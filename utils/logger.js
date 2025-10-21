/**
 * WorkIn Logger Utility
 * Provides centralized logging with different levels and storage
 */
class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.levels.INFO;
    this.maxLogs = 1000; // Maximum number of logs to store
    this.storageKey = 'workin_logs';
    
    this.init();
  }

  /**
   * Initialize logger
   */
  async init() {
    try {
      // Set log level from storage if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['logLevel']);
        if (result.logLevel) {
          this.currentLevel = this.levels[result.logLevel] || this.levels.INFO;
        }
      }
    } catch (error) {
      console.error('Error initializing logger:', error);
    }
  }

  /**
   * Set logging level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level];
      
      // Save to storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ logLevel: level });
      }
    }
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, data = null, context = null) {
    return {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      data: data,
      context: context,
      url: typeof window !== 'undefined' ? window.location.href : 'background',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
  }

  /**
   * Log message with specified level
   */
  async log(level, message, data = null, context = null) {
    const levelValue = this.levels[level];
    
    if (levelValue > this.currentLevel) {
      return; // Skip if level is higher than current
    }

    const logEntry = this.createLogEntry(level, message, data, context);
    
    // Console output
    const consoleMethod = level === 'ERROR' ? 'error' : 
                         level === 'WARN' ? 'warn' : 'log';
    
    console[consoleMethod](`[WorkIn ${level}]`, message, data || '');
    
    // Store in Chrome storage
    await this.storeLog(logEntry);
  }

  /**
   * Store log entry
   */
  async storeLog(logEntry) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      // Get existing logs
      const result = await chrome.storage.local.get([this.storageKey]);
      let logs = result[this.storageKey] || [];
      
      // Add new log
      logs.push(logEntry);
      
      // Keep only recent logs
      if (logs.length > this.maxLogs) {
        logs = logs.slice(-this.maxLogs);
      }
      
      // Save back to storage
      await chrome.storage.local.set({ [this.storageKey]: logs });
      
    } catch (error) {
      console.error('Error storing log:', error);
    }
  }

  /**
   * Get stored logs
   */
  async getLogs(level = null, limit = 100) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return [];
      }

      const result = await chrome.storage.local.get([this.storageKey]);
      let logs = result[this.storageKey] || [];
      
      // Filter by level if specified
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      
      // Return most recent logs
      return logs.slice(-limit).reverse();
      
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove([this.storageKey]);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  async exportLogs() {
    try {
      const logs = await this.getLogs(null, this.maxLogs);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting logs:', error);
      return '[]';
    }
  }

  // Convenience methods
  error(message, data = null, context = null) {
    return this.log('ERROR', message, data, context);
  }

  warn(message, data = null, context = null) {
    return this.log('WARN', message, data, context);
  }

  info(message, data = null, context = null) {
    return this.log('INFO', message, data, context);
  }

  debug(message, data = null, context = null) {
    return this.log('DEBUG', message, data, context);
  }

  /**
   * Log user action
   */
  logUserAction(action, details = null) {
    return this.info(`User Action: ${action}`, details, 'user_action');
  }

  /**
   * Log system event
   */
  logSystemEvent(event, details = null) {
    return this.info(`System Event: ${event}`, details, 'system_event');
  }

  /**
   * Log API call
   */
  logAPICall(method, url, status, duration = null) {
    const data = { method, url, status, duration };
    const level = status >= 400 ? 'ERROR' : 'INFO';
    return this.log(level, `API Call: ${method} ${url}`, data, 'api_call');
  }

  /**
   * Log Chrome API usage
   */
  logChromeAPI(api, method, success, error = null) {
    const data = { api, method, success, error };
    const level = success ? 'DEBUG' : 'ERROR';
    return this.log(level, `Chrome API: ${api}.${method}`, data, 'chrome_api');
  }

  /**
   * Log job search activity
   */
  logJobSearch(action, details = null) {
    return this.info(`Job Search: ${action}`, details, 'job_search');
  }

  /**
   * Log onboarding activity
   */
  logOnboarding(step, details = null) {
    return this.info(`Onboarding: ${step}`, details, 'onboarding');
  }
}

// Create global logger instance
const logger = new Logger();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
} else if (typeof window !== 'undefined') {
  window.WorkInLogger = logger;
}