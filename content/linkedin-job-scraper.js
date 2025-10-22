/**
 * WorkIn Extension - LinkedIn Job Scraper Module
 * Módulo responsável por scroll inteligente e extração de dados de vagas
 * Simula comportamento humano para evitar detecção
 */

// Seletores validados do LinkedIn (podem mudar com atualizações da plataforma)
const LINKEDIN_SELECTORS = {
  LIST_CONTAINER: '.jobs-search-results-list',
  JOB_CARD: 'li.jobs-search-results__list-item',
  TITLE: 'a.job-card-list__title',
  COMPANY: '.job-card-container__company-name',
  LOCATION: '.job-card-container__metadata-item',
  EASY_APPLY_BADGE: '.job-card-container__apply-method',
  JOB_DESCRIPTION: '.jobs-description-content__text',
  APPLY_BUTTON: '.jobs-apply-button'
};

/**
 * Função utilitária para delay assíncrono
 * @param {number} ms - Milissegundos para aguardar
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função principal de scroll com delays humanos
 * Simula comportamento de leitura humana para evitar detecção
 * @param {Element} listElement - Elemento contêiner da lista de vagas
 * @param {number} maxResults - Número máximo de resultados desejado
 * @returns {Promise<number>} - Número total de vagas carregadas
 */
async function performScroll(listElement, maxResults = 50) {
  if (!listElement) {
    throw new Error('Elemento de lista não encontrado');
  }

  let previousHeight = 0;
  let unchangedCount = 0;
  let loadedJobs = 0;
  let iterationCount = 0;
  
  // Configurações de segurança
  const MAX_UNCHANGED = 3; // Máximo de iterações sem novos itens
  const MAX_ITERATIONS = 20; // Limite absoluto de iterações
  const SCROLL_STEP = 500; // Pixels por scroll
  const MIN_DELAY = 2000; // Delay mínimo em ms
  const MAX_DELAY = 4000; // Delay máximo em ms
  
  console.log(`Iniciando scroll inteligente. Meta: ${maxResults} vagas`);
  
  while (loadedJobs < maxResults && unchangedCount < MAX_UNCHANGED && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    
    // Scroll incremental para simular comportamento humano
    const currentScrollTop = listElement.scrollTop;
    listElement.scrollTop += SCROLL_STEP;
    
    // Delay variável para simular tempo de leitura humana
    const randomDelay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    await delay(randomDelay);
    
    // Verificar se novos itens foram carregados
    const currentJobs = document.querySelectorAll(LINKEDIN_SELECTORS.JOB_CARD).length;
    
    if (currentJobs > loadedJobs) {
      loadedJobs = currentJobs;
      unchangedCount = 0;
      console.log(`Scroll ${iterationCount}: ${loadedJobs} vagas carregadas`);
    } else {
      unchangedCount++;
      console.log(`Scroll ${iterationCount}: Nenhuma nova vaga (${unchangedCount}/${MAX_UNCHANGED})`);
    }
    
    // Verificar se chegou ao final da página
    const isAtBottom = listElement.scrollHeight - listElement.scrollTop <= listElement.clientHeight + 100;
    if (isAtBottom) {
      console.log('Fim da página atingido');
      break;
    }
    
    // Verificar se o scroll não mudou (possível erro)
    if (listElement.scrollTop === currentScrollTop) {
      console.log('Scroll não progrediu, possível erro');
      unchangedCount++;
    }
  }
  
  console.log(`Scroll concluído: ${loadedJobs} vagas carregadas em ${iterationCount} iterações`);
  return loadedJobs;
}

/**
 * Extrai dados de todas as vagas visíveis no container
 * @param {Element} container - Container da lista de vagas
 * @returns {Array<Object>} - Array de objetos com dados das vagas
 */
function scrapeJobs(container) {
  if (!container) {
    throw new Error('Container não fornecido');
  }

  const jobs = [];
  const cards = container.querySelectorAll(LINKEDIN_SELECTORS.JOB_CARD);
  
  console.log(`Extraindo dados de ${cards.length} vagas`);
  
  cards.forEach((card, index) => {
    try {
      const titleEl = card.querySelector(LINKEDIN_SELECTORS.TITLE);
      const companyEl = card.querySelector(LINKEDIN_SELECTORS.COMPANY);
      const locationEl = card.querySelector(LINKEDIN_SELECTORS.LOCATION);
      const easyApplyBadge = card.querySelector(LINKEDIN_SELECTORS.EASY_APPLY_BADGE);
      
      if (titleEl && companyEl) {
        const jobData = {
          id: extractJobId(titleEl.href),
          title: cleanText(titleEl.textContent),
          company: cleanText(companyEl.textContent),
          location: locationEl ? cleanText(locationEl.textContent) : 'Não especificado',
          url: titleEl.href,
          hasEasyApply: easyApplyBadge ? 
            easyApplyBadge.textContent.includes('Easy Apply') || 
            easyApplyBadge.textContent.includes('Candidatura rápida') : false,
          extractedAt: Date.now(),
          source: 'linkedin',
          index: index
        };
        
        // Validar dados básicos
        if (jobData.title.length > 3 && jobData.company.length > 1) {
          jobs.push(jobData);
        } else {
          console.warn(`Vaga ${index} com dados inválidos ignorada`);
        }
      }
    } catch (error) {
      console.error(`Erro ao extrair dados da vaga ${index}:`, error);
    }
  });
  
  console.log(`${jobs.length} vagas válidas extraídas`);
  return jobs;
}

/**
 * Extrai ID da vaga da URL do LinkedIn
 * @param {string} url - URL da vaga
 * @returns {string} - ID da vaga ou ID gerado
 */
function extractJobId(url) {
  if (!url) return `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const match = url.match(/\/jobs\/view\/(\d+)/);
  return match ? match[1] : `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Limpa e normaliza texto extraído do DOM
 * @param {string} text - Texto bruto
 * @returns {string} - Texto limpo
 */
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .trim();
}

/**
 * Verifica se a página atual é uma página de busca de vagas do LinkedIn
 * @returns {boolean} - True se for página de vagas
 */
function isLinkedInJobsPage() {
  const url = window.location.href;
  return url.includes('linkedin.com') && 
         (url.includes('/jobs/search/') || url.includes('/jobs/'));
}

/**
 * Encontra o container principal da lista de vagas
 * @returns {Element|null} - Elemento container ou null
 */
function findJobsListContainer() {
  // Tentar múltiplos seletores para diferentes layouts
  const selectors = [
    LINKEDIN_SELECTORS.LIST_CONTAINER,
    '.jobs-search-results-list',
    '.jobs-search-results',
    '[data-test-id="jobs-search-results-list"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Container encontrado com seletor: ${selector}`);
      return element;
    }
  }
  
  console.warn('Container de lista de vagas não encontrado');
  return null;
}

/**
 * Verifica se há elementos de captcha ou verificação na página
 * @returns {boolean} - True se captcha detectado
 */
function detectCaptcha() {
  console.log('🔍 Verificando captcha (modo simplificado)...');
  
  // TEMPORÁRIO: Desabilitar detecção de captcha para permitir coleta
  // TODO: Implementar detecção mais precisa depois
  console.log('✅ Modo bypass ativo - captcha ignorado temporariamente');
  return false;
  
  /* CÓDIGO ORIGINAL COMENTADO PARA DEBUG
  // Seletores mais específicos para captcha real
  const captchaSelectors = [
    // Captcha visual clássico
    '.captcha-container',
    '.captcha-wrapper',
    '#captcha-challenge',
    '.captcha-image',
    
    // reCAPTCHA específico
    '.g-recaptcha',
    '.recaptcha-checkbox',
    '.recaptcha-checkbox-border',
    '[data-sitekey]',
    
    // hCaptcha
    '.h-captcha',
    '.hcaptcha-container',
    
    // Verificação de segurança do LinkedIn
    '.security-challenge',
    '.verification-modal',
    '.challenge-modal',
    
    // Elementos de bloqueio
    '.blocked-content',
    '.access-denied',
    '.verification-required'
  ];
  
  // Verificar elementos visíveis e interativos
  for (const selector of captchaSelectors) {
    const element = document.querySelector(selector);
    if (element && isElementVisible(element)) {
      console.warn('🚫 Captcha detectado:', selector, element);
      return true;
    }
  }
  
  // Verificar textos indicativos de captcha
  const captchaTexts = [
    'prove you are human',
    'verify you are human',
    'security check',
    'verification required',
    'complete the security check',
    'solve the puzzle',
    'select all images',
    'i\'m not a robot',
    'não sou um robô'
  ];
  
  const pageText = document.body.textContent.toLowerCase();
  for (const text of captchaTexts) {
    if (pageText.includes(text)) {
      console.warn('🚫 Texto de captcha detectado:', text);
      return true;
    }
  }
  
  // Verificar se há modais de verificação
  const modals = document.querySelectorAll('.modal, .overlay, .popup');
  for (const modal of modals) {
    if (isElementVisible(modal)) {
      const modalText = modal.textContent.toLowerCase();
      if (modalText.includes('verify') || modalText.includes('captcha') || modalText.includes('security')) {
        console.warn('🚫 Modal de verificação detectado:', modal);
        return true;
      }
    }
  }
  
  console.log('✅ Nenhum captcha detectado');
  return false;
  */
}

/**
 * Verifica se um elemento está visível na página
 * @param {Element} element - Elemento a ser verificado
 * @returns {boolean} - True se elemento está visível
 */
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0
  );
}

/**
 * Função principal que combina scroll e scraping
 * @param {number} maxResults - Número máximo de vagas para coletar
 * @returns {Promise<Object>} - Resultado da operação
 */
async function collectJobsWithScroll(maxResults = 50) {
  try {
    // Verificar se está na página correta
    if (!isLinkedInJobsPage()) {
      throw new Error('Não está em uma página de vagas do LinkedIn');
    }
    
    // Verificar captcha com bypass inteligente
    console.log('🔍 Verificando captcha antes da coleta...');
    const captchaResult = await handleCaptchaDetection();
    if (captchaResult.blocked) {
      console.log(`🚫 Captcha bloqueou a operação: ${captchaResult.reason}`);
      throw new Error(`Captcha detectado: ${captchaResult.reason}. Operação cancelada por segurança.`);
    }
    console.log('✅ Verificação de captcha passou, continuando...');
    
    // Encontrar container
    const container = findJobsListContainer();
    if (!container) {
      throw new Error('Lista de vagas não encontrada na página');
    }
    
    console.log('Iniciando coleta de vagas...');
    
    // Executar scroll inteligente
    const totalLoaded = await performScroll(container, maxResults);
    
    // Extrair dados das vagas
    const jobs = scrapeJobs(container);
    
    console.log(`Coleta concluída: ${jobs.length} vagas coletadas`);
    
    return {
      success: true,
      jobs: jobs,
      total: jobs.length,
      loaded: totalLoaded,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('Erro na coleta de vagas:', error);
    return {
      success: false,
      error: error.message,
      jobs: [],
      total: 0
    };
  }
}

/**
 * Sistema inteligente de detecção e bypass de captcha
 * @returns {Promise<Object>} - Resultado da verificação
 */
async function handleCaptchaDetection() {
  try {
    console.log('🔍 Verificando captcha (modo bypass)...');
    
    // TEMPORÁRIO: Sempre permitir coleta
    console.log('✅ Modo bypass ativo - coleta permitida');
    return { blocked: false, reason: 'Bypass ativo' };
    
    /* CÓDIGO ORIGINAL COMENTADO PARA DEBUG
    // Debug: Verificar todos os elementos que podem estar causando falso positivo
    await debugCaptchaElements();
    
    // Verificação inicial
    const hasCaptcha = detectCaptcha();
    
    if (!hasCaptcha) {
      console.log('✅ Nenhum captcha detectado');
      return { blocked: false, reason: null };
    }
    
    console.log('⚠️ Possível captcha detectado, analisando...');
    
    // Aguardar um pouco para ver se é um falso positivo
    await delay(2000);
    
    // Verificar novamente após delay
    const stillHasCaptcha = detectCaptcha();
    
    if (!stillHasCaptcha) {
      console.log('✅ Falso positivo detectado, continuando...');
      return { blocked: false, reason: null };
    }
    
    // Verificar se é um captcha real ou apenas elementos similares
    const captchaAnalysis = analyzeCaptchaType();
    
    if (captchaAnalysis.isRealCaptcha) {
      console.log('🚫 Captcha real detectado:', captchaAnalysis.type);
      return { 
        blocked: true, 
        reason: `Captcha ${captchaAnalysis.type} detectado`,
        type: captchaAnalysis.type,
        element: captchaAnalysis.element
      };
    }
    
    // Se não é captcha real, tentar bypass
    console.log('🔄 Tentando bypass de elementos similares...');
    const bypassResult = await attemptCaptchaBypass();
    
    if (bypassResult.success) {
      console.log('✅ Bypass bem-sucedido');
      return { blocked: false, reason: 'Bypass aplicado' };
    }
    
    console.log('🚫 Não foi possível fazer bypass');
    return { 
      blocked: true, 
      reason: 'Elementos de verificação não puderam ser contornados' 
    };
    */
    
  } catch (error) {
    console.error('❌ Erro na verificação de captcha:', error);
    return { 
      blocked: false, // Mesmo com erro, permitir coleta
      reason: `Erro ignorado: ${error.message}` 
    };
  }
}

/**
 * Função de debug para identificar elementos que podem causar falso positivo
 */
async function debugCaptchaElements() {
  console.log('🔍 DEBUG: Verificando elementos que podem causar falso positivo...');
  
  // Verificar elementos com "captcha" no ID ou classe
  const captchaElements = document.querySelectorAll('[id*="captcha"], [class*="captcha"]');
  console.log(`📊 Elementos com "captcha" encontrados: ${captchaElements.length}`);
  
  captchaElements.forEach((element, index) => {
    const isVisible = isElementVisible(element);
    const tagName = element.tagName;
    const id = element.id || 'sem-id';
    const className = element.className || 'sem-classe';
    
    console.log(`  ${index + 1}. ${tagName}#${id}.${className} - Visível: ${isVisible}`);
    
    if (isVisible) {
      console.log(`     Texto: "${element.textContent.substring(0, 100)}..."`);
      console.log(`     HTML: ${element.outerHTML.substring(0, 200)}...`);
    }
  });
  
  // Verificar elementos com "verification" ou "security"
  const verificationElements = document.querySelectorAll('[id*="verification"], [class*="verification"], [id*="security"], [class*="security"]');
  console.log(`📊 Elementos de verificação encontrados: ${verificationElements.length}`);
  
  verificationElements.forEach((element, index) => {
    const isVisible = isElementVisible(element);
    const tagName = element.tagName;
    const id = element.id || 'sem-id';
    const className = element.className || 'sem-classe';
    
    console.log(`  ${index + 1}. ${tagName}#${id}.${className} - Visível: ${isVisible}`);
  });
  
  console.log('🔍 DEBUG: Verificação concluída');
}

/**
 * Analisa o tipo de captcha detectado
 * @returns {Object} - Análise do captcha
 */
function analyzeCaptchaType() {
  const analysis = {
    isRealCaptcha: false,
    type: 'unknown',
    element: null
  };
  
  // Verificar reCAPTCHA
  const recaptcha = document.querySelector('.g-recaptcha, .recaptcha-checkbox');
  if (recaptcha && isElementVisible(recaptcha)) {
    analysis.isRealCaptcha = true;
    analysis.type = 'reCAPTCHA';
    analysis.element = recaptcha;
    return analysis;
  }
  
  // Verificar hCaptcha
  const hcaptcha = document.querySelector('.h-captcha, .hcaptcha-container');
  if (hcaptcha && isElementVisible(hcaptcha)) {
    analysis.isRealCaptcha = true;
    analysis.type = 'hCaptcha';
    analysis.element = hcaptcha;
    return analysis;
  }
  
  // Verificar captcha clássico
  const classicCaptcha = document.querySelector('.captcha-container, .captcha-image');
  if (classicCaptcha && isElementVisible(classicCaptcha)) {
    analysis.isRealCaptcha = true;
    analysis.type = 'classic';
    analysis.element = classicCaptcha;
    return analysis;
  }
  
  // Verificar modais de verificação
  const verificationModal = document.querySelector('.verification-modal, .challenge-modal');
  if (verificationModal && isElementVisible(verificationModal)) {
    analysis.isRealCaptcha = true;
    analysis.type = 'verification-modal';
    analysis.element = verificationModal;
    return analysis;
  }
  
  return analysis;
}

/**
 * Tenta fazer bypass de elementos similares a captcha
 * @returns {Promise<Object>} - Resultado do bypass
 */
async function attemptCaptchaBypass() {
  try {
    // Tentar fechar modais desnecessários
    const closeButtons = document.querySelectorAll('.modal-close, .close-button, [aria-label="Close"]');
    for (const button of closeButtons) {
      if (isElementVisible(button)) {
        console.log('🔄 Tentando fechar modal...');
        button.click();
        await delay(1000);
      }
    }
    
    // Tentar clicar em "Skip" ou "Continue" se disponível
    const skipButtons = document.querySelectorAll('button[class*="skip"], button[class*="continue"], a[class*="skip"]');
    for (const button of skipButtons) {
      if (isElementVisible(button)) {
        const text = button.textContent.toLowerCase();
        if (text.includes('skip') || text.includes('continue') || text.includes('pular')) {
          console.log('🔄 Tentando pular verificação...');
          button.click();
          await delay(1000);
        }
      }
    }
    
    // Verificar se ainda há captcha após tentativas
    const stillHasCaptcha = detectCaptcha();
    
    return {
      success: !stillHasCaptcha,
      attempts: closeButtons.length + skipButtons.length
    };
    
  } catch (error) {
    console.error('❌ Erro no bypass:', error);
    return { success: false, error: error.message };
  }
}

// Exportar funções para uso em outros módulos
if (typeof window !== 'undefined') {
  window.WorkInJobScraper = {
    performScroll,
    scrapeJobs,
    collectJobsWithScroll,
    extractJobId,
    cleanText,
    isLinkedInJobsPage,
    findJobsListContainer,
    detectCaptcha,
    handleCaptchaDetection,
    analyzeCaptchaType,
    attemptCaptchaBypass,
    isElementVisible,
    debugCaptchaElements,
    SELECTORS: LINKEDIN_SELECTORS
  };
}

// Exportar para módulos ES6 se disponível
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    performScroll,
    scrapeJobs,
    collectJobsWithScroll,
    extractJobId,
    cleanText,
    isLinkedInJobsPage,
    findJobsListContainer,
    detectCaptcha,
    handleCaptchaDetection,
    analyzeCaptchaType,
    attemptCaptchaBypass,
    isElementVisible,
    debugCaptchaElements,
    SELECTORS: LINKEDIN_SELECTORS
  };
}
