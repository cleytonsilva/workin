/**
 * WorkIn Extension - LinkedIn Job Detector Content Script
 * Detecta vagas no LinkedIn e injeta funcionalidades da extensão
 */

class LinkedInDetector {
  constructor() {
    this.isInitialized = false;
    this.isCollecting = false;
    this.currentJobs = new Map();
    this.observer = null;
    this.settings = null;
    
    // Seletores para diferentes layouts do LinkedIn
    this.selectors = {
      // Página individual de vaga
      jobPage: {
        container: '.jobs-unified-top-card, .job-details-jobs-unified-top-card',
        title: '.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title',
        company: '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name',
        location: '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet',
        easyApplyButton: '.jobs-apply-button--top-card, .jobs-apply-button',
        description: '.jobs-description-content__text, .job-details-jobs-unified-top-card__primary-description-text'
      },
      
      // Lista de vagas
      jobList: {
        containers: '.job-card-container, .jobs-search-results__list-item',
        title: '.job-card-list__title, .job-card-container__link',
        company: '.job-card-container__primary-description, .job-card-list__company-name',
        location: '.job-card-container__metadata-item, .job-card-list__metadata',
        easyApplyButton: '.job-card-container__apply-method, .jobs-apply-button'
      },
      
      // Formulário de candidatura
      applicationForm: {
        modal: '.jobs-easy-apply-modal, .application-modal',
        form: '.jobs-easy-apply-content, .application-form',
        nextButton: '.artdeco-button--primary[aria-label*="Next"], .artdeco-button--primary[data-control-name*="continue"]',
        submitButton: '.artdeco-button--primary[aria-label*="Submit"], .artdeco-button--primary[data-control-name*="submit"]',
        reviewButton: '.artdeco-button--primary[aria-label*="Review"], .artdeco-button--primary[data-control-name*="review"]'
      }
    };
    
    this.init();
  }

  /**
   * Inicializa o detector
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Carrega configurações
      await this.loadSettings();
      
      // Verifica se está em uma página relevante
      if (!this.isLinkedInJobsPage()) {
        return;
      }
      
      // Inicia detecção
      await this.startDetection();
      
      // Configura observer para mudanças na página
      this.setupPageObserver();
      
      // Configura listener para mensagens do popup/service worker
      this.setupMessageListener();
      
      // Configura listeners de atividade do usuário para segurança
      this.setupUserActivityListeners();
      
      this.isInitialized = true;
      WorkInUtils.LogUtils.log('info', 'LinkedIn Detector initialized successfully');
      
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to initialize LinkedIn Detector', { error });
    }
  }

  /**
   * Carrega configurações da extensão
   */
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });
      
      this.settings = response.settings || this.getDefaultSettings();
    } catch (error) {
      WorkInUtils.LogUtils.log('warn', 'Failed to load settings, using defaults', { error });
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Configurações padrão
   */
  getDefaultSettings() {
    return {
      filters: {
        minScore: 60,
        mustHaveKeywords: [],
        excludeKeywords: [],
        excludeCompanies: []
      },
      automationLimits: {
        delayMin: 3000,
        delayMax: 8000,
        maxPerHour: 20
      }
    };
  }

  /**
   * Verifica se está em uma página de vagas do LinkedIn
   */
  isLinkedInJobsPage() {
    const url = window.location.href;
    return url.includes('linkedin.com') && 
           (url.includes('/jobs/') || url.includes('/job/'));
  }

  /**
   * Inicia a detecção de vagas
   */
  async startDetection() {
    // Detecta vaga individual
    if (this.isJobDetailPage()) {
      await this.detectSingleJob();
    }
    
    // Detecta lista de vagas
    if (this.isJobListPage()) {
      await this.detectJobList();
    }
  }

  /**
   * Verifica se é página de detalhes de vaga
   */
  isJobDetailPage() {
    return window.location.href.includes('/jobs/view/') ||
           document.querySelector(this.selectors.jobPage.container);
  }

  /**
   * Verifica se é página de lista de vagas
   */
  isJobListPage() {
    return window.location.href.includes('/jobs/search/') ||
           document.querySelector(this.selectors.jobList.containers);
  }

  /**
   * Detecta vaga individual na página
   */
  async detectSingleJob() {
    const jobContainer = document.querySelector(this.selectors.jobPage.container);
    if (!jobContainer) return;

    try {
      const jobData = await this.extractJobData(jobContainer, 'single');
      if (jobData) {
        await this.processJob(jobData, jobContainer);
      }
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to detect single job', { error });
    }
  }

  /**
   * Detecta lista de vagas
   */
  async detectJobList() {
    const jobContainers = document.querySelectorAll(this.selectors.jobList.containers);
    
    for (const container of jobContainers) {
      try {
        const jobData = await this.extractJobData(container, 'list');
        if (jobData) {
          await this.processJob(jobData, container);
        }
      } catch (error) {
        WorkInUtils.LogUtils.log('error', 'Failed to detect job in list', { error });
      }
    }
  }

  /**
   * Inicia coleta automática de vagas com scroll inteligente
   * @param {number} maxResults - Número máximo de vagas para coletar
   * @returns {Promise<Object>} - Resultado da operação
   */
  async startJobCollection(maxResults = 50) {
    if (this.isCollecting) {
      return { error: 'Coleta já em andamento' };
    }
    
    this.isCollecting = true;
    
    try {
      // Verificar segurança antes de iniciar
      if (window.WorkInSafetyManager) {
        const safetyCheck = await window.WorkInSafetyManager.checkSafety('collect');
        if (!safetyCheck.safe) {
          throw new Error(`Verificação de segurança falhou: ${safetyCheck.reason}`);
        }
        
        // Registrar operação
        await window.WorkInSafetyManager.recordOperation('collect', { maxResults });
      }
      
      // Verificar se o módulo scraper está disponível
      if (!window.WorkInJobScraper) {
        throw new Error('Módulo de scraping não carregado');
      }
      
      // Verificar se está em página de vagas
      if (!window.WorkInJobScraper.isLinkedInJobsPage()) {
        throw new Error('Não está em uma página de vagas do LinkedIn');
      }
      
      // Notificar início
      this.showNotification('Iniciando coleta de vagas...', 'info');
      
      // Executar coleta com scroll inteligente
      const result = await window.WorkInJobScraper.collectJobsWithScroll(maxResults);
      
      if (result.success) {
        // Salvar vagas coletadas no storage
        await this.saveCollectedJobs(result.jobs);
        
        // Notificar conclusão
        this.showNotification(`${result.jobs.length} vagas coletadas com sucesso!`, 'success');
        
        // Log da operação
        WorkInUtils.LogUtils.log('info', 'Job collection completed', {
          total: result.jobs.length,
          maxResults,
          duration: Date.now() - result.timestamp
        });
        
        return result;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Job collection failed', { error: error.message });
      this.showNotification('Erro na coleta: ' + error.message, 'error');
      return { error: error.message };
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Scroll inteligente com simulação de comportamento humano
   * @param {Element} container - Container da lista de vagas
   * @param {number} maxResults - Número máximo de resultados
   * @returns {Promise<number>} - Número de vagas carregadas
   */
  async performSmartScroll(container, maxResults) {
    if (!window.WorkInJobScraper) {
      throw new Error('Módulo de scraping não disponível');
    }
    
    return await window.WorkInJobScraper.performScroll(container, maxResults);
  }

  /**
   * Salva vagas coletadas no storage da extensão
   * @param {Array<Object>} jobs - Array de vagas coletadas
   */
  async saveCollectedJobs(jobs) {
    try {
      // Enviar para o service worker para salvar
      const response = await chrome.runtime.sendMessage({
        action: 'saveCollectedJobs',
        jobs: jobs
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      WorkInUtils.LogUtils.log('info', 'Jobs saved to storage', { count: jobs.length });
      
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to save collected jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Extrai todas as vagas visíveis do container
   * @param {Element} container - Container da lista
   * @returns {Array<Object>} - Array de vagas extraídas
   */
  extractAllJobs(container) {
    if (!window.WorkInJobScraper) {
      throw new Error('Módulo de scraping não disponível');
    }
    
    return window.WorkInJobScraper.scrapeJobs(container);
  }

  /**
   * Extrai dados da vaga do DOM
   */
  async extractJobData(container, type) {
    const selectors = type === 'single' ? this.selectors.jobPage : this.selectors.jobList;
    
    try {
      // Extrai informações básicas
      const titleElement = container.querySelector(selectors.title);
      const companyElement = container.querySelector(selectors.company);
      const locationElement = container.querySelector(selectors.location);
      const easyApplyElement = container.querySelector(selectors.easyApplyButton);
      
      if (!titleElement || !companyElement) {
        return null;
      }

      const title = this.cleanText(titleElement.textContent);
      const company = this.cleanText(companyElement.textContent);
      const location = locationElement ? this.cleanText(locationElement.textContent) : '';
      
      // Verifica se tem Easy Apply
      const hasEasyApply = easyApplyElement && 
                          (easyApplyElement.textContent.includes('Easy Apply') ||
                           easyApplyElement.textContent.includes('Candidatura Simplificada'));

      // Extrai URL da vaga
      let jobUrl = window.location.href;
      if (type === 'list') {
        const linkElement = container.querySelector('a[href*="/jobs/view/"]');
        if (linkElement) {
          jobUrl = linkElement.href;
        }
      }

      // Extrai ID da vaga da URL
      const jobIdMatch = jobUrl.match(/\/jobs\/view\/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : WorkInUtils.StringUtils.generateId();

      // Extrai descrição se disponível
      let description = '';
      if (type === 'single') {
        const descElement = document.querySelector(selectors.description);
        if (descElement) {
          description = this.cleanText(descElement.textContent);
        }
      }

      // Detecta modalidade de trabalho
      const locationText = location.toLowerCase();
      const remote = locationText.includes('remot') || locationText.includes('home');
      const hybrid = locationText.includes('híbrid') || locationText.includes('hybrid');

      const jobData = {
        id: jobId,
        url: jobUrl,
        title,
        company,
        location,
        remote,
        hybrid,
        description,
        hasEasyApply,
        requirements: this.extractRequirements(description),
        publishedDate: Date.now(), // Aproximação
        source: 'linkedin',
        extractedAt: Date.now()
      };

      return jobData;

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to extract job data', { error });
      return null;
    }
  }

  /**
   * Limpa texto extraído do DOM
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Extrai requisitos da descrição
   */
  extractRequirements(description) {
    if (!description) return [];
    
    const keywords = WorkInUtils.StringUtils.extractKeywords(description);
    
    // Filtra palavras-chave técnicas comuns
    const technicalKeywords = keywords.filter(keyword => {
      const tech = keyword.toLowerCase();
      return tech.length > 2 && (
        tech.includes('javascript') || tech.includes('python') || tech.includes('java') ||
        tech.includes('react') || tech.includes('vue') || tech.includes('angular') ||
        tech.includes('node') || tech.includes('sql') || tech.includes('aws') ||
        tech.includes('docker') || tech.includes('kubernetes') || tech.includes('git') ||
        tech.includes('agile') || tech.includes('scrum') || tech.includes('api')
      );
    });
    
    return technicalKeywords.slice(0, 10); // Limita a 10 requisitos
  }

  /**
   * Processa vaga detectada
   */
  async processJob(jobData, container) {
    // Verifica se já foi processada
    if (this.currentJobs.has(jobData.id)) {
      return;
    }

    try {
      // Aplica filtros básicos
      if (!this.passesFilters(jobData)) {
        return;
      }

      // Salva vaga no storage
      await this.saveJob(jobData);

      // Calcula score de compatibilidade
      const score = await this.calculateCompatibilityScore(jobData);

      // Injeta UI da extensão
      await this.injectJobUI(container, jobData, score);

      // Registra vaga processada
      this.currentJobs.set(jobData.id, {
        ...jobData,
        score,
        container
      });

      WorkInUtils.LogUtils.log('info', `Job processed: ${jobData.title} at ${jobData.company}`, {
        jobId: jobData.id,
        score
      });

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to process job', { error, jobData });
    }
  }

  /**
   * Verifica se a vaga passa pelos filtros
   */
  passesFilters(jobData) {
    const filters = this.settings.filters;

    // Verifica empresas excluídas
    if (filters.excludeCompanies.some(company => 
        jobData.company.toLowerCase().includes(company.toLowerCase()))) {
      return false;
    }

    // Verifica palavras-chave excluídas
    const jobText = `${jobData.title} ${jobData.description}`.toLowerCase();
    if (filters.excludeKeywords.some(keyword => 
        jobText.includes(keyword.toLowerCase()))) {
      return false;
    }

    // Verifica se tem Easy Apply (requisito básico)
    if (!jobData.hasEasyApply) {
      return false;
    }

    return true;
  }

  /**
   * Salva vaga no storage
   */
  async saveJob(jobData) {
    try {
      await chrome.runtime.sendMessage({
        action: 'saveJob',
        jobData
      });
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to save job', { error });
    }
  }

  /**
   * Calcula score de compatibilidade
   */
  async calculateCompatibilityScore(jobData) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'calculateMatch',
        jobData
      });
      
      return response.score || 0;
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to calculate compatibility score', { error });
      return 0;
    }
  }

  /**
   * Injeta UI da extensão na vaga
   */
  async injectJobUI(container, jobData, score) {
    // Remove UI anterior se existir
    const existingUI = container.querySelector('.workin-element');
    if (existingUI) {
      existingUI.remove();
    }

    // Adiciona classe para identificar container
    container.classList.add('workin-job-container');

    // Cria badge de score
    const badge = this.createScoreBadge(score, jobData);
    container.appendChild(badge);

    // Cria botão de ação rápida
    const actionButton = this.createQuickActionButton(jobData);
    container.appendChild(actionButton);

    // Adiciona indicador de status se já foi aplicada
    const status = await this.getJobStatus(jobData.id);
    if (status) {
      const statusIndicator = this.createStatusIndicator(status);
      container.appendChild(statusIndicator);
    }
  }

  /**
   * Cria badge de score
   */
  createScoreBadge(score, jobData) {
    const badge = document.createElement('div');
    badge.className = 'workin-element workin-score-badge';
    
    // Define classe baseada no score
    if (score >= 80) {
      badge.classList.add('high-score');
    } else if (score >= 60) {
      badge.classList.add('medium-score');
    } else {
      badge.classList.add('low-score');
    }

    badge.innerHTML = `
      <div>🎯 ${score}%</div>
      <div class="workin-tooltip">
        <strong>Compatibilidade: ${score}%</strong><br>
        Clique para ver detalhes
      </div>
    `;

    // Adiciona evento de clique
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showJobDetails(jobData, score);
    });

    return badge;
  }

  /**
   * Cria botão de ação rápida
   */
  createQuickActionButton(jobData) {
    const button = document.createElement('button');
    button.className = 'workin-element workin-quick-action';
    button.textContent = 'Aplicar WorkIn';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.quickApply(jobData);
    });

    return button;
  }

  /**
   * Cria indicador de status
   */
  createStatusIndicator(status) {
    const indicator = document.createElement('div');
    indicator.className = `workin-element workin-status-indicator ${status}`;
    indicator.title = `Status: ${status}`;
    return indicator;
  }

  /**
   * Obtém status da vaga
   */
  async getJobStatus(jobId) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getJobStatus',
        jobId
      });
      return response.status;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mostra detalhes da vaga
   */
  showJobDetails(jobData, score) {
    chrome.runtime.sendMessage({
      action: 'showJobDetails',
      jobData,
      score
    });
  }

  /**
   * Aplicação rápida
   */
  async quickApply(jobData) {
    try {
      // Mostra indicador de processamento
      this.showProcessingIndicator(jobData.id);

      // Envia comando para aplicar
      const response = await chrome.runtime.sendMessage({
        action: 'quickApply',
        jobData
      });

      if (response.success) {
        this.showNotification('Candidatura enviada com sucesso!', 'success');
        await this.updateJobStatus(jobData.id, 'applied');
      } else {
        this.showNotification(response.error || 'Erro ao enviar candidatura', 'error');
      }

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Quick apply failed', { error });
      this.showNotification('Erro ao processar candidatura', 'error');
    } finally {
      this.hideProcessingIndicator(jobData.id);
    }
  }

  /**
   * Mostra indicador de processamento
   */
  showProcessingIndicator(jobId) {
    const job = this.currentJobs.get(jobId);
    if (!job) return;

    const indicator = document.createElement('div');
    indicator.className = 'workin-element workin-processing';
    indicator.id = `workin-processing-${jobId}`;
    
    job.container.appendChild(indicator);
  }

  /**
   * Esconde indicador de processamento
   */
  hideProcessingIndicator(jobId) {
    const indicator = document.getElementById(`workin-processing-${jobId}`);
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Atualiza status da vaga
   */
  async updateJobStatus(jobId, status) {
    try {
      await chrome.runtime.sendMessage({
        action: 'updateJobStatus',
        jobId,
        status
      });

      // Atualiza UI
      const job = this.currentJobs.get(jobId);
      if (job) {
        const existingIndicator = job.container.querySelector('.workin-status-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }
        
        const newIndicator = this.createStatusIndicator(status);
        job.container.appendChild(newIndicator);
      }

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to update job status', { error });
    }
  }

  /**
   * Mostra notificação
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `workin-element workin-notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Anima entrada
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove após 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Configura observer para mudanças na página
   */
  setupPageObserver() {
    // Desconecta observer anterior se existir
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver(
      WorkInUtils.PerformanceUtils.debounce(async (mutations) => {
        let shouldRedetect = false;

        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Verifica se novos elementos de vaga foram adicionados
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches && (
                    node.matches(this.selectors.jobList.containers) ||
                    node.querySelector && node.querySelector(this.selectors.jobList.containers)
                  )) {
                  shouldRedetect = true;
                  break;
                }
              }
            }
          }
        }

        if (shouldRedetect) {
          await this.startDetection();
        }
      }, 1000)
    );

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Configura listener para mensagens do popup/service worker
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indica resposta assíncrona
    });
  }

  /**
   * Manipula mensagens recebidas do popup/service worker
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      const { action, ...data } = message;

      switch (action) {
        case 'startJobCollection':
          const result = await this.startJobCollection(data.maxResults || 50);
          sendResponse(result);
          break;

        case 'getCollectionStatus':
          sendResponse({
            isCollecting: this.isCollecting,
            currentJobsCount: this.currentJobs.size
          });
          break;

        case 'stopCollection':
          this.isCollecting = false;
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Error handling message', { error: error.message });
      sendResponse({ error: error.message });
    }
  }

  /**
   * Configura listeners de atividade do usuário para segurança
   */
  setupUserActivityListeners() {
    if (!window.WorkInSafetyManager) {
      return;
    }

    // Registrar atividade em eventos de interação
    const events = ['click', 'scroll', 'keypress', 'mousemove'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        window.WorkInSafetyManager.recordUserActivity(eventType);
      }, { passive: true, once: false });
    });

    // Registrar atividade em mudanças de foco
    window.addEventListener('focus', () => {
      window.WorkInSafetyManager.recordUserActivity('focus');
    });

    window.addEventListener('blur', () => {
      window.WorkInSafetyManager.recordUserActivity('blur');
    });
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.currentJobs.clear();
    this.isInitialized = false;
  }
}

// Inicializa o detector quando a página carrega
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LinkedInDetector();
  });
} else {
  new LinkedInDetector();
}

// Reinicializa em mudanças de URL (SPA)
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(() => {
      new LinkedInDetector();
    }, 1000);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Exporta para uso global se necessário
if (typeof window !== 'undefined') {
  window.WorkInLinkedInDetector = LinkedInDetector;
}