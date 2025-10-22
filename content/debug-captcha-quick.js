/**
 * WorkIn Extension - Debug Rápido de Captcha
 * Execute este script no console do LinkedIn para identificar o problema
 */

console.log('🔍 DEBUG RÁPIDO - Identificando problema de captcha...');

// Função para verificar elementos problemáticos
function debugCaptchaIssue() {
  console.log('📊 Verificando elementos que podem causar falso positivo...');
  
  // 1. Verificar elementos com "captcha" no ID ou classe
  const captchaElements = document.querySelectorAll('[id*="captcha"], [class*="captcha"]');
  console.log(`🔍 Elementos com "captcha" encontrados: ${captchaElements.length}`);
  
  captchaElements.forEach((element, index) => {
    const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
    const tagName = element.tagName;
    const id = element.id || 'sem-id';
    const className = element.className || 'sem-classe';
    
    console.log(`  ${index + 1}. ${tagName}#${id}.${className} - Visível: ${isVisible}`);
    
    if (isVisible) {
      console.log(`     Texto: "${element.textContent.substring(0, 100)}..."`);
      console.log(`     HTML: ${element.outerHTML.substring(0, 200)}...`);
    }
  });
  
  // 2. Verificar elementos com "verification" ou "security"
  const verificationElements = document.querySelectorAll('[id*="verification"], [class*="verification"], [id*="security"], [class*="security"]');
  console.log(`🔍 Elementos de verificação encontrados: ${verificationElements.length}`);
  
  verificationElements.forEach((element, index) => {
    const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
    const tagName = element.tagName;
    const id = element.id || 'sem-id';
    const className = element.className || 'sem-classe';
    
    console.log(`  ${index + 1}. ${tagName}#${id}.${className} - Visível: ${isVisible}`);
  });
  
  // 3. Verificar se há elementos de captcha real
  const realCaptchaSelectors = [
    '.g-recaptcha',
    '.recaptcha-checkbox',
    '.h-captcha',
    '.captcha-container',
    '.captcha-image',
    '.security-challenge',
    '.verification-modal'
  ];
  
  console.log('🔍 Verificando captcha real...');
  realCaptchaSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`  ⚠️ ${selector}: ${elements.length} elementos encontrados`);
      elements.forEach((el, i) => {
        const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
        console.log(`    ${i + 1}. Visível: ${isVisible}`);
      });
    }
  });
  
  // 4. Verificar textos de captcha
  const pageText = document.body.textContent.toLowerCase();
  const captchaTexts = [
    'prove you are human',
    'verify you are human',
    'i\'m not a robot',
    'não sou um robô',
    'security check',
    'verification required'
  ];
  
  console.log('🔍 Verificando textos de captcha...');
  captchaTexts.forEach(text => {
    if (pageText.includes(text)) {
      console.log(`  ⚠️ Texto encontrado: "${text}"`);
    }
  });
  
  console.log('✅ Debug concluído!');
}

// Executar debug
debugCaptchaIssue();

// Função para testar a detecção atual
function testCurrentDetection() {
  console.log('🧪 Testando detecção atual...');
  
  if (window.WorkInJobScraper && window.WorkInJobScraper.detectCaptcha) {
    const hasCaptcha = window.WorkInJobScraper.detectCaptcha();
    console.log(`📊 Resultado da detecção: ${hasCaptcha ? 'CAPTCHA DETECTADO' : 'NENHUM CAPTCHA'}`);
  } else {
    console.log('❌ Módulo WorkInJobScraper não encontrado');
  }
}

// Executar teste
testCurrentDetection();

// Função para forçar bypass (se necessário)
function forceBypass() {
  console.log('🔄 Tentando bypass forçado...');
  
  if (window.WorkInJobScraper && window.WorkInJobScraper.handleCaptchaDetection) {
    window.WorkInJobScraper.handleCaptchaDetection().then(result => {
      console.log('📊 Resultado do bypass:', result);
    });
  } else {
    console.log('❌ Função de bypass não encontrada');
  }
}

console.log('💡 Comandos disponíveis:');
console.log('  - debugCaptchaIssue() - Executar debug completo');
console.log('  - testCurrentDetection() - Testar detecção atual');
console.log('  - forceBypass() - Tentar bypass forçado');
console.log('  - window.WorkInJobScraper.debugCaptchaElements() - Debug detalhado');
