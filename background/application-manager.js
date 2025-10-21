/**
 * WorkIn Extension - Application Manager
 * Gerencia processo de candidaturas automáticas no LinkedIn
 */

class ApplicationManager {
  constructor() {
    this.settings = null;
    this.isInitialized = false;
    this.activeApplications = new Map();
    
    // Configurações de automação
    this.automationConfig = {
      maxRetries: 3,
      retryDelay: 5000,
      stepDelay: { min: 2000, max: 5000 },
      formFillDelay: { min: 100, max: 300 },
      humanLikeTyping: true
    };
  }

  /**
   * Inicializa o application manager
   */
  async init(settings = null) {
    try {
      if (settings) {
        this.settings = settings;
      }
      
      this.isInitialized = true;
      console.log('Application Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Application Manager:', error);
      throw error;
    }
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(settings) {
    this.settings = settings;
  }

  /**
   * Aplica para uma vaga
   */
  async applyToJob(jobData, tab) {
    const applicationId = WorkInUtils.StringUtils.generateId();
    
    try {
      // Registra aplicação ativa
      this.activeApplications.set(applicationId, {
        jobId: jobData.id,
        tabId: tab.id,
        status: 'starting',
        startedAt: Date.now()
      });

      // Verifica se a aba ainda está ativa
      await this.ensureTabActive(tab.id);

      // Navega para a vaga se necessário
      if (tab.url !== jobData.url) {
        await this.navigateToJob(tab.id, jobData.url);
      }

      // Aguarda carregamento da página
      await this.waitForPageLoad(tab.id);

      // Inicia processo de candidatura
      const result = await this.executeApplication(tab.id, jobData, applicationId);

      // Remove da lista de aplicações ativas
      this.activeApplications.delete(applicationId);

      return result;

    } catch (error) {
      console.error('Application failed:', error);
      
      // Remove da lista de aplicações ativas
      this.activeApplications.delete(applicationId);
      
      return {
        success: false,
        error: error.message,
        applicationId
      };
    }
  }

  /**
   * Executa o processo de candidatura
   */
  async executeApplication(tabId, jobData, applicationId) {
    try {
      // Atualiza status
      this.updateApplicationStatus(applicationId, 'detecting_button');

      // Detecta botão Easy Apply
      const easyApplyButton = await this.findEasyApplyButton(tabId);
      if (!easyApplyButton) {
        throw new Error('Botão Easy Apply não encontrado');
      }

      // Clica no botão Easy Apply
      this.updateApplicationStatus(applicationId, 'clicking_apply');
      await this.clickEasyApplyButton(tabId, easyApplyButton);

      // Aguarda modal de candidatura
      await this.waitForApplicationModal(tabId);

      // Processa formulário de candidatura
      this.updateApplicationStatus(applicationId, 'filling_form');
      const formResult = await this.processApplicationForm(tabId, jobData);

      if (!formResult.success) {
        throw new Error(formResult.error || 'Falha ao processar formulário');
      }

      // Submete candidatura
      this.updateApplicationStatus(applicationId, 'submitting');
      await this.submitApplication(tabId);

      // Verifica confirmação
      const confirmed = await this.waitForConfirmation(tabId);
      if (!confirmed) {
        throw new Error('Confirmação de candidatura não recebida');
      }

      this.updateApplicationStatus(applicationId, 'completed');

      return {
        success: true,
        applicationId,
        submittedAt: Date.now()
      };

    } catch (error) {
      this.updateApplicationStatus(applicationId, 'failed');
      throw error;
    }
  }

  /**
   * Encontra botão Easy Apply
   */
  async findEasyApplyButton(tabId) {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        // Seletores para botão Easy Apply
        const selectors = [
          '.jobs-apply-button--top-card',
          '.jobs-apply-button',
          '[data-control-name="jobdetails_topcard_inapply"]',
          'button[aria-label*="Easy Apply"]',
          'button[aria-label*="Candidatura Simplificada"]',
          '.artdeco-button--primary[aria-label*="Apply"]'
        ];

        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && button.textContent.toLowerCase().includes('easy apply') ||
              button && button.textContent.toLowerCase().includes('candidatura simplificada')) {
            return {
              found: true,
              selector,
              text: button.textContent.trim(),
              enabled: !button.disabled
            };
          }
        }

        return { found: false };
      }
    });

    return result[0]?.result?.found ? result[0].result : null;
  }

  /**
   * Clica no botão Easy Apply
   */
  async clickEasyApplyButton(tabId, buttonInfo) {
    await chrome.scripting.executeScript({
      target: { tabId },
      function: (selector) => {
        const button = document.querySelector(selector);
        if (button) {
          // Simula clique humano
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          setTimeout(() => {
            button.click();
          }, Math.random() * 1000 + 500);
        }
      },
      args: [buttonInfo.selector]
    });

    // Aguarda um pouco após o clique
    await WorkInUtils.TimeUtils.randomDelay(1000, 2000);
  }

  /**
   * Aguarda modal de candidatura
   */
  async waitForApplicationModal(tabId) {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          const selectors = [
            '.jobs-easy-apply-modal',
            '.application-modal',
            '[data-test-modal]',
            '.artdeco-modal'
          ];

          for (const selector of selectors) {
            const modal = document.querySelector(selector);
            if (modal && modal.style.display !== 'none') {
              return { found: true, selector };
            }
          }

          return { found: false };
        }
      });

      if (result[0]?.result?.found) {
        return true;
      }

      attempts++;
      await WorkInUtils.TimeUtils.randomDelay(1000, 2000);
    }

    throw new Error('Modal de candidatura não encontrado');
  }

  /**
   * Processa formulário de candidatura
   */
  async processApplicationForm(tabId, jobData) {
    try {
      // Detecta tipo de formulário
      const formInfo = await this.analyzeApplicationForm(tabId);
      
      if (!formInfo.found) {
        throw new Error('Formulário de candidatura não encontrado');
      }

      // Processa cada etapa do formulário
      for (let step = 0; step < formInfo.totalSteps; step++) {
        await this.processFormStep(tabId, step, jobData);
        
        // Verifica se há próxima etapa
        if (step < formInfo.totalSteps - 1) {
          await this.clickNextButton(tabId);
          await WorkInUtils.TimeUtils.randomDelay(2000, 4000);
        }
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Analisa formulário de candidatura
   */
  async analyzeApplicationForm(tabId) {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        const modal = document.querySelector('.jobs-easy-apply-modal, .application-modal');
        if (!modal) {
          return { found: false };
        }

        // Detecta etapas do formulário
        const stepIndicators = modal.querySelectorAll('.jobs-easy-apply-step-indicator li, .step-indicator li');
        const totalSteps = stepIndicators.length || 1;

        // Detecta campos do formulário
        const fields = modal.querySelectorAll('input, select, textarea');
        const fieldTypes = Array.from(fields).map(field => ({
          type: field.type,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          required: field.required
        }));

        return {
          found: true,
          totalSteps,
          fieldTypes,
          hasFileUpload: Array.from(fields).some(f => f.type === 'file'),
          hasTextAreas: Array.from(fields).some(f => f.tagName === 'TEXTAREA')
        };
      }
    });

    return result[0]?.result || { found: false };
  }

  /**
   * Processa uma etapa do formulário
   */
  async processFormStep(tabId, stepIndex, jobData) {
    // Obtém campos da etapa atual
    const fields = await this.getCurrentStepFields(tabId);

    for (const field of fields) {
      await this.fillField(tabId, field, jobData);
      
      // Delay entre preenchimentos para parecer humano
      await WorkInUtils.TimeUtils.randomDelay(
        this.automationConfig.formFillDelay.min,
        this.automationConfig.formFillDelay.max
      );
    }
  }

  /**
   * Obtém campos da etapa atual
   */
  async getCurrentStepFields(tabId) {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        const modal = document.querySelector('.jobs-easy-apply-modal, .application-modal');
        if (!modal) return [];

        const fields = modal.querySelectorAll('input:not([type="hidden"]), select, textarea');

        const getFieldSelector = (el) => {
          // Preferir ID
          if (el.id) return `#${CSS.escape(el.id)}`;
          // name
          if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
          // aria-label
          const aria = el.getAttribute('aria-label');
          if (aria) return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(aria)}"]`;
          // placeholder
          const ph = el.getAttribute('placeholder');
          if (ph) return `${el.tagName.toLowerCase()}[placeholder="${CSS.escape(ph)}"]`;
          // data-test-id
          const dti = el.getAttribute('data-test-id');
          if (dti) return `${el.tagName.toLowerCase()}[data-test-id="${CSS.escape(dti)}"]`;
          // Caminho CSS com nth-of-type
          const parts = [];
          let node = el;
          while (node && node.nodeType === 1 && parts.length < 5) {
            let sel = node.tagName.toLowerCase();
            if (node.className && typeof node.className === 'string') {
              const cls = node.className.trim().split(/\s+/).slice(0,2).map(c => `.${CSS.escape(c)}`).join('');
              if (cls) sel += cls;
            }
            const parent = node.parentElement;
            if (parent) {
              const sameType = Array.from(parent.children).filter(ch => ch.tagName === node.tagName);
              if (sameType.length > 1) {
                const index = sameType.indexOf(node) + 1;
                sel += `:nth-of-type(${index})`;
              }
            }
            parts.unshift(sel);
            node = parent;
          }
          return parts.length ? parts.join(' > ') : el.tagName.toLowerCase();
        };

        return Array.from(fields)
          .filter(field => {
            // Filtra apenas campos visíveis e editáveis
            const style = window.getComputedStyle(field);
            return style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   !field.disabled &&
                   !field.readOnly;
          })
          .map(field => ({
            type: field.type,
            name: field.name,
            id: field.id,
            placeholder: field.placeholder,
            value: field.value,
            required: field.required,
            tagName: field.tagName,
            selector: getFieldSelector(field)
          }));
      }
    });

    return result[0]?.result || [];
  }

  /**
   * Preenche um campo do formulário
   */
  async fillField(tabId, field, jobData) {
    const value = this.getFieldValue(field, jobData);
    
    if (!value) {
      return; // Pula campos que não conseguimos preencher
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      function: (selector, value, humanLike) => {
        const field = document.querySelector(selector);
        if (!field) return;

        // Foca no campo
        field.focus();

        if (field.tagName === 'SELECT') {
          // Para selects, encontra a opção mais próxima
          const options = Array.from(field.options);
          const bestOption = options.find(option => 
            option.text.toLowerCase().includes(value.toLowerCase()) ||
            option.value.toLowerCase().includes(value.toLowerCase())
          );
          
          if (bestOption) {
            field.value = bestOption.value;
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          // Para inputs e textareas
          if (humanLike) {
            // Simula digitação humana
            field.value = '';
            let i = 0;
            const typeChar = () => {
              if (i < value.length) {
                field.value += value[i];
                field.dispatchEvent(new Event('input', { bubbles: true }));
                i++;
                setTimeout(typeChar, Math.random() * 100 + 50);
              } else {
                field.dispatchEvent(new Event('change', { bubbles: true }));
              }
            };
            typeChar();
          } else {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      },
      args: [field.selector, value, this.automationConfig.humanLikeTyping]
    });
  }

  /**
   * Determina valor para um campo
   */
  getFieldValue(field, jobData) {
    const fieldName = (field.name || field.id || field.placeholder || '').toLowerCase();
    
    // Mapeia campos comuns
    if (fieldName.includes('phone') || fieldName.includes('telefone')) {
      return this.getUserProfile()?.phone || '';
    }
    
    if (fieldName.includes('email')) {
      return this.getUserProfile()?.email || '';
    }
    
    if (fieldName.includes('name') || fieldName.includes('nome')) {
      return this.getUserProfile()?.name || '';
    }
    
    if (fieldName.includes('location') || fieldName.includes('cidade')) {
      return this.getUserProfile()?.location || '';
    }
    
    if (fieldName.includes('salary') || fieldName.includes('salário')) {
      const preferences = this.getUserProfile()?.preferences;
      if (preferences?.salaryRange?.min) {
        return preferences.salaryRange.min.toString();
      }
    }
    
    if (fieldName.includes('experience') || fieldName.includes('experiência')) {
      return this.calculateUserExperience().toString();
    }
    
    if (fieldName.includes('cover') || fieldName.includes('carta')) {
      return this.generateCoverLetter(jobData);
    }
    
    // Para campos de texto livre, tenta usar informações do perfil
    if (field.tagName === 'TEXTAREA') {
      return this.getUserProfile()?.summary || '';
    }
    
    return '';
  }

  /**
   * Obtém perfil do usuário (cache simples)
   */
  getUserProfile() {
    // Em implementação real, isso viria do storage
    return this._cachedProfile || null;
  }

  /**
   * Define/Cached o perfil do usuário
   */
  setUserProfile(profile) {
    this._cachedProfile = profile || null;
  }

  /**
   * Calcula experiência do usuário
   */
  calculateUserExperience() {
    const profile = this.getUserProfile();
    if (!profile?.experience) return 0;
    
    let totalMonths = 0;
    for (const exp of profile.experience) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + 
                    (end.getMonth() - start.getMonth());
    }
    
    return Math.round(totalMonths / 12);
  }

  /**
   * Gera carta de apresentação simples
   */
  generateCoverLetter(jobData) {
    const profile = this.getUserProfile();
    if (!profile) return '';
    
    return `Prezados,

Tenho grande interesse na vaga de ${jobData.title} na ${jobData.company}. 
Com minha experiência em ${profile.skills?.slice(0, 3).join(', ') || 'desenvolvimento'}, 
acredito poder contribuir significativamente para a equipe.

Atenciosamente,
${profile.name}`;
  }

  /**
   * Clica no botão "Próximo"
   */
  async clickNextButton(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        const selectors = [
          '.artdeco-button--primary[aria-label*="Next"]',
          '.artdeco-button--primary[aria-label*="Próximo"]',
          '.artdeco-button--primary[data-control-name*="continue"]',
          'button[type="submit"]'
        ];

        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && !button.disabled) {
            button.click();
            return true;
          }
        }
        
        return false;
      }
    });
  }

  /**
   * Submete candidatura
   */
  async submitApplication(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        const selectors = [
          '.artdeco-button--primary[aria-label*="Submit"]',
          '.artdeco-button--primary[aria-label*="Enviar"]',
          '.artdeco-button--primary[data-control-name*="submit"]',
          'button[type="submit"]'
        ];

        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button && !button.disabled) {
            button.click();
            return true;
          }
        }
        
        return false;
      }
    });
  }

  /**
   * Aguarda confirmação de candidatura
   */
  async waitForConfirmation(tabId) {
    const maxAttempts = 15;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          // Procura por mensagens de confirmação
          const confirmationTexts = [
            'application submitted',
            'candidatura enviada',
            'application sent',
            'successfully applied',
            'candidatura realizada'
          ];

          const textContent = document.body.textContent.toLowerCase();
          
          return confirmationTexts.some(text => 
            textContent.includes(text)
          );
        }
      });

      if (result[0]?.result) {
        return true;
      }

      attempts++;
      await WorkInUtils.TimeUtils.randomDelay(1000, 2000);
    }

    return false;
  }

  /**
   * Navega para a vaga
   */
  async navigateToJob(tabId, jobUrl) {
    await chrome.tabs.update(tabId, { url: jobUrl });
  }

  /**
   * Aguarda carregamento da página
   */
  async waitForPageLoad(tabId) {
    return new Promise((resolve) => {
      const listener = (tabId_updated, changeInfo) => {
        if (tabId_updated === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 2000); // Aguarda um pouco mais para garantir
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout de segurança
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 30000);
    });
  }

  /**
   * Garante que a aba está ativa
   */
  async ensureTabActive(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab) {
        throw new Error('Tab not found');
      }
      
      // Ativa a aba
      await chrome.tabs.update(tabId, { active: true });
      
      return true;
    } catch (error) {
      throw new Error(`Tab ${tabId} is not available`);
    }
  }

  /**
   * Atualiza status da aplicação
   */
  updateApplicationStatus(applicationId, status) {
    const application = this.activeApplications.get(applicationId);
    if (application) {
      application.status = status;
      application.updatedAt = Date.now();
    }
  }

  /**
   * Obtém aplicações ativas
   */
  getActiveApplications() {
    return Array.from(this.activeApplications.values());
  }

  /**
   * Cancela aplicação
   */
  async cancelApplication(applicationId) {
    const application = this.activeApplications.get(applicationId);
    if (application) {
      application.status = 'cancelled';
      this.activeApplications.delete(applicationId);
      return true;
    }
    return false;
  }
}

// Exporta para uso global
if (typeof globalThis !== 'undefined') {
  globalThis.ApplicationManager = ApplicationManager;
}
