/**
 * WorkIn Extension - Background Service Worker
 * Gerencia processamento em background, storage e comunicação entre componentes
 */

// Importa módulos necessários
importScripts(
  '../shared/types.js',
  '../shared/utils.js',
  'storage-manager.js',
  'matching-engine.js',
  'application-manager.js',
  'queue-manager.js',
  'profile-analyzer.js',
  'job-search-engine.js',
  'auto-application-system.js'
);

class WorkInServiceWorker {
  constructor() {
    this.isInitialized = false;
    this.storageManager = null;
    this.matchingEngine = null;
    this.applicationManager = null;
    this.queueManager = null;
    
    // Cache de configurações
    this.settingsCache = null;
    this.userProfileCache = null;
    
    this.init();
  }

  /**
   * Inicializa o service worker
   */
  async init() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing WorkIn Service Worker...');

      // Inicializa módulos com verificações de segurança
      try {
        this.storageManager = new StorageManager();
        console.log('StorageManager initialized');
      } catch (error) {
        console.error('Failed to initialize StorageManager:', error);
        this.storageManager = null;
      }

      try {
        this.matchingEngine = new MatchingEngine();
        console.log('MatchingEngine initialized');
      } catch (error) {
        console.error('Failed to initialize MatchingEngine:', error);
        this.matchingEngine = null;
      }

      try {
        this.applicationManager = new ApplicationManager();
        console.log('ApplicationManager initialized');
      } catch (error) {
        console.error('Failed to initialize ApplicationManager:', error);
        this.applicationManager = null;
      }

      try {
        this.queueManager = new QueueManager();
        console.log('QueueManager initialized');
      } catch (error) {
        console.error('Failed to initialize QueueManager:', error);
        this.queueManager = null;
      }

      // Configura listeners (sempre tenta configurar)
      this.setupMessageListeners();
      this.setupAlarms();
      this.setupContextMenus();

      // Carrega configurações iniciais se o storage estiver disponível
      if (this.storageManager) {
        try {
          await this.loadInitialData();
          console.log('Initial data loaded');
        } catch (error) {
          console.error('Failed to load initial data:', error);
        }
      }

      this.isInitialized = true;
      console.log('WorkIn Service Worker initialized successfully');

    } catch (error) {
      console.error('Failed to initialize WorkIn Service Worker:', error);
      // Mesmo com erro, marca como inicializado para evitar loops
      this.isInitialized = true;
    }
  }

  /**
   * Configura listeners de mensagens
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indica resposta assíncrona
    });
  }

  /**
   * Manipula mensagens recebidas
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      const { action, ...data } = message;

      switch (action) {
        // Configurações
        case 'getSettings':
          sendResponse(await this.getSettings());
          break;

        case 'updateSettings':
          sendResponse(await this.updateSettings(data.settings));
          break;

        // Perfil do usuário
        case 'getUserProfile':
          sendResponse(await this.getUserProfile());
          break;

        case 'updateUserProfile':
          sendResponse(await this.updateUserProfile(data.profile));
          break;

        // Vagas
        case 'saveJob':
          sendResponse(await this.saveJob(data.jobData));
          break;

        case 'getJob':
          sendResponse(await this.getJob(data.jobId));
          break;

        case 'getJobs':
          sendResponse(await this.getJobs(data.filters));
          break;

        case 'getJobStatus':
          sendResponse(await this.getJobStatus(data.jobId));
          break;

        case 'updateJobStatus':
          sendResponse(await this.updateJobStatus(data.jobId, data.status));
          break;

        // Matching
        case 'calculateMatch':
          sendResponse(await this.calculateMatch(data.jobData));
          break;

        // Candidaturas
        case 'quickApply':
          sendResponse(await this.quickApply(data.jobData, sender.tab));
          break;

        case 'batchApply':
          sendResponse(await this.batchApply(data.jobIds));
          break;

        case 'getApplications':
          sendResponse(await this.getApplications(data.filters));
          break;

        // CVs
        case 'getCVs':
          sendResponse(await this.getCVs());
          break;

        case 'saveCV':
          sendResponse(await this.saveCV(data.cvData));
          break;

        // Logs
        case 'getLogs':
          sendResponse(await this.getLogs(data.filters));
          break;

        // Popup/UI
        case 'showJobDetails':
          await this.showJobDetails(data.jobData, data.score);
          sendResponse({ success: true });
          break;

        case 'getStats':
          sendResponse(await this.getStats());
          break;

        // Queue/status helpers for popup
        case 'getQueueStatus':
          sendResponse(await this.getQueueStatus());
          break;

        case 'getRateLimitInfo':
          sendResponse(await this.getRateLimitInfo());
          break;

        case 'getQueueItems':
          sendResponse(await this.getQueueItems());
          break;

        case 'clearQueue':
          sendResponse(await this.clearQueue());
          break;

        // Page info (best-effort without DOM injection)
        case 'getPageInfo':
          sendResponse(await this.getPageInfo(data.tabId));
          break;

        case 'getRecentActivity':
          sendResponse(await this.getRecentActivity(data.limit || 5));
          break;

        case 'startAutoApply':
          try {
            if (this.queueManager && typeof this.queueManager.processQueue === 'function') {
              this.queueManager.processQueue();
            }
            sendResponse({ success: true });
          } catch (e) {
            sendResponse({ error: e.message });
          }
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }

    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  /**
   * Carrega dados iniciais
   */
  async loadInitialData() {
    try {
      // Carrega configurações
      this.settingsCache = await this.storageManager.getSettings();
      
      // Carrega perfil do usuário
      this.userProfileCache = await this.storageManager.getUserProfile();

      // Inicializa módulos com dados
      await this.matchingEngine.init(this.userProfileCache);
      await this.applicationManager.init(this.settingsCache);
      if (typeof this.applicationManager.setUserProfile === 'function') {
        this.applicationManager.setUserProfile(this.userProfileCache);
      }
      await this.queueManager.init(this.settingsCache);

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  /**
   * Obtém configurações
   */
  async getSettings() {
    try {
      if (!this.settingsCache) {
        this.settingsCache = await this.storageManager.getSettings();
      }
      return { settings: this.settingsCache };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(settings) {
    try {
      await this.storageManager.saveSettings(settings);
      this.settingsCache = settings;
      
      // Atualiza módulos
      await this.applicationManager.updateSettings(settings);
      await this.queueManager.updateSettings(settings);
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém perfil do usuário
   */
  async getUserProfile() {
    try {
      if (!this.userProfileCache) {
        this.userProfileCache = await this.storageManager.getUserProfile();
      }
      return { profile: this.userProfileCache };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateUserProfile(profile) {
    try {
      await this.storageManager.saveUserProfile(profile);
      this.userProfileCache = profile;
      
      // Atualiza matching engine e application manager
      await this.matchingEngine.updateProfile(profile);
      if (typeof this.applicationManager.setUserProfile === 'function') {
        this.applicationManager.setUserProfile(profile);
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Salva vaga
   */
  async saveJob(jobData) {
    try {
      const savedJob = await this.storageManager.saveJob(jobData);
      
      // Log da ação
      await this.storageManager.saveLog({
        level: 'info',
        action: 'job_detected',
        details: {
          jobId: savedJob.id,
          title: savedJob.title,
          company: savedJob.company
        }
      });
      
      return { success: true, job: savedJob };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém vaga
   */
  async getJob(jobId) {
    try {
      const job = await this.storageManager.getJob(jobId);
      return { job };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém lista de vagas
   */
  async getJobs(filters = {}) {
    try {
      const jobs = await this.storageManager.getJobs(filters);
      return { jobs };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém status da vaga
   */
  async getJobStatus(jobId) {
    try {
      const application = await this.storageManager.getApplicationByJobId(jobId);
      return { status: application?.status || null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Atualiza status da vaga
   */
  async updateJobStatus(jobId, status) {
    try {
      await this.storageManager.updateJobStatus(jobId, status);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Calcula compatibilidade
   */
  async calculateMatch(jobData) {
    try {
      const score = await this.matchingEngine.calculateScore(jobData);
      
      // Salva o score
      await this.storageManager.saveMatch({
        jobId: jobData.id,
        score,
        factors: this.matchingEngine.getLastFactors(),
        calculatedAt: Date.now()
      });
      
      return { score };
    } catch (error) {
      return { error: error.message, score: 0 };
    }
  }

  /**
   * Candidatura rápida
   */
  async quickApply(jobData, tab) {
    try {
      // Verifica limites
      const canApply = await this.queueManager.canApply();
      if (!canApply.allowed) {
        return { error: canApply.reason };
      }

      // Adiciona à fila
      const queueItem = await this.queueManager.addToQueue({
        jobId: jobData.id,
        jobData,
        tabId: tab.id,
        priority: 'high'
      });

      // Processa imediatamente se possível
      if (queueItem.canProcessNow) {
        const result = await this.applicationManager.applyToJob(jobData, tab);
        
        if (result.success) {
          await this.queueManager.markCompleted(queueItem.id);
          
          // Salva candidatura
          await this.storageManager.saveApplication({
            jobId: jobData.id,
            status: 'applied',
            appliedAt: Date.now(),
            method: 'quick_apply'
          });
        } else {
          await this.queueManager.markFailed(queueItem.id, result.error);
        }
        
        return result;
      } else {
        return { 
          success: true, 
          queued: true, 
          message: 'Candidatura adicionada à fila' 
        };
      }

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Candidatura em lote
   */
  async batchApply(jobIds) {
    try {
      const results = [];
      
      for (const jobId of jobIds) {
        const job = await this.storageManager.getJob(jobId);
        if (job) {
          const queueItem = await this.queueManager.addToQueue({
            jobId,
            jobData: job,
            priority: 'normal'
          });
          results.push({ jobId, queued: true, queueId: queueItem.id });
        }
      }
      
      // Inicia processamento da fila
      this.queueManager.processQueue();
      
      return { success: true, results };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém candidaturas
   */
  async getApplications(filters = {}) {
    try {
      const applications = await this.storageManager.getApplications(filters);
      return { applications };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém CVs
   */
  async getCVs() {
    try {
      const cvs = await this.storageManager.getCVs();
      return { cvs };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Salva CV
   */
  async saveCV(cvData) {
    try {
      const savedCV = await this.storageManager.saveCV(cvData);
      return { success: true, cv: savedCV };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém logs
   */
  async getLogs(filters = {}) {
    try {
      const logs = await this.storageManager.getLogs(filters);
      return { logs };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Mostra detalhes da vaga
   */
  async showJobDetails(jobData, score) {
    try {
      // Abre popup com detalhes
      await chrome.action.openPopup();
      
      // Envia dados para o popup
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'displayJobDetails',
          jobData,
          score
        });
      }, 500);
      
    } catch (error) {
      console.error('Failed to show job details:', error);
    }
  }

  /**
   * Obtém estatísticas
   */
  async getStats() {
    try {
      const stats = await this.storageManager.getStats();
      return { stats };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Retorna informações agregadas da fila
   */
  async getQueueStatus() {
    try {
      if (!this.queueManager) return { status: 'idle', pending: 0, processing: 0, completed: 0 };
      const q = this.queueManager.queue || [];
      const pending = q.filter(i => i.status === 'pending').length;
      const processing = q.filter(i => i.status === 'processing').length + (this.queueManager.processing ? 1 : 0);
      const completed = q.filter(i => i.status === 'completed').length;
      return { status: this.queueManager.processing ? 'processing' : 'idle', pending, processing, completed };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Retorna itens da fila
   */
  async getQueueItems() {
    try {
      if (!this.queueManager) return { items: [] };
      return { items: (this.queueManager.queue || []) };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Limpa a fila
   */
  async clearQueue() {
    try {
      if (!this.queueManager) return { success: true };
      if (Array.isArray(this.queueManager.queue)) {
        this.queueManager.queue.length = 0;
      }
      if (typeof this.queueManager.persistQueue === 'function') {
        await this.queueManager.persistQueue();
      }
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Informa limites de rate limiting com base no histórico em memória
   */
  async getRateLimitInfo() {
    try {
      if (!this.queueManager) return { info: { hour: { used: 0, limit: 0 }, day: { used: 0, limit: 0 }, nextAllowedAt: null } };
      const hist = this.queueManager.applicationHistory || [];
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      const hourly = hist.filter(h => now - h.timestamp < oneHour).length;
      const daily = hist.filter(h => now - h.timestamp < oneDay).length;
      const limits = this.queueManager.rateLimits || { maxPerHour: 0, maxPerDay: 0 };
      return { info: { hour: { used: hourly, limit: limits.maxPerHour }, day: { used: daily, limit: limits.maxPerDay }, nextAllowedAt: null } };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém info da página usando apenas a URL da aba
   */
  async getPageInfo(tabId) {
    try {
      if (!chrome.tabs || !tabId) return { isLinkedIn: false };
      const tab = await chrome.tabs.get(tabId);
      const url = tab?.url || '';
      const isLinkedIn = url.includes('linkedin.com');
      const isJobPage = /\/jobs\/view\//.test(url);
      const isJobList = /\/jobs\/search\//.test(url);
      return { isLinkedIn, isJobPage, isJobList, jobTitle: null, jobCount: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Atividade recente baseada no histórico da fila
   */
  async getRecentActivity(limit = 5) {
    try {
      const hist = (this.queueManager?.applicationHistory || []).slice(-limit).reverse();
      const items = hist.map(h => ({
        title: `Candidatura ${h.status}`,
        timestamp: h.timestamp,
        status: h.status
      }));
      return items;
    } catch (error) {
      return [];
    }
  }

  /**
   * Configura alarmes
   */
  setupAlarms() {
    try {
      // Verifica se a API de alarmes está disponível
      if (!chrome.alarms) {
        console.warn('Chrome alarms API not available');
        return;
      }

      // Alarme para processamento da fila
      chrome.alarms.create('processQueue', { periodInMinutes: 5 });
      
      // Alarme para limpeza de dados antigos
      chrome.alarms.create('cleanup', { periodInMinutes: 60 });
      
      // Alarme para backup
      chrome.alarms.create('backup', { periodInMinutes: 30 });

      chrome.alarms.onAlarm.addListener(async (alarm) => {
        try {
          switch (alarm.name) {
            case 'processQueue':
              if (this.queueManager && typeof this.queueManager.processQueue === 'function') {
                await this.queueManager.processQueue();
              }
              break;
              
            case 'cleanup':
              if (this.storageManager && typeof this.storageManager.cleanup === 'function') {
                await this.storageManager.cleanup();
              }
              break;
              
            case 'backup':
              if (this.storageManager && typeof this.storageManager.backup === 'function') {
                await this.storageManager.backup();
              }
              break;
          }
        } catch (error) {
          console.error(`Error handling alarm ${alarm.name}:`, error);
        }
      });
      
      console.log('Alarms setup completed successfully');
    } catch (error) {
      console.error('Error setting up alarms:', error);
    }
  }

  /**
   * Configura menus de contexto
   */
  setupContextMenus() {
    try {
      // Verifica se a API de context menus está disponível
      if (!chrome.contextMenus) {
        console.warn('Chrome contextMenus API not available');
        return;
      }

      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: 'workin-apply',
          title: 'Aplicar com WorkIn',
          contexts: ['page'],
          documentUrlPatterns: ['*://www.linkedin.com/jobs/*']
        });

        chrome.contextMenus.create({
          id: 'workin-save',
          title: 'Salvar vaga no WorkIn',
          contexts: ['page'],
          documentUrlPatterns: ['*://www.linkedin.com/jobs/*']
        });
      });

      chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        try {
          switch (info.menuItemId) {
            case 'workin-apply':
              await this.handleContextMenuApply(tab);
              break;
              
            case 'workin-save':
              await this.handleContextMenuSave(tab);
              break;
          }
        } catch (error) {
          console.error(`Error handling context menu ${info.menuItemId}:`, error);
        }
      });
      
      console.log('Context menus setup completed successfully');
    } catch (error) {
      console.error('Error setting up context menus:', error);
    }
  }

  /**
   * Manipula aplicação via menu de contexto
   */
  async handleContextMenuApply(tab) {
    try {
      // Injeta script para detectar vaga atual
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Detecta vaga na página atual
          if (window.WorkInLinkedInDetector) {
            return window.WorkInLinkedInDetector.getCurrentJob();
          }
          return null;
        }
      });

      const jobData = results[0]?.result;
      if (jobData) {
        await this.quickApply(jobData, tab);
      }

    } catch (error) {
      console.error('Context menu apply failed:', error);
    }
  }

  /**
   * Manipula salvamento via menu de contexto
   */
  async handleContextMenuSave(tab) {
    try {
      // Similar ao apply, mas apenas salva
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (window.WorkInLinkedInDetector) {
            return window.WorkInLinkedInDetector.getCurrentJob();
          }
          return null;
        }
      });

      const jobData = results[0]?.result;
      if (jobData) {
        await this.saveJob(jobData);
      }

    } catch (error) {
      console.error('Context menu save failed:', error);
    }
  }
}

// Inicializa o service worker
const workInServiceWorker = new WorkInServiceWorker();

// Listener para instalação
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('WorkIn Extension installed');
    
    // Abre página de boas-vindas
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html')
    });
  }
});

// Listener para startup
chrome.runtime.onStartup.addListener(() => {
  console.log('WorkIn Extension started');
});

// Exporta para uso global
if (typeof globalThis !== 'undefined') {
  globalThis.WorkInServiceWorker = workInServiceWorker;
}
