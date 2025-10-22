/**
 * WorkIn Extension - Button Component
 * Componente de botão reutilizável inspirado no Shadcn UI
 */

class WorkInButton {
  static variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white border-primary',
    success: 'bg-success hover:bg-success-hover text-white border-success',
    innovation: 'bg-innovation hover:bg-innovation-hover text-white border-innovation',
    warning: 'bg-warning hover:bg-warning-hover text-white border-warning',
    error: 'bg-error hover:bg-error-hover text-white border-error',
    outline: 'border border-border bg-transparent hover:bg-hover text-text hover:text-text',
    ghost: 'hover:bg-hover text-text-muted hover:text-text',
    link: 'text-primary hover:text-primary-hover underline-offset-4 hover:underline'
  };
  
  static sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  static iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  /**
   * Cria um botão com as configurações especificadas
   * @param {Object} options - Opções do botão
   * @param {string} options.variant - Variante do botão (primary, success, etc.)
   * @param {string} options.size - Tamanho do botão (xs, sm, md, lg, xl)
   * @param {string} options.text - Texto do botão
   * @param {string} options.icon - SVG do ícone (opcional)
   * @param {string} options.iconPosition - Posição do ícone ('left' ou 'right')
   * @param {Function} options.onClick - Função de callback
   * @param {boolean} options.disabled - Se o botão está desabilitado
   * @param {string} options.className - Classes CSS adicionais
   * @param {string} options.id - ID do elemento
   * @param {string} options.title - Tooltip do botão
   * @returns {HTMLButtonElement} Elemento do botão
   */
  static create({
    variant = 'primary',
    size = 'md',
    text = '',
    icon = '',
    iconPosition = 'left',
    onClick = null,
    disabled = false,
    className = '',
    id = '',
    title = ''
  } = {}) {
    const button = document.createElement('button');
    
    // Classes base
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50';
    
    // Variante e tamanho
    const variantClasses = this.variants[variant] || this.variants.primary;
    const sizeClasses = this.sizes[size] || this.sizes.md;
    
    // Classes finais
    button.className = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();
    
    // Atributos
    if (id) button.id = id;
    if (title) button.title = title;
    if (disabled) button.disabled = true;
    
    // Conteúdo do botão
    if (icon && text) {
      const iconSize = this.iconSizes[size] || this.iconSizes.md;
      const iconElement = `<span class="${iconSize}">${icon}</span>`;
      
      if (iconPosition === 'right') {
        button.innerHTML = `<span>${text}</span>${iconElement}`;
      } else {
        button.innerHTML = `${iconElement}<span>${text}</span>`;
      }
    } else if (icon) {
      const iconSize = this.iconSizes[size] || this.iconSizes.md;
      button.innerHTML = `<span class="${iconSize}">${icon}</span>`;
    } else {
      button.textContent = text;
    }
    
    // Event listener
    if (onClick && typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Cria um botão de ação rápida (action card)
   * @param {Object} options - Opções do botão de ação
   * @returns {HTMLButtonElement} Elemento do botão de ação
   */
  static createActionCard({
    title = '',
    description = '',
    icon = '',
    variant = 'primary',
    onClick = null,
    className = ''
  } = {}) {
    const button = document.createElement('button');
    
    const baseClasses = 'action-card w-full text-left p-4 rounded-lg border transition-all hover:shadow-md hover:-translate-y-0.5';
    const variantClasses = variant === 'primary' 
      ? 'bg-gradient-to-br from-primary to-innovation text-white border-transparent' 
      : 'bg-white border-border hover:border-primary';
    
    button.className = `${baseClasses} ${variantClasses} ${className}`.trim();
    
    button.innerHTML = `
      <div class="action-icon w-12 h-12 mx-auto mb-3 rounded-md flex items-center justify-center ${
        variant === 'primary' ? 'bg-white/20' : 'bg-gray-100'
      }">
        <span class="w-6 h-6">${icon}</span>
      </div>
      <h3 class="action-title font-semibold text-sm mb-1">${title}</h3>
      <p class="action-desc text-xs opacity-80">${description}</p>
    `;
    
    if (onClick && typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Cria um botão de ícone simples
   * @param {Object} options - Opções do botão de ícone
   * @returns {HTMLButtonElement} Elemento do botão de ícone
   */
  static createIconButton({
    icon = '',
    size = 'md',
    variant = 'ghost',
    onClick = null,
    title = '',
    className = ''
  } = {}) {
    const button = document.createElement('button');
    
    const baseClasses = 'inline-flex items-center justify-center rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';
    const variantClasses = this.variants[variant] || this.variants.ghost;
    
    // Tamanhos específicos para botões de ícone
    const iconOnlySizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14'
    };
    
    const sizeClasses = iconOnlySizes[size] || iconOnlySizes.md;
    const iconSize = this.iconSizes[size] || this.iconSizes.md;
    
    button.className = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();
    
    if (title) button.title = title;
    
    button.innerHTML = `<span class="${iconSize}">${icon}</span>`;
    
    if (onClick && typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Atualiza o estado de loading de um botão
   * @param {HTMLButtonElement} button - Elemento do botão
   * @param {boolean} loading - Se está em loading
   * @param {string} loadingText - Texto durante o loading
   */
  static setLoading(button, loading = true, loadingText = 'Carregando...') {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = `
        <span class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        <span>${loadingText}</span>
      `;
    } else {
      button.disabled = false;
      const originalText = button.dataset.originalText;
      if (originalText) {
        button.textContent = originalText;
        delete button.dataset.originalText;
      }
    }
  }
}

// Expor globalmente
window.WorkInButton = WorkInButton;
