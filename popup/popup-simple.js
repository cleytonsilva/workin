/**
 * WorkIn Extension - Popup Simplificado
 * Versão simplificada para teste de conectividade
 */

console.log('WorkIn Popup Simplificado carregado');

class WorkInPopupSimple {
  constructor() {
    this.isLinkedInPage = false;
    this.init();
  }

  async init() {
    console.log('Inicializando popup simplificado...');
    
    try {
      // Verificar se estamos em uma página do LinkedIn
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.isLinkedInPage = tab.url.includes('linkedin.com');
      
      this.updateStatus();
      this.setupEventListeners();
      
      console.log('Popup inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar popup:', error);
      this.showError('Erro ao inicializar: ' + error.message);
    }
  }

  updateStatus() {
    const statusText = document.getElementById('statusText');
    const statusDiv = document.getElementById('status');
    
    if (this.isLinkedInPage) {
      statusText.textContent = 'LinkedIn detectado - Pronto para uso';
      statusDiv.className = 'status success';
    } else {
      statusText.textContent = 'Navegue até uma página do LinkedIn';
      statusDiv.className = 'status error';
    }
  }

  setupEventListeners() {
    document.getElementById('scanBtn').addEventListener('click', () => this.scanPage());
    document.getElementById('collectBtn').addEventListener('click', () => this.collectJobs());
    document.getElementById('autoApplyBtn').addEventListener('click', () => this.autoApply());
  }

  async scanPage() {
    if (!this.isLinkedInPage) {
      this.showError('Navegue até uma página do LinkedIn primeiro');
      return;
    }

    try {
      this.showStatus('Escanando página...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Primeiro, testar conectividade
      const pingResponse = await this.pingContentScript(tab.id);
      if (!pingResponse.success) {
        this.showError('Content script não está respondendo. Recarregue a página.');
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scanPage'
      });

      if (response && response.success) {
        this.showSuccess(`Página escaneada: ${response.jobsFound} vagas encontradas`);
      } else {
        this.showError('Erro ao escanear página: ' + (response?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao escanear:', error);
      this.showError('Erro ao escanear: ' + error.message);
    }
  }

  async collectJobs() {
    if (!this.isLinkedInPage) {
      this.showError('Navegue até uma página do LinkedIn primeiro');
      return;
    }

    try {
      this.showStatus('Coletando vagas...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Primeiro, testar conectividade
      const pingResponse = await this.pingContentScript(tab.id);
      if (!pingResponse.success) {
        this.showError('Content script não está respondendo. Recarregue a página.');
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'startJobCollection',
        maxResults: 20
      });

      if (response && response.success) {
        this.showSuccess(`${response.jobs.length} vagas coletadas com sucesso!`);
      } else {
        this.showError('Erro na coleta: ' + (response?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro na coleta:', error);
      this.showError('Erro na coleta: ' + error.message);
    }
  }

  async pingContentScript(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'ping'
      });
      return response || { success: false, error: 'Sem resposta' };
    } catch (error) {
      console.error('Erro no ping:', error);
      return { success: false, error: error.message };
    }
  }

  async autoApply() {
    this.showError('Funcionalidade de candidatura automática em desenvolvimento');
  }

  showStatus(message) {
    const statusText = document.getElementById('statusText');
    const statusDiv = document.getElementById('status');
    
    statusText.textContent = message;
    statusDiv.className = 'status';
  }

  showSuccess(message) {
    const statusText = document.getElementById('statusText');
    const statusDiv = document.getElementById('status');
    
    statusText.textContent = message;
    statusDiv.className = 'status success';
  }

  showError(message) {
    const statusText = document.getElementById('statusText');
    const statusDiv = document.getElementById('status');
    
    statusText.textContent = message;
    statusDiv.className = 'status error';
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new WorkInPopupSimple();
});
