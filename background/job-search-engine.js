/**
 * WorkIn Job Search Engine
 * Handles automatic job discovery and compatibility scoring
 */

class JobSearchEngine {
  constructor() {
    this.isSearching = false;
    this.searchQueue = [];
    this.lastSearchTime = null;
    this.searchInterval = 30 * 60 * 1000; // 30 minutes
    
    this.init();
  }

  /**
   * Initialize the job search engine
   */
  init() {
    this.setupPeriodicSearch();
    this.bindEvents();
  }

  /**
   * Setup periodic job search
   */
  setupPeriodicSearch() {
    // Create alarm for periodic searches
    chrome.alarms.create('jobSearch', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });

    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'jobSearch') {
        this.performAutomaticSearch();
      }
    });
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SEARCH_JOBS') {
        this.searchJobs(message.criteria).then(sendResponse);
        return true; // Keep message channel open for async response
      }
      
      if (message.type === 'GET_SEARCH_STATUS') {
        sendResponse({
          isSearching: this.isSearching,
          lastSearchTime: this.lastSearchTime,
          queueLength: this.searchQueue.length
        });
      }
    });
  }

  /**
   * Perform automatic search based on user profile and preferences
   */
  async performAutomaticSearch() {
    try {
      console.log('Starting automatic job search...');
      
      // Get user profile and preferences
      const data = await chrome.storage.local.get([
        'onboardingProfile',
        'onboardingPreferences',
        'userSettings'
      ]);

      if (!data.onboardingProfile || !data.onboardingPreferences) {
        console.log('No profile or preferences found, skipping automatic search');
        return;
      }

      // Build search criteria
      const criteria = this.buildSearchCriteria(data.onboardingProfile, data.onboardingPreferences);
      
      // Perform search
      const results = await this.searchJobs(criteria);
      
      // Process and save results
      await this.processSearchResults(results, criteria);
      
      console.log(`Automatic search completed. Found ${results.jobs.length} jobs.`);
      
    } catch (error) {
      console.error('Error in automatic job search:', error);
    }
  }

  /**
   * Build search criteria from profile and preferences
   */
  buildSearchCriteria(profile, preferences) {
    const criteria = {
      keywords: this.extractKeywords(profile),
      location: this.getLocationCriteria(preferences.location, profile.location),
      jobTypes: preferences.jobTypes || ['fulltime'],
      experienceLevel: this.getExperienceLevel(profile),
      salary: preferences.salary,
      remote: preferences.jobTypes?.includes('remote') || false,
      minScore: preferences.application?.minScore || 70,
      maxResults: 50
    };

    return criteria;
  }

  /**
   * Extract relevant keywords from profile
   */
  extractKeywords(profile) {
    const keywords = new Set();

    // Add skills
    if (profile.skills) {
      profile.skills.forEach(skill => {
        keywords.add(skill.toLowerCase());
      });
    }

    // Add job titles from experience
    if (profile.experience) {
      profile.experience.forEach(exp => {
        if (exp.title) {
          // Extract key terms from job titles
          const titleWords = exp.title.toLowerCase()
            .split(/[\s\-\/]+/)
            .filter(word => word.length > 2);
          titleWords.forEach(word => keywords.add(word));
        }
      });
    }

    // Add industry-specific terms
    if (profile.analysis?.industry) {
      const industryKeywords = this.getIndustryKeywords(profile.analysis.industry);
      industryKeywords.forEach(keyword => keywords.add(keyword));
    }

    return Array.from(keywords).slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Get industry-specific keywords
   */
  getIndustryKeywords(industry) {
    const industryMap = {
      'Tecnologia': ['javascript', 'react', 'node', 'python', 'java', 'aws', 'docker', 'api'],
      'Marketing': ['digital', 'seo', 'social media', 'analytics', 'campaigns', 'content'],
      'Vendas': ['sales', 'crm', 'leads', 'pipeline', 'b2b', 'b2c', 'revenue'],
      'Design': ['ui', 'ux', 'figma', 'photoshop', 'branding', 'visual', 'prototype'],
      'Finanças': ['excel', 'financial', 'analysis', 'budget', 'accounting', 'reporting']
    };

    return industryMap[industry] || [];
  }

  /**
   * Get location criteria
   */
  getLocationCriteria(locationPref, profileLocation) {
    switch (locationPref.preference) {
      case 'current':
        return profileLocation || 'Brasil';
      case 'remote':
        return 'Remoto';
      case 'flexible':
        return null; // No location filter
      case 'custom':
        return locationPref.custom || profileLocation || 'Brasil';
      default:
        return profileLocation || 'Brasil';
    }
  }

  /**
   * Get experience level from profile
   */
  getExperienceLevel(profile) {
    const seniority = profile.analysis?.seniority?.toLowerCase();
    
    if (seniority?.includes('junior') || seniority?.includes('estagiário')) {
      return 'entry';
    } else if (seniority?.includes('pleno') || seniority?.includes('mid')) {
      return 'mid';
    } else if (seniority?.includes('senior') || seniority?.includes('lead')) {
      return 'senior';
    }
    
    return 'mid'; // Default
  }

  /**
   * Search for jobs based on criteria
   */
  async searchJobs(criteria) {
    this.isSearching = true;
    
    try {
      /**
       * WorkIn Job Search Engine
       * Handles automatic job discovery and compatibility scoring
       */
      class JobSearchEngine {
        constructor() {
          this.isSearching = false;
          this.searchResults = [];
          this.lastSearchTime = null;
          this.searchCriteria = null;
          this.retryCount = 0;
          this.maxRetries = 3;
          
          // Chrome API availability checks
          this.chromeAPIs = {
            storage: typeof chrome !== 'undefined' && chrome.storage,
            tabs: typeof chrome !== 'undefined' && chrome.tabs,
            scripting: typeof chrome !== 'undefined' && chrome.scripting,
            alarms: typeof chrome !== 'undefined' && chrome.alarms,
            runtime: typeof chrome !== 'undefined' && chrome.runtime
          };
          
          this.init();
        }
      
        /**
         * Initialize the job search engine
         */
        async init() {
          try {
            console.log('Initializing JobSearchEngine...');
            
            // Verificar APIs essenciais
            if (!this.checkEssentialAPIs()) {
              console.error('Essential Chrome APIs not available');
              return;
            }
            
            this.bindEvents();
            await this.setupPeriodicSearch();
            
            console.log('JobSearchEngine initialized successfully');
          } catch (error) {
            console.error('Error initializing JobSearchEngine:', error);
          }
        }
      
        /**
         * Check if essential Chrome APIs are available
         */
        checkEssentialAPIs() {
          const essential = ['storage', 'tabs', 'scripting'];
          const missing = essential.filter(api => !this.chromeAPIs[api]);
          
          if (missing.length > 0) {
            console.error('Missing essential Chrome APIs:', missing);
            return false;
          }
          
          return true;
        }
      
        /**
         * Safe Chrome API wrapper
         */
        async safeChrome(apiCall, fallback = null) {
          try {
            return await apiCall();
          } catch (error) {
            console.error('Chrome API error:', error);
            if (fallback) {
              return await fallback();
            }
            throw error;
          }
        }
      
        /**
         * Bind event listeners
         */
        bindEvents() {
          if (!this.chromeAPIs.runtime) {
            console.warn('Chrome runtime API not available');
            return;
          }
      
          try {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              this.handleMessage(message, sender, sendResponse);
              return true; // Keep message channel open for async response
            });
          } catch (error) {
            console.error('Error binding events:', error);
          }
        }
      
        /**
         * Handle incoming messages
         */
        async handleMessage(message, sender, sendResponse) {
          try {
            switch (message.action) {
              case 'searchJobs':
                const results = await this.searchJobs(message.criteria);
                sendResponse({ success: true, data: results });
                break;
                
              case 'getSearchStatus':
                sendResponse({ 
                  success: true, 
                  data: { 
                    isSearching: this.isSearching,
                    lastSearchTime: this.lastSearchTime,
                    resultsCount: this.searchResults.length
                  }
                });
                break;
                
              case 'stopSearch':
                this.isSearching = false;
                sendResponse({ success: true });
                break;
                
              default:
                sendResponse({ success: false, error: 'Unknown action' });
            }
          } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
          }
        }
      
        /**
         * Setup periodic job search
         */
        async setupPeriodicSearch() {
          if (!this.chromeAPIs.alarms) {
            console.warn('Chrome alarms API not available - periodic search disabled');
            return;
          }
      
          try {
            // Clear existing alarms
            await this.safeChrome(() => chrome.alarms.clear('jobSearch'));
            
            // Create new alarm for periodic search (every 2 hours)
            await this.safeChrome(() => 
              chrome.alarms.create('jobSearch', { 
                delayInMinutes: 120, 
                periodInMinutes: 120 
              })
            );
            
            // Listen for alarm
            chrome.alarms.onAlarm.addListener((alarm) => {
              if (alarm.name === 'jobSearch') {
                this.performAutomaticSearch();
              }
            });
            
            console.log('Periodic job search configured');
          } catch (error) {
            console.error('Error setting up periodic search:', error);
          }
        }
      
        /**
         * Perform automatic job search
         */
        async performAutomaticSearch() {
          if (this.isSearching) {
            console.log('Search already in progress, skipping automatic search');
            return;
          }
      
          try {
            console.log('Starting automatic job search...');
            
            if (!this.chromeAPIs.storage) {
              throw new Error('Chrome storage API not available');
            }
            
            // Get user profile and preferences
            const userData = await this.safeChrome(() => 
              chrome.storage.local.get(['userProfile', 'jobPreferences'])
            );
            
            if (!userData.userProfile || !userData.jobPreferences) {
              console.log('User profile or preferences not found, skipping automatic search');
              return;
            }
            
            // Build search criteria
            const criteria = this.buildSearchCriteria(userData.userProfile, userData.jobPreferences);
            
            // Perform search
            const results = await this.searchJobs(criteria);
            
            // Save results
            await this.processSearchResults(results);
            
            console.log(`Automatic search completed. Found ${results.length} jobs`);
            
          } catch (error) {
            console.error('Error in automatic search:', error);
            this.retryCount++;
            
            if (this.retryCount < this.maxRetries) {
              console.log(`Retrying automatic search (${this.retryCount}/${this.maxRetries})`);
              setTimeout(() => this.performAutomaticSearch(), 30000); // Retry in 30 seconds
            } else {
              console.error('Max retries reached for automatic search');
              this.retryCount = 0;
            }
          }
        }
      }
      
      /**
       * Build search criteria from user data
       */
      buildSearchCriteria(profile, preferences) {
        return {
          keywords: [
            ...(profile.skills || []),
            ...(preferences.technologies || []),
            profile.currentRole || 'desenvolvedor'
          ].filter(Boolean),
          location: preferences.location || profile.location || 'Brasil',
          allowRemote: preferences.allowRemote || false,
          experienceLevel: preferences.experienceLevel || 'mid',
          preferredCompanies: preferences.companies || [],
          minScore: preferences.minScore || 60
        };
      }

      /**
       * Search jobs on LinkedIn
       */
      async searchJobs(criteria) {
        try {
          // Get active LinkedIn tabs
          let linkedinTabs = await this.getLinkedInTabs();
          
          if (linkedinTabs.length === 0) {
            // Criar nova aba do LinkedIn se não houver nenhuma
            const newTab = await chrome.tabs.create({
              url: 'https://www.linkedin.com/jobs/',
              active: false
            });
            
            if (!newTab || !newTab.id) {
              throw new Error('Não foi possível criar aba do LinkedIn');
            }
            
            // Aguardar carregamento da nova aba
            await this.waitForPageLoad(newTab.id);
            linkedinTabs = [newTab];
          }

          // Use the first LinkedIn tab for searching
          const tabId = linkedinTabs[0].id;
          
          // Navigate to LinkedIn jobs search
          const searchUrl = this.buildLinkedInSearchUrl(criteria);
          console.log('Navegando para URL de busca:', searchUrl);
          
          await chrome.tabs.update(tabId, { url: searchUrl });
          
          // Wait for page to load
          await this.waitForPageLoad(tabId);
          
          // Extract job listings
          const jobs = await this.extractJobListings(tabId, criteria);
          
          if (!jobs || jobs.length === 0) {
            console.warn('Nenhuma vaga encontrada na página');
          }
          
          // Calculate compatibility scores
          const scoredJobs = await this.scoreJobs(jobs, criteria);
          
          // Filter by minimum score
          const filteredJobs = scoredJobs.filter(job => job.score >= (criteria.minScore || 60));
          
          this.lastSearchTime = new Date().toISOString();
          
          return {
            total: filteredJobs.length,
            jobs: filteredJobs.slice(0, criteria.maxResults || 50),
            criteria,
            searchTime: this.lastSearchTime
          };
          
        } catch (error) {
          console.error('Job search error:', error);
          throw error;
        } finally {
          this.isSearching = false;
        }
      }

  /**
   * Get active LinkedIn tabs
   */
  async getLinkedInTabs() {
    const tabs = await chrome.tabs.query({
      url: 'https://*.linkedin.com/*'
    });
    
    return tabs.filter(tab => !tab.url.includes('/messaging/'));
  }

  /**
   * Build LinkedIn search URL
   */
  buildLinkedInSearchUrl(criteria) {
    const baseUrl = 'https://www.linkedin.com/jobs/search/';
    const params = new URLSearchParams();

    // Keywords
    if (criteria.keywords && criteria.keywords.length > 0) {
      params.append('keywords', criteria.keywords.slice(0, 5).join(' OR '));
    }

    // Location
    if (criteria.location && criteria.location !== 'Remoto') {
      params.append('location', criteria.location);
    }

    // Experience level
    if (criteria.experienceLevel) {
      const experienceLevels = {
        'entry': '1',
        'mid': '2',
        'senior': '3'
      };
      params.append('f_E', experienceLevels[criteria.experienceLevel]);
    }

    // Job type
    if (criteria.jobTypes && criteria.jobTypes.length > 0) {
      const jobTypeMap = {
        'fulltime': 'F',
        'parttime': 'P',
        'contract': 'C',
        'freelance': 'T',
        'internship': 'I'
      };
      
      const linkedinJobTypes = criteria.jobTypes
        .map(type => jobTypeMap[type])
        .filter(Boolean);
      
      if (linkedinJobTypes.length > 0) {
        params.append('f_JT', linkedinJobTypes.join(','));
      }
    }

    // Remote work
    if (criteria.remote) {
      params.append('f_WT', '2'); // Remote work filter
    }

    // Easy Apply filter
    params.append('f_AL', 'true');

    // Sort by date
    params.append('sortBy', 'DD');

    return baseUrl + '?' + params.toString();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(tabId, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkLoaded = () => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => document.readyState === 'complete' && 
                      document.querySelector('.jobs-search-results-list')
        }, (results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (results && results[0]?.result) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for page load'));
          } else {
            setTimeout(checkLoaded, 1000);
          }
        });
      };
      
      setTimeout(checkLoaded, 2000); // Initial delay
    });
  }

  /**
   * Extract job listings from LinkedIn page
   */
  async extractJobListings(tabId, criteria) {
    try {
      // Verificar se a API de scripting está disponível
      if (!chrome || !chrome.scripting || !chrome.scripting.executeScript) {
        throw new Error('API de scripting não disponível');
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const jobs = [];
          
          // Múltiplos seletores para diferentes layouts do LinkedIn
          const selectors = [
            '.jobs-search-results__list-item',
            '.job-card-container',
            '.jobs-search-results-list__item',
            '.job-card-list',
            '[data-job-id]'
          ];
          
          let jobCards = [];
          
          // Tentar diferentes seletores
          for (const selector of selectors) {
            jobCards = document.querySelectorAll(selector);
            if (jobCards.length > 0) {
              console.log(`Encontradas ${jobCards.length} vagas usando seletor: ${selector}`);
              break;
            }
          }
          
          if (jobCards.length === 0) {
            console.warn('Nenhuma vaga encontrada com os seletores disponíveis');
            return [];
          }
          
          jobCards.forEach((card, index) => {
            try {
              // Múltiplos seletores para título
              const titleSelectors = [
                '.job-card-list__title',
                '.job-card-container__link',
                '.job-card__title',
                '.jobs-unified-top-card__job-title',
                'h3 a',
                '[data-control-name="job_card_click"]'
              ];
              
              // Múltiplos seletores para empresa
              const companySelectors = [
                '.job-card-container__company-name',
                '.job-card-container__primary-description',
                '.job-card__company-name',
                '.jobs-unified-top-card__company-name',
                '.job-card-list__company-name'
              ];
              
              // Múltiplos seletores para localização
              const locationSelectors = [
                '.job-card-container__metadata-item',
                '.job-card-container__metadata',
                '.job-card__location',
                '.jobs-unified-top-card__bullet'
              ];
              
              // Múltiplos seletores para link
              const linkSelectors = [
                'a[data-control-name="job_card_click"]',
                '.job-card-container__link',
                '.job-card-list__title-link',
                'h3 a',
                'a[href*="/jobs/view/"]'
              ];
              
              // Múltiplos seletores para Easy Apply
              const easyApplySelectors = [
                '.job-card-container__apply-method',
                '.jobs-apply-button',
                '[data-control-name="jobcard_save_job"]',
                '.job-card-container__footer-item'
              ];
              
              // Extrair dados usando os seletores
              const titleElement = this.findElementBySelectors(card, titleSelectors);
              const companyElement = this.findElementBySelectors(card, companySelectors);
              const locationElement = this.findElementBySelectors(card, locationSelectors);
              const linkElement = this.findElementBySelectors(card, linkSelectors);
              const easyApplyElement = this.findElementBySelectors(card, easyApplySelectors);
              
              if (titleElement && companyElement && linkElement) {
                // Extrair ID da vaga da URL
                const jobId = this.extractJobIdFromUrl(linkElement.href) || `linkedin_${Date.now()}_${index}`;
                
                const job = {
                  id: jobId,
                  title: titleElement.textContent.trim(),
                  company: companyElement.textContent.trim(),
                  location: locationElement ? locationElement.textContent.trim() : 'Não especificado',
                  url: linkElement.href,
                  easyApply: easyApplyElement ? 
                    (easyApplyElement.textContent.includes('Easy Apply') || 
                     easyApplyElement.textContent.includes('Candidatura rápida')) : false,
                  source: 'linkedin',
                  extractedAt: new Date().toISOString(),
                  rawHtml: card.outerHTML.substring(0, 500) // Para debug
                };
                
                // Validar dados básicos
                if (job.title.length > 3 && job.company.length > 1) {
                  jobs.push(job);
                }
              }
            } catch (error) {
              console.error('Erro ao extrair dados do card de vaga:', error);
            }
          });
          
          console.log(`Extraídas ${jobs.length} vagas válidas`);
          return jobs;
        }
      });

      // Adicionar função auxiliar para buscar elementos
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Função auxiliar para encontrar elemento usando múltiplos seletores
          window.findElementBySelectors = function(container, selectors) {
            for (const selector of selectors) {
              const element = container.querySelector(selector);
              if (element) return element;
            }
            return null;
          };
          
          // Função auxiliar para extrair ID da vaga
          window.extractJobIdFromUrl = function(url) {
            if (!url) return null;
            const match = url.match(/\/jobs\/view\/(\d+)/);
            return match ? match[1] : null;
          };
        }
      });

      const extractedJobs = results[0]?.result || [];
      console.log(`Extração concluída: ${extractedJobs.length} vagas encontradas`);
      
      return extractedJobs;
      
    } catch (error) {
      console.error('Erro na extração de vagas:', error);
      throw new Error(`Falha ao extrair vagas: ${error.message}`);
    }
  }

  /**
   * Score jobs based on compatibility
   */
  async scoreJobs(jobs, criteria) {
    const scoredJobs = [];

    for (const job of jobs) {
      try {
        const score = await this.calculateJobScore(job, criteria);
        const scoreDetails = this.getScoreDetails(job, criteria);
        
        scoredJobs.push({
          ...job,
          score: Math.round(Math.max(0, Math.min(100, score))),
          scoreDetails,
          matchFactors: this.getMatchFactors(job, criteria)
        });
      } catch (error) {
        console.error('Error scoring job:', error);
        // Add job with default score
        scoredJobs.push({
          ...job,
          score: 50,
          scoreDetails: { error: 'Erro no cálculo do score' },
          matchFactors: {}
        });
      }
    }

    // Sort by score (highest first)
    return scoredJobs.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate job compatibility score
   */
  async calculateJobScore(job, criteria) {
    try {
      let totalScore = 0;
      const weights = {
        title: 0.30,      // 30% - Compatibilidade do título
        keywords: 0.25,   // 25% - Palavras-chave
        location: 0.15,   // 15% - Localização
        company: 0.10,    // 10% - Empresa
        easyApply: 0.10,  // 10% - Easy Apply
        experience: 0.10  // 10% - Nível de experiência
      };

      // Score do título
      const titleScore = this.calculateTitleScore(job.title, criteria.keywords || []);
      totalScore += titleScore * weights.title;

      // Score de palavras-chave
      const keywordScore = this.calculateKeywordScore(job, criteria.keywords || []);
      totalScore += keywordScore * weights.keywords;

      // Score de localização
      const locationScore = this.calculateLocationScore(
        job.location, 
        criteria.location, 
        criteria.allowRemote || false
      );
      totalScore += locationScore * weights.location;

      // Score da empresa
      const companyScore = this.calculateCompanyScore(job.company, criteria.preferredCompanies || []);
      totalScore += companyScore * weights.company;

      // Bonus para Easy Apply
      const easyApplyScore = job.easyApply ? 100 : 0;
      totalScore += easyApplyScore * weights.easyApply;

      // Score de experiência (baseado no título)
      const experienceScore = this.calculateExperienceScore(job.title, criteria.experienceLevel);
      totalScore += experienceScore * weights.experience;

      // Aplicar bônus e penalidades
      totalScore = this.applyBonusesAndPenalties(totalScore, job, criteria);

      return Math.max(0, Math.min(100, totalScore));
      
    } catch (error) {
      console.error('Error calculating job score:', error);
      return 50; // Score padrão em caso de erro
    }
  }

  /**
   * Calculate title compatibility score
   */
  calculateTitleScore(title, keywords) {
    if (!title || !keywords || keywords.length === 0) {
      return 50; // Score neutro se não há dados
    }

    const titleLower = title.toLowerCase();
    let matches = 0;
    let totalWeight = 0;

    // Palavras-chave com diferentes pesos
    const keywordWeights = {
      // Tecnologias principais
      'react': 10, 'angular': 10, 'vue': 10, 'javascript': 8, 'typescript': 8,
      'python': 8, 'java': 8, 'node': 8, 'php': 6, 'c#': 6,
      
      // Níveis de senioridade
      'senior': 8, 'pleno': 6, 'junior': 4, 'lead': 10, 'principal': 10,
      
      // Tipos de posição
      'desenvolvedor': 8, 'developer': 8, 'engenheiro': 8, 'engineer': 8,
      'programador': 6, 'analista': 6, 'arquiteto': 10, 'tech lead': 10
    };

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const weight = keywordWeights[keywordLower] || 5;
      
      if (titleLower.includes(keywordLower)) {
        matches += weight;
      }
      totalWeight += weight;
    });

    // Calcular score baseado nas correspondências
    const score = totalWeight > 0 ? (matches / totalWeight) * 100 : 50;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate keyword compatibility score
   */
  calculateKeywordScore(job, keywords) {
    if (!keywords || keywords.length === 0) {
      return 50;
    }

    const jobText = `${job.title} ${job.company}`.toLowerCase();
    let matches = 0;

    keywords.forEach(keyword => {
      if (jobText.includes(keyword.toLowerCase())) {
        matches++;
      }
    });

    return (matches / keywords.length) * 100;
  }

  /**
   * Calculate location compatibility score
   */
  calculateLocationScore(jobLocation, preferredLocation, allowRemote) {
    if (!jobLocation) {
      return 50; // Score neutro se localização não especificada
    }

    const jobLocationLower = jobLocation.toLowerCase();
    
    // Verificar se é remoto
    const remoteKeywords = ['remoto', 'remote', 'home office', 'trabalho remoto'];
    const isRemote = remoteKeywords.some(keyword => jobLocationLower.includes(keyword));
    
    if (isRemote && allowRemote) {
      return 100; // Score máximo para trabalho remoto quando permitido
    }
    
    if (isRemote && !allowRemote) {
      return 30; // Score baixo se remoto não é desejado
    }

    // Verificar compatibilidade com localização preferida
    if (preferredLocation) {
      const preferredLower = preferredLocation.toLowerCase();
      
      // Correspondência exata
      if (jobLocationLower.includes(preferredLower)) {
        return 100;
      }
      
      // Correspondência parcial (mesmo estado/região)
      const jobParts = jobLocationLower.split(',');
      const preferredParts = preferredLower.split(',');
      
      for (const jobPart of jobParts) {
        for (const prefPart of preferredParts) {
          if (jobPart.trim().includes(prefPart.trim()) || 
              prefPart.trim().includes(jobPart.trim())) {
            return 70; // Score alto para correspondência parcial
          }
        }
      }
      
      return 30; // Score baixo para localização diferente
    }

    return 50; // Score neutro se não há preferência de localização
  }

  /**
   * Calculate company score
   */
  calculateCompanyScore(company, preferredCompanies) {
    if (!preferredCompanies || preferredCompanies.length === 0) {
      return 50; // Score neutro se não há preferências
    }

    const companyLower = company.toLowerCase();
    
    for (const preferred of preferredCompanies) {
      if (companyLower.includes(preferred.toLowerCase())) {
        return 100; // Score máximo para empresa preferida
      }
    }

    return 50; // Score neutro para outras empresas
  }

  /**
   * Calculate experience level score
   */
  calculateExperienceScore(title, experienceLevel) {
    if (!experienceLevel) {
      return 50; // Score neutro se não especificado
    }

    const titleLower = title.toLowerCase();
    
    const experienceKeywords = {
      'entry': ['junior', 'trainee', 'estagiário', 'iniciante', 'entry'],
      'mid': ['pleno', 'mid', 'middle', 'intermediário'],
      'senior': ['senior', 'sênior', 'lead', 'principal', 'arquiteto', 'specialist']
    };

    const keywords = experienceKeywords[experienceLevel] || [];
    
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return 100; // Correspondência perfeita
      }
    }

    // Verificar incompatibilidades
    const allKeywords = Object.values(experienceKeywords).flat();
    const hasOtherLevel = allKeywords.some(keyword => 
      keyword !== experienceLevel && titleLower.includes(keyword)
    );

    if (hasOtherLevel) {
      return 20; // Penalidade por nível incompatível
    }

    return 60; // Score neutro se não há indicação clara
  }

  /**
   * Apply bonuses and penalties
   */
  applyBonusesAndPenalties(baseScore, job, criteria) {
    let finalScore = baseScore;

    // Bônus para Easy Apply
    if (job.easyApply) {
      finalScore += 5;
    }

    // Bônus para vagas recentes (se tiver timestamp)
    if (job.extractedAt) {
      const extractedTime = new Date(job.extractedAt);
      const now = new Date();
      const hoursDiff = (now - extractedTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        finalScore += 3; // Bônus para vagas do último dia
      }
    }

    // Penalidade para títulos muito genéricos
    const genericTitles = ['desenvolvedor', 'programador', 'analista', 'engineer'];
    const titleLower = job.title.toLowerCase();
    
    if (genericTitles.some(generic => titleLower === generic)) {
      finalScore -= 10; // Penalidade para títulos muito genéricos
    }

    // Bônus para empresas conhecidas
    const knownCompanies = ['google', 'microsoft', 'amazon', 'facebook', 'apple', 'netflix'];
    const companyLower = job.company.toLowerCase();
    
    if (knownCompanies.some(known => companyLower.includes(known))) {
      finalScore += 5;
    }

    return finalScore;
  }

  /**
   * Get detailed score breakdown
   */
  getScoreDetails(job, criteria) {
    return {
      title: this.calculateTitleScore(job.title, criteria.keywords || []),
      keywords: this.calculateKeywordScore(job, criteria.keywords || []),
      location: this.calculateLocationScore(job.location, criteria.location, criteria.allowRemote),
      company: this.calculateCompanyScore(job.company, criteria.preferredCompanies || []),
      easyApply: job.easyApply ? 100 : 0,
      experience: this.calculateExperienceScore(job.title, criteria.experienceLevel)
    };
  }

  /**
   * Get match factors for display
   */
  getMatchFactors(job, criteria) {
    const factors = [];
    
    if (job.easyApply) {
      factors.push('Easy Apply disponível');
    }
    
    if (criteria.keywords) {
      const matchingKeywords = criteria.keywords.filter(keyword =>
        job.title.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        factors.push(`Tecnologias: ${matchingKeywords.join(', ')}`);
      }
    }
    
    if (job.location && job.location.toLowerCase().includes('remoto')) {
      factors.push('Trabalho remoto');
    }
    
    return factors;
  }

  /**
   * Process and save search results
   */
  async processSearchResults(results, criteria) {
    try {
      // Get existing job queue
      const data = await chrome.storage.local.get(['jobQueue', 'searchHistory']);
      
      const jobQueue = data.jobQueue || [];
      const searchHistory = data.searchHistory || [];

      // Add new jobs to queue (avoid duplicates)
      const existingUrls = new Set(jobQueue.map(job => job.url));
      const newJobs = results.jobs.filter(job => !existingUrls.has(job.url));

      // Add to queue with application status
      const queueJobs = newJobs.map(job => ({
        ...job,
        addedAt: new Date().toISOString(),
        status: 'pending',
        autoApply: criteria.autoApply && job.easyApply && job.score >= criteria.minScore
      }));

      // Update storage
      await chrome.storage.local.set({
        jobQueue: [...jobQueue, ...queueJobs].slice(-200), // Keep last 200 jobs
        searchHistory: [
          {
            timestamp: results.searchTime,
            criteria,
            resultsCount: results.total,
            newJobsCount: newJobs.length
          },
          ...searchHistory
        ].slice(0, 50), // Keep last 50 searches
        lastSearchResults: results
      });

      // Notify about new jobs
      if (newJobs.length > 0) {
        this.notifyNewJobs(newJobs.length);
      }

    } catch (error) {
      console.error('Error processing search results:', error);
    }
  }

  /**
   * Notify about new jobs found
   */
  notifyNewJobs(count) {
    // Create notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'src/icons/icon48.svg',
      title: 'WorkIn - Novas Vagas Encontradas',
      message: `Encontramos ${count} nova${count > 1 ? 's' : ''} vaga${count > 1 ? 's' : ''} compatível${count > 1 ? 'eis' : ''} com seu perfil!`
    });
  }

  /**
   * Get search statistics
   */
  async getSearchStats() {
    const data = await chrome.storage.local.get(['searchHistory', 'jobQueue']);
    
    const searchHistory = data.searchHistory || [];
    const jobQueue = data.jobQueue || [];

    return {
      totalSearches: searchHistory.length,
      lastSearchTime: this.lastSearchTime,
      totalJobsFound: jobQueue.length,
      pendingApplications: jobQueue.filter(job => job.status === 'pending').length,
      isSearching: this.isSearching
    };
  }
}

// Initialize job search engine
const jobSearchEngine = new JobSearchEngine();