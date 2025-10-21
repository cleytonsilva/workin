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
  const captchaSelectors = [
    '[id*="captcha"]',
    '[class*="captcha"]',
    '[data-test-id*="captcha"]',
    '.captcha',
    '#captcha',
    '[aria-label*="captcha"]',
    '[aria-label*="verification"]'
  ];
  
  for (const selector of captchaSelectors) {
    if (document.querySelector(selector)) {
      console.warn('Captcha detectado:', selector);
      return true;
    }
  }
  
  return false;
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
    
    // Verificar captcha
    if (detectCaptcha()) {
      throw new Error('Captcha detectado. Operação cancelada por segurança.');
    }
    
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
    SELECTORS: LINKEDIN_SELECTORS
  };
}
