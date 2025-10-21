/**
 * WorkIn Extension - LinkedIn Profile Parser
 * Extrai automaticamente dados do perfil do usuário no LinkedIn
 */

class LinkedInProfileParser {
  constructor() {
    this.isInitialized = false;
    this.profileData = null;
    this.selectors = {
      // Informações básicas do perfil
      profile: {
        name: '.text-heading-xlarge, .pv-text-details__left-panel h1, .ph5 h1',
        headline: '.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium, .ph5 .text-body-medium',
        location: '.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .text-body-small, .ph5 .text-body-small',
        about: '.pv-about-section .pv-about__summary-text, .pv-about-section .inline-show-more-text, .about-section .pv-about__summary-text'
      },
      
      // Experiência profissional
      experience: {
        section: '.pv-profile-section.experience-section, .pvs-list__outer-container, .experience-section',
        items: '.pv-entity__summary-info, .pvs-list__paged-list-item, .pv-experience-section__list-item',
        title: '.pv-entity__summary-info-v2 h3, .mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3',
        company: '.pv-entity__secondary-title, .t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title',
        duration: '.pv-entity__bullet-item, .t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__bullet-item',
        description: '.pv-entity__description, .inline-show-more-text, .pv-entity__description'
      },
      
      // Educação
      education: {
        section: '.pv-profile-section.education-section, .pvs-list__outer-container, .education-section',
        items: '.pv-entity__summary-info, .pvs-list__paged-list-item, .pv-education-section__list-item',
        school: '.pv-entity__school-name, .mr1.t-bold span[aria-hidden="true"], .pv-entity__school-name',
        degree: '.pv-entity__degree-name, .t-14.t-normal span[aria-hidden="true"], .pv-entity__degree-name',
        field: '.pv-entity__fos, .t-14.t-normal span[aria-hidden="true"], .pv-entity__fos',
        duration: '.pv-entity__dates, .t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__dates'
      },
      
      // Habilidades
      skills: {
        section: '.pv-profile-section.pv-skill-categories-section, .pvs-list__outer-container, .skills-section',
        items: '.pv-skill-category-entity, .pvs-list__paged-list-item, .pv-skill-category-entity',
        name: '.pv-skill-category-entity__name, .mr1.t-bold span[aria-hidden="true"], .pv-skill-category-entity__name',
        endorsements: '.pv-skill-category-entity__endorsement-count, .t-12.t-black--light, .pv-skill-category-entity__endorsement-count'
      },
      
      // Idiomas
      languages: {
        section: '.pv-profile-section.languages-section, .pvs-list__outer-container, .languages-section',
        items: '.pv-accomplishment-entity, .pvs-list__paged-list-item, .pv-accomplishment-entity',
        name: '.pv-accomplishment-entity-title, .mr1.t-bold span[aria-hidden="true"], .pv-accomplishment-entity-title',
        proficiency: '.pv-accomplishment-entity-caption, .t-14.t-normal span[aria-hidden="true"], .pv-accomplishment-entity-caption'
      }
    };
    
    this.init();
  }

  /**
   * Inicializa o parser
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Verifica se está na página de perfil
      if (!this.isProfilePage()) {
        return;
      }
      
      WorkInUtils.LogUtils.log('info', 'LinkedIn Profile Parser initialized');
      this.isInitialized = true;
      
    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to initialize LinkedIn Profile Parser', { error });
    }
  }

  /**
   * Verifica se está na página de perfil
   */
  isProfilePage() {
    const url = window.location.href;
    return url.includes('linkedin.com') && 
           (url.includes('/in/') || url.includes('/profile/'));
  }

  /**
   * Extrai todos os dados do perfil
   */
  async extractProfileData() {
    if (!this.isProfilePage()) {
      throw new Error('Não está na página de perfil do LinkedIn');
    }

    try {
      // Aguarda carregamento da página
      await this.waitForPageLoad();

      const profileData = {
        basicInfo: await this.extractBasicInfo(),
        experience: await this.extractExperience(),
        education: await this.extractEducation(),
        skills: await this.extractSkills(),
        languages: await this.extractLanguages(),
        extractedAt: Date.now(),
        source: 'linkedin-profile'
      };

      this.profileData = profileData;
      
      WorkInUtils.LogUtils.log('info', 'Profile data extracted successfully', {
        experienceCount: profileData.experience.length,
        skillsCount: profileData.skills.length,
        educationCount: profileData.education.length
      });

      return profileData;

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to extract profile data', { error });
      throw error;
    }
  }

  /**
   * Aguarda carregamento da página
   */
  async waitForPageLoad() {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        const nameElement = document.querySelector(this.selectors.profile.name);
        if (nameElement && nameElement.textContent.trim()) {
          resolve();
        } else {
          setTimeout(checkLoaded, 500);
        }
      };
      checkLoaded();
    });
  }

  /**
   * Extrai informações básicas do perfil
   */
  async extractBasicInfo() {
    const nameElement = document.querySelector(this.selectors.profile.name);
    const headlineElement = document.querySelector(this.selectors.profile.headline);
    const locationElement = document.querySelector(this.selectors.profile.location);
    const aboutElement = document.querySelector(this.selectors.profile.about);

    return {
      name: nameElement ? this.cleanText(nameElement.textContent) : '',
      headline: headlineElement ? this.cleanText(headlineElement.textContent) : '',
      location: locationElement ? this.cleanText(locationElement.textContent) : '',
      about: aboutElement ? this.cleanText(aboutElement.textContent) : '',
      profileUrl: window.location.href
    };
  }

  /**
   * Extrai experiência profissional
   */
  async extractExperience() {
    const experiences = [];
    const experienceItems = document.querySelectorAll(this.selectors.experience.items);

    for (const item of experienceItems) {
      try {
        const titleElement = item.querySelector(this.selectors.experience.title);
        const companyElement = item.querySelector(this.selectors.experience.company);
        const durationElement = item.querySelector(this.selectors.experience.duration);
        const descriptionElement = item.querySelector(this.selectors.experience.description);

        if (titleElement && companyElement) {
          const experience = {
            title: this.cleanText(titleElement.textContent),
            company: this.cleanText(companyElement.textContent),
            duration: durationElement ? this.cleanText(durationElement.textContent) : '',
            description: descriptionElement ? this.cleanText(descriptionElement.textContent) : '',
            skills: this.extractSkillsFromText(descriptionElement ? descriptionElement.textContent : ''),
            seniority: this.calculateSeniority(titleElement.textContent)
          };

          experiences.push(experience);
        }
      } catch (error) {
        WorkInUtils.LogUtils.log('warn', 'Failed to extract experience item', { error });
      }
    }

    return experiences;
  }

  /**
   * Extrai educação
   */
  async extractEducation() {
    const educations = [];
    const educationItems = document.querySelectorAll(this.selectors.education.items);

    for (const item of educationItems) {
      try {
        const schoolElement = item.querySelector(this.selectors.education.school);
        const degreeElement = item.querySelector(this.selectors.education.degree);
        const fieldElement = item.querySelector(this.selectors.education.field);
        const durationElement = item.querySelector(this.selectors.education.duration);

        if (schoolElement) {
          const education = {
            school: this.cleanText(schoolElement.textContent),
            degree: degreeElement ? this.cleanText(degreeElement.textContent) : '',
            field: fieldElement ? this.cleanText(fieldElement.textContent) : '',
            duration: durationElement ? this.cleanText(durationElement.textContent) : ''
          };

          educations.push(education);
        }
      } catch (error) {
        WorkInUtils.LogUtils.log('warn', 'Failed to extract education item', { error });
      }
    }

    return educations;
  }

  /**
   * Extrai habilidades
   */
  async extractSkills() {
    const skills = [];
    const skillItems = document.querySelectorAll(this.selectors.skills.items);

    for (const item of skillItems) {
      try {
        const nameElement = item.querySelector(this.selectors.skills.name);
        const endorsementsElement = item.querySelector(this.selectors.skills.endorsements);

        if (nameElement) {
          const skill = {
            name: this.cleanText(nameElement.textContent),
            endorsements: endorsementsElement ? 
              this.extractNumberFromText(endorsementsElement.textContent) : 0
          };

          skills.push(skill);
        }
      } catch (error) {
        WorkInUtils.LogUtils.log('warn', 'Failed to extract skill item', { error });
      }
    }

    return skills;
  }

  /**
   * Extrai idiomas
   */
  async extractLanguages() {
    const languages = [];
    const languageItems = document.querySelectorAll(this.selectors.languages.items);

    for (const item of languageItems) {
      try {
        const nameElement = item.querySelector(this.selectors.languages.name);
        const proficiencyElement = item.querySelector(this.selectors.languages.proficiency);

        if (nameElement) {
          const language = {
            name: this.cleanText(nameElement.textContent),
            proficiency: proficiencyElement ? 
              this.cleanText(proficiencyElement.textContent) : ''
          };

          languages.push(language);
        }
      } catch (error) {
        WorkInUtils.LogUtils.log('warn', 'Failed to extract language item', { error });
      }
    }

    return languages;
  }

  /**
   * Extrai skills de um texto
   */
  extractSkillsFromText(text) {
    if (!text) return [];

    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'vue', 'angular', 'node',
      'sql', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
      'api', 'rest', 'graphql', 'mongodb', 'postgresql', 'mysql',
      'typescript', 'html', 'css', 'sass', 'webpack', 'babel',
      'redux', 'vuex', 'express', 'nestjs', 'spring', 'django',
      'flask', 'laravel', 'php', 'c#', 'c++', 'go', 'rust',
      'firebase', 'azure', 'gcp', 'jenkins', 'ci/cd', 'devops'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        foundSkills.push(keyword);
      }
    });

    return foundSkills;
  }

  /**
   * Calcula senioridade baseada no título
   */
  calculateSeniority(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('senior') || lowerTitle.includes('sr.') || 
        lowerTitle.includes('lead') || lowerTitle.includes('principal') ||
        lowerTitle.includes('architect') || lowerTitle.includes('manager')) {
      return 'senior';
    }
    
    if (lowerTitle.includes('junior') || lowerTitle.includes('jr.') ||
        lowerTitle.includes('trainee') || lowerTitle.includes('intern') ||
        lowerTitle.includes('estagiário') || lowerTitle.includes('aprendiz')) {
      return 'junior';
    }
    
    return 'pleno';
  }

  /**
   * Extrai número de um texto
   */
  extractNumberFromText(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Limpa texto extraído
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Analisa dados do perfil para gerar insights
   */
  analyzeProfile(profileData) {
    const analysis = {
      totalExperience: this.calculateTotalExperience(profileData.experience),
      primarySkills: this.identifyPrimarySkills(profileData.skills, profileData.experience),
      seniorityLevel: this.determineSeniorityLevel(profileData.experience),
      industryFocus: this.identifyIndustryFocus(profileData.experience),
      locationPreference: this.extractLocationPreference(profileData.basicInfo.location),
      careerProgression: this.analyzeCareerProgression(profileData.experience),
      educationLevel: this.determineEducationLevel(profileData.education),
      languageSkills: this.analyzeLanguageSkills(profileData.languages)
    };

    return analysis;
  }

  /**
   * Calcula experiência total em anos
   */
  calculateTotalExperience(experiences) {
    let totalMonths = 0;
    
    experiences.forEach(exp => {
      const months = this.parseDurationToMonths(exp.duration);
      totalMonths += months;
    });
    
    return Math.round(totalMonths / 12 * 10) / 10; // Anos com 1 casa decimal
  }

  /**
   * Converte duração em meses
   */
  parseDurationToMonths(duration) {
    if (!duration) return 0;
    
    const yearMatch = duration.match(/(\d+)\s*(ano|year)/i);
    const monthMatch = duration.match(/(\d+)\s*(mês|mes|month)/i);
    
    let months = 0;
    if (yearMatch) months += parseInt(yearMatch[1]) * 12;
    if (monthMatch) months += parseInt(monthMatch[1]);
    
    return months || 12; // Default para 1 ano se não conseguir parsear
  }

  /**
   * Identifica skills primárias
   */
  identifyPrimarySkills(skills, experiences) {
    const skillFrequency = new Map();
    
    // Conta skills do perfil
    skills.forEach(skill => {
      skillFrequency.set(skill.name.toLowerCase(), (skill.endorsements || 0) + 1);
    });
    
    // Conta skills das experiências
    experiences.forEach(exp => {
      exp.skills.forEach(skill => {
        const current = skillFrequency.get(skill.toLowerCase()) || 0;
        skillFrequency.set(skill.toLowerCase(), current + 2); // Peso maior para skills em experiências
      });
    });
    
    // Retorna top 10 skills
    return Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, frequency]) => ({ skill, frequency }));
  }

  /**
   * Determina nível de senioridade
   */
  determineSeniorityLevel(experiences) {
    const seniorityLevels = experiences.map(exp => exp.seniority);
    const seniorCount = seniorityLevels.filter(s => s === 'senior').length;
    const juniorCount = seniorityLevels.filter(s => s === 'junior').length;
    
    if (seniorCount > juniorCount) return 'senior';
    if (juniorCount > seniorCount) return 'junior';
    return 'pleno';
  }

  /**
   * Identifica foco da indústria
   */
  identifyIndustryFocus(experiences) {
    const industries = experiences.map(exp => this.categorizeCompany(exp.company));
    const industryCount = {};
    
    industries.forEach(industry => {
      industryCount[industry] = (industryCount[industry] || 0) + 1;
    });
    
    return Object.entries(industryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([industry, count]) => ({ industry, count }));
  }

  /**
   * Categoriza empresa por indústria
   */
  categorizeCompany(companyName) {
    const company = companyName.toLowerCase();
    
    if (company.includes('tech') || company.includes('software') || 
        company.includes('digital') || company.includes('startup')) {
      return 'Tecnologia';
    }
    
    if (company.includes('bank') || company.includes('financ') || 
        company.includes('invest') || company.includes('credit')) {
      return 'Financeiro';
    }
    
    if (company.includes('consult') || company.includes('advisory')) {
      return 'Consultoria';
    }
    
    if (company.includes('health') || company.includes('medic') || 
        company.includes('pharma') || company.includes('hospital')) {
      return 'Saúde';
    }
    
    return 'Outros';
  }

  /**
   * Extrai preferência de localização
   */
  extractLocationPreference(location) {
    if (!location) return { city: '', state: '', country: '', remote: false };
    
    const parts = location.split(',').map(part => part.trim());
    
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[parts.length - 1] || '',
      remote: location.toLowerCase().includes('remot')
    };
  }

  /**
   * Analiza progressão de carreira
   */
  analyzeCareerProgression(experiences) {
    if (experiences.length < 2) return 'Dados insuficientes';
    
    const seniorityOrder = { 'junior': 1, 'pleno': 2, 'senior': 3 };
    const progression = experiences.map(exp => seniorityOrder[exp.seniority] || 2);
    
    const isProgressing = progression.some((level, index) => 
      index > 0 && level > progression[index - 1]
    );
    
    return isProgressing ? 'Progressiva' : 'Estável';
  }

  /**
   * Determina nível educacional
   */
  determineEducationLevel(educations) {
    if (!educations.length) return 'Não informado';
    
    const degrees = educations.map(edu => edu.degree.toLowerCase());
    
    if (degrees.some(d => d.includes('phd') || d.includes('doutorado'))) {
      return 'Doutorado';
    }
    
    if (degrees.some(d => d.includes('master') || d.includes('mestrado') || d.includes('mba'))) {
      return 'Pós-graduação';
    }
    
    if (degrees.some(d => d.includes('bacharel') || d.includes('bachelor') || 
                         d.includes('graduação') || d.includes('superior'))) {
      return 'Superior';
    }
    
    return 'Técnico/Outros';
  }

  /**
   * Analisa habilidades linguísticas
   */
  analyzeLanguageSkills(languages) {
    const analysis = {
      total: languages.length,
      native: languages.filter(lang => 
        lang.proficiency.toLowerCase().includes('nativ') ||
        lang.proficiency.toLowerCase().includes('matern')
      ).length,
      fluent: languages.filter(lang => 
        lang.proficiency.toLowerCase().includes('fluent') ||
        lang.proficiency.toLowerCase().includes('fluente')
      ).length,
      languages: languages.map(lang => lang.name)
    };
    
    return analysis;
  }
}

// Torna disponível globalmente
window.LinkedInProfileParser = LinkedInProfileParser;