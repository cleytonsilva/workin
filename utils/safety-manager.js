/**
 * WorkIn Extension - Safety Manager
 * Gerencia verificações de segurança, rate limiting e detecção de captcha
 */

class SafetyManager {
  constructor() {
    this.rateLimits = {
      hourly: { max: 5, window: 60 * 60 * 1000 }, // 5 por hora
      daily: { max: 20, window: 24 * 60 * 60 * 1000 }, // 20 por dia
      weekly: { max: 100, window: 7 * 24 * 60 * 60 * 1000 } // 100 por semana
    };
    
    this.captchaSelectors = [
      '[id*="captcha"]',
      '[class*="captcha"]',
      '[data-test-id*="captcha"]',
      '.captcha',
      '#captcha',
      '[aria-label*="captcha"]',
      '[aria-label*="verification"]',
      '[aria-label*="robot"]',
      '.recaptcha',
      '#recaptcha',
      '[data-sitekey]', // reCAPTCHA
      '.hcaptcha',
      '#hcaptcha'
    ];
    
    this.suspiciousSelectors = [
      '[data-test-id*="blocked"]',
      '[class*="blocked"]',
      '[class*="suspended"]',
      '[class*="restricted"]',
      '.error-message',
      '.warning-message',
      '[aria-label*="blocked"]',
      '[aria-label*="suspended"]'
    ];
  }

  /**
   * Verifica se é seguro executar operações automatizadas
   * @param {string} operation - Tipo de operação ('scroll', 'apply', 'collect')
   * @returns {Promise<Object>} - Resultado da verificação de segurança
   */
  async checkSafety(operation = 'scroll') {
    try {
      const checks = await Promise.allSettled([
        this.checkCaptcha(),
        this.checkRateLimits(operation),
        this.checkSuspiciousActivity(),
        this.checkPageLoadTime(),
        this.checkUserActivity()
      ]);

      const results = checks.map(check => 
        check.status === 'fulfilled' ? check.value : { safe: false, reason: check.reason?.message || 'Erro na verificação' }
      );

      // Se qualquer verificação falhar, não é seguro
      const unsafeChecks = results.filter(result => !result.safe);
      
      if (unsafeChecks.length > 0) {
        return {
          safe: false,
          reason: unsafeChecks[0].reason,
          details: unsafeChecks,
          recommendations: this.getRecommendations(unsafeChecks)
        };
      }

      return {
        safe: true,
        confidence: this.calculateConfidence(results),
        details: results
      };

    } catch (error) {
      console.error('Erro na verificação de segurança:', error);
      return {
        safe: false,
        reason: 'Erro interno na verificação de segurança',
        error: error.message
      };
    }
  }

  /**
   * Verifica se há captcha na página
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async checkCaptcha() {
    try {
      // Verificar se estamos em contexto de página
      if (typeof document === 'undefined') {
        return { safe: true, reason: 'Verificação de captcha não aplicável' };
      }

      for (const selector of this.captchaSelectors) {
        const element = document.querySelector(selector);
        if (element && this.isElementVisible(element)) {
          return {
            safe: false,
            reason: 'Captcha detectado na página',
            element: selector,
            recommendation: 'Aguarde resolução manual do captcha'
          };
        }
      }

      return { safe: true, reason: 'Nenhum captcha detectado' };

    } catch (error) {
      return { safe: false, reason: 'Erro ao verificar captcha', error: error.message };
    }
  }

  /**
   * Verifica limites de rate para operações
   * @param {string} operation - Tipo de operação
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async checkRateLimits(operation) {
    try {
      const data = await chrome.storage.local.get(['applicationLog', 'safetyStats']);
      const log = data.applicationLog || [];
      const stats = data.safetyStats || { operations: [] };

      const now = Date.now();
      const operationType = this.getOperationType(operation);

      // Verificar limites por período
      for (const [period, limit] of Object.entries(this.rateLimits)) {
        const cutoffTime = now - limit.window;
        const recentOperations = stats.operations.filter(op => 
          op.timestamp > cutoffTime && op.type === operationType
        );

        if (recentOperations.length >= limit.max) {
          const nextAllowedTime = new Date(cutoffTime + limit.window);
          return {
            safe: false,
            reason: `Limite ${period} atingido (${limit.max} operações)`,
            limit: limit.max,
            period: period,
            nextAllowed: nextAllowedTime.toISOString(),
            recommendation: `Aguarde até ${nextAllowedTime.toLocaleTimeString()}`
          };
        }
      }

      return { safe: true, reason: 'Limites de rate respeitados' };

    } catch (error) {
      return { safe: false, reason: 'Erro ao verificar rate limits', error: error.message };
    }
  }

  /**
   * Verifica atividade suspeita na página
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async checkSuspiciousActivity() {
    try {
      if (typeof document === 'undefined') {
        return { safe: true, reason: 'Verificação de atividade suspeita não aplicável' };
      }

      // Verificar elementos de bloqueio/suspensão
      for (const selector of this.suspiciousSelectors) {
        const element = document.querySelector(selector);
        if (element && this.isElementVisible(element)) {
          return {
            safe: false,
            reason: 'Atividade suspeita detectada',
            element: selector,
            text: element.textContent?.substring(0, 100),
            recommendation: 'Verifique manualmente a página'
          };
        }
      }

      // Verificar se a página carregou corretamente
      if (document.body && document.body.children.length < 5) {
        return {
          safe: false,
          reason: 'Página pode estar bloqueada ou incompleta',
          recommendation: 'Recarregue a página manualmente'
        };
      }

      return { safe: true, reason: 'Nenhuma atividade suspeita detectada' };

    } catch (error) {
      return { safe: false, reason: 'Erro ao verificar atividade suspeita', error: error.message };
    }
  }

  /**
   * Verifica tempo de carregamento da página
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async checkPageLoadTime() {
    try {
      if (typeof performance === 'undefined') {
        return { safe: true, reason: 'Verificação de performance não disponível' };
      }

      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) {
        return { safe: true, reason: 'Dados de navegação não disponíveis' };
      }

      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

      // Se a página demorou muito para carregar, pode ser um problema
      if (loadTime > 10000) { // 10 segundos
        return {
          safe: false,
          reason: 'Página demorou muito para carregar',
          loadTime: Math.round(loadTime),
          recommendation: 'Aguarde carregamento completo ou recarregue'
        };
      }

      if (domContentLoaded > 5000) { // 5 segundos
        return {
          safe: false,
          reason: 'DOM demorou muito para carregar',
          domTime: Math.round(domContentLoaded),
          recommendation: 'Página pode estar com problemas'
        };
      }

      return { 
        safe: true, 
        reason: 'Página carregou normalmente',
        loadTime: Math.round(loadTime),
        domTime: Math.round(domContentLoaded)
      };

    } catch (error) {
      return { safe: false, reason: 'Erro ao verificar tempo de carregamento', error: error.message };
    }
  }

  /**
   * Verifica atividade do usuário para detectar se está presente
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async checkUserActivity() {
    try {
      const data = await chrome.storage.local.get(['userActivity']);
      const activity = data.userActivity || { lastSeen: Date.now(), events: [] };

      const now = Date.now();
      const timeSinceLastActivity = now - activity.lastSeen;

      // Se não há atividade há mais de 30 minutos, pode ser suspeito
      if (timeSinceLastActivity > 30 * 60 * 1000) {
        return {
          safe: false,
          reason: 'Usuário inativo há muito tempo',
          inactiveTime: Math.round(timeSinceLastActivity / 60000),
          recommendation: 'Interaja com a página antes de continuar'
        };
      }

      return { 
        safe: true, 
        reason: 'Usuário ativo recentemente',
        lastActivity: new Date(activity.lastSeen).toLocaleTimeString()
      };

    } catch (error) {
      return { safe: false, reason: 'Erro ao verificar atividade do usuário', error: error.message };
    }
  }

  /**
   * Registra uma operação para controle de rate limiting
   * @param {string} operation - Tipo de operação
   * @param {Object} details - Detalhes da operação
   */
  async recordOperation(operation, details = {}) {
    try {
      const data = await chrome.storage.local.get(['safetyStats']);
      const stats = data.safetyStats || { operations: [] };

      const operationRecord = {
        type: this.getOperationType(operation),
        timestamp: Date.now(),
        details: details,
        userAgent: navigator.userAgent,
        url: window.location?.href || 'unknown'
      };

      stats.operations.push(operationRecord);

      // Manter apenas os últimos 1000 registros
      if (stats.operations.length > 1000) {
        stats.operations = stats.operations.slice(-1000);
      }

      await chrome.storage.local.set({ safetyStats: stats });

    } catch (error) {
      console.error('Erro ao registrar operação:', error);
    }
  }

  /**
   * Registra atividade do usuário
   * @param {string} eventType - Tipo de evento (click, scroll, keypress)
   */
  async recordUserActivity(eventType = 'interaction') {
    try {
      const data = await chrome.storage.local.get(['userActivity']);
      const activity = data.userActivity || { lastSeen: Date.now(), events: [] };

      activity.lastSeen = Date.now();
      activity.events.push({
        type: eventType,
        timestamp: Date.now()
      });

      // Manter apenas os últimos 100 eventos
      if (activity.events.length > 100) {
        activity.events = activity.events.slice(-100);
      }

      await chrome.storage.local.set({ userActivity: activity });

    } catch (error) {
      console.error('Erro ao registrar atividade do usuário:', error);
    }
  }

  /**
   * Calcula confiança baseada nos resultados das verificações
   * @param {Array} results - Resultados das verificações
   * @returns {number} - Nível de confiança (0-100)
   */
  calculateConfidence(results) {
    const safeChecks = results.filter(r => r.safe).length;
    const totalChecks = results.length;
    
    return Math.round((safeChecks / totalChecks) * 100);
  }

  /**
   * Obtém recomendações baseadas nos problemas encontrados
   * @param {Array} unsafeChecks - Verificações que falharam
   * @returns {Array} - Lista de recomendações
   */
  getRecommendations(unsafeChecks) {
    const recommendations = [];

    unsafeChecks.forEach(check => {
      if (check.recommendation) {
        recommendations.push(check.recommendation);
      }
    });

    // Recomendações gerais baseadas no tipo de problema
    if (unsafeChecks.some(c => c.reason.includes('captcha'))) {
      recommendations.push('Resolva o captcha manualmente antes de continuar');
    }

    if (unsafeChecks.some(c => c.reason.includes('rate'))) {
      recommendations.push('Reduza a frequência de operações automatizadas');
    }

    if (unsafeChecks.some(c => c.reason.includes('suspicious'))) {
      recommendations.push('Verifique se sua conta não foi bloqueada');
    }

    return [...new Set(recommendations)]; // Remove duplicatas
  }

  /**
   * Converte tipo de operação para formato interno
   * @param {string} operation - Operação original
   * @returns {string} - Tipo interno
   */
  getOperationType(operation) {
    const mapping = {
      'scroll': 'scroll',
      'collect': 'collect',
      'apply': 'apply',
      'click': 'interaction',
      'fill': 'interaction'
    };

    return mapping[operation] || 'unknown';
  }

  /**
   * Verifica se elemento está visível
   * @param {Element} element - Elemento a verificar
   * @returns {boolean} - True se visível
   */
  isElementVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  /**
   * Obtém estatísticas de segurança
   * @returns {Promise<Object>} - Estatísticas
   */
  async getSafetyStats() {
    try {
      const data = await chrome.storage.local.get(['safetyStats', 'userActivity']);
      const stats = data.safetyStats || { operations: [] };
      const activity = data.userActivity || { lastSeen: Date.now(), events: [] };

      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;

      const hourlyOps = stats.operations.filter(op => 
        now - op.timestamp < oneHour
      );

      const dailyOps = stats.operations.filter(op => 
        now - op.timestamp < oneDay
      );

      return {
        totalOperations: stats.operations.length,
        hourlyOperations: hourlyOps.length,
        dailyOperations: dailyOps.length,
        lastActivity: activity.lastSeen,
        timeSinceLastActivity: now - activity.lastSeen,
        recentEvents: activity.events.slice(-10)
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas de segurança:', error);
      return {
        totalOperations: 0,
        hourlyOperations: 0,
        dailyOperations: 0,
        lastActivity: Date.now(),
        timeSinceLastActivity: 0,
        recentEvents: []
      };
    }
  }

  /**
   * Limpa dados antigos de segurança
   */
  async cleanupOldData() {
    try {
      const data = await chrome.storage.local.get(['safetyStats', 'userActivity']);
      const stats = data.safetyStats || { operations: [] };
      const activity = data.userActivity || { events: [] };

      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - oneWeek;

      // Limpar operações antigas
      stats.operations = stats.operations.filter(op => op.timestamp > cutoffTime);

      // Limpar eventos antigos
      activity.events = activity.events.filter(event => event.timestamp > cutoffTime);

      await chrome.storage.local.set({ 
        safetyStats: stats,
        userActivity: activity
      });

    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
    }
  }
}

// Exportar para uso em outros módulos
if (typeof window !== 'undefined') {
  window.WorkInSafetyManager = SafetyManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafetyManager;
}
