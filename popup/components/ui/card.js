/**
 * WorkIn Extension - Card Component
 * Componente de card reutilizável inspirado no Shadcn UI
 */

class WorkInCard {
  static variants = {
    default: 'bg-white border-border',
    primary: 'bg-primary-light border-primary',
    success: 'bg-success-light border-success',
    warning: 'bg-warning-light border-warning',
    error: 'bg-error-light border-error',
    innovation: 'bg-innovation-light border-innovation'
  };

  /**
   * Cria um card com header, content e footer
   * @param {Object} options - Opções do card
   * @param {string} options.title - Título do card
   * @param {string} options.content - Conteúdo principal do card
   * @param {string} options.footer - Rodapé do card
   * @param {string} options.variant - Variante do card
   * @param {string} options.className - Classes CSS adicionais
   * @param {string} options.id - ID do elemento
   * @returns {HTMLDivElement} Elemento do card
   */
  static create({
    title = '',
    content = '',
    footer = '',
    variant = 'default',
    className = '',
    id = ''
  } = {}) {
    const card = document.createElement('div');
    
    const baseClasses = 'rounded-lg border shadow-sm';
    const variantClasses = this.variants[variant] || this.variants.default;
    
    card.className = `${baseClasses} ${variantClasses} ${className}`.trim();
    
    if (id) card.id = id;
    
    let cardHTML = '';
    
    if (title) {
      cardHTML += `
        <div class="card-header p-6 pb-0">
          <h3 class="text-lg font-semibold text-text">${title}</h3>
        </div>
      `;
    }
    
    cardHTML += `
      <div class="card-content p-6 ${title ? 'pt-4' : ''} ${footer ? 'pb-4' : ''}">
        ${content}
      </div>
    `;
    
    if (footer) {
      cardHTML += `
        <div class="card-footer p-6 pt-0">
          ${footer}
        </div>
      `;
    }
    
    card.innerHTML = cardHTML;
    return card;
  }

  /**
   * Cria um card de estatística
   * @param {Object} options - Opções do card de estatística
   * @returns {HTMLDivElement} Elemento do card de estatística
   */
  static createStatCard({
    value = '0',
    label = '',
    icon = '',
    variant = 'primary',
    trend = null,
    className = ''
  } = {}) {
    const card = document.createElement('div');
    
    const baseClasses = 'stat-card rounded-lg border p-6 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5';
    const variantClasses = this.variants[variant] || this.variants.default;
    
    card.className = `${baseClasses} ${variantClasses} ${className}`.trim();
    
    const iconClasses = {
      primary: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      error: 'bg-error/10 text-error',
      innovation: 'bg-innovation/10 text-innovation'
    };
    
    const iconClass = iconClasses[variant] || iconClasses.primary;
    
    let trendHTML = '';
    if (trend) {
      const trendClass = trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-muted';
      const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
      trendHTML = `<span class="text-xs ${trendClass}">${trendIcon} ${Math.abs(trend)}%</span>`;
    }
    
    card.innerHTML = `
      <div class="stat-icon w-12 h-12 rounded-md flex items-center justify-center ${iconClass}">
        <span class="w-6 h-6">${icon}</span>
      </div>
      <div class="stat-content flex-1">
        <div class="stat-value text-2xl font-bold text-text mb-1">${value}</div>
        <div class="stat-label text-sm text-text-muted flex items-center gap-2">
          <span>${label}</span>
          ${trendHTML}
        </div>
      </div>
    `;
    
    return card;
  }

  /**
   * Cria um card de automação com toggle
   * @param {Object} options - Opções do card de automação
   * @returns {HTMLDivElement} Elemento do card de automação
   */
  static createAutomationCard({
    title = 'Automação',
    description = '',
    enabled = false,
    stats = [],
    onToggle = null,
    className = ''
  } = {}) {
    const card = document.createElement('div');
    
    const baseClasses = 'automation-card rounded-lg border border-border bg-white p-6';
    card.className = `${baseClasses} ${className}`.trim();
    
    let statsHTML = '';
    if (stats.length > 0) {
      statsHTML = `
        <div class="automation-stats flex gap-4 mt-4">
          ${stats.map(stat => `
            <div class="automation-stat flex-1 text-center p-3 bg-gray-50 rounded-md">
              <div class="stat-label text-xs text-text-muted mb-1">${stat.label}</div>
              <div class="stat-value font-semibold text-sm">${stat.value}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="automation-header flex justify-between items-start mb-4">
        <div class="automation-info">
          <h3 class="automation-title text-sm font-semibold text-text mb-1">${title}</h3>
          <p class="automation-desc text-xs text-text-muted">${description}</p>
        </div>
        <label class="toggle-switch relative inline-block w-12 h-6">
          <input type="checkbox" class="sr-only" ${enabled ? 'checked' : ''}>
          <span class="toggle-slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all"></span>
        </label>
      </div>
      ${statsHTML}
    `;
    
    // Event listener para o toggle
    if (onToggle && typeof onToggle === 'function') {
      const toggleInput = card.querySelector('input[type="checkbox"]');
      toggleInput.addEventListener('change', (e) => onToggle(e.target.checked));
    }
    
    return card;
  }

  /**
   * Cria um card de alerta
   * @param {Object} options - Opções do card de alerta
   * @returns {HTMLDivElement} Elemento do card de alerta
   */
  static createAlert({
    title = '',
    message = '',
    variant = 'warning',
    icon = '',
    dismissible = false,
    onDismiss = null,
    className = ''
  } = {}) {
    const alert = document.createElement('div');
    
    const variantClasses = {
      warning: 'bg-warning-light border-warning text-warning',
      error: 'bg-error-light border-error text-error',
      success: 'bg-success-light border-success text-success',
      info: 'bg-primary-light border-primary text-primary'
    };
    
    const baseClasses = 'alert flex gap-3 p-4 rounded-lg border';
    const classes = variantClasses[variant] || variantClasses.warning;
    
    alert.className = `${baseClasses} ${classes} ${className}`.trim();
    
    let dismissHTML = '';
    if (dismissible) {
      dismissHTML = `
        <button class="alert-dismiss ml-auto text-current hover:opacity-70 transition-opacity">
          <span class="w-4 h-4">×</span>
        </button>
      `;
    }
    
    alert.innerHTML = `
      ${icon ? `<div class="alert-icon w-5 h-5 flex-shrink-0">${icon}</div>` : ''}
      <div class="alert-content flex-1">
        ${title ? `<h4 class="alert-title text-sm font-semibold mb-1">${title}</h4>` : ''}
        <p class="alert-text text-xs opacity-90">${message}</p>
      </div>
      ${dismissHTML}
    `;
    
    // Event listener para dismiss
    if (dismissible && onDismiss) {
      const dismissBtn = alert.querySelector('.alert-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          alert.remove();
          if (typeof onDismiss === 'function') {
            onDismiss();
          }
        });
      }
    }
    
    return alert;
  }

  /**
   * Cria um card de atividade recente
   * @param {Object} options - Opções do card de atividade
   * @returns {HTMLDivElement} Elemento do card de atividade
   */
  static createActivityCard({
    title = '',
    description = '',
    time = '',
    icon = '',
    variant = 'default',
    className = ''
  } = {}) {
    const card = document.createElement('div');
    
    const baseClasses = 'activity-card flex gap-3 p-4 rounded-lg border border-border bg-white hover:shadow-sm transition-all';
    card.className = `${baseClasses} ${className}`.trim();
    
    const iconClasses = {
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-primary',
      default: 'text-text-muted'
    };
    
    const iconClass = iconClasses[variant] || iconClasses.default;
    
    card.innerHTML = `
      <div class="activity-icon w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span class="w-4 h-4 ${iconClass}">${icon}</span>
      </div>
      <div class="activity-content flex-1 min-w-0">
        <h4 class="activity-title text-sm font-medium text-text truncate">${title}</h4>
        <p class="activity-desc text-xs text-text-muted truncate">${description}</p>
        <time class="activity-time text-xs text-text-light">${time}</time>
      </div>
    `;
    
    return card;
  }
}

// Expor globalmente
window.WorkInCard = WorkInCard;
