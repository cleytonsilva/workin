/**
 * WorkIn Extension - Options Page Controller
 * Manages the settings and configuration interface
 */

class WorkInOptions {
  constructor() {
    this.currentTab = 'profile';
    this.settings = {};
    this.userProfile = {};
    this.isDirty = false;
    this.autoSaveTimeout = null;
    
    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      this.showLoading(true);
      
      // Load current settings and profile
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize UI
      this.initializeUI();
      
      // Setup auto-save
      this.setupAutoSave();
      
      this.showLoading(false);
      this.showToast('Configurações carregadas com sucesso', 'success');
    } catch (error) {
      console.error('Error initializing options:', error);
      this.showToast('Erro ao carregar configurações', 'error');
      this.showLoading(false);
    }
  }

  /**
   * Load settings and user profile from storage
   */
  async loadData() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });
      
      if (response && response.settings) {
        this.settings = response.settings;
      } else {
        this.settings = this.getDefaultSettings();
      }

      const profileResponse = await chrome.runtime.sendMessage({
        action: 'getUserProfile'
      });
      
      if (profileResponse && profileResponse.profile) {
        this.userProfile = profileResponse.profile;
      } else {
        this.userProfile = this.getDefaultProfile();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.settings = this.getDefaultSettings();
      this.userProfile = this.getDefaultProfile();
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      automation: {
        maxApplicationsPerHour: 5,
        maxApplicationsPerDay: 20,
        minDelayBetweenApplications: 300000, // 5 minutes
        maxDelayBetweenApplications: 900000, // 15 minutes
        enableAutoApply: false,
        workingHours: {
          enabled: true,
          start: '09:00',
          end: '18:00',
          timezone: 'America/Sao_Paulo'
        },
        autoFilters: {
          onlyEasyApply: true,
          excludeApplied: true,
          minScore: 60
        }
      },
      matching: {
        weights: {
          skills: 0.3,
          experience: 0.25,
          location: 0.15,
          jobType: 0.1,
          seniority: 0.1,
          keywords: 0.1
        },
        keywords: {
          important: [],
          negative: []
        }
      },
      privacy: {
        enableEncryption: true,
        dataRetentionDays: 90,
        enableLogging: true,
        enableAnalytics: false,
        logLevel: 'INFO'
      },
      advanced: {
        enableDebugMode: false,
        enablePerformanceMonitoring: true,
        enableAutoBackup: true,
        backupFrequency: 'weekly'
      }
    };
  }

  /**
   * Get default user profile
   */
  getDefaultProfile() {
    return {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedinUrl: ''
      },
      professional: {
        currentPosition: '',
        yearsOfExperience: 0,
        seniority: 'JUNIOR',
        skills: [],
        preferredJobTypes: [],
        preferredLocations: [],
        salaryExpectation: {
          min: 0,
          max: 0,
          currency: 'BRL'
        }
      },
      education: [],
      experience: []
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Header actions
    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importSettings').addEventListener('click', () => {
      this.importSettings();
    });

    // Form changes
    document.addEventListener('input', (e) => {
      if (e.target.matches('.form-control, input[type="checkbox"], input[type="radio"]')) {
        this.markDirty();
        this.scheduleAutoSave();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.matches('.form-control, input[type="checkbox"], input[type="radio"]')) {
        this.markDirty();
        this.scheduleAutoSave();
      }
    });

    // Skills input
    const skillsInput = document.getElementById('skillsInput');
    if (skillsInput) {
      skillsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addSkill(skillsInput.value.trim());
          skillsInput.value = '';
        }
      });
    }

    // Keywords inputs
    const importantKeywordsInput = document.getElementById('importantKeywords');
    const negativeKeywordsInput = document.getElementById('negativeKeywords');
    
    if (importantKeywordsInput) {
      importantKeywordsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addKeyword('important', importantKeywordsInput.value.trim());
          importantKeywordsInput.value = '';
        }
      });
    }

    if (negativeKeywordsInput) {
      negativeKeywordsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addKeyword('negative', negativeKeywordsInput.value.trim());
          negativeKeywordsInput.value = '';
        }
      });
    }

    // Range sliders
    document.querySelectorAll('.range-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        this.updateRangeValue(e.target);
      });
    });

    // Privacy actions
    document.getElementById('clearAllData').addEventListener('click', () => {
      this.clearAllData();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Save button
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveSettings();
      }
    });

    // Before unload warning
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      }
    });
  }

  /**
   * Initialize UI with current data
   */
  initializeUI() {
    this.populateProfileTab();
    this.populateAutomationTab();
    this.populateMatchingTab();
    this.populatePrivacyTab();
    this.populateAdvancedTab();
    this.updateSystemInfo();
  }

  /**
   * Populate profile tab
   */
  populateProfileTab() {
    const profile = this.userProfile;
    
    // Personal info
    this.setFieldValue('fullName', profile.personalInfo?.fullName || '');
    this.setFieldValue('email', profile.personalInfo?.email || '');
    this.setFieldValue('phone', profile.personalInfo?.phone || '');
    this.setFieldValue('location', profile.personalInfo?.location || '');
    this.setFieldValue('linkedinUrl', profile.personalInfo?.linkedinUrl || '');
    
    // Professional info
    this.setFieldValue('currentPosition', profile.professional?.currentPosition || '');
    this.setFieldValue('yearsOfExperience', profile.professional?.yearsOfExperience || 0);
    this.setFieldValue('seniority', profile.professional?.seniority || 'JUNIOR');
    
    // Skills
    this.renderSkills(profile.professional?.skills || []);
    
    // Job preferences
    this.setCheckboxValues('preferredJobTypes', profile.professional?.preferredJobTypes || []);
    this.setFieldValue('salaryMin', profile.professional?.salaryExpectation?.min || 0);
    this.setFieldValue('salaryMax', profile.professional?.salaryExpectation?.max || 0);
  }

  /**
   * Populate automation tab
   */
  populateAutomationTab() {
    const automation = this.settings.automation || {};
    
    this.setFieldValue('maxApplicationsPerHour', automation.maxApplicationsPerHour || 5);
    this.setFieldValue('maxApplicationsPerDay', automation.maxApplicationsPerDay || 20);
    this.setFieldValue('minDelay', Math.floor((automation.minDelayBetweenApplications || 300000) / 60000));
    this.setFieldValue('maxDelay', Math.floor((automation.maxDelayBetweenApplications || 900000) / 60000));
    this.setFieldValue('enableAutoApply', automation.enableAutoApply || false);
    
    // Working hours
    this.setFieldValue('workingHoursEnabled', automation.workingHours?.enabled || true);
    this.setFieldValue('workingHoursStart', automation.workingHours?.start || '09:00');
    this.setFieldValue('workingHoursEnd', automation.workingHours?.end || '18:00');
    
    // Auto filters
    this.setFieldValue('onlyEasyApply', automation.autoFilters?.onlyEasyApply || true);
    this.setFieldValue('excludeApplied', automation.autoFilters?.excludeApplied || true);
    this.setFieldValue('minScore', automation.autoFilters?.minScore || 60);
  }

  /**
   * Populate matching tab
   */
  populateMatchingTab() {
    const matching = this.settings.matching || {};
    const weights = matching.weights || {};
    
    // Set weight sliders
    this.setRangeValue('skillsWeight', Math.round((weights.skills || 0.3) * 100));
    this.setRangeValue('experienceWeight', Math.round((weights.experience || 0.25) * 100));
    this.setRangeValue('locationWeight', Math.round((weights.location || 0.15) * 100));
    this.setRangeValue('jobTypeWeight', Math.round((weights.jobType || 0.1) * 100));
    this.setRangeValue('seniorityWeight', Math.round((weights.seniority || 0.1) * 100));
    this.setRangeValue('keywordsWeight', Math.round((weights.keywords || 0.1) * 100));
    
    // Render keywords
    this.renderKeywords('important', matching.keywords?.important || []);
    this.renderKeywords('negative', matching.keywords?.negative || []);
  }

  /**
   * Populate privacy tab
   */
  populatePrivacyTab() {
    const privacy = this.settings.privacy || {};
    
    this.setFieldValue('enableEncryption', privacy.enableEncryption !== false);
    this.setFieldValue('dataRetentionDays', privacy.dataRetentionDays || 90);
    this.setFieldValue('enableLogging', privacy.enableLogging !== false);
    this.setFieldValue('enableAnalytics', privacy.enableAnalytics || false);
    this.setFieldValue('logLevel', privacy.logLevel || 'INFO');
  }

  /**
   * Populate advanced tab
   */
  populateAdvancedTab() {
    const advanced = this.settings.advanced || {};
    
    this.setFieldValue('enableDebugMode', advanced.enableDebugMode || false);
    this.setFieldValue('enablePerformanceMonitoring', advanced.enablePerformanceMonitoring !== false);
    this.setFieldValue('enableAutoBackup', advanced.enableAutoBackup !== false);
    this.setFieldValue('backupFrequency', advanced.backupFrequency || 'weekly');
  }

  /**
   * Update system information
   */
  async updateSystemInfo() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });
      
      if (response.success) {
        const info = response.data;
        document.getElementById('extensionVersion').textContent = info.version || '1.0.0';
        document.getElementById('chromeVersion').textContent = info.chromeVersion || 'Unknown';
        document.getElementById('storageUsed').textContent = this.formatBytes(info.storageUsed || 0);
        document.getElementById('lastBackup').textContent = info.lastBackup || 'Nunca';
      }
    } catch (error) {
      console.error('Error updating system info:', error);
    }
  }

  /**
   * Switch to a different tab
   */
  switchTab(tabId) {
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update content
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabId}Tab`);
    });
    
    this.currentTab = tabId;
  }

  /**
   * Add a skill to the profile
   */
  addSkill(skill) {
    if (!skill || this.userProfile.professional.skills.includes(skill)) {
      return;
    }
    
    this.userProfile.professional.skills.push(skill);
    this.renderSkills(this.userProfile.professional.skills);
    this.markDirty();
  }

  /**
   * Remove a skill from the profile
   */
  removeSkill(skill) {
    const index = this.userProfile.professional.skills.indexOf(skill);
    if (index > -1) {
      this.userProfile.professional.skills.splice(index, 1);
      this.renderSkills(this.userProfile.professional.skills);
      this.markDirty();
    }
  }

  /**
   * Render skills tags
   */
  renderSkills(skills) {
    const container = document.getElementById('skillsTags');
    if (!container) return;
    
    container.innerHTML = skills.map(skill => `
      <span class="skill-tag">
        ${this.escapeHtml(skill)}
        <span class="remove" onclick="workInOptions.removeSkill('${this.escapeHtml(skill)}')">&times;</span>
      </span>
    `).join('');
  }

  /**
   * Add a keyword
   */
  addKeyword(type, keyword) {
    if (!keyword) return;
    
    if (!this.settings.matching.keywords) {
      this.settings.matching.keywords = { important: [], negative: [] };
    }
    
    if (!this.settings.matching.keywords[type].includes(keyword)) {
      this.settings.matching.keywords[type].push(keyword);
      this.renderKeywords(type, this.settings.matching.keywords[type]);
      this.markDirty();
    }
  }

  /**
   * Remove a keyword
   */
  removeKeyword(type, keyword) {
    if (!this.settings.matching.keywords || !this.settings.matching.keywords[type]) {
      return;
    }
    
    const index = this.settings.matching.keywords[type].indexOf(keyword);
    if (index > -1) {
      this.settings.matching.keywords[type].splice(index, 1);
      this.renderKeywords(type, this.settings.matching.keywords[type]);
      this.markDirty();
    }
  }

  /**
   * Render keywords tags
   */
  renderKeywords(type, keywords) {
    const container = document.getElementById(`${type}KeywordsTags`);
    if (!container) return;
    
    container.innerHTML = keywords.map(keyword => `
      <span class="skill-tag">
        ${this.escapeHtml(keyword)}
        <span class="remove" onclick="workInOptions.removeKeyword('${type}', '${this.escapeHtml(keyword)}')">&times;</span>
      </span>
    `).join('');
  }

  /**
   * Set field value
   */
  setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  }

  /**
   * Set checkbox values for multiple checkboxes
   */
  setCheckboxValues(name, values) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
      checkbox.checked = values.includes(checkbox.value);
    });
  }

  /**
   * Set range slider value and update display
   */
  setRangeValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = value;
      this.updateRangeValue(field);
    }
  }

  /**
   * Update range slider display value
   */
  updateRangeValue(slider) {
    const valueDisplay = slider.parentElement.querySelector('.range-current');
    if (valueDisplay) {
      valueDisplay.textContent = `${slider.value}%`;
    }
  }

  /**
   * Mark settings as dirty (unsaved changes)
   */
  markDirty() {
    this.isDirty = true;
    document.body.classList.add('has-unsaved-changes');
  }

  /**
   * Mark settings as clean (saved)
   */
  markClean() {
    this.isDirty = false;
    document.body.classList.remove('has-unsaved-changes');
  }

  /**
   * Schedule auto-save
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveSettings(true);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    // Auto-save every 30 seconds if there are changes
    setInterval(() => {
      if (this.isDirty) {
        this.saveSettings(true);
      }
    }, 30000);
  }

  /**
   * Collect form data
   */
  collectFormData() {
    // Profile data
    this.userProfile.personalInfo = {
      fullName: this.getFieldValue('fullName'),
      email: this.getFieldValue('email'),
      phone: this.getFieldValue('phone'),
      location: this.getFieldValue('location'),
      linkedinUrl: this.getFieldValue('linkedinUrl')
    };
    
    this.userProfile.professional = {
      ...this.userProfile.professional,
      currentPosition: this.getFieldValue('currentPosition'),
      yearsOfExperience: parseInt(this.getFieldValue('yearsOfExperience')) || 0,
      seniority: this.getFieldValue('seniority'),
      preferredJobTypes: this.getCheckboxValues('preferredJobTypes'),
      salaryExpectation: {
        min: parseInt(this.getFieldValue('salaryMin')) || 0,
        max: parseInt(this.getFieldValue('salaryMax')) || 0,
        currency: 'BRL'
      }
    };
    
    // Settings data
    this.settings.automation = {
      maxApplicationsPerHour: parseInt(this.getFieldValue('maxApplicationsPerHour')) || 5,
      maxApplicationsPerDay: parseInt(this.getFieldValue('maxApplicationsPerDay')) || 20,
      minDelayBetweenApplications: (parseInt(this.getFieldValue('minDelay')) || 5) * 60000,
      maxDelayBetweenApplications: (parseInt(this.getFieldValue('maxDelay')) || 15) * 60000,
      enableAutoApply: this.getFieldValue('enableAutoApply'),
      workingHours: {
        enabled: this.getFieldValue('workingHoursEnabled'),
        start: this.getFieldValue('workingHoursStart'),
        end: this.getFieldValue('workingHoursEnd'),
        timezone: 'America/Sao_Paulo'
      },
      autoFilters: {
        onlyEasyApply: this.getFieldValue('onlyEasyApply'),
        excludeApplied: this.getFieldValue('excludeApplied'),
        minScore: parseInt(this.getFieldValue('minScore')) || 60
      }
    };
    
    this.settings.matching = {
      weights: {
        skills: parseInt(this.getFieldValue('skillsWeight')) / 100,
        experience: parseInt(this.getFieldValue('experienceWeight')) / 100,
        location: parseInt(this.getFieldValue('locationWeight')) / 100,
        jobType: parseInt(this.getFieldValue('jobTypeWeight')) / 100,
        seniority: parseInt(this.getFieldValue('seniorityWeight')) / 100,
        keywords: parseInt(this.getFieldValue('keywordsWeight')) / 100
      },
      keywords: this.settings.matching.keywords || { important: [], negative: [] }
    };
    
    this.settings.privacy = {
      enableEncryption: this.getFieldValue('enableEncryption'),
      dataRetentionDays: parseInt(this.getFieldValue('dataRetentionDays')) || 90,
      enableLogging: this.getFieldValue('enableLogging'),
      enableAnalytics: this.getFieldValue('enableAnalytics'),
      logLevel: this.getFieldValue('logLevel')
    };
    
    this.settings.advanced = {
      enableDebugMode: this.getFieldValue('enableDebugMode'),
      enablePerformanceMonitoring: this.getFieldValue('enablePerformanceMonitoring'),
      enableAutoBackup: this.getFieldValue('enableAutoBackup'),
      backupFrequency: this.getFieldValue('backupFrequency')
    };
  }

  /**
   * Get field value
   */
  getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return '';
    
    if (field.type === 'checkbox') {
      return field.checked;
    }
    return field.value;
  }

  /**
   * Get checkbox values for multiple checkboxes
   */
  getCheckboxValues(name) {
    const values = [];
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(checkbox => {
      values.push(checkbox.value);
    });
    return values;
  }

  /**
   * Save settings
   */
  async saveSettings(isAutoSave = false) {
    try {
      if (!isAutoSave) {
        this.showLoading(true);
      }
      
      // Collect form data
      this.collectFormData();
      
      // Validate data
      const validation = this.validateSettings();
      if (!validation.valid) {
        this.showToast(validation.message, 'error');
        if (!isAutoSave) {
          this.showLoading(false);
        }
        return;
      }
      
      // Save to storage
      const settingsResponse = await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      const profileResponse = await chrome.runtime.sendMessage({
        action: 'updateUserProfile',
        profile: this.userProfile
      });
      
      if (settingsResponse.success && profileResponse.success) {
        this.markClean();
        if (!isAutoSave) {
          this.showToast('Configurações salvas com sucesso!', 'success');
        }
      } else {
        throw new Error('Failed to save settings');
      }
      
      if (!isAutoSave) {
        this.showLoading(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Erro ao salvar configurações', 'error');
      if (!isAutoSave) {
        this.showLoading(false);
      }
    }
  }

  /**
   * Validate settings
   */
  validateSettings() {
    // Validate email
    const email = this.userProfile.personalInfo?.email;
    if (email && !this.isValidEmail(email)) {
      return { valid: false, message: 'Email inválido' };
    }
    
    // Validate LinkedIn URL
    const linkedinUrl = this.userProfile.personalInfo?.linkedinUrl;
    if (linkedinUrl && !this.isValidLinkedInUrl(linkedinUrl)) {
      return { valid: false, message: 'URL do LinkedIn inválida' };
    }
    
    // Validate automation limits
    const maxHour = this.settings.automation?.maxApplicationsPerHour || 0;
    const maxDay = this.settings.automation?.maxApplicationsPerDay || 0;
    
    if (maxHour > 10) {
      return { valid: false, message: 'Máximo de 10 candidaturas por hora permitido' };
    }
    
    if (maxDay > 50) {
      return { valid: false, message: 'Máximo de 50 candidaturas por dia permitido' };
    }
    
    if (maxHour * 24 > maxDay) {
      return { valid: false, message: 'Limite por hora inconsistente com limite diário' };
    }
    
    // Validate matching weights (should sum to 100%)
    const weights = this.settings.matching?.weights || {};
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return { valid: false, message: 'Os pesos de matching devem somar 100%' };
    }
    
    return { valid: true };
  }

  /**
   * Export settings to file
   */
  async exportSettings() {
    try {
      this.collectFormData();
      
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: this.settings,
        userProfile: this.userProfile
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workin-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('Configurações exportadas com sucesso!', 'success');
    } catch (error) {
      console.error('Error exporting settings:', error);
      this.showToast('Erro ao exportar configurações', 'error');
    }
  }

  /**
   * Import settings from file
   */
  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data
        if (!importData.settings || !importData.userProfile) {
          throw new Error('Arquivo de configuração inválido');
        }
        
        // Confirm import
        if (!confirm('Isso substituirá todas as configurações atuais. Continuar?')) {
          return;
        }
        
        this.settings = importData.settings;
        this.userProfile = importData.userProfile;
        
        // Update UI
        this.initializeUI();
        this.markDirty();
        
        this.showToast('Configurações importadas com sucesso!', 'success');
      } catch (error) {
        console.error('Error importing settings:', error);
        this.showToast('Erro ao importar configurações', 'error');
      }
    };
    
    input.click();
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (!confirm('Isso apagará TODOS os dados da extensão. Esta ação não pode ser desfeita. Continuar?')) {
      return;
    }
    
    if (!confirm('Tem certeza? Todos os dados serão perdidos permanentemente.')) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'clearAllData'
      });
      
      if (response.success) {
        // Reset to defaults
        this.settings = this.getDefaultSettings();
        this.userProfile = this.getDefaultProfile();
        this.initializeUI();
        this.markClean();
        
        this.showToast('Todos os dados foram apagados', 'success');
      } else {
        throw new Error('Failed to clear data');
      }
      
      this.showLoading(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showToast('Erro ao apagar dados', 'error');
      this.showLoading(false);
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    if (!confirm('Isso restaurará todas as configurações para os valores padrão. Continuar?')) {
      return;
    }
    
    this.settings = this.getDefaultSettings();
    this.populateAutomationTab();
    this.populateMatchingTab();
    this.populatePrivacyTab();
    this.populateAdvancedTab();
    this.markDirty();
    
    this.showToast('Configurações restauradas para os padrões', 'info');
  }

  /**
   * Show loading overlay
   */
  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.toggle('show', show);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Utility functions
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidLinkedInUrl(url) {
    return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.workInOptions = new WorkInOptions();
});

// Global functions for onclick handlers
window.workInOptions = null;
