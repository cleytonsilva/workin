/**
 * WorkIn Extension - Popup Redesign Interface
 * Interface moderna da extensão com componentes Shadcn-style
 */

class WorkInPopupRedesign {
  constructor() {
    this.currentTab = 'dashboard';
    this.jobs = [];
    this.queueStatus = null;
    this.settings = null;
    this.isLinkedInPage = false;
    this.isLoading = false;
    
    this.init();
  }

  /**
   * Inicializa o popup redesenhado
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
      
      console.log('WorkIn Popup Redesign initialized');
      
    } catch (error) {
      console.error('Failed to initialize popup redesign:', error);
      this.showToast('Erro ao inicializar extensão', 'error');
    }
  }

  /**
   * Configura event listeners para nova interface
   */
  setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Action buttons
    document.getElementById('collectJobsBtn').addEventListener('click', () => this.collectJobs());
    document.getElementById('scanPageBtn').addEventListener('click', () => this.scanCurrentPage());
    document.getElementById('toggleAutoApply').addEventListener('change', (e) => this.toggleAutoApply(e.target.checked));
    document.getElementById('refreshJobsBtn').addEventListener('click', () => this.refreshJobs());
    
    // Header actions
    document.getElementById('notificationsBtn').addEventListener('click', () => this.showNotifications());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    
    // Job filter
    document.getElementById('jobFilter').addEventListener('change', (e) => this.filterJobs(e.target.value));
    
    // Queue controls
    document.getElementById('pauseQueueBtn')?.addEventListener('click', () => this.pauseQueue());
    document.getElementById('clearQueueBtn')?.addEventListener('click', () => this.clearQueue());
  }

  /**
   * Alterna entre tabs com animação
   */
  switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    // Remove active de todos os elementos
    document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => {
      el.classList.remove('active');
    });
    
    // Adiciona active aos elementos selecionados
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    this.currentTab = tabName;
    
    // Carrega dados específicos da tab
    this.loadTabData(tabName);
    
    console.log(`Switched to ${tabName} tab`);
  }

  /**
   * Carrega dados específicos de cada tab
   */
  async loadTabData(tabName) {
    switch (tabName) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'jobs':
        await this.loadJobsData();
        break;
      case 'queue':
        await this.loadQueueData();
        break;
    }
  }

  /**
   * Carrega dados iniciais
   */
  async loadInitialData() {
    try {
      this.showLoading('Carregando dados...');
      
      // Carrega configurações
      await this.loadSettings();
      
      // Verifica página atual
      await this.checkCurrentPage();
      
      // Carrega estatísticas
      await this.loadStats();
      
      // Carrega estado da automação
      await this.loadAutomationState();
      
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      console.error('Error loading initial data:', error);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  /**
   * Carrega configurações
   */
  async loadSettings() {
    try {
      const data = await chrome.storage.local.get(['settings']);
      this.settings = data.settings || {};
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {};
    }
  }

  /**
   * Verifica página atual
   */
  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.isLinkedInPage = tab.url.includes('linkedin.com');
      
      // Atualiza status do LinkedIn
      const linkedinStatus = document.getElementById('linkedinStatus');
      if (linkedinStatus) {
        const indicator = linkedinStatus.querySelector('.status-indicator');
        if (this.isLinkedInPage) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      }
      
    } catch (error) {
      console.error('Error checking current page:', error);
      this.isLinkedInPage = false;
    }
  }

  /**
   * Carrega estatísticas
   */
  async loadStats() {
    try {
      // Carrega contadores de vagas e candidaturas
      const data = await chrome.storage.local.get(['jobCount', 'applicationCount']);
      
      document.getElementById('totalJobsCount').textContent = data.jobCount || 0;
      document.getElementById('applicationsCount').textContent = data.applicationCount || 0;
      
    } catch (error) {
      console.error('Error loading stats:', error);
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
      if (toggle) {
        toggle.checked = enabled;
      }
      
      // Atualiza estatísticas de automação
      await this.updateAutomationStats();
      
    } catch (error) {
      console.error('Error loading automation state:', error);
    }
  }

  /**
   * Atualiza estatísticas de automação
   */
  async updateAutomationStats() {
    try {
      const data = await chrome.storage.local.get(['dailyApplications', 'hourlyApplications']);
      
      const todayCount = data.dailyApplications || 0;
      const hourlyCount = data.hourlyApplications || 0;
      
      document.getElementById('todayApplications').textContent = `${todayCount}/20`;
      document.getElementById('hourlyApplications').textContent = `${hourlyCount}/5`;
      
    } catch (error) {
      console.error('Error updating automation stats:', error);
    }
  }

  /**
   * Carrega dados do dashboard
   */
  async loadDashboardData() {
    try {
      // Carrega atividade recente
      await this.loadRecentActivity();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  /**
   * Carrega atividade recente
   */
  async loadRecentActivity() {
    try {
      const data = await chrome.storage.local.get(['recentActivity']);
      const activities = data.recentActivity || [];
      
      const container = document.getElementById('recentActivity');
      if (!container) return;
      
      if (activities.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-text-muted">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-sm">Nenhuma atividade recente</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = activities.slice(0, 5).map(activity => {
        const icon = this.getActivityIcon(activity.type);
        const time = this.formatTime(activity.timestamp);
        
        return `
          <div class="activity-item">
            <div class="activity-icon">
              <span class="w-4 h-4">${icon}</span>
            </div>
            <div class="activity-content">
              <div class="activity-title">${activity.title}</div>
              <div class="activity-desc">${activity.description}</div>
              <div class="activity-time">${time}</div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  /**
   * Obtém ícone para tipo de atividade
   */
  getActivityIcon(type) {
    const icons = {
      'job_collected': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>',
      'application_sent': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'page_scanned': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
      'automation_toggled': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    
    return icons[type] || icons['job_collected'];
  }

  /**
   * Formata timestamp para exibição
   */
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  }

  /**
   * Carrega dados de vagas
   */
  async loadJobsData() {
    try {
      const data = await chrome.storage.local.get(['jobs']);
      this.jobs = data.jobs || [];
      
      this.renderJobs();
      
    } catch (error) {
      console.error('Error loading jobs data:', error);
    }
  }

  /**
   * Renderiza lista de vagas
   */
  renderJobs() {
    const container = document.getElementById('jobsList');
    if (!container) return;
    
    if (this.jobs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-text-muted">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
          <p class="text-sm">Use o botão "Coletar Vagas" para buscar vagas no LinkedIn</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.jobs.map(job => {
      const badges = [];
      
      if (job.hasEasyApply) {
        badges.push('<span class="badge bg-success-light text-success border-success/20">Easy Apply</span>');
      }
      
      if (job.compatibility && job.compatibility > 80) {
        badges.push('<span class="badge bg-primary-light text-primary border-primary/20">Alta Compatibilidade</span>');
      }
      
      return `
        <div class="job-item">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-text truncate flex-1 mr-2">${job.title}</h3>
            <div class="flex gap-1 flex-shrink-0">
              ${badges.join('')}
            </div>
          </div>
          <p class="text-sm text-text-muted mb-2">${job.company}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-text-light">${this.formatTime(job.timestamp)}</span>
            <button class="text-xs text-primary hover:text-primary-hover font-medium" onclick="window.open('${job.url}', '_blank')">
              Ver vaga →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Carrega dados da fila
   */
  async loadQueueData() {
    try {
      const data = await chrome.storage.local.get(['queueStatus', 'queueItems']);
      this.queueStatus = data.queueStatus || { pending: 0, processing: 0, completed: 0 };
      
      // Atualiza contadores
      document.getElementById('queuePendingCount').textContent = this.queueStatus.pending || 0;
      document.getElementById('queueProcessingCount').textContent = this.queueStatus.processing || 0;
      document.getElementById('queueCompletedCount').textContent = this.queueStatus.completed || 0;
      
      this.renderQueueItems(data.queueItems || []);
      
    } catch (error) {
      console.error('Error loading queue data:', error);
    }
  }

  /**
   * Renderiza itens da fila
   */
  renderQueueItems(items) {
    const container = document.getElementById('queueItems');
    if (!container) return;
    
    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-text-muted">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">Fila vazia</h3>
          <p class="text-sm">Nenhuma candidatura pendente</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = items.map(item => {
      const statusIcon = this.getQueueStatusIcon(item.status);
      const statusColor = this.getQueueStatusColor(item.status);
      
      return `
        <div class="queue-item">
          <div class="w-8 h-8 rounded-full ${statusColor} flex items-center justify-center flex-shrink-0">
            <span class="w-4 h-4">${statusIcon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-text truncate">${item.title}</h4>
            <p class="text-sm text-text-muted truncate">${item.company}</p>
            <p class="text-xs text-text-light">${this.formatTime(item.timestamp)}</p>
          </div>
          <div class="text-xs font-medium ${statusColor.replace('bg-', 'text-')}">
            ${item.status}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Obtém ícone para status da fila
   */
  getQueueStatusIcon(status) {
    const icons = {
      'pending': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'processing': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
      'completed': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'failed': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
    };
    
    return icons[status] || icons['pending'];
  }

  /**
   * Obtém cor para status da fila
   */
  getQueueStatusColor(status) {
    const colors = {
      'pending': 'bg-primary-light text-primary',
      'processing': 'bg-warning-light text-warning',
      'completed': 'bg-success-light text-success',
      'failed': 'bg-error-light text-error'
    };
    
    return colors[status] || colors['pending'];
  }

  /**
   * Coleta vagas do LinkedIn
   */
  async collectJobs() {
    try {
      if (!this.isLinkedInPage) {
        this.showToast('Navegue até uma página de vagas do LinkedIn', 'warning');
        return;
      }
      
      this.showLoading('Coletando vagas...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes('linkedin.com/jobs')) {
        this.showToast('Navegue até a página de busca de vagas do LinkedIn', 'warning');
        this.hideLoading();
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'startJobCollection',
        maxResults: 50
      });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showToast(`${response.jobs.length} vagas coletadas com sucesso!`, 'success');
        await this.loadInitialData();
        this.updateUI();
        
        // Adiciona à atividade recente
        this.addRecentActivity({
          type: 'job_collected',
          title: 'Vagas Coletadas',
          description: `${response.jobs.length} vagas encontradas`,
          timestamp: Date.now()
        });
        
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
   * Escaneia página atual
   */
  async scanCurrentPage() {
    try {
      if (!this.isLinkedInPage) {
        this.showToast('Navegue até uma página do LinkedIn', 'warning');
        return;
      }
      
      this.showLoading('Escanando página...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scanPage'
      });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showToast('Página escaneada com sucesso!', 'success');
        
        // Adiciona à atividade recente
        this.addRecentActivity({
          type: 'page_scanned',
          title: 'Página Escaneada',
          description: `${response.jobsFound || 0} vagas detectadas`,
          timestamp: Date.now()
        });
        
      } else {
        this.showToast(response?.error || 'Erro ao escanear página', 'error');
      }
      
    } catch (error) {
      this.hideLoading();
      console.error('Erro ao escanear página:', error);
      this.showToast('Erro ao escanear página', 'error');
    }
  }

  /**
   * Alterna automação
   */
  async toggleAutoApply(enabled) {
    try {
      await chrome.storage.local.set({
        'automation.enabled': enabled
      });
      
      if (enabled) {
        this.showToast('Automação ativada', 'success');
        
        // Inicia processamento automático
        const response = await this.sendMessage({
          action: 'processAutoApplicationQueue'
        });
        
        if (response && response.success) {
          this.showToast(`Processando ${response.processed} vagas elegíveis`, 'info');
        }
        
        // Adiciona à atividade recente
        this.addRecentActivity({
          type: 'automation_toggled',
          title: 'Automação Ativada',
          description: 'Candidatura automática habilitada',
          timestamp: Date.now()
        });
        
      } else {
        this.showToast('Automação desativada', 'info');
      }
      
      await this.updateAutomationStats();
      
    } catch (error) {
      console.error('Erro ao alterar automação:', error);
      this.showToast('Erro ao alterar configuração', 'error');
      
      // Reverte o toggle
      const toggle = document.getElementById('toggleAutoApply');
      toggle.checked = !enabled;
    }
  }

  /**
   * Filtra vagas
   */
  filterJobs(filter) {
    // Implementar lógica de filtro
    console.log('Filtering jobs by:', filter);
  }

  /**
   * Atualiza vagas
   */
  async refreshJobs() {
    await this.loadJobsData();
    this.showToast('Lista de vagas atualizada', 'success');
  }

  /**
   * Mostra notificações
   */
  showNotifications() {
    this.showToast('Sistema de notificações em desenvolvimento', 'info');
  }

  /**
   * Abre configurações
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Pausa fila
   */
  pauseQueue() {
    this.showToast('Funcionalidade em desenvolvimento', 'info');
  }

  /**
   * Limpa fila
   */
  clearQueue() {
    this.showToast('Funcionalidade em desenvolvimento', 'info');
  }

  /**
   * Atualiza interface
   */
  updateUI() {
    // Atualiza contadores
    this.updateCounters();
    
    // Atualiza status
    this.updateStatus();
  }

  /**
   * Atualiza contadores
   */
  updateCounters() {
    // Implementar atualização de contadores
  }

  /**
   * Atualiza status
   */
  updateStatus() {
    // Implementar atualização de status
  }

  /**
   * Configura atualizações automáticas
   */
  setupAutoRefresh() {
    // Atualiza a cada 30 segundos
    setInterval(() => {
      this.loadStats();
      this.updateAutomationStats();
    }, 30000);
  }

  /**
   * Mostra loading
   */
  showLoading(text = 'Carregando...') {
    this.isLoading = true;
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (overlay) {
      overlay.classList.add('active');
    }
    
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  /**
   * Esconde loading
   */
  hideLoading() {
    this.isLoading = false;
    const overlay = document.getElementById('loadingOverlay');
    
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Mostra toast
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove após 3 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * Adiciona atividade recente
   */
  async addRecentActivity(activity) {
    try {
      const data = await chrome.storage.local.get(['recentActivity']);
      const activities = data.recentActivity || [];
      
      activities.unshift(activity);
      activities.splice(10); // Mantém apenas os últimos 10
      
      await chrome.storage.local.set({ recentActivity: activities });
      
    } catch (error) {
      console.error('Error adding recent activity:', error);
    }
  }

  /**
   * Envia mensagem para service worker
   */
  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new WorkInPopupRedesign();
});
