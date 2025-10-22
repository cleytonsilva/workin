/**
 * WorkIn Extension - Teste de Conectividade
 * Script para testar se a comunicação entre popup e content script está funcionando
 */

console.log('🔧 WorkIn Extension - Teste de Conectividade');

// Testa se estamos em uma página do LinkedIn
if (window.location.href.includes('linkedin.com')) {
  console.log('✅ Página do LinkedIn detectada');
  
  // Aguarda um pouco para garantir que tudo foi carregado
  setTimeout(() => {
    console.log('🔍 Verificando componentes WorkIn...');
    
    // Verifica se os módulos estão carregados
    if (window.WorkInJobScraper) {
      console.log('✅ WorkInJobScraper carregado');
    } else {
      console.log('❌ WorkInJobScraper não encontrado');
    }
    
    if (window.WorkInSafetyManager) {
      console.log('✅ WorkInSafetyManager carregado');
    } else {
      console.log('❌ WorkInSafetyManager não encontrado');
    }
    
    if (window.WorkInLinkedInDetector) {
      console.log('✅ WorkInLinkedInDetector carregado');
    } else {
      console.log('❌ WorkInLinkedInDetector não encontrado');
    }
    
    // Testa se estamos em uma página de vagas
    if (window.location.href.includes('/jobs/')) {
      console.log('✅ Página de vagas detectada');
      
      // Verifica se há elementos de vaga na página
      const jobElements = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
      console.log(`📊 ${jobElements.length} elementos de vaga encontrados`);
      
      if (jobElements.length > 0) {
        console.log('✅ Elementos de vaga detectados - pronto para coleta');
      } else {
        console.log('⚠️ Nenhum elemento de vaga encontrado');
      }
    } else {
      console.log('⚠️ Não está em uma página de vagas');
    }
    
  }, 2000);
  
} else {
  console.log('❌ Não está em uma página do LinkedIn');
}

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Mensagem recebida:', message);
  
  try {
    switch (message.action) {
      case 'startJobCollection':
        console.log('🚀 Iniciando coleta de vagas...');
        if (window.WorkInJobScraper) {
          window.WorkInJobScraper.collectJobsWithScroll(message.maxResults || 50)
            .then(result => {
              console.log('✅ Coleta concluída:', result);
              sendResponse(result);
            })
            .catch(error => {
              console.error('❌ Erro na coleta:', error);
              sendResponse({ success: false, error: error.message });
            });
        } else {
          sendResponse({ success: false, error: 'WorkInJobScraper não carregado' });
        }
        break;
        
      case 'scanPage':
        console.log('🔍 Escaneando página...');
        const jobElements = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
        const result = {
          success: true,
          jobsFound: jobElements.length,
          url: window.location.href,
          timestamp: Date.now()
        };
        console.log('✅ Escaneamento concluído:', result);
        sendResponse(result);
        break;
        
      default:
        console.log('❓ Ação desconhecida:', message.action);
        sendResponse({ success: false, error: 'Ação desconhecida' });
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Mantém o canal aberto para resposta assíncrona
});

console.log('🎯 Teste de conectividade configurado');
