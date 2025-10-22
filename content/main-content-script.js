/**
 * WorkIn Extension - Content Script Principal
 * Script principal que coordena todas as funcionalidades no LinkedIn
 */

console.log('🔧 WorkIn Content Script Principal carregado');

class WorkInContentScript {
  constructor() {
    this.isInitialized = false;
    this.isLinkedInPage = window.location.href.includes('linkedin.com');
    this.modules = {};
    
    if (this.isLinkedInPage) {
      this.init();
    }
  }

  async init() {
    console.log('🚀 Inicializando WorkIn Content Script...');
    
    try {
      // Aguardar carregamento dos módulos
      await this.waitForModules();
      
      // Configurar listeners de mensagem
      this.setupMessageListener();
      
      // Configurar detecção de página
      this.setupPageDetection();
      
      this.isInitialized = true;
      console.log('✅ WorkIn Content Script inicializado com sucesso');
      
      // Notificar que está pronto
      this.notifyReady();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Content Script:', error);
    }
  }

  async waitForModules() {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // Verificar se os módulos principais estão carregados
      if (window.WorkInJobScraper && window.WorkInSafetyManager) {
        console.log('✅ Módulos principais carregados');
        return;
      }
      
      attempts++;
      console.log(`⏳ Aguardando módulos... tentativa ${attempts}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Timeout aguardando carregamento dos módulos');
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Mensagem recebida:', message);
      
      try {
        this.handleMessage(message, sender, sendResponse);
        return true; // Manter canal aberto para resposta assíncrona
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
        return true;
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    const { action, ...data } = message;
    
    switch (action) {
      case 'ping':
        sendResponse({ 
          success: true, 
          message: 'Content script ativo',
          timestamp: Date.now(),
          url: window.location.href
        });
        break;
        
      case 'scanPage':
        const scanResult = await this.scanPage();
        sendResponse(scanResult);
        break;
        
      case 'startJobCollection':
        const collectResult = await this.collectJobs(data.maxResults || 50);
        sendResponse(collectResult);
        break;
        
      case 'getStatus':
        sendResponse({
          success: true,
          isLinkedInPage: this.isLinkedInPage,
          isInitialized: this.isInitialized,
          modules: {
            jobScraper: !!window.WorkInJobScraper,
            safetyManager: !!window.WorkInSafetyManager,
            detector: !!window.WorkInLinkedInDetector
          },
          url: window.location.href
        });
        break;
        
      default:
        sendResponse({ 
          success: false, 
          error: `Ação desconhecida: ${action}` 
        });
    }
  }

  async scanPage() {
    try {
      console.log('🔍 Escaneando página...');
      
      if (!this.isLinkedInPage) {
        return {
          success: false,
          error: 'Não está em uma página do LinkedIn'
        };
      }
      
      // Contar elementos de vaga
      const jobSelectors = [
        '.job-card-container',
        '.jobs-search-results__list-item',
        '.jobs-unified-top-card',
        '.job-details-jobs-unified-top-card'
      ];
      
      let totalJobs = 0;
      const jobDetails = [];
      
      jobSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        totalJobs += elements.length;
        
        elements.forEach((element, index) => {
          if (index < 5) { // Limitar a 5 por tipo para não sobrecarregar
            const title = element.querySelector('a[href*="/jobs/view/"]')?.textContent?.trim() || 
                         element.querySelector('.job-card-list__title')?.textContent?.trim() ||
                         element.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim();
            
            const company = element.querySelector('.job-card-container__company-name')?.textContent?.trim() ||
                           element.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim();
            
            if (title && company) {
              jobDetails.push({ title, company });
            }
          }
        });
      });
      
      console.log(`✅ Escaneamento concluído: ${totalJobs} vagas encontradas`);
      
      return {
        success: true,
        jobsFound: totalJobs,
        jobDetails: jobDetails.slice(0, 10), // Limitar a 10 detalhes
        url: window.location.href,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Erro no escaneamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async collectJobs(maxResults = 50) {
    try {
      console.log(`🚀 Iniciando coleta de vagas (máximo: ${maxResults})...`);
      console.log(`📍 URL atual: ${window.location.href}`);
      
      if (!this.isLinkedInPage) {
        console.log('❌ Não está em uma página do LinkedIn');
        return {
          success: false,
          error: 'Não está em uma página do LinkedIn'
        };
      }
      
      if (!window.WorkInJobScraper) {
        console.log('❌ Módulo de scraping não carregado');
        return {
          success: false,
          error: 'Módulo de scraping não carregado'
        };
      }
      
      // Verificar se estamos em uma página de vagas
      if (!window.location.href.includes('/jobs/')) {
        console.log('❌ Não está em uma página de vagas');
        return {
          success: false,
          error: 'Navegue até uma página de vagas do LinkedIn (linkedin.com/jobs)'
        };
      }
      
      console.log('✅ Todas as verificações passaram, iniciando coleta...');
      
      // Usar o módulo de scraping
      const result = await window.WorkInJobScraper.collectJobsWithScroll(maxResults);
      
      if (result.success) {
        console.log(`✅ Coleta concluída: ${result.jobs.length} vagas coletadas`);
        console.log(`📊 Detalhes: ${result.total} total, ${result.loaded} carregadas`);
        
        // Salvar no storage
        try {
          await chrome.runtime.sendMessage({
            action: 'saveCollectedJobs',
            jobs: result.jobs
          });
          console.log('💾 Vagas salvas no storage');
        } catch (storageError) {
          console.warn('⚠️ Erro ao salvar no storage:', storageError);
        }
        
        return result;
      } else {
        console.log(`❌ Erro na coleta: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Erro desconhecido na coleta'
        };
      }
      
    } catch (error) {
      console.error('❌ Erro na coleta de vagas:', error);
      console.error('📍 Stack trace:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  setupPageDetection() {
    // Detectar mudanças de URL (SPA)
    let currentUrl = window.location.href;
    
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🔄 URL mudou:', currentUrl);
        
        // Re-inicializar se necessário
        if (currentUrl.includes('linkedin.com') && !this.isInitialized) {
          setTimeout(() => this.init(), 1000);
        }
      }
    });
    
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  notifyReady() {
    // Notificar que o content script está pronto
    try {
      chrome.runtime.sendMessage({
        action: 'contentScriptReady',
        url: window.location.href,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('⚠️ Erro ao notificar que está pronto:', error);
    }
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WorkInContentScript();
  });
} else {
  new WorkInContentScript();
}

// Expor globalmente para debug
window.WorkInContentScript = WorkInContentScript;

console.log('🎯 WorkIn Content Script Principal configurado');

