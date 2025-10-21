/**
 * WorkIn Extension - Popup Interface
 * Interface principal da extensão
 */

class WorkInPopup {
  constructor() {
    this.currentTab = 'dashboard';
    this.jobs = [];
    this.queueStatus = null;
    this.settings = null;
    this.isLinkedInPage = false;
    
    this.init();
  }

  /**
   * Inicializa o popup
   */
  async init() {
    try {
      // Configura event listeners
      this.setupEventListeners();
      
      // Carrega dados iniciais
      await this.loadInitialData();
      
      // Atualiza interface
      this.updateUI();
      
      // Configura atualizações automáticas
      this.setupAutoRefresh();
      
      console.log('WorkIn Popup initialized');
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showToast('Erro ao inicializar extensão', 'error');
    }
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Navigation tabs
    document.getElementById('dashboardTab').addEventListener('click', () => this.switchTab('dashboard'));
    document.getElementById('jobsTab').addEventListener('click', () => this.switchTab('jobs'));
    document.getElementById('queueTab').addEventListener('click', () => this.switchTab('queue'));

    // Dashboard actions
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('startOnboardingBtn').addEventListener('click', () => this.startOnboarding());
    document.getElementById('scanPageBtn').addEventListener('click', () => this.scanCurrentPage());
    document.getElementById('collectJobsBtn').addEventListener('click', () => this.collectJobs());
    document.getElementById('toggleAutoApply').addEventListener('change', (e) => this.toggleAutoApply(e.target.checked));
    document.getElementById('autoApplyBtn').addEventListener('click', () => this.startAutoApply());
    document.getElementById('openLinkedInBtn').addEventListener('click', () => this.openLinkedIn());

    // Jobs actions
    document.getElementById('jobFilter').addEventListener('change', (e) => this.filterJobs(e.target.value));
    document.getElementById('refreshJobsBtn').addEventListener('click', () => this.refreshJobs());

    // Queue actions
    document.getElementById('pauseQueueBtn').addEventListener('click', () => this.toggleQueue());
    document.getElementById('clearQueueBtn').addEventListener('click', () => this.clearQueue());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  /**
   * Carrega dados iniciais
   */
  async loadInitialData() {
    try {
      // Verifica página atual
      await this.checkCurrentPage();
      
      // Carrega configurações
      {
        const resp = await this.sendMessage({ action: 'getSettings' });
        this.settings = resp && resp.settings ? resp.settings : null;
      }
      
      // Verifica se onboarding foi concluído
      await this.checkOnboardingStatus();
      
      // Carrega estado da automação
      await this.loadAutomationState();
      
      // Carrega vagas
      {
        const respJobs = await this.sendMessage({ action: 'getJobs' });
        this.jobs = respJobs && respJobs.jobs ? respJobs.jobs : [];
      }
      
      // Carrega status da fila
      {
        const respQ = await this.sendMessage({ action: 'getQueueStatus' });
        this.queueStatus = respQ || { status: 'idle', pending: 0 };
      }
      
      // Carrega atividade recente
      await this.loadRecentActivity();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  /**
   * Verifica página atual
   */
  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        this.isLinkedInPage = tab.url.includes('linkedin.com');
        
        if (this.isLinkedInPage) {
          // Obtém informações da página
          const pageInfo = await this.sendMessage({ 
            action: 'getPageInfo',
            tabId: tab.id 
          });
          
          this.updateCurrentPageInfo(pageInfo);
        }
      }
    } catch (error) {
      console.error('Failed to check current page:', error);
    }
  }

  /**
   * Atualiza informações da página atual
   */
  updateCurrentPageInfo(pageInfo) {
    const currentPageInfo = document.getElementById('currentPageInfo');
    const pageDetails = document.getElementById('pageDetails');
    const pageStatus = document.getElementById('pageStatus');

    if (this.isLinkedInPage && pageInfo) {
      currentPageInfo.classList.remove('hidden');
      
      if (pageInfo.isJobPage) {
        pageDetails.innerHTML = `
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span>Página de vaga detectada</span>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Vaga</span>
            </div>
            ${pageInfo.jobTitle ? `<div class="text-xs text-gray-500">${pageInfo.jobTitle}</div>` : ''}
          </div>
        `;
      } else if (pageInfo.isJobList) {
        pageDetails.innerHTML = `
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span>Lista de vagas detectada</span>
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Lista</span>
            </div>
            <div class="text-xs text-gray-500">${pageInfo.jobCount || 0} vagas encontradas</div>
          </div>
        `;
      } else {
        pageDetails.innerHTML = `
          <div class="flex items-center justify-between">
            <span>LinkedIn detectado</span>
            <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Geral</span>
          </div>
        `;
      }
      
      pageStatus.textContent = 'Ativo';
      pageStatus.className = 'px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs';
    } else {
      currentPageInfo.classList.add('hidden');
    }
  }

  /**
   * Carrega atividade recente
   */
  async loadRecentActivity() {
    try {
      const activity = await this.sendMessage({ action: 'getRecentActivity', limit: 5 });
      const container = document.getElementById('recentActivity');
      
      if (activity && activity.length > 0) {
        container.innerHTML = activity.map(item => `
          <div class="flex items-center justify-between p-2 bg-white rounded border">
            <div class="flex-1">
              <div class="text-sm font-medium">${item.title}</div>
              <div class="text-xs text-gray-500">${this.formatTime(item.timestamp)}</div>
            </div>
            <div class="status-indicator ${item.status}">
              ${item.status === 'success' ? '✓' : item.status === 'failed' ? '✗' : '⏳'}
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="text-sm text-gray-500 text-center py-4">
            Nenhuma atividade recente
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  /**
   * Atualiza interface
   */
  updateUI() {
    this.updateDashboard();
    this.updateJobsList();
    this.updateQueue();
    this.updateButtons();
  }

  /**
   * Atualiza dashboard
   */
  updateDashboard() {
    // Contadores
    document.getElementById('totalJobsCount').textContent = this.jobs.length;
    
    const appliedJobs = this.jobs.filter(job => job.applicationStatus === 'applied').length;
    document.getElementById('applicationsCount').textContent = appliedJobs;

    // Status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    if (this.isLinkedInPage) {
      statusIndicator.className = 'w-3 h-3 bg-green-400 rounded-full';
      statusIndicator.title = 'Status: Ativo no LinkedIn';
    } else {
      statusIndicator.className = 'w-3 h-3 bg-gray-400 rounded-full';
      statusIndicator.title = 'Status: Inativo';
    }
  }

  /**
   * Atualiza lista de vagas
   */
  updateJobsList() {
    const container = document.getElementById('jobsList');
    const filter = document.getElementById('jobFilter').value;
    
    let filteredJobs = this.jobs;
    
    // Aplica filtros
    switch (filter) {
      case 'high-match':
        filteredJobs = this.jobs.filter(job => job.compatibilityScore >= 80);
        break;
      case 'medium-match':
        filteredJobs = this.jobs.filter(job => job.compatibilityScore >= 60 && job.compatibilityScore < 80);
        break;
      case 'low-match':
        filteredJobs = this.jobs.filter(job => job.compatibilityScore < 60);
        break;
      case 'easy-apply':
        filteredJobs = this.jobs.filter(job => job.isEasyApply);
        break;
      case 'applied':
        filteredJobs = this.jobs.filter(job => job.applicationStatus === 'applied');
        break;
    }

    if (filteredJobs.length > 0) {
      container.innerHTML = filteredJobs.map(job => this.createJobItem(job)).join('');
      
      // Adiciona event listeners
      container.querySelectorAll('.job-item').forEach(item => {
        item.addEventListener('click', () => this.openJob(item.dataset.jobId));
      });
      
      container.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.applyToJob(btn.dataset.jobId);
        });
      });
      
      container.querySelectorAll('.queue-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.addToQueue(btn.dataset.jobId);
        });
      });
      
    } else {
      container.innerHTML = `
        <div class="text-sm text-gray-500 text-center py-8">
          ${filter === 'all' ? 'Nenhuma vaga encontrada' : 'Nenhuma vaga corresponde ao filtro'}
        </div>
      `;
    }
  }

  /**
   * Cria item de vaga
   */
  createJobItem(job) {
    const scoreClass = job.compatibilityScore >= 80 ? 'high' : 
                     job.compatibilityScore >= 60 ? 'medium' : 'low';
    
    const matchClass = job.compatibilityScore >= 80 ? 'high-match' : 
                      job.compatibilityScore >= 60 ? 'medium-match' : 'low-match';

    const isApplied = job.applicationStatus === 'applied';
    
    return `
      <div class="job-item ${matchClass} ${isApplied ? 'applied' : ''}" data-job-id="${job.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <h4 class="text-sm font-medium text-gray-900 truncate">${job.title}</h4>
              <div class="score-badge ${scoreClass}">${job.compatibilityScore}</div>
            </div>
            <p class="text-sm text-gray-600 mb-1">${job.company}</p>
            <p class="text-xs text-gray-500">${job.location}</p>
            
            <div class="flex items-center space-x-2 mt-2">
              ${job.isEasyApply ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Easy Apply</span>' : ''}
              ${job.isRemote ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Remoto</span>' : ''}
              ${isApplied ? '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Candidatado</span>' : ''}
            </div>
          </div>
          
          <div class="flex flex-col space-y-1 ml-2">
            ${!isApplied && job.isEasyApply ? `
              <button class="apply-btn px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs" data-job-id="${job.id}">
                Candidatar
              </button>
            ` : ''}
            ${!isApplied ? `
              <button class="queue-btn px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs" data-job-id="${job.id}">
                + Fila
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Atualiza fila
   */
  updateQueue() {
    if (!this.queueStatus) return;

    // Contadores
    document.getElementById('queuePendingCount').textContent = this.queueStatus.pending || 0;
    document.getElementById('queueProcessingCount').textContent = this.queueStatus.processing || 0;
    document.getElementById('queueCompletedCount').textContent = this.queueStatus.completed || 0;

    // Rate limit info
    this.updateRateLimitInfo();

    // Items da fila
    this.updateQueueItems();

    // Botão de pause/resume
    const pauseBtn = document.getElementById('pauseQueueBtn');
    if (this.queueStatus.status === 'processing') {
      pauseBtn.textContent = 'Pausar';
      pauseBtn.className = 'px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm';
    } else {
      pauseBtn.textContent = 'Retomar';
      pauseBtn.className = 'px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm';
    }
  }

  /**
   * Atualiza informações de rate limit
   */
  async updateRateLimitInfo() {
    try {
      const rateLimitInfo = await this.sendMessage({ action: 'getRateLimitInfo' });
      const info = (rateLimitInfo && rateLimitInfo.info) ? rateLimitInfo.info : null;
      
      if (info) {
        document.getElementById('applicationsToday').textContent = 
          `${info.day.used}/${info.day.limit}`;
        
        document.getElementById('applicationsLastHour').textContent = 
          `${info.hour.used}/${info.hour.limit}`;
        
        const nextAllowed = info.nextAllowedAt;
        if (nextAllowed && nextAllowed > Date.now()) {
          const timeUntil = this.formatTimeUntil(nextAllowed);
          document.getElementById('nextAllowedTime').textContent = timeUntil;
        } else {
          document.getElementById('nextAllowedTime').textContent = 'Agora';
        }
      }
    } catch (error) {
      console.error('Failed to update rate limit info:', error);
    }
  }

  /**
   * Atualiza items da fila
   */
  async updateQueueItems() {
    try {
      const resp = await this.sendMessage({ action: 'getQueueItems' });
      const queueItems = resp && resp.items ? resp.items : [];
      const container = document.getElementById('queueItems');
      
      if (queueItems.length > 0) {
        container.innerHTML = queueItems.map(item => `
          <div class="queue-item ${item.status}" data-item-id="${item.id}">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">
                  ${item.jobData?.title || 'Vaga sem título'}
                </div>
                <div class="text-xs text-gray-500">
                  ${item.jobData?.company || 'Empresa não informada'}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${this.formatQueueItemStatus(item)}
                </div>
              </div>
              
              <div class="flex items-center space-x-1">
                <span class="status-indicator ${item.status}">
                  ${this.getStatusIcon(item.status)}
                </span>
                ${item.status === 'pending' ? `
                  <button class="remove-queue-item px-1 py-1 text-red-600 hover:bg-red-50 rounded text-xs" data-item-id="${item.id}">
                    ✗
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('');
        
        // Event listeners para remoção
        container.querySelectorAll('.remove-queue-item').forEach(btn => {
          btn.addEventListener('click', () => this.removeQueueItem(btn.dataset.itemId));
        });
        
      } else {
        container.innerHTML = `
          <div class="text-sm text-gray-500 text-center py-4">
            Fila vazia
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to update queue items:', error);
    }
  }

  /**
   * Atualiza botões
   */
  updateButtons() {
    const autoApplyBtn = document.getElementById('autoApplyBtn');
    const scanPageBtn = document.getElementById('scanPageBtn');

    // Auto Apply button
    if (this.isLinkedInPage && this.jobs.some(job => job.isEasyApply && job.applicationStatus !== 'applied')) {
      autoApplyBtn.disabled = false;
    } else {
      autoApplyBtn.disabled = true;
    }

    // Scan Page button
    scanPageBtn.disabled = !this.isLinkedInPage;
  }

  /**
   * Troca de aba
   */
  switchTab(tabName) {
    // Remove active class de todas as abas
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      btn.classList.add('border-transparent', 'text-gray-500');
      btn.classList.remove('border-blue-500', 'text-blue-600');
    });

    // Esconde todo conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });

    // Ativa aba selecionada
    const activeTab = document.getElementById(`${tabName}Tab`);
    const activeContent = document.getElementById(`${tabName}Content`);

    activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeContent.classList.remove('hidden');

    this.currentTab = tabName;

    // Atualiza dados específicos da aba
    if (tabName === 'jobs') {
      this.refreshJobs();
    } else if (tabName === 'queue') {
      this.refreshQueue();
    }
  }

  /**
   * Ações dos botões
   */
  async openSettings() {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Failed to open settings:', error);
      this.showToast('Erro ao abrir configurações', 'error');
    }
  }

  async scanCurrentPage() {
    try {
      this.showLoading(true);
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await this.sendMessage({ 
        action: 'scanPage',
        tabId: tab.id 
      });

      if (result.success) {
        this.showToast(`${result.jobsFound} vagas encontradas`, 'success');
        await this.refreshJobs();
      } else {
        this.showToast(result.error || 'Erro ao escanear página', 'error');
      }
    } catch (error) {
      console.error('Failed to scan page:', error);
      this.showToast('Erro ao escanear página', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async startAutoApply() {
    try {
      const result = await this.sendMessage({ action: 'startAutoApply' });
      
      if (result.success) {
        this.showToast('Candidatura automática iniciada', 'success');
        this.switchTab('queue');
      } else {
        this.showToast(result.error || 'Erro ao iniciar candidatura automática', 'error');
      }
    } catch (error) {
      console.error('Failed to start auto apply:', error);
      this.showToast('Erro ao iniciar candidatura automática', 'error');
    }
  }

  async openLinkedIn() {
    try {
      await chrome.tabs.create({ url: 'https://www.linkedin.com/jobs' });
    } catch (error) {
      console.error('Failed to open LinkedIn:', error);
      this.showToast('Erro ao abrir LinkedIn', 'error');
    }
  }

  async refreshJobs() {
    try {
      this.jobs = await this.sendMessage({ action: 'getJobs' }) || [];
      this.updateJobsList();
      this.updateDashboard();
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    }
  }

  async refreshQueue() {
    try {
      this.queueStatus = await this.sendMessage({ action: 'getQueueStatus' });
      this.updateQueue();
    } catch (error) {
      console.error('Failed to refresh queue:', error);
    }
  }

  filterJobs(filter) {
    this.updateJobsList();
  }

  async toggleQueue() {
    try {
      const action = this.queueStatus?.isProcessing ? 'pauseQueue' : 'resumeQueue';
      const result = await this.sendMessage({ action });
      
      if (result.success) {
        this.showToast(
          this.queueStatus?.isProcessing ? 'Fila pausada' : 'Fila retomada', 
          'success'
        );
        await this.refreshQueue();
      }
    } catch (error) {
      console.error('Failed to toggle queue:', error);
      this.showToast('Erro ao alterar status da fila', 'error');
    }
  }

  async clearQueue() {
    if (confirm('Tem certeza que deseja limpar toda a fila?')) {
      try {
        const result = await this.sendMessage({ action: 'clearQueue' });
        
        if (result.success) {
          this.showToast('Fila limpa', 'success');
          await this.refreshQueue();
        }
      } catch (error) {
        console.error('Failed to clear queue:', error);
        this.showToast('Erro ao limpar fila', 'error');
      }
    }
  }

  async openJob(jobId) {
    try {
      const job = this.jobs.find(j => j.id === jobId);
      if (job) {
        await chrome.tabs.create({ url: job.url });
      }
    } catch (error) {
      console.error('Failed to open job:', error);
    }
  }

  async applyToJob(jobId) {
    try {
      const result = await this.sendMessage({ 
        action: 'applyToJob',
        jobId 
      });
      
      if (result.success) {
        this.showToast('Candidatura enviada com sucesso', 'success');
        await this.refreshJobs();
      } else {
        this.showToast(result.error || 'Erro ao enviar candidatura', 'error');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      this.showToast('Erro ao enviar candidatura', 'error');
    }
  }

  async addToQueue(jobId) {
    try {
      const result = await this.sendMessage({ 
        action: 'addToQueue',
        jobId 
      });
      
      if (result.success) {
        this.showToast('Vaga adicionada à fila', 'success');
        await this.refreshQueue();
      } else {
        this.showToast(result.error || 'Erro ao adicionar à fila', 'error');
      }
    } catch (error) {
      console.error('Failed to add to queue:', error);
      this.showToast('Erro ao adicionar à fila', 'error');
    }
  }

  async removeQueueItem(itemId) {
    try {
      const result = await this.sendMessage({ 
        action: 'removeQueueItem',
        itemId 
      });
      
      if (result.success) {
        this.showToast('Item removido da fila', 'success');
        await this.refreshQueue();
      }
    } catch (error) {
      console.error('Failed to remove queue item:', error);
      this.showToast('Erro ao remover item da fila', 'error');
    }
  }

  /**
   * Utilitários
   */
  handleKeyboard(e) {
    // Atalhos de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          this.switchTab('dashboard');
          break;
        case '2':
          e.preventDefault();
          this.switchTab('jobs');
          break;
        case '3':
          e.preventDefault();
          this.switchTab('queue');
          break;
        case 'r':
          e.preventDefault();
          if (this.currentTab === 'jobs') {
            this.refreshJobs();
          } else if (this.currentTab === 'queue') {
            this.refreshQueue();
          }
          break;
      }
    }
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  }

  formatTimeUntil(timestamp) {
    const diff = timestamp - Date.now();
    
    if (diff <= 0) return 'Agora';
    if (diff < 60000) return `${Math.ceil(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.ceil(diff / 60000)}m`;
    return `${Math.ceil(diff / 3600000)}h`;
  }

  formatQueueItemStatus(item) {
    switch (item.status) {
      case 'pending':
        return `Adicionado ${this.formatTime(item.addedAt)}`;
      case 'processing':
        return `Processando desde ${this.formatTime(item.startedAt)}`;
      case 'completed':
        return `Concluído ${this.formatTime(item.completedAt)}`;
      case 'failed':
        return `Falhou ${this.formatTime(item.failedAt)} (${item.retries} tentativas)`;
      default:
        return 'Status desconhecido';
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm">${message}</span>
        <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  setupAutoRefresh() {
    // Atualiza dados a cada 30 segundos
    setInterval(() => {
      if (this.currentTab === 'dashboard') {
        this.loadRecentActivity();
      } else if (this.currentTab === 'queue') {
        this.refreshQueue();
      }
    }, 30000);
  }

  /**
   * Verifica status do onboarding
   */
  async checkOnboardingStatus() {
    try {
      const data = await chrome.storage.local.get(['onboardingCompleted']);
      const onboardingCompleted = data.onboardingCompleted || false;
      
      const onboardingBtn = document.getElementById('startOnboardingBtn');
      
      if (!onboardingCompleted) {
        onboardingBtn.classList.remove('hidden');
      } else {
        onboardingBtn.classList.add('hidden');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  }

  /**
   * Inicia o processo de onboarding
   */
  async startOnboarding() {
    try {
      // Abre a página de onboarding em uma nova aba
      const onboardingUrl = chrome.runtime.getURL('onboarding/onboarding.html');
      await chrome.tabs.create({ url: onboardingUrl });
      
      // Fecha o popup
      window.close();
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      this.showToast('Erro ao iniciar configuração', 'error');
    }
  }

  /**
   * Inicia coleta de vagas com scroll inteligente
   */
  async collectJobs() {
    try {
      if (!this.isLinkedInPage) {
        this.showToast('Navegue até uma página de vagas do LinkedIn', 'warning');
        return;
      }

      // Mostrar loading
      this.showLoading('Coletando vagas...');

      // Obter aba ativa
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('linkedin.com/jobs')) {
        this.showToast('Navegue até a página de busca de vagas do LinkedIn', 'warning');
        this.hideLoading();
        return;
      }

      // Enviar comando para content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'startJobCollection',
        maxResults: 50
      });

      this.hideLoading();

      if (response && response.success) {
        this.showToast(`${response.total} vagas coletadas com sucesso!`, 'success');
        
        // Atualizar dados
        await this.loadInitialData();
        this.updateUI();
      } else {
        this.showToast(response?.error || 'Erro na coleta de vagas', 'error');
      }

    } catch (error) {
      this.hideLoading();
      console.error('Erro na coleta de vagas:', error);
      this.showToast('Erro na coleta de vagas', 'error');
    }
  }

  /**
   * Toggle de automação de candidaturas
   */
  async toggleAutoApply(enabled) {
    try {
      // Salvar configuração
      await chrome.storage.local.set({
        'automation.enabled': enabled
      });

      // Atualizar estado do botão
      const autoApplyBtn = document.getElementById('autoApplyBtn');
      autoApplyBtn.disabled = !enabled;

      if (enabled) {
        this.showToast('Automação ativada', 'success');
        
        // Opcional: iniciar processamento automático
        const response = await this.sendMessage({
          action: 'processAutoApplicationQueue'
        });
        
        if (response && response.success) {
          this.showToast(`Processando ${response.processed} vagas elegíveis`, 'info');
        }
      } else {
        this.showToast('Automação desativada', 'info');
      }

    } catch (error) {
      console.error('Erro ao alterar automação:', error);
      this.showToast('Erro ao alterar configuração', 'error');
      
      // Reverter estado do toggle
      const toggle = document.getElementById('toggleAutoApply');
      toggle.checked = !enabled;
    }
  }

  /**
   * Carrega estado da automação
   */
  async loadAutomationState() {
    try {
      const data = await chrome.storage.local.get(['automation.enabled']);
      const enabled = data['automation.enabled'] || false;
      
      const toggle = document.getElementById('toggleAutoApply');
      const autoApplyBtn = document.getElementById('autoApplyBtn');
      
      toggle.checked = enabled;
      autoApplyBtn.disabled = !enabled;
      
    } catch (error) {
      console.error('Erro ao carregar estado da automação:', error);
    }
  }

  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
}

// Inicializa popup quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new WorkInPopup();
});
