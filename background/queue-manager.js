/**
 * WorkIn Extension - Queue Manager
 * Gerencia filas de candidaturas e rate limiting
 */

class QueueManager {
  constructor() {
    this.settings = null;
    this.isInitialized = false;
    this.queue = [];
    this.processing = false;
    this.applicationHistory = [];
    
    // Configurações de rate limiting
    this.rateLimits = {
      maxPerHour: 20,
      maxPerDay: 100,
      minDelayBetween: 3000,
      maxDelayBetween: 8000
    };
    
    // Estatísticas
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      lastProcessedAt: null
    };
  }

  /**
   * Inicializa o queue manager
   */
  async init(settings = null) {
    try {
      if (settings) {
        this.settings = settings;
        this.updateRateLimits(settings);
      }
      
      // Carrega fila persistida
      await this.loadPersistedQueue();
      
      // Carrega histórico
      await this.loadApplicationHistory();
      
      this.isInitialized = true;
      console.log('Queue Manager initialized successfully');
      
      // Inicia processamento se há itens na fila
      if (this.queue.length > 0) {
        this.processQueue();
      }
      
    } catch (error) {
      console.error('Failed to initialize Queue Manager:', error);
      throw error;
    }
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(settings) {
    this.settings = settings;
    this.updateRateLimits(settings);
    await this.persistQueue();
  }

  /**
   * Atualiza limites de rate limiting
   */
  updateRateLimits(settings) {
    if (settings.automationLimits) {
      this.rateLimits = {
        ...this.rateLimits,
        ...settings.automationLimits
      };
    }
  }

  /**
   * Persiste fila e histórico no chrome.storage.local
   */
  async persistQueue() {
    try {
      await chrome.storage.local.set({
        'workin_queue': this.queue,
        'workin_history': this.applicationHistory,
        'workin_stats': this.stats
      });
    } catch (error) {
      console.warn('Failed to persist queue', error);
    }
  }

  /**
   * Carrega fila e histórico persistidos
   */
  async loadPersistedQueue() {
    try {
      const data = await chrome.storage.local.get(['workin_queue', 'workin_history', 'workin_stats']);
      this.queue = Array.isArray(data.workin_queue) ? data.workin_queue : [];
      this.applicationHistory = Array.isArray(data.workin_history) ? data.workin_history : [];
      if (data.workin_stats) {
        this.stats = { ...this.stats, ...data.workin_stats };
      }
    } catch (error) {
      console.warn('Failed to load persisted queue', error);
      this.queue = [];
      this.applicationHistory = [];
    }
  }

  /**
   * Garante histórico carregado
   */
  async loadApplicationHistory() {
    if (!this.applicationHistory || this.applicationHistory.length === 0) {
      await this.loadPersistedQueue();
    }
  }

  /**
   * Adiciona item à fila
   */
  async addToQueue(item) {
    const queueItem = {
      id: WorkInUtils.StringUtils.generateId(),
      ...item,
      addedAt: Date.now(),
      status: 'pending',
      retries: 0,
      priority: item.priority || 'normal'
    };

    // Verifica se pode processar imediatamente
    const canProcess = await this.canApply();
    queueItem.canProcessNow = canProcess.allowed;

    // Adiciona à fila na posição correta baseada na prioridade
    this.insertByPriority(queueItem);

    // Persiste fila
    await this.persistQueue();

    console.log(`Item added to queue: ${queueItem.id} (priority: ${queueItem.priority})`);

    return queueItem;
  }

  /**
   * Insere item na fila baseado na prioridade
   */
  insertByPriority(item) {
    const priorities = { 'high': 3, 'normal': 2, 'low': 1 };
    const itemPriority = priorities[item.priority] || 2;

    let insertIndex = this.queue.length;
    
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorities[this.queue[i].priority] || 2;
      if (itemPriority > queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Verifica se pode aplicar baseado nos limites
   */
  async canApply() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // Filtra aplicações recentes
    const recentApplications = this.applicationHistory.filter(app => 
      now - app.timestamp < oneDay
    );

    const applicationsLastHour = recentApplications.filter(app => 
      now - app.timestamp < oneHour
    );

    // Verifica limite por hora
    if (applicationsLastHour.length >= this.rateLimits.maxPerHour) {
      return {
        allowed: false,
        reason: `Limite de ${this.rateLimits.maxPerHour} candidaturas por hora atingido`,
        nextAllowedAt: Math.min(...applicationsLastHour.map(app => app.timestamp)) + oneHour
      };
    }

    // Verifica limite por dia
    if (recentApplications.length >= this.rateLimits.maxPerDay) {
      return {
        allowed: false,
        reason: `Limite de ${this.rateLimits.maxPerDay} candidaturas por dia atingido`,
        nextAllowedAt: Math.min(...recentApplications.map(app => app.timestamp)) + oneDay
      };
    }

    // Verifica delay mínimo entre aplicações
    if (this.stats.lastProcessedAt) {
      const timeSinceLastApplication = now - this.stats.lastProcessedAt;
      if (timeSinceLastApplication < this.rateLimits.minDelayBetween) {
        return {
          allowed: false,
          reason: 'Aguardando delay mínimo entre candidaturas',
          nextAllowedAt: this.stats.lastProcessedAt + this.rateLimits.minDelayBetween
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Processa fila de candidaturas
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`Starting queue processing. ${this.queue.length} items in queue.`);

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];

        // Verifica se pode processar
        const canProcess = await this.canApply();
        if (!canProcess.allowed) {
          console.log(`Queue processing paused: ${canProcess.reason}`);
          
          // Agenda próxima tentativa
          if (canProcess.nextAllowedAt) {
            const delay = canProcess.nextAllowedAt - Date.now();
            setTimeout(() => this.processQueue(), Math.max(delay, 60000)); // Mínimo 1 minuto
          }
          break;
        }

        // Remove item da fila
        this.queue.shift();
        
        // Processa item
        await this.processQueueItem(item);

        // Delay entre processamentos
        const delay = WorkInUtils.TimeUtils.getRandomDelay(
          this.rateLimits.minDelayBetween,
          this.rateLimits.maxDelayBetween
        );
        
        if (this.queue.length > 0) {
          console.log(`Waiting ${delay}ms before next application...`);
          await WorkInUtils.TimeUtils.delay(delay);
        }
      }

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.processing = false;
      await this.persistQueue();
      console.log('Queue processing completed');
    }
  }

  /**
   * Processa um item da fila
   */
  async processQueueItem(item) {
    try {
      console.log(`Processing queue item: ${item.id} (${item.jobData?.title})`);
      
      item.status = 'processing';
      item.startedAt = Date.now();

      // Verifica se a aba ainda existe
      let tab = null;
      if (item.tabId) {
        try {
          tab = await chrome.tabs.get(item.tabId);
        } catch (error) {
          // Aba não existe mais, cria nova
          tab = await chrome.tabs.create({ url: item.jobData.url });
          item.tabId = tab.id;
        }
      } else {
        // Cria nova aba
        tab = await chrome.tabs.create({ url: item.jobData.url });
        item.tabId = tab.id;
      }

      // Processa candidatura
      const applicationManager = globalThis.WorkInServiceWorker?.applicationManager;
      if (!applicationManager) {
        throw new Error('Application Manager not available');
      }

      const result = await applicationManager.applyToJob(item.jobData, tab);

      if (result.success) {
        await this.markCompleted(item.id, result);
      } else {
        await this.markFailed(item.id, result.error);
      }

    } catch (error) {
      console.error(`Failed to process queue item ${item.id}:`, error);
      await this.markFailed(item.id, error.message);
    }
  }

  /**
   * Marca item como completado
   */
  async markCompleted(itemId, result = {}) {
    const item = this.findQueueItem(itemId);
    if (!item) return;

    item.status = 'completed';
    item.completedAt = Date.now();
    item.result = result;

    // Adiciona ao histórico
    this.applicationHistory.push({
      id: itemId,
      jobId: item.jobData?.id,
      timestamp: Date.now(),
      status: 'success',
      duration: item.completedAt - item.startedAt
    });

    // Atualiza estatísticas
    this.stats.totalProcessed++;
    this.stats.successful++;
    this.stats.lastProcessedAt = Date.now();

    // Remove da fila se ainda estiver lá
    this.removeFromQueue(itemId);

    await this.persistQueue();
    await this.persistHistory();

    console.log(`Queue item completed: ${itemId}`);
  }

  /**
   * Marca item como falhado
   */
  async markFailed(itemId, error) {
    const item = this.findQueueItem(itemId);
    if (!item) return;

    item.retries = (item.retries || 0) + 1;
    item.lastError = error;
    item.lastAttemptAt = Date.now();

    // Verifica se deve tentar novamente
    const maxRetries = 3;
    if (item.retries < maxRetries) {
      item.status = 'pending';
      console.log(`Queue item failed, will retry: ${itemId} (attempt ${item.retries}/${maxRetries})`);
      
      // Move para o final da fila
      this.removeFromQueue(itemId);
      this.queue.push(item);
    } else {
      item.status = 'failed';
      item.failedAt = Date.now();

      // Adiciona ao histórico
      this.applicationHistory.push({
        id: itemId,
        jobId: item.jobData?.id,
        timestamp: Date.now(),
        status: 'failed',
        error: error
      });

      // Atualiza estatísticas
      this.stats.totalProcessed++;
      this.stats.failed++;

      // Remove da fila
      this.removeFromQueue(itemId);

      console.log(`Queue item permanently failed: ${itemId}`);
    }

    await this.persistQueue();
    await this.persistHistory();
  }

  /**
   * Encontra item na fila
   */
  findQueueItem(itemId) {
    return this.queue.find(item => item.id === itemId);
  }

  /**
   * Remove item da fila
   */
  removeFromQueue(itemId) {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Obtém status da fila
   */
  getQueueStatus() {
    const pending = this.queue.filter(item => item.status === 'pending').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const failed = this.queue.filter(item => item.status === 'failed').length;

    return {
      total: this.queue.length,
      pending,
      processing,
      failed,
      isProcessing: this.processing,
      stats: this.stats
    };
  }

  /**
   * Obtém próximo horário permitido para candidatura
   */
  async getNextAllowedTime() {
    const canApply = await this.canApply();
    return canApply.nextAllowedAt || Date.now();
  }

  /**
   * Pausa processamento da fila
   */
  pauseQueue() {
    this.processing = false;
    console.log('Queue processing paused');
  }

  /**
   * Resume processamento da fila
   */
  resumeQueue() {
    if (!this.processing && this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Limpa fila
   */
  async clearQueue() {
    this.queue = [];
    await this.persistQueue();
    console.log('Queue cleared');
  }

  /**
   * Remove item específico da fila
   */
  async removeQueueItem(itemId) {
    this.removeFromQueue(itemId);
    await this.persistQueue();
    console.log(`Queue item removed: ${itemId}`);
  }

  /**
   * Obtém histórico de candidaturas
   */
  getApplicationHistory(limit = 100) {
    return this.applicationHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Limpa histórico antigo
   */
  async cleanupHistory() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    this.applicationHistory = this.applicationHistory.filter(app => 
      app.timestamp > thirtyDaysAgo
    );
    
    await this.persistHistory();
    console.log('Application history cleaned up');
  }

  /**
   * Persiste fila no storage
   */
  async persistQueue() {
    try {
      await chrome.storage.local.set({
        'workin_queue': this.queue,
        'workin_queue_stats': this.stats
      });
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  /**
   * Carrega fila persistida
   */
  async loadPersistedQueue() {
    try {
      const result = await chrome.storage.local.get(['workin_queue', 'workin_queue_stats']);
      
      if (result.workin_queue) {
        this.queue = result.workin_queue;
      }
      
      if (result.workin_queue_stats) {
        this.stats = { ...this.stats, ...result.workin_queue_stats };
      }
      
      console.log(`Loaded ${this.queue.length} items from persisted queue`);
    } catch (error) {
      console.error('Failed to load persisted queue:', error);
    }
  }

  /**
   * Persiste histórico
   */
  async persistHistory() {
    try {
      await chrome.storage.local.set({
        'workin_application_history': this.applicationHistory
      });
    } catch (error) {
      console.error('Failed to persist history:', error);
    }
  }

  /**
   * Carrega histórico
   */
  async loadApplicationHistory() {
    try {
      const result = await chrome.storage.local.get('workin_application_history');
      
      if (result.workin_application_history) {
        this.applicationHistory = result.workin_application_history;
      }
      
      console.log(`Loaded ${this.applicationHistory.length} items from application history`);
    } catch (error) {
      console.error('Failed to load application history:', error);
    }
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getDetailedStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const recentHistory = this.applicationHistory.filter(app => 
      now - app.timestamp < oneWeek
    );

    const stats = {
      queue: this.getQueueStatus(),
      
      applications: {
        total: this.applicationHistory.length,
        successful: this.applicationHistory.filter(app => app.status === 'success').length,
        failed: this.applicationHistory.filter(app => app.status === 'failed').length
      },
      
      recent: {
        lastHour: recentHistory.filter(app => now - app.timestamp < oneHour).length,
        lastDay: recentHistory.filter(app => now - app.timestamp < oneDay).length,
        lastWeek: recentHistory.length
      },
      
      rateLimits: this.rateLimits,
      
      performance: {
        averageDuration: this.calculateAverageDuration(),
        successRate: this.calculateSuccessRate()
      }
    };

    return stats;
  }

  /**
   * Calcula duração média das candidaturas
   */
  calculateAverageDuration() {
    const successfulApps = this.applicationHistory.filter(app => 
      app.status === 'success' && app.duration
    );
    
    if (successfulApps.length === 0) return 0;
    
    const totalDuration = successfulApps.reduce((sum, app) => sum + app.duration, 0);
    return Math.round(totalDuration / successfulApps.length);
  }

  /**
   * Calcula taxa de sucesso
   */
  calculateSuccessRate() {
    if (this.applicationHistory.length === 0) return 0;
    
    const successful = this.applicationHistory.filter(app => app.status === 'success').length;
    return Math.round((successful / this.applicationHistory.length) * 100);
  }
}

// Exporta para uso global
if (typeof globalThis !== 'undefined') {
  globalThis.QueueManager = QueueManager;
}
