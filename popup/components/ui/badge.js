/**
 * WorkIn Extension - Badge Component
 * Componente de badge reutilizável inspirado no Shadcn UI
 */

class WorkInBadge {
  static variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-primary-light text-primary border-primary/20',
    success: 'bg-success-light text-success border-success/20',
    warning: 'bg-warning-light text-warning border-warning/20',
    error: 'bg-error-light text-error border-error/20',
    innovation: 'bg-innovation-light text-innovation border-innovation/20',
    outline: 'border border-border text-text-muted bg-transparent',
    secondary: 'bg-gray-200 text-gray-800 border-gray-300'
  };
  
  static sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-sm'
  };

  /**
   * Cria um badge simples
   * @param {Object} options - Opções do badge
   * @param {string} options.text - Texto do badge
   * @param {string} options.variant - Variante do badge
   * @param {string} options.size - Tamanho do badge
   * @param {string} options.className - Classes CSS adicionais
   * @param {string} options.id - ID do elemento
   * @returns {HTMLSpanElement} Elemento do badge
   */
  static create({
    text = '',
    variant = 'default',
    size = 'sm',
    className = '',
    id = ''
  } = {}) {
    const badge = document.createElement('span');
    
    const baseClasses = 'inline-flex items-center rounded-full border font-medium';
    const variantClasses = this.variants[variant] || this.variants.default;
    const sizeClasses = this.sizes[size] || this.sizes.sm;
    
    badge.className = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();
    
    if (id) badge.id = id;
    badge.textContent = text;
    
    return badge;
  }

  /**
   * Cria um badge com ícone
   * @param {Object} options - Opções do badge com ícone
   * @returns {HTMLSpanElement} Elemento do badge com ícone
   */
  static createWithIcon({
    text = '',
    icon = '',
    variant = 'default',
    size = 'sm',
    iconPosition = 'left',
    className = ''
  } = {}) {
    const badge = document.createElement('span');
    
    const baseClasses = 'inline-flex items-center gap-1 rounded-full border font-medium';
    const variantClasses = this.variants[variant] || this.variants.default;
    const sizeClasses = this.sizes[size] || this.sizes.sm;
    
    badge.className = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();
    
    const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    
    if (iconPosition === 'right') {
      badge.innerHTML = `<span>${text}</span><span class="${iconSize}">${icon}</span>`;
    } else {
      badge.innerHTML = `<span class="${iconSize}">${icon}</span><span>${text}</span>`;
    }
    
    return badge;
  }

  /**
   * Cria um badge de status
   * @param {Object} options - Opções do badge de status
   * @returns {HTMLSpanElement} Elemento do badge de status
   */
  static createStatus({
    status = 'active',
    text = '',
    className = ''
  } = {}) {
    const statusConfig = {
      active: { variant: 'success', icon: '●', text: text || 'Ativo' },
      inactive: { variant: 'default', icon: '○', text: text || 'Inativo' },
      pending: { variant: 'warning', icon: '◐', text: text || 'Pendente' },
      error: { variant: 'error', icon: '●', text: text || 'Erro' },
      processing: { variant: 'innovation', icon: '⟳', text: text || 'Processando' },
      completed: { variant: 'success', icon: '✓', text: text || 'Concluído' },
      failed: { variant: 'error', icon: '✗', text: text || 'Falhou' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return this.createWithIcon({
      text: config.text,
      icon: config.icon,
      variant: config.variant,
      size: 'sm',
      className
    });
  }

  /**
   * Cria um badge de contador
   * @param {Object} options - Opções do badge de contador
   * @returns {HTMLSpanElement} Elemento do badge de contador
   */
  static createCounter({
    count = 0,
    max = 99,
    variant = 'primary',
    size = 'sm',
    className = ''
  } = {}) {
    const displayCount = count > max ? `${max}+` : count.toString();
    
    return this.create({
      text: displayCount,
      variant,
      size,
      className: `min-w-5 h-5 flex items-center justify-center ${className}`
    });
  }

  /**
   * Cria um badge de prioridade
   * @param {Object} options - Opções do badge de prioridade
   * @returns {HTMLSpanElement} Elemento do badge de prioridade
   */
  static createPriority({
    priority = 'medium',
    className = ''
  } = {}) {
    const priorityConfig = {
      low: { variant: 'default', text: 'Baixa', icon: '↓' },
      medium: { variant: 'warning', text: 'Média', icon: '→' },
      high: { variant: 'error', text: 'Alta', icon: '↑' },
      urgent: { variant: 'error', text: 'Urgente', icon: '⚡' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    
    return this.createWithIcon({
      text: config.text,
      icon: config.icon,
      variant: config.variant,
      size: 'xs',
      className
    });
  }

  /**
   * Cria um badge de tipo de vaga
   * @param {Object} options - Opções do badge de tipo de vaga
   * @returns {HTMLSpanElement} Elemento do badge de tipo de vaga
   */
  static createJobType({
    type = 'full-time',
    className = ''
  } = {}) {
    const typeConfig = {
      'full-time': { variant: 'primary', text: 'Tempo Integral', icon: '🕒' },
      'part-time': { variant: 'warning', text: 'Meio Período', icon: '⏰' },
      'contract': { variant: 'innovation', text: 'Contrato', icon: '📋' },
      'internship': { variant: 'success', text: 'Estágio', icon: '🎓' },
      'remote': { variant: 'success', text: 'Remoto', icon: '🏠' },
      'hybrid': { variant: 'warning', text: 'Híbrido', icon: '🔄' },
      'easy-apply': { variant: 'success', text: 'Easy Apply', icon: '⚡' }
    };
    
    const config = typeConfig[type] || typeConfig['full-time'];
    
    return this.createWithIcon({
      text: config.text,
      icon: config.icon,
      variant: config.variant,
      size: 'xs',
      className
    });
  }

  /**
   * Cria um badge de compatibilidade
   * @param {Object} options - Opções do badge de compatibilidade
   * @returns {HTMLSpanElement} Elemento do badge de compatibilidade
   */
  static createCompatibility({
    score = 0,
    className = ''
  } = {}) {
    let variant, text, icon;
    
    if (score >= 80) {
      variant = 'success';
      text = 'Alta Compatibilidade';
      icon = '🎯';
    } else if (score >= 60) {
      variant = 'warning';
      text = 'Compatibilidade Média';
      icon = '📊';
    } else {
      variant = 'error';
      text = 'Baixa Compatibilidade';
      icon = '⚠️';
    }
    
    return this.createWithIcon({
      text: `${text} (${score}%)`,
      icon,
      variant,
      size: 'xs',
      className
    });
  }

  /**
   * Atualiza o texto de um badge existente
   * @param {HTMLSpanElement} badge - Elemento do badge
   * @param {string} newText - Novo texto
   */
  static updateText(badge, newText) {
    if (badge.querySelector('span:last-child')) {
      badge.querySelector('span:last-child').textContent = newText;
    } else {
      badge.textContent = newText;
    }
  }

  /**
   * Atualiza a variante de um badge existente
   * @param {HTMLSpanElement} badge - Elemento do badge
   * @param {string} newVariant - Nova variante
   */
  static updateVariant(badge, newVariant) {
    // Remove todas as classes de variante
    Object.values(this.variants).forEach(variantClass => {
      badge.classList.remove(...variantClass.split(' '));
    });
    
    // Adiciona a nova variante
    const newVariantClass = this.variants[newVariant] || this.variants.default;
    badge.classList.add(...newVariantClass.split(' '));
  }
}

// Expor globalmente
window.WorkInBadge = WorkInBadge;
