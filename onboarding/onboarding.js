/**
 * WorkIn Onboarding System
 * Handles the 3-step onboarding wizard for automatic profile scanning and job discovery
 */

class OnboardingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.profileData = null;
    this.preferences = null;
    this.jobResults = null;
    
    this.init();
  }

  /**
   * Initialize the onboarding wizard
   */
  init() {
    this.bindEvents();
    this.updateProgress();
    this.loadSavedData();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Navigation buttons
    document.getElementById('step1Next').addEventListener('click', () => this.nextStep());
    document.getElementById('step2Back').addEventListener('click', () => this.previousStep());
    document.getElementById('step2Next').addEventListener('click', () => this.nextStep());
    document.getElementById('step3Back').addEventListener('click', () => this.previousStep());

    // Step 1: Profile URL input and scanning
    document.getElementById('profileUrl').addEventListener('input', (e) => this.validateProfileUrl(e.target.value));
    document.getElementById('profileUrl').addEventListener('paste', (e) => {
      setTimeout(() => this.validateProfileUrl(e.target.value), 100);
    });
    document.getElementById('startScanBtn').addEventListener('click', () => this.startProfileScan());
    document.getElementById('retryScanBtn').addEventListener('click', () => this.startProfileScan());
    document.getElementById('manualSetupBtn').addEventListener('click', () => this.showManualSetup());

    // Step 2: Preferences
    this.bindPreferenceEvents();

    // Step 3: Job discovery
    document.getElementById('startDiscoveryBtn').addEventListener('click', () => this.startJobDiscovery());

    // Final actions
    document.getElementById('startUsingBtn').addEventListener('click', () => this.completeOnboarding());
    document.getElementById('viewDashboardBtn').addEventListener('click', () => this.openDashboard());

    // Skip button
    document.getElementById('skipBtn').addEventListener('click', () => this.skipOnboarding());

    // Custom location radio
    document.getElementById('locationCustom').addEventListener('change', (e) => {
      document.getElementById('customLocation').disabled = !e.target.checked;
      if (e.target.checked) {
        document.getElementById('customLocation').focus();
      }
    });

    // Range sliders
    this.bindRangeSliders();
  }

  /**
   * Bind preference-related events
   */
  bindPreferenceEvents() {
    // Update current location text
    this.updateCurrentLocation();

    // Job type checkboxes
    const jobTypeCheckboxes = document.querySelectorAll('.job-type-checkbox');
    jobTypeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.validatePreferences());
    });

    // Location preferences
    const locationRadios = document.querySelectorAll('input[name="locationPref"]');
    locationRadios.forEach(radio => {
      radio.addEventListener('change', () => this.validatePreferences());
    });

    // Salary inputs
    document.getElementById('salaryMin').addEventListener('input', () => this.validateSalaryRange());
    document.getElementById('salaryMax').addEventListener('input', () => this.validateSalaryRange());
  }

  /**
   * Bind range slider events
   */
  bindRangeSliders() {
    const minScoreRange = document.getElementById('minScoreRange');
    const minScoreValue = document.getElementById('minScoreValue');
    const maxApplicationsRange = document.getElementById('maxApplicationsRange');
    const maxApplicationsValue = document.getElementById('maxApplicationsValue');

    minScoreRange.addEventListener('input', (e) => {
      minScoreValue.textContent = e.target.value + '%';
    });

    maxApplicationsRange.addEventListener('input', (e) => {
      maxApplicationsValue.textContent = e.target.value;
    });
  }

  /**
   * Update progress bar and step indicator
   */
  updateProgress() {
    const progress = (this.currentStep / this.totalSteps) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '%';
    document.getElementById('currentStep').textContent = this.currentStep;
  }

  /**
   * Show specific step
   */
  showStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= this.totalSteps; i++) {
      document.getElementById(`step${i}`).classList.add('hidden');
    }

    // Show current step
    document.getElementById(`step${stepNumber}`).classList.remove('hidden');
    
    this.currentStep = stepNumber;
    this.updateProgress();
  }

  /**
   * Go to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.showStep(this.currentStep + 1);
      }
    }
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Validate current step before proceeding
   */
  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.validateStep1();
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      default:
        return true;
    }
  }

  /**
   * Validate step 1 (profile scan)
   */
  validateStep1() {
    const profileUrl = document.getElementById('profileUrl').value.trim();
    if (!profileUrl) {
      this.showError('Por favor, insira a URL do seu perfil LinkedIn.');
      return false;
    }
    
    if (!this.isValidLinkedInUrl(profileUrl)) {
      this.showError('Por favor, insira uma URL válida do LinkedIn.');
      return false;
    }
    
    if (!this.profileData) {
      this.showError('Por favor, complete a análise do perfil antes de continuar.');
      return false;
    }
    return true;
  }

  /**
   * Validate LinkedIn profile URL in real-time
   */
  validateProfileUrl(url) {
    const urlInput = document.getElementById('profileUrl');
    const validIcon = document.getElementById('urlValidIcon');
    const invalidIcon = document.getElementById('urlInvalidIcon');
    const startBtn = document.getElementById('startScanBtn');
    
    if (!url.trim()) {
      // Empty URL - reset state
      validIcon.classList.add('hidden');
      invalidIcon.classList.add('hidden');
      startBtn.disabled = true;
      urlInput.classList.remove('border-green-500', 'border-red-500');
      return;
    }
    
    if (this.isValidLinkedInUrl(url)) {
      // Valid URL
      validIcon.classList.remove('hidden');
      invalidIcon.classList.add('hidden');
      startBtn.disabled = false;
      urlInput.classList.remove('border-red-500');
      urlInput.classList.add('border-green-500');
    } else {
      // Invalid URL
      validIcon.classList.add('hidden');
      invalidIcon.classList.remove('hidden');
      startBtn.disabled = true;
      urlInput.classList.remove('border-green-500');
      urlInput.classList.add('border-red-500');
    }
  }

  /**
   * Check if URL is a valid LinkedIn profile URL
   */
  isValidLinkedInUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Verificar se é um domínio LinkedIn válido
      const validDomains = ['linkedin.com', 'www.linkedin.com', 'br.linkedin.com'];
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.linkedin.com')
      );
      
      if (!isValidDomain) {
        return false;
      }
      
      // Verificar se é uma URL de perfil válida
      const validPaths = ['/in/', '/profile/view?id='];
      const hasValidPath = validPaths.some(path => urlObj.pathname.includes(path));
      
      if (!hasValidPath) {
        return false;
      }
      
      // Verificar se não é uma URL de empresa ou página
      const invalidPaths = ['/company/', '/school/', '/showcase/', '/groups/'];
      const hasInvalidPath = invalidPaths.some(path => urlObj.pathname.includes(path));
      
      if (hasInvalidPath) {
        return false;
      }
      
      // Verificar se tem um identificador de perfil
      const pathParts = urlObj.pathname.split('/');
      if (urlObj.pathname.includes('/in/')) {
        const profileId = pathParts[pathParts.indexOf('in') + 1];
        if (!profileId || profileId.length < 3) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('URL validation error:', error);
      return false;
    }
  }

  /**
   * Validate step 2 (preferences)
   */
  validateStep2() {
    // Check if at least one job type is selected
    const selectedJobTypes = document.querySelectorAll('.job-type-checkbox:checked');
    if (selectedJobTypes.length === 0) {
      this.showError('Selecione pelo menos um tipo de vaga.');
      return false;
    }

    // Validate custom location if selected
    const customLocationRadio = document.getElementById('locationCustom');
    const customLocationInput = document.getElementById('customLocation');
    if (customLocationRadio.checked && !customLocationInput.value.trim()) {
      this.showError('Digite uma localização personalizada ou selecione outra opção.');
      customLocationInput.focus();
      return false;
    }

    this.savePreferences();
    return true;
  }

  /**
   * Validate step 3 (job discovery)
   */
  validateStep3() {
    return true; // No validation needed for step 3
  }

  /**
   * Start profile scanning process
   */
  async startProfileScan() {
    const profileUrl = document.getElementById('profileUrl').value.trim();
    
    if (!profileUrl || !this.isValidLinkedInUrl(profileUrl)) {
      this.showError('Por favor, insira uma URL válida do LinkedIn.');
      return;
    }
    
    this.showScanState('progress');
    
    try {
      // Navigate to the provided LinkedIn profile URL
      const tab = await this.navigateToProfile(profileUrl);
      
      // Wait for page to load completely
      await this.waitForPageLoad(tab.id);
      
      // Inject profile parser and start scanning
      await this.injectProfileParser(tab.id);
      
      // Simulate scanning progress with detailed steps
      await this.simulateScanProgress();
      
      // Get profile data from the specific URL
      this.profileData = await this.extractProfileData(tab.id);
      
      if (!this.profileData || !this.profileData.name) {
        throw new Error('Não foi possível extrair dados do perfil. Verifique se a URL está correta e o perfil é público.');
      }

      // Store the original profile URL
      this.profileData.originalUrl = profileUrl;

      // Analyze profile
      const analyzer = new ProfileAnalyzer();
      const analysis = await analyzer.analyzeProfile(this.profileData);
      this.profileData.analysis = analysis;

      // Show results
      this.displayProfileSummary();
      this.showScanState('complete');
      
      // Enable next button
      document.getElementById('step1Next').disabled = false;
      
      // Save profile data
      await this.saveProfileData();
      
      // Auto-start job search after successful profile extraction
      setTimeout(() => {
        this.autoStartJobSearch();
      }, 2000);
      
    } catch (error) {
      console.error('Profile scan error:', error);
      this.showScanState('error', error.message);
    }
  }

  /**
   * Navigate to LinkedIn profile URL
   */
  async navigateToProfile(profileUrl) {
    try {
      // Verificar se as APIs do Chrome estão disponíveis
      if (!chrome || !chrome.tabs || !chrome.tabs.create) {
        throw new Error('API de navegação não disponível. Verifique se a extensão tem as permissões necessárias.');
      }

      // Validar URL novamente antes da navegação
      if (!this.isValidLinkedInUrl(profileUrl)) {
        throw new Error('URL do perfil inválida. Certifique-se de usar uma URL válida do LinkedIn.');
      }

      // Normalizar URL para garantir formato correto
      const normalizedUrl = this.normalizeLinkedInUrl(profileUrl);
      
      console.log('Navegando para perfil:', normalizedUrl);

      // Criar nova aba com a URL do perfil
      const tab = await chrome.tabs.create({
        url: normalizedUrl,
        active: true
      });
      
      if (!tab || !tab.id) {
        throw new Error('Falha ao criar nova aba. Tente novamente.');
      }
      
      // Verificar se a aba foi criada com sucesso
      await this.verifyTabCreation(tab.id, normalizedUrl);
      
      console.log('Aba criada com sucesso:', tab.id);
      return tab;
      
    } catch (error) {
      console.error('Navigation error:', error);
      throw new Error(`Não foi possível navegar para o perfil: ${error.message}`);
    }
  }

  /**
   * Normalize LinkedIn URL to ensure correct format
   */
  normalizeLinkedInUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Garantir que usa HTTPS
      urlObj.protocol = 'https:';
      
      // Garantir que usa www.linkedin.com
      if (urlObj.hostname !== 'www.linkedin.com') {
        urlObj.hostname = 'www.linkedin.com';
      }
      
      // Remover parâmetros desnecessários
      const allowedParams = ['locale'];
      const newSearchParams = new URLSearchParams();
      
      for (const [key, value] of urlObj.searchParams) {
        if (allowedParams.includes(key)) {
          newSearchParams.append(key, value);
        }
      }
      
      urlObj.search = newSearchParams.toString();
      
      // Remover fragmento
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      console.error('URL normalization error:', error);
      return url; // Retorna URL original se normalização falhar
    }
  }

  /**
   * Verify tab creation was successful
   */
  async verifyTabCreation(tabId, expectedUrl) {
    return new Promise((resolve, reject) => {
      const maxAttempts = 10;
      let attempts = 0;
      
      const checkTab = () => {
        attempts++;
        
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Erro ao verificar aba: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          if (!tab) {
            reject(new Error('Aba não encontrada após criação.'));
            return;
          }
          
          // Verificar se a URL está correta
          if (tab.url && (tab.url === expectedUrl || tab.url.includes('linkedin.com'))) {
            resolve(tab);
            return;
          }
          
          // Se ainda não carregou e não excedeu tentativas, tentar novamente
          if (attempts < maxAttempts) {
            setTimeout(checkTab, 500);
          } else {
            reject(new Error('Timeout: Aba não carregou a URL esperada.'));
          }
        });
      };
      
      checkTab();
    });
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(tabId, maxWaitTime = 10000) {
    return new Promise((resolve, reject) => {
      // Check if chrome.tabs API is available
      if (!chrome || !chrome.tabs || !chrome.tabs.get) {
        reject(new Error('API de verificação de carregamento não disponível.'));
        return;
      }

      const startTime = Date.now();
      
      const checkLoading = () => {
        try {
          chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Erro ao verificar o carregamento da página: ${chrome.runtime.lastError.message}`));
              return;
            }
            
            if (!tab) {
              reject(new Error('Aba não encontrada. Ela pode ter sido fechada.'));
              return;
            }
            
            if (tab.status === 'complete') {
              // Additional wait for LinkedIn's dynamic content
              setTimeout(resolve, 2000);
            } else if (Date.now() - startTime > maxWaitTime) {
              reject(new Error('Timeout: A página demorou muito para carregar.'));
            } else {
              setTimeout(checkLoading, 500);
            }
          });
        } catch (error) {
          reject(new Error(`Erro inesperado ao verificar carregamento: ${error.message}`));
        }
      };
      
      checkLoading();
    });
  }

  /**
   * Auto-start job search after profile extraction
   */
  async autoStartJobSearch() {
    try {
      // Update scan progress to show job search initiation
      document.getElementById('scanProgressText').textContent = 'Iniciando busca automática por vagas...';
      
      // Check if chrome.tabs API is available
      if (chrome && chrome.tabs && chrome.tabs.create) {
        // Navigate to LinkedIn jobs page
        const jobsUrl = 'https://www.linkedin.com/jobs/';
        await chrome.tabs.create({
          url: jobsUrl,
          active: false // Keep in background
        });
        
        // Show success message
        this.showNotification('Busca por vagas iniciada automaticamente!', 'success');
      } else {
        console.warn('Chrome tabs API not available for auto job search.');
        this.showNotification('Busca automática não disponível. Acesse o LinkedIn manualmente.', 'warning');
      }
      
    } catch (error) {
      console.warn('Não foi possível iniciar a busca automática:', error);
      this.showNotification('Erro na busca automática. Acesse o LinkedIn manualmente.', 'warning');
    }
  }

  /**
   * Show scan state
   */
  showScanState(state, errorMessage = '') {
    const states = ['idle', 'progress', 'complete', 'error'];
    states.forEach(s => {
      document.getElementById(`scan${s.charAt(0).toUpperCase() + s.slice(1)}`).classList.add('hidden');
    });
    
    document.getElementById(`scan${state.charAt(0).toUpperCase() + state.slice(1)}`).classList.remove('hidden');
    
    if (state === 'error' && errorMessage) {
      document.getElementById('scanErrorText').textContent = errorMessage;
    }
  }

  /**
   * Inject profile parser into LinkedIn tab
   */
  async injectProfileParser(tabId) {
    try {
      // Check if chrome.scripting API is available
      if (!chrome || !chrome.scripting || !chrome.scripting.executeScript) {
        throw new Error('API de injeção de scripts não disponível. Verifique as permissões da extensão.');
      }

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/linkedin-profile-parser.js']
      });
    } catch (error) {
      console.error('Script injection error:', error);
      throw new Error(`Falha ao injetar script de análise: ${error.message}`);
    }
  }

  /**
   * Simulate scanning progress with realistic steps
   */
  async simulateScanProgress() {
    const steps = [
      { text: 'Extraindo informações básicas...', progress: 20 },
      { text: 'Analisando experiência profissional...', progress: 40 },
      { text: 'Identificando habilidades...', progress: 60 },
      { text: 'Processando educação...', progress: 80 },
      { text: 'Finalizando análise...', progress: 100 }
    ];

    for (const step of steps) {
      document.getElementById('scanProgressText').textContent = step.text;
      document.getElementById('scanProgressBar').style.width = step.progress + '%';
      await this.delay(800);
    }
  }

  /**
   * Extract profile data from LinkedIn page
   */
  async extractProfileData(tabId) {
    try {
      // Check if chrome.scripting API is available
      if (!chrome || !chrome.scripting || !chrome.scripting.executeScript) {
        throw new Error('API de execução de scripts não disponível.');
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
          if (typeof LinkedInProfileParser !== 'undefined') {
            const parser = new LinkedInProfileParser();
            // Use the correct method name from the parser
            return await parser.extractProfileData();
          }
          return null;
        }
      });

      return results[0]?.result || null;
    } catch (error) {
      console.error('Profile extraction error:', error);
      throw new Error(`Falha ao extrair dados do perfil: ${error.message}`);
    }
  }

  /**
   * Display profile summary
   */
  displayProfileSummary() {
    if (!this.profileData) return;

    // Handle the correct data structure from LinkedInProfileParser
    const basicInfo = this.profileData.basicInfo || this.profileData;
    
    document.getElementById('profileName').textContent = basicInfo.name || '-';
    document.getElementById('profileHeadline').textContent = basicInfo.headline || '-';
    document.getElementById('profileLocation').textContent = basicInfo.location || '-';
    
    const experienceYears = this.calculateExperienceYears();
    document.getElementById('profileExperience').textContent = experienceYears ? `${experienceYears} anos` : '-';
    
    const seniority = this.profileData.analysis?.seniority || 'Não determinado';
    document.getElementById('profileSeniority').textContent = seniority;
    
    const industry = this.profileData.analysis?.industry || 'Não determinado';
    document.getElementById('profileIndustry').textContent = industry;

    document.getElementById('profileSummary').classList.remove('hidden');
  }

  /**
   * Calculate years of experience
   */
  calculateExperienceYears() {
    if (!this.profileData.experience || this.profileData.experience.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    const currentDate = new Date();

    this.profileData.experience.forEach(exp => {
      const startDate = this.parseDate(exp.startDate);
      const endDate = exp.endDate ? this.parseDate(exp.endDate) : currentDate;
      
      if (startDate && endDate) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    });

    return Math.floor(totalMonths / 12);
  }

  /**
   * Parse date string to Date object
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    // Handle various date formats
    const formats = [
      /(\w+)\s+(\d{4})/,  // "Janeiro 2020"
      /(\d{1,2})\/(\d{4})/, // "01/2020"
      /(\d{4})/            // "2020"
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (format === formats[2]) {
          return new Date(parseInt(match[1]), 0); // Year only
        } else if (format === formats[1]) {
          return new Date(parseInt(match[2]), this.getMonthNumber(match[1]) - 1);
        } else if (format === formats[0]) {
          return new Date(parseInt(match[2]), parseInt(match[1]) - 1);
        }
      }
    }

    return null;
  }

  /**
   * Get month number from name
   */
  getMonthNumber(monthName) {
    const months = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    return months[monthName.toLowerCase()] || 1;
  }

  /**
   * Update current location text
   */
  async updateCurrentLocation() {
    try {
      const basicInfo = this.profileData?.basicInfo || this.profileData;
      const location = basicInfo?.location || 'Não detectado';
      document.getElementById('currentLocationText').textContent = location;
    } catch (error) {
      document.getElementById('currentLocationText').textContent = 'Não detectado';
    }
  }

  /**
   * Validate preferences
   */
  validatePreferences() {
    const selectedJobTypes = document.querySelectorAll('.job-type-checkbox:checked');
    const hasJobTypes = selectedJobTypes.length > 0;
    
    // Enable/disable next button based on validation
    const nextBtn = document.getElementById('step2Next');
    nextBtn.disabled = !hasJobTypes;
  }

  /**
   * Validate salary range
   */
  validateSalaryRange() {
    const minSalary = parseInt(document.getElementById('salaryMin').value) || 0;
    const maxSalary = parseInt(document.getElementById('salaryMax').value) || 0;
    
    if (minSalary > 0 && maxSalary > 0 && minSalary >= maxSalary) {
      this.showError('O salário máximo deve ser maior que o mínimo.');
      return false;
    }
    
    return true;
  }

  /**
   * Save user preferences
   */
  savePreferences() {
    const jobTypes = Array.from(document.querySelectorAll('.job-type-checkbox:checked'))
      .map(cb => cb.id.replace('jobType_', ''));
    
    const locationPref = document.querySelector('input[name="locationPref"]:checked').value;
    const customLocation = document.getElementById('customLocation').value;
    
    const salaryMin = parseInt(document.getElementById('salaryMin').value) || null;
    const salaryMax = parseInt(document.getElementById('salaryMax').value) || null;
    
    const minScore = parseInt(document.getElementById('minScoreRange').value);
    const maxApplications = parseInt(document.getElementById('maxApplicationsRange').value);
    const autoApplyEnabled = document.getElementById('autoApplyEnabled').checked;

    this.preferences = {
      jobTypes,
      location: {
        preference: locationPref,
        custom: customLocation
      },
      salary: {
        min: salaryMin,
        max: salaryMax
      },
      application: {
        minScore,
        maxApplications,
        autoApplyEnabled
      }
    };

    // Save to storage
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ 
          onboardingPreferences: this.preferences 
        });
      } else {
        console.warn('Chrome storage not available. Preferences not saved.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  /**
   * Start job discovery process
   */
  async startJobDiscovery() {
    this.showDiscoveryState('progress');
    
    try {
      // Simulate job discovery progress
      await this.simulateDiscoveryProgress();
      
      // Search for compatible jobs
      this.jobResults = await this.searchCompatibleJobs();
      
      // Display results
      this.displayJobResults();
      this.showDiscoveryState('complete');
      
      // Show setup complete
      document.getElementById('setupComplete').classList.remove('hidden');
      
      // Save job results
      await this.saveJobResults();
      
    } catch (error) {
      console.error('Job discovery error:', error);
      this.showError('Erro ao buscar vagas: ' + error.message);
    }
  }

  /**
   * Show discovery state
   */
  showDiscoveryState(state) {
    const states = ['idle', 'progress', 'complete'];
    states.forEach(s => {
      document.getElementById(`discovery${s.charAt(0).toUpperCase() + s.slice(1)}`).classList.add('hidden');
    });
    
    document.getElementById(`discovery${state.charAt(0).toUpperCase() + state.slice(1)}`).classList.remove('hidden');
  }

  /**
   * Simulate discovery progress
   */
  async simulateDiscoveryProgress() {
    const steps = [
      { text: 'Analisando oportunidades disponíveis...', progress: 25 },
      { text: 'Calculando compatibilidade...', progress: 50 },
      { text: 'Filtrando vagas relevantes...', progress: 75 },
      { text: 'Preparando resultados...', progress: 100 }
    ];

    for (const step of steps) {
      document.getElementById('discoveryProgressText').textContent = step.text;
      document.getElementById('discoveryProgressBar').style.width = step.progress + '%';
      await this.delay(1000);
    }
  }

  /**
   * Search for compatible jobs (mock implementation)
   */
  async searchCompatibleJobs() {
    // This would integrate with the actual job search system
    // For now, we'll return mock data
    
    const mockJobs = [
      {
        id: 'job1',
        title: 'Desenvolvedor Frontend React',
        company: 'TechCorp',
        location: 'São Paulo, SP',
        score: 92,
        easyApply: true,
        url: 'https://linkedin.com/jobs/view/123456'
      },
      {
        id: 'job2',
        title: 'Engenheiro de Software',
        company: 'StartupXYZ',
        location: 'Remoto',
        score: 88,
        easyApply: true,
        url: 'https://linkedin.com/jobs/view/123457'
      },
      {
        id: 'job3',
        title: 'Full Stack Developer',
        company: 'InnovaCorp',
        location: 'Rio de Janeiro, RJ',
        score: 85,
        easyApply: false,
        url: 'https://linkedin.com/jobs/view/123458'
      }
    ];

    // Filter based on preferences
    const filteredJobs = mockJobs.filter(job => {
      return job.score >= this.preferences.application.minScore;
    });

    return {
      total: filteredJobs.length,
      highMatch: filteredJobs.filter(job => job.score >= 85).length,
      readyToApply: filteredJobs.filter(job => job.easyApply).length,
      jobs: filteredJobs
    };
  }

  /**
   * Display job discovery results
   */
  displayJobResults() {
    if (!this.jobResults) return;

    document.getElementById('totalJobsFound').textContent = this.jobResults.total;
    document.getElementById('highMatchJobs').textContent = this.jobResults.highMatch;
    document.getElementById('readyToApply').textContent = this.jobResults.readyToApply;

    // Display top job matches
    const topJobsList = document.getElementById('topJobsList');
    topJobsList.innerHTML = '';

    this.jobResults.jobs.slice(0, 3).forEach(job => {
      const jobCard = this.createJobCard(job);
      topJobsList.appendChild(jobCard);
    });
  }

  /**
   * Create job card element
   */
  createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    
    const scoreClass = job.score >= 85 ? 'score-high' : job.score >= 70 ? 'score-medium' : 'score-low';
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
          <h5 class="font-medium text-gray-900">${job.title}</h5>
          <p class="text-sm text-gray-600">${job.company} • ${job.location}</p>
        </div>
        <span class="compatibility-score ${scoreClass}">${job.score}%</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500">
          ${job.easyApply ? '✓ Easy Apply' : '○ Candidatura externa'}
        </span>
        <button class="text-sm text-blue-600 hover:text-blue-700" onclick="window.open('${job.url}', '_blank')">
          Ver Vaga →
        </button>
      </div>
    `;
    
    return card;
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding() {
    try {
      // Check if chrome.storage is available
      if (chrome && chrome.storage && chrome.storage.local) {
        // Mark onboarding as complete
        await chrome.storage.local.set({ 
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString()
        });
      } else {
        console.warn('Chrome storage not available. Onboarding completion not saved.');
      }

      // Close onboarding and open extension popup
      window.close();
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      this.showError('Erro ao finalizar configuração.');
    }
  }

  /**
   * Open dashboard
   */
  openDashboard() {
    try {
      if (chrome && chrome.tabs && chrome.tabs.create && chrome.runtime && chrome.runtime.getURL) {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
        window.close();
      } else {
        console.warn('Chrome APIs not available for opening dashboard.');
        // Fallback: just close the window
        window.close();
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      window.close();
    }
  }

  /**
   * Skip onboarding
   */
  async skipOnboarding() {
    if (confirm('Tem certeza que deseja pular a configuração? Você pode configurar depois nas opções da extensão.')) {
      await chrome.storage.local.set({ 
        onboardingSkipped: true,
        onboardingSkippedAt: new Date().toISOString()
      });
      window.close();
    }
  }

  /**
   * Show manual setup (fallback)
   */
  showManualSetup() {
    // For now, just proceed to next step
    this.profileData = {
      name: 'Usuário',
      headline: 'Profissional',
      location: 'Brasil',
      experience: [],
      skills: [],
      education: [],
      analysis: {
        seniority: 'Não determinado',
        industry: 'Não determinado'
      }
    };
    
    this.displayProfileSummary();
    this.showScanState('complete');
    document.getElementById('step1Next').disabled = false;
  }

  /**
   * Save profile data to storage
   */
  async saveProfileData() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('Chrome storage API not available. Cannot save profile data.');
        return;
      }

      await chrome.storage.local.set({ 
        onboardingProfile: this.profileData 
      });
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  }

  /**
   * Save job results to storage
   */
  async saveJobResults() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('Chrome storage API not available. Cannot save job results.');
        return;
      }

      await chrome.storage.local.set({ 
        onboardingJobResults: this.jobResults 
      });
    } catch (error) {
      console.error('Error saving job results:', error);
    }
  }

  /**
   * Load saved data from previous session
   */
  async loadSavedData() {
    try {
      // Check if chrome.storage is available
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('Chrome storage API not available. Using fallback.');
        return;
      }

      const data = await chrome.storage.local.get([
        'onboardingProfile',
        'onboardingPreferences',
        'onboardingJobResults'
      ]);

      if (data.onboardingProfile) {
        this.profileData = data.onboardingProfile;
        this.displayProfileSummary();
        this.showScanState('complete');
        document.getElementById('step1Next').disabled = false;
      }

      if (data.onboardingPreferences) {
        this.preferences = data.onboardingPreferences;
        this.loadPreferencesUI();
      }

      if (data.onboardingJobResults) {
        this.jobResults = data.onboardingJobResults;
      }

    } catch (error) {
      console.error('Error loading saved data:', error);
      // Fallback: continue without saved data
      console.warn('Continuing without saved data due to storage error.');
    }
  }

  /**
   * Load preferences into UI
   */
  loadPreferencesUI() {
    if (!this.preferences) return;

    // Job types
    this.preferences.jobTypes?.forEach(type => {
      const checkbox = document.getElementById(`jobType_${type}`);
      if (checkbox) checkbox.checked = true;
    });

    // Location preference
    if (this.preferences.location?.preference) {
      const radio = document.getElementById(`location${this.preferences.location.preference.charAt(0).toUpperCase() + this.preferences.location.preference.slice(1)}`);
      if (radio) radio.checked = true;
      
      if (this.preferences.location.preference === 'custom' && this.preferences.location.custom) {
        document.getElementById('customLocation').value = this.preferences.location.custom;
        document.getElementById('customLocation').disabled = false;
      }
    }

    // Salary
    if (this.preferences.salary?.min) {
      document.getElementById('salaryMin').value = this.preferences.salary.min;
    }
    if (this.preferences.salary?.max) {
      document.getElementById('salaryMax').value = this.preferences.salary.max;
    }

    // Application settings
    if (this.preferences.application) {
      document.getElementById('minScoreRange').value = this.preferences.application.minScore || 70;
      document.getElementById('minScoreValue').textContent = (this.preferences.application.minScore || 70) + '%';
      
      document.getElementById('maxApplicationsRange').value = this.preferences.application.maxApplications || 20;
      document.getElementById('maxApplicationsValue').textContent = this.preferences.application.maxApplications || 20;
      
      document.getElementById('autoApplyEnabled').checked = this.preferences.application.autoApplyEnabled !== false;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Create or update error message element
    let errorEl = document.getElementById('onboardingError');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'onboardingError';
      errorEl.className = 'error-message mb-4';
      
      // Insert at the top of current step
      const currentStepEl = document.getElementById(`step${this.currentStep}`);
      currentStepEl.insertBefore(errorEl, currentStepEl.firstChild);
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm`;
    
    // Set styles based on type
    const styles = {
      success: 'bg-green-100 border border-green-400 text-green-700',
      error: 'bg-red-100 border border-red-400 text-red-700',
      warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
      info: 'bg-blue-100 border border-blue-400 text-blue-700'
    };
    
    notification.className += ` ${styles[type] || styles.info}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize onboarding when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OnboardingWizard();
});