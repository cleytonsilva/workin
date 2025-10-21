/**
 * WorkIn Extension - Shared Utilities
 * Funções utilitárias compartilhadas entre todos os módulos
 */

/**
 * Utilitários de tempo e delay
 */
const TimeUtils = {
  /**
   * Cria um delay aleatório entre min e max
   * @param {number} min - Tempo mínimo em ms
   * @param {number} max - Tempo máximo em ms
   * @returns {Promise<void>}
   */
  randomDelay: (min, max) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  /**
   * Retorna um delay aleatório (ms) entre min e max
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  getRandomDelay: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Aguarda por um período (ms)
   * @param {number} ms
   * @returns {Promise<void>}
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Formata timestamp para string legível
   * @param {number} timestamp - Timestamp em ms
   * @returns {string}
   */
  formatTimestamp: (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  },

  /**
   * Verifica se está dentro do horário de funcionamento
   * @param {WorkingHours} workingHours - Horário configurado
   * @returns {boolean}
   */
  isWithinWorkingHours: (workingHours) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }
};

/**
 * Utilitários de string e texto
 */
const StringUtils = {
  /**
   * Gera ID único
   * @returns {string}
   */
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Normaliza texto para comparação
   * @param {string} text - Texto a normalizar
   * @returns {string}
   */
  normalizeText: (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .trim();
  },

  /**
   * Calcula similaridade entre duas strings
   * @param {string} str1 - Primeira string
   * @param {string} str2 - Segunda string
   * @returns {number} - Similaridade de 0 a 1
   */
  similarity: (str1, str2) => {
    const s1 = StringUtils.normalizeText(str1);
    const s2 = StringUtils.normalizeText(str2);
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Algoritmo de Levenshtein simplificado
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - matrix[s2.length][s1.length]) / maxLength;
  },

  /**
   * Extrai palavras-chave de um texto
   * @param {string} text - Texto para extrair palavras-chave
   * @returns {string[]}
   */
  extractKeywords: (text) => {
    const normalized = StringUtils.normalizeText(text);
    const words = normalized.split(/\s+/);
    
    // Remove palavras muito curtas e comuns
    const stopWords = new Set([
      'a', 'o', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'com', 'para',
      'por', 'na', 'no', 'as', 'os', 'que', 'se', 'ou', 'mas', 'como',
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'
    ]);
    
    return words
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicatas
  }
};

/**
 * Utilitários de validação
 */
const ValidationUtils = {
  /**
   * Valida se é uma URL do LinkedIn
   * @param {string} url - URL para validar
   * @returns {boolean}
   */
  isLinkedInUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('linkedin.com');
    } catch {
      return false;
    }
  },

  /**
   * Valida se é uma página de vaga
   * @param {string} url - URL para validar
   * @returns {boolean}
   */
  isJobPage: (url) => {
    return ValidationUtils.isLinkedInUrl(url) && 
           (url.includes('/jobs/view/') || url.includes('/jobs/collections/'));
  },

  /**
   * Valida score de compatibilidade
   * @param {number} score - Score para validar
   * @returns {boolean}
   */
  isValidScore: (score) => {
    return typeof score === 'number' && score >= 0 && score <= 100;
  },

  /**
   * Valida email
   * @param {string} email - Email para validar
   * @returns {boolean}
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

/**
 * Utilitários de DOM
 */
const DOMUtils = {
  /**
   * Aguarda elemento aparecer no DOM
   * @param {string} selector - Seletor CSS
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<Element|null>}
   */
  waitForElement: (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  },

  /**
   * Simula clique humano
   * @param {Element} element - Elemento para clicar
   * @returns {Promise<void>}
   */
  humanClick: async (element) => {
    if (!element) return;
    
    // Simula movimento do mouse
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await TimeUtils.randomDelay(50, 150);
    
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await TimeUtils.randomDelay(50, 100);
    
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },

  /**
   * Simula digitação humana
   * @param {Element} element - Input para digitar
   * @param {string} text - Texto para digitar
   * @returns {Promise<void>}
   */
  humanType: async (element, text) => {
    if (!element || !text) return;
    
    element.focus();
    element.value = '';
    
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await TimeUtils.randomDelay(50, 150);
    }
    
    element.dispatchEvent(new Event('change', { bubbles: true }));
  },

  /**
   * Verifica se elemento está visível
   * @param {Element} element - Elemento para verificar
   * @returns {boolean}
   */
  isVisible: (element) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }
};

/**
 * Utilitários de logging
 */
const LogUtils = {
  /**
   * Cria entrada de log
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} context - Contexto adicional
   * @returns {LogEntry}
   */
  createLogEntry: (level, message, context = {}) => {
    return {
      id: StringUtils.generateId(),
      level,
      message,
      context,
      timestamp: Date.now()
    };
  },

  /**
   * Log para console com formatação
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} context - Contexto adicional
   */
  log: (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    const prefix = `[WorkIn ${level.toUpperCase()}] ${timestamp}:`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, context);
        break;
      case 'warn':
        console.warn(prefix, message, context);
        break;
      case 'debug':
        console.debug(prefix, message, context);
        break;
      default:
        console.log(prefix, message, context);
    }
  }
};

/**
 * Utilitários de performance
 */
const PerformanceUtils = {
  /**
   * Mede tempo de execução de uma função
   * @param {Function} fn - Função para medir
   * @param {string} label - Label para identificar
   * @returns {Promise<any>}
   */
  measureTime: async (fn, label = 'operation') => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      LogUtils.log('debug', `${label} completed in ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      LogUtils.log('error', `${label} failed after ${(end - start).toFixed(2)}ms`, { error });
      throw error;
    }
  },

  /**
   * Debounce para funções
   * @param {Function} func - Função para debounce
   * @param {number} wait - Tempo de espera em ms
   * @returns {Function}
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle para funções
   * @param {Function} func - Função para throttle
   * @param {number} limit - Limite em ms
   * @returns {Function}
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Exportar utilitários para uso global
if (typeof window !== 'undefined') {
  window.WorkInUtils = {
    TimeUtils,
    StringUtils,
    ValidationUtils,
    DOMUtils,
    LogUtils,
  PerformanceUtils
  };
}

// Também anexar às APIs globais fora do window (ex.: Service Worker)
try {
  if (typeof globalThis !== 'undefined') {
    globalThis.WorkInUtils = {
      TimeUtils,
      StringUtils,
      ValidationUtils,
      DOMUtils,
      LogUtils,
      PerformanceUtils
    };
  }
} catch (_) { /* noop */ }
