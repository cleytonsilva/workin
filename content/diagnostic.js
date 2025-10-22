/**
 * WorkIn Extension - Diagnóstico de Problemas
 * Script para identificar e corrigir problemas comuns
 */

console.log('🔧 WorkIn Extension - Diagnóstico Iniciado');

// Função para verificar se a extensão está funcionando
function diagnoseExtension() {
  const issues = [];
  const fixes = [];
  
  console.log('🔍 Verificando componentes...');
  
  // 1. Verificar se estamos no LinkedIn
  if (!window.location.href.includes('linkedin.com')) {
    issues.push('❌ Não está em uma página do LinkedIn');
    fixes.push('Navegue até uma página do LinkedIn (ex: linkedin.com/jobs)');
  } else {
    console.log('✅ Página do LinkedIn detectada');
  }
  
  // 2. Verificar módulos carregados
  const modules = [
    'WorkInJobScraper',
    'WorkInSafetyManager', 
    'WorkInLinkedInDetector'
  ];
  
  modules.forEach(module => {
    if (window[module]) {
      console.log(`✅ ${module} carregado`);
    } else {
      issues.push(`❌ ${module} não carregado`);
      fixes.push(`Recarregue a página ou reinstale a extensão`);
    }
  });
  
  // 3. Verificar se é página de vagas
  if (window.location.href.includes('/jobs/')) {
    console.log('✅ Página de vagas detectada');
    
    // Verificar elementos de vaga
    const jobElements = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
    if (jobElements.length > 0) {
      console.log(`✅ ${jobElements.length} elementos de vaga encontrados`);
    } else {
      issues.push('⚠️ Nenhum elemento de vaga encontrado');
      fixes.push('Navegue até uma página com lista de vagas');
    }
  } else {
    issues.push('⚠️ Não está em uma página de vagas');
    fixes.push('Navegue até linkedin.com/jobs para usar a funcionalidade de coleta');
  }
  
  // 4. Verificar Chrome APIs
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome APIs disponíveis');
  } else {
    issues.push('❌ Chrome APIs não disponíveis');
    fixes.push('Verifique se está executando como extensão do Chrome');
  }
  
  // 5. Verificar storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    console.log('✅ Chrome Storage disponível');
  } else {
    issues.push('❌ Chrome Storage não disponível');
    fixes.push('Verifique as permissões da extensão');
  }
  
  // Exibir resultados
  console.log('\n📊 DIAGNÓSTICO COMPLETO:');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('🎉 Tudo funcionando corretamente!');
  } else {
    console.log('⚠️ PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    fixes.forEach(fix => console.log(`• ${fix}`));
  }
  
  return {
    issues,
    fixes,
    isHealthy: issues.length === 0
  };
}

// Executar diagnóstico após carregamento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(diagnoseExtension, 1000);
  });
} else {
  setTimeout(diagnoseExtension, 1000);
}

// Listener para mensagens de diagnóstico
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'diagnose') {
    const result = diagnoseExtension();
    sendResponse(result);
  }
});

// Expor função globalmente para uso manual
window.WorkInDiagnose = diagnoseExtension;

console.log('🎯 Diagnóstico configurado - use WorkInDiagnose() para executar manualmente');
