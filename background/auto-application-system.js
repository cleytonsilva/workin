/**
 * WorkIn Auto Application System
 * Handles automatic job applications with rate limiting and safety measures
 */

class AutoApplicationSystem {
  constructor() {
    this.isProcessing = false;
    this.applicationQueue = [];
    this.dailyApplicationCount = 0;
    this.lastApplicationTime = null;
    this.rateLimitDelay = 30000; // 30 seconds between applications
    this.maxDailyApplications = 20;
    
    this.init();
  }

  /**
   * Initialize the auto application system
   */
  init() {
    this.setupPeriodicProcessing();
    this.bindEvents();
    this.loadDailyStats();
  }

  /**
   * Setup periodic queue processing
   */
  setupPeriodicProcessing() {
    // Create alarm for processing applications
    chrome.alarms.create('processApplications', {
      delayInMinutes: 5,
      periodInMinutes: 5
    });

    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'processApplications') {
        this.processApplicationQueue();
      }
    });

    // Reset daily counter at midnight
    chrome.alarms.create('resetDailyCounter', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'resetDailyCounter') {
        this.resetDailyCounter();
      }
    });
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ADD_TO_APPLICATION_QUEUE':
          this.addToQueue(message.job).then(sendResponse);
          return true;
          
        case 'GET_APPLICATION_STATUS':
          this.getApplicationStatus().then(sendResponse);
          return true;
          
        case 'PAUSE_AUTO_APPLICATIONS':
          this.pauseApplications();
          sendResponse({ success: true });
          break;
          
        case 'RESUME_AUTO_APPLICATIONS':
          this.resumeApplications();
          sendResponse({ success: true });
          break;
          
        case 'GET_QUEUE_STATUS':
          this.getQueueStatus().then(sendResponse);
          return true;
      }
    });
  }

  /**
   * Load daily application statistics
   */
  async loadDailyStats() {
    try {
      const data = await chrome.storage.local.get(['dailyApplicationStats']);
      const stats = data.dailyApplicationStats;
      
      if (stats && this.isToday(stats.date)) {
        this.dailyApplicationCount = stats.count || 0;
      } else {
        this.dailyApplicationCount = 0;
        await this.saveDailyStats();
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
      this.dailyApplicationCount = 0;
    }
  }

  /**
   * Save daily application statistics
   */
  async saveDailyStats() {
    await chrome.storage.local.set({
      dailyApplicationStats: {
        date: new Date().toDateString(),
        count: this.dailyApplicationCount
      }
    });
  }

  /**
   * Check if date is today
   */
  isToday(dateString) {
    return dateString === new Date().toDateString();
  }

  /**
   * Get next midnight timestamp
   */
  getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Reset daily application counter
   */
  async resetDailyCounter() {
    this.dailyApplicationCount = 0;
    await this.saveDailyStats();
    console.log('Daily application counter reset');
  }

  /**
   * Add job to application queue
   */
  async addToQueue(job) {
    try {
      // Validate job data
      if (!job || !job.url || !job.easyApply) {
        throw new Error('Invalid job data or job does not support Easy Apply');
      }

      // Check if already in queue
      const data = await chrome.storage.local.get(['applicationQueue']);
      const queue = data.applicationQueue || [];
      
      const exists = queue.some(queuedJob => queuedJob.url === job.url);
      if (exists) {
        throw new Error('Job already in application queue');
      }

      // Add to queue
      const queueItem = {
        ...job,
        queuedAt: new Date().toISOString(),
        status: 'queued',
        attempts: 0,
        maxAttempts: 3
      };

      queue.push(queueItem);
      
      await chrome.storage.local.set({ applicationQueue: queue });
      
      console.log(`Job added to application queue: ${job.title} at ${job.company}`);
      
      return { success: true, queuePosition: queue.length };
      
    } catch (error) {
      console.error('Error adding job to queue:', error);
      throw error;
    }
  }

  /**
   * Process application queue
   */
  async processApplicationQueue() {
    if (this.isProcessing) {
      console.log('Application processing already in progress');
      return;
    }

    try {
      this.isProcessing = true;
      
      // Check if auto applications are enabled
      const settings = await this.getApplicationSettings();
      if (!settings.autoApplyEnabled) {
        console.log('Auto applications are disabled');
        return;
      }

      // Check daily limit
      if (this.dailyApplicationCount >= settings.maxDailyApplications) {
        console.log('Daily application limit reached');
        return;
      }

      // Check rate limiting
      if (this.lastApplicationTime) {
        const timeSinceLastApplication = Date.now() - new Date(this.lastApplicationTime).getTime();
        if (timeSinceLastApplication < this.rateLimitDelay) {
          console.log('Rate limit active, waiting...');
          return;
        }
      }

      // Get queue
      const data = await chrome.storage.local.get(['applicationQueue']);
      const queue = data.applicationQueue || [];
      
      // Find next job to process
      const nextJob = queue.find(job => 
        job.status === 'queued' && 
        job.attempts < job.maxAttempts
      );

      if (!nextJob) {
        console.log('No jobs in queue to process');
        return;
      }

      // Process the application
      await this.processApplication(nextJob);
      
    } catch (error) {
      console.error('Error processing application queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job application
   */
  async processApplication(job) {
    try {
      console.log(`Processing application for: ${job.title} at ${job.company}`);
      
      // Update job status
      await this.updateJobStatus(job.id, 'processing');
      
      // Get or create LinkedIn tab
      const tabId = await this.getLinkedInTab();
      
      // Navigate to job page
      await chrome.tabs.update(tabId, { url: job.url });
      
      // Wait for page to load
      await this.waitForJobPageLoad(tabId);
      
      // Attempt to apply
      const applicationResult = await this.attemptApplication(tabId, job);
      
      if (applicationResult.success) {
        // Application successful
        await this.updateJobStatus(job.id, 'applied');
        this.dailyApplicationCount++;
        this.lastApplicationTime = new Date().toISOString();
        await this.saveDailyStats();
        
        // Log successful application
        await this.logApplication(job, 'success', applicationResult.details);
        
        console.log(`Successfully applied to: ${job.title} at ${job.company}`);
        
        // Notify user
        this.notifyApplicationSuccess(job);
        
      } else {
        // Application failed
        await this.updateJobStatus(job.id, 'failed', applicationResult.error);
        await this.incrementJobAttempts(job.id);
        
        // Log failed application
        await this.logApplication(job, 'failed', applicationResult.error);
        
        console.log(`Failed to apply to: ${job.title} at ${job.company}. Error: ${applicationResult.error}`);
      }
      
    } catch (error) {
      console.error('Error processing application:', error);
      await this.updateJobStatus(job.id, 'error', error.message);
      await this.incrementJobAttempts(job.id);
    }
  }

  /**
   * Get LinkedIn tab or create one
   */
  async getLinkedInTab() {
    // Try to find existing LinkedIn tab
    const tabs = await chrome.tabs.query({ url: 'https://*.linkedin.com/*' });
    
    if (tabs.length > 0) {
      return tabs[0].id;
    }
    
    // Create new tab
    const tab = await chrome.tabs.create({ 
      url: 'https://www.linkedin.com/jobs/',
      active: false 
    });
    
    return tab.id;
  }

  /**
   * Wait for job page to load
   */
  async waitForJobPageLoad(tabId, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkLoaded = () => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            return document.readyState === 'complete' && 
                   (document.querySelector('.jobs-apply-button') || 
                    document.querySelector('[data-control-name="jobdetails_topcard_inapply"]'));
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (results && results[0]?.result) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for job page load'));
          } else {
            setTimeout(checkLoaded, 1000);
          }
        });
      };
      
      setTimeout(checkLoaded, 2000);
    });
  }

  /**
   * Attempt to apply to job
   */
  async attemptApplication(tabId, job) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (jobData) => {
          try {
            // Look for Easy Apply button
            const easyApplyButton = document.querySelector('.jobs-apply-button') ||
                                  document.querySelector('[data-control-name="jobdetails_topcard_inapply"]') ||
                                  document.querySelector('button[aria-label*="Easy Apply"]');
            
            if (!easyApplyButton) {
              return { 
                success: false, 
                error: 'Easy Apply button not found' 
              };
            }

            // Check if button is disabled or already applied
            if (easyApplyButton.disabled || 
                easyApplyButton.textContent.toLowerCase().includes('applied')) {
              return { 
                success: false, 
                error: 'Already applied or button disabled' 
              };
            }

            // Click the Easy Apply button
            easyApplyButton.click();
            
            // Wait a moment for modal to appear
            setTimeout(() => {
              // Look for application modal
              const modal = document.querySelector('.jobs-easy-apply-modal') ||
                           document.querySelector('[data-test-modal]');
              
              if (modal) {
                // Look for submit button in modal
                const submitButton = modal.querySelector('button[aria-label*="Submit"]') ||
                                   modal.querySelector('button[type="submit"]') ||
                                   modal.querySelector('.jobs-apply-button');
                
                if (submitButton && !submitButton.disabled) {
                  submitButton.click();
                  return { 
                    success: true, 
                    details: 'Application submitted via Easy Apply modal' 
                  };
                }
              }
            }, 1000);
            
            return { 
              success: true, 
              details: 'Easy Apply button clicked' 
            };
            
          } catch (error) {
            return { 
              success: false, 
              error: error.message 
            };
          }
        },
        args: [job]
      });

      return result[0]?.result || { success: false, error: 'No result from script' };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Update job status in queue
   */
  async updateJobStatus(jobId, status, error = null) {
    try {
      const data = await chrome.storage.local.get(['applicationQueue']);
      const queue = data.applicationQueue || [];
      
      const jobIndex = queue.findIndex(job => job.id === jobId);
      if (jobIndex !== -1) {
        queue[jobIndex].status = status;
        queue[jobIndex].lastUpdated = new Date().toISOString();
        
        if (error) {
          queue[jobIndex].error = error;
        }
        
        await chrome.storage.local.set({ applicationQueue: queue });
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  /**
   * Increment job attempt count
   */
  async incrementJobAttempts(jobId) {
    try {
      const data = await chrome.storage.local.get(['applicationQueue']);
      const queue = data.applicationQueue || [];
      
      const jobIndex = queue.findIndex(job => job.id === jobId);
      if (jobIndex !== -1) {
        queue[jobIndex].attempts = (queue[jobIndex].attempts || 0) + 1;
        await chrome.storage.local.set({ applicationQueue: queue });
      }
    } catch (error) {
      console.error('Error incrementing job attempts:', error);
    }
  }

  /**
   * Log application attempt
   */
  async logApplication(job, result, details) {
    try {
      const data = await chrome.storage.local.get(['applicationLog']);
      const log = data.applicationLog || [];
      
      const logEntry = {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        url: job.url,
        result,
        details,
        timestamp: new Date().toISOString(),
        score: job.score
      };
      
      log.unshift(logEntry); // Add to beginning
      
      // Keep only last 100 entries
      const trimmedLog = log.slice(0, 100);
      
      await chrome.storage.local.set({ applicationLog: trimmedLog });
      
    } catch (error) {
      console.error('Error logging application:', error);
    }
  }

  /**
   * Get application settings
   */
  async getApplicationSettings() {
    try {
      const data = await chrome.storage.local.get(['onboardingPreferences', 'userSettings']);
      
      const preferences = data.onboardingPreferences?.application || {};
      const settings = data.userSettings || {};
      
      return {
        autoApplyEnabled: preferences.autoApplyEnabled !== false,
        maxDailyApplications: preferences.maxApplications || settings.maxDailyApplications || this.maxDailyApplications,
        minScore: preferences.minScore || settings.minCompatibilityScore || 70
      };
      
    } catch (error) {
      console.error('Error getting application settings:', error);
      return {
        autoApplyEnabled: true,
        maxDailyApplications: this.maxDailyApplications,
        minScore: 70
      };
    }
  }

  /**
   * Get application status
   */
  async getApplicationStatus() {
    try {
      const data = await chrome.storage.local.get(['applicationQueue', 'applicationLog']);
      
      const queue = data.applicationQueue || [];
      const log = data.applicationLog || [];
      
      const today = new Date().toDateString();
      const todayApplications = log.filter(entry => 
        new Date(entry.timestamp).toDateString() === today
      );
      
      return {
        queueLength: queue.filter(job => job.status === 'queued').length,
        processing: queue.filter(job => job.status === 'processing').length,
        dailyApplications: todayApplications.length,
        maxDailyApplications: (await this.getApplicationSettings()).maxDailyApplications,
        isProcessing: this.isProcessing,
        lastApplicationTime: this.lastApplicationTime
      };
      
    } catch (error) {
      console.error('Error getting application status:', error);
      return {
        queueLength: 0,
        processing: 0,
        dailyApplications: 0,
        maxDailyApplications: this.maxDailyApplications,
        isProcessing: false,
        lastApplicationTime: null
      };
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    try {
      const data = await chrome.storage.local.get(['applicationQueue']);
      const queue = data.applicationQueue || [];
      
      return {
        total: queue.length,
        queued: queue.filter(job => job.status === 'queued').length,
        processing: queue.filter(job => job.status === 'processing').length,
        applied: queue.filter(job => job.status === 'applied').length,
        failed: queue.filter(job => job.status === 'failed').length,
        error: queue.filter(job => job.status === 'error').length
      };
      
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        total: 0,
        queued: 0,
        processing: 0,
        applied: 0,
        failed: 0,
        error: 0
      };
    }
  }

  /**
   * Pause auto applications
   */
  pauseApplications() {
    chrome.storage.local.set({ autoApplicationsPaused: true });
    console.log('Auto applications paused');
  }

  /**
   * Resume auto applications
   */
  resumeApplications() {
    chrome.storage.local.set({ autoApplicationsPaused: false });
    console.log('Auto applications resumed');
  }

  /**
   * Notify user of successful application
   */
  notifyApplicationSuccess(job) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'src/icons/icon48.svg',
      title: 'WorkIn - Candidatura Enviada',
      message: `Candidatura enviada com sucesso para ${job.title} na ${job.company}!`
    });
  }

  /**
   * Get application statistics
   */
  async getApplicationStats() {
    try {
      const data = await chrome.storage.local.get(['applicationLog']);
      const log = data.applicationLog || [];
      
      const today = new Date().toDateString();
      const thisWeek = this.getWeekStart();
      
      const todayApplications = log.filter(entry => 
        new Date(entry.timestamp).toDateString() === today
      );
      
      const weekApplications = log.filter(entry => 
        new Date(entry.timestamp) >= thisWeek
      );
      
      const successfulApplications = log.filter(entry => entry.result === 'success');
      
      return {
        today: todayApplications.length,
        week: weekApplications.length,
        total: log.length,
        successful: successfulApplications.length,
        successRate: log.length > 0 ? (successfulApplications.length / log.length * 100).toFixed(1) : 0
      };
      
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        today: 0,
        week: 0,
        total: 0,
        successful: 0,
        successRate: 0
      };
    }
  }

  /**
   * Get start of current week
   */
  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  }
}

// Initialize auto application system
const autoApplicationSystem = new AutoApplicationSystem();