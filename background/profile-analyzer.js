/**
 * WorkIn Extension - Profile Analyzer
 * Sistema de análise inteligente de informações do perfil
 */

class ProfileAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.industryKeywords = this.initializeIndustryKeywords();
    this.skillCategories = this.initializeSkillCategories();
    this.seniorityIndicators = this.initializeSeniorityIndicators();
  }

  /**
   * Inicializa palavras-chave por indústria
   */
  initializeIndustryKeywords() {
    return {
      'Tecnologia': [
        'software', 'tech', 'digital', 'startup', 'saas', 'fintech',
        'desenvolvimento', 'programação', 'sistemas', 'ti', 'tecnologia',
        'inovação', 'artificial intelligence', 'machine learning', 'data science'
      ],
      'Financeiro': [
        'bank', 'banco', 'financeiro', 'investment', 'investimento',
        'credit', 'crédito', 'insurance', 'seguro', 'capital', 'wealth',
        'asset', 'trading', 'finance', 'contabilidade', 'auditoria'
      ],
      'Consultoria': [
        'consulting', 'consultoria', 'advisory', 'strategy', 'estratégia',
        'management', 'gestão', 'business', 'negócios', 'transformation',
        'transformação', 'process', 'processo', 'optimization'
      ],
      'Saúde': [
        'health', 'saúde', 'medical', 'médico', 'hospital', 'pharma',
        'farmacêutico', 'biotechnology', 'biotecnologia', 'healthcare',
        'clinic', 'clínica', 'therapy', 'terapia', 'research', 'pesquisa'
      ],
      'Educação': [
        'education', 'educação', 'university', 'universidade', 'school',
        'escola', 'teaching', 'ensino', 'learning', 'aprendizagem',
        'training', 'treinamento', 'academic', 'acadêmico', 'research'
      ],
      'Varejo': [
        'retail', 'varejo', 'commerce', 'comércio', 'sales', 'vendas',
        'marketing', 'brand', 'marca', 'consumer', 'consumidor',
        'ecommerce', 'marketplace', 'fashion', 'moda', 'luxury'
      ],
      'Manufatura': [
        'manufacturing', 'manufatura', 'production', 'produção',
        'industrial', 'factory', 'fábrica', 'automotive', 'automotivo',
        'aerospace', 'aeroespacial', 'chemical', 'químico', 'energy'
      ],
      'Mídia': [
        'media', 'mídia', 'advertising', 'publicidade', 'communication',
        'comunicação', 'journalism', 'jornalismo', 'entertainment',
        'entretenimento', 'creative', 'criativo', 'design', 'content'
      ]
    };
  }

  /**
   * Inicializa categorias de skills
   */
  initializeSkillCategories() {
    return {
      'Frontend': [
        'react', 'vue', 'angular', 'javascript', 'typescript', 'html',
        'css', 'sass', 'less', 'webpack', 'babel', 'jquery', 'bootstrap',
        'tailwind', 'material-ui', 'styled-components', 'next.js', 'nuxt.js'
      ],
      'Backend': [
        'node.js', 'express', 'nestjs', 'python', 'django', 'flask',
        'java', 'spring', 'php', 'laravel', 'c#', '.net', 'go', 'rust',
        'ruby', 'rails', 'scala', 'kotlin', 'api', 'rest', 'graphql'
      ],
      'Database': [
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'oracle', 'sql server', 'sqlite', 'cassandra', 'dynamodb',
        'firebase', 'supabase', 'prisma', 'sequelize', 'mongoose'
      ],
      'DevOps': [
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins',
        'gitlab ci', 'github actions', 'terraform', 'ansible',
        'prometheus', 'grafana', 'elk', 'nginx', 'apache', 'linux'
      ],
      'Mobile': [
        'react native', 'flutter', 'swift', 'kotlin', 'ionic',
        'xamarin', 'cordova', 'android', 'ios', 'mobile development'
      ],
      'Data Science': [
        'python', 'r', 'pandas', 'numpy', 'scikit-learn', 'tensorflow',
        'pytorch', 'jupyter', 'tableau', 'power bi', 'sql', 'spark',
        'hadoop', 'machine learning', 'deep learning', 'statistics'
      ],
      'Design': [
        'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
        'ui/ux', 'user experience', 'user interface', 'prototyping',
        'wireframing', 'design thinking', 'usability', 'accessibility'
      ],
      'Management': [
        'agile', 'scrum', 'kanban', 'project management', 'team leadership',
        'product management', 'stakeholder management', 'strategic planning',
        'budget management', 'risk management', 'change management'
      ]
    };
  }

  /**
   * Inicializa indicadores de senioridade
   */
  initializeSeniorityIndicators() {
    return {
      'senior': [
        'senior', 'sr.', 'lead', 'principal', 'architect', 'manager',
        'director', 'head', 'chief', 'vp', 'vice president', 'specialist',
        'expert', 'consultant', 'tech lead', 'team lead', 'coordenador'
      ],
      'pleno': [
        'pleno', 'mid-level', 'developer', 'engineer', 'analyst',
        'analista', 'desenvolvedor', 'engenheiro', 'programador',
        'designer', 'consultant', 'specialist'
      ],
      'junior': [
        'junior', 'jr.', 'trainee', 'intern', 'estagiário', 'aprendiz',
        'assistant', 'associate', 'entry-level', 'graduate', 'iniciante'
      ]
    };
  }

  /**
   * Analisa perfil completo
   */
  async analyzeProfile(profileData) {
    try {
      const cacheKey = this.generateCacheKey(profileData);
      
      // Verifica cache
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      const analysis = {
        // Análise básica
        basicAnalysis: this.analyzeBasicInfo(profileData.basicInfo),
        
        // Análise de experiência
        experienceAnalysis: this.analyzeExperience(profileData.experience),
        
        // Análise de skills
        skillsAnalysis: this.analyzeSkills(profileData.skills, profileData.experience),
        
        // Análise de educação
        educationAnalysis: this.analyzeEducation(profileData.education),
        
        // Análise de idiomas
        languageAnalysis: this.analyzeLanguages(profileData.languages),
        
        // Perfil profissional consolidado
        professionalProfile: this.generateProfessionalProfile(profileData),
        
        // Recomendações de vagas
        jobRecommendations: this.generateJobRecommendations(profileData),
        
        // Score de completude do perfil
        profileCompleteness: this.calculateProfileCompleteness(profileData),
        
        // Timestamp da análise
        analyzedAt: Date.now()
      };

      // Salva no cache
      this.analysisCache.set(cacheKey, analysis);
      
      return analysis;

    } catch (error) {
      WorkInUtils.LogUtils.log('error', 'Failed to analyze profile', { error });
      throw error;
    }
  }

  /**
   * Analisa informações básicas
   */
  analyzeBasicInfo(basicInfo) {
    return {
      hasCompleteName: basicInfo.name && basicInfo.name.length > 2,
      hasHeadline: basicInfo.headline && basicInfo.headline.length > 10,
      hasLocation: basicInfo.location && basicInfo.location.length > 2,
      hasAbout: basicInfo.about && basicInfo.about.length > 50,
      locationAnalysis: this.analyzeLocation(basicInfo.location),
      headlineAnalysis: this.analyzeHeadline(basicInfo.headline),
      aboutAnalysis: this.analyzeAbout(basicInfo.about)
    };
  }

  /**
   * Analisa localização
   */
  analyzeLocation(location) {
    if (!location) return { isRemote: false, city: '', state: '', country: '' };

    const lowerLocation = location.toLowerCase();
    const isRemote = lowerLocation.includes('remot') || 
                    lowerLocation.includes('home') ||
                    lowerLocation.includes('anywhere');

    const parts = location.split(',').map(part => part.trim());
    
    return {
      isRemote,
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[parts.length - 1] || '',
      fullLocation: location
    };
  }

  /**
   * Analisa headline
   */
  analyzeHeadline(headline) {
    if (!headline) return { seniorityLevel: 'unknown', industries: [], skills: [] };

    const lowerHeadline = headline.toLowerCase();
    
    // Detecta senioridade
    let seniorityLevel = 'pleno';
    for (const [level, indicators] of Object.entries(this.seniorityIndicators)) {
      if (indicators.some(indicator => lowerHeadline.includes(indicator))) {
        seniorityLevel = level;
        break;
      }
    }

    // Detecta indústrias
    const industries = [];
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(keyword => lowerHeadline.includes(keyword))) {
        industries.push(industry);
      }
    }

    // Detecta skills
    const skills = [];
    for (const [category, skillList] of Object.entries(this.skillCategories)) {
      const foundSkills = skillList.filter(skill => lowerHeadline.includes(skill));
      if (foundSkills.length > 0) {
        skills.push({ category, skills: foundSkills });
      }
    }

    return { seniorityLevel, industries, skills };
  }

  /**
   * Analisa seção sobre
   */
  analyzeAbout(about) {
    if (!about) return { keyTopics: [], skills: [], careerGoals: [] };

    const lowerAbout = about.toLowerCase();
    
    // Detecta tópicos principais
    const keyTopics = [];
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      const matchCount = keywords.filter(keyword => lowerAbout.includes(keyword)).length;
      if (matchCount > 0) {
        keyTopics.push({ industry, relevance: matchCount });
      }
    }

    // Detecta skills mencionadas
    const skills = [];
    for (const [category, skillList] of Object.entries(this.skillCategories)) {
      const foundSkills = skillList.filter(skill => lowerAbout.includes(skill));
      if (foundSkills.length > 0) {
        skills.push({ category, skills: foundSkills });
      }
    }

    // Detecta objetivos de carreira
    const careerGoals = this.extractCareerGoals(about);

    return { 
      keyTopics: keyTopics.sort((a, b) => b.relevance - a.relevance),
      skills,
      careerGoals
    };
  }

  /**
   * Extrai objetivos de carreira
   */
  extractCareerGoals(about) {
    const goals = [];
    const lowerAbout = about.toLowerCase();

    const goalIndicators = [
      { goal: 'Leadership', keywords: ['liderar', 'gerenciar', 'coordenar', 'lead', 'manage'] },
      { goal: 'Technical Growth', keywords: ['aprender', 'desenvolver', 'especializar', 'learn', 'develop'] },
      { goal: 'Innovation', keywords: ['inovar', 'criar', 'transformar', 'innovate', 'create'] },
      { goal: 'Entrepreneurship', keywords: ['empreender', 'startup', 'negócio', 'business', 'entrepreneur'] },
      { goal: 'Remote Work', keywords: ['remoto', 'home office', 'remote', 'anywhere'] }
    ];

    goalIndicators.forEach(({ goal, keywords }) => {
      if (keywords.some(keyword => lowerAbout.includes(keyword))) {
        goals.push(goal);
      }
    });

    return goals;
  }

  /**
   * Analisa experiência profissional
   */
  analyzeExperience(experiences) {
    if (!experiences || experiences.length === 0) {
      return { totalYears: 0, seniorityProgression: 'unknown', industries: [], skillEvolution: [] };
    }

    // Calcula anos totais de experiência
    const totalYears = this.calculateTotalExperience(experiences);

    // Analisa progressão de senioridade
    const seniorityProgression = this.analyzeSeniorityProgression(experiences);

    // Identifica indústrias
    const industries = this.identifyIndustries(experiences);

    // Analisa evolução de skills
    const skillEvolution = this.analyzeSkillEvolution(experiences);

    // Identifica padrões de carreira
    const careerPatterns = this.identifyCareerPatterns(experiences);

    return {
      totalYears,
      seniorityProgression,
      industries,
      skillEvolution,
      careerPatterns,
      currentRole: experiences[0] || null,
      roleStability: this.calculateRoleStability(experiences)
    };
  }

  /**
   * Calcula experiência total
   */
  calculateTotalExperience(experiences) {
    let totalMonths = 0;
    
    experiences.forEach(exp => {
      const months = this.parseDurationToMonths(exp.duration);
      totalMonths += months;
    });
    
    return Math.round(totalMonths / 12 * 10) / 10;
  }

  /**
   * Converte duração em meses
   */
  parseDurationToMonths(duration) {
    if (!duration) return 12; // Default 1 ano

    const yearMatch = duration.match(/(\d+)\s*(ano|year)/i);
    const monthMatch = duration.match(/(\d+)\s*(mês|mes|month)/i);
    
    let months = 0;
    if (yearMatch) months += parseInt(yearMatch[1]) * 12;
    if (monthMatch) months += parseInt(monthMatch[1]);
    
    return months || 12;
  }

  /**
   * Analisa progressão de senioridade
   */
  analyzeSeniorityProgression(experiences) {
    const seniorityLevels = experiences.map(exp => {
      const title = exp.title.toLowerCase();
      for (const [level, indicators] of Object.entries(this.seniorityIndicators)) {
        if (indicators.some(indicator => title.includes(indicator))) {
          return level;
        }
      }
      return 'pleno';
    });

    const seniorityOrder = { 'junior': 1, 'pleno': 2, 'senior': 3 };
    const progression = seniorityLevels.map(level => seniorityOrder[level]);

    const isProgressing = progression.some((level, index) => 
      index > 0 && level > progression[index - 1]
    );

    return {
      current: seniorityLevels[0] || 'pleno',
      progression: isProgressing ? 'ascending' : 'stable',
      levels: seniorityLevels
    };
  }

  /**
   * Identifica indústrias
   */
  identifyIndustries(experiences) {
    const industryCount = {};
    
    experiences.forEach(exp => {
      const industry = this.categorizeCompany(exp.company, exp.title, exp.description);
      industryCount[industry] = (industryCount[industry] || 0) + 1;
    });

    return Object.entries(industryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([industry, count]) => ({ industry, count, percentage: (count / experiences.length) * 100 }));
  }

  /**
   * Categoriza empresa por indústria
   */
  categorizeCompany(companyName, title = '', description = '') {
    const text = `${companyName} ${title} ${description}`.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'Outros';
  }

  /**
   * Analisa evolução de skills
   */
  analyzeSkillEvolution(experiences) {
    const skillsByPeriod = experiences.map(exp => ({
      period: exp.duration,
      skills: exp.skills || [],
      title: exp.title
    }));

    const allSkills = new Set();
    skillsByPeriod.forEach(period => {
      period.skills.forEach(skill => allSkills.add(skill));
    });

    return {
      totalUniqueSkills: allSkills.size,
      skillsByPeriod,
      emergingSkills: this.identifyEmergingSkills(skillsByPeriod),
      coreSkills: this.identifyCoreSkills(skillsByPeriod)
    };
  }

  /**
   * Identifica skills emergentes
   */
  identifyEmergingSkills(skillsByPeriod) {
    if (skillsByPeriod.length < 2) return [];

    const recentSkills = new Set(skillsByPeriod[0].skills);
    const olderSkills = new Set();
    
    skillsByPeriod.slice(1).forEach(period => {
      period.skills.forEach(skill => olderSkills.add(skill));
    });

    return Array.from(recentSkills).filter(skill => !olderSkills.has(skill));
  }

  /**
   * Identifica skills principais
   */
  identifyCoreSkills(skillsByPeriod) {
    const skillFrequency = {};
    
    skillsByPeriod.forEach(period => {
      period.skills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    return Object.entries(skillFrequency)
      .filter(([skill, frequency]) => frequency >= Math.ceil(skillsByPeriod.length / 2))
      .sort((a, b) => b[1] - a[1])
      .map(([skill, frequency]) => ({ skill, frequency }));
  }

  /**
   * Identifica padrões de carreira
   */
  identifyCareerPatterns(experiences) {
    const patterns = [];
    
    // Verifica se há mudanças frequentes de empresa
    if (experiences.length > 3) {
      const avgDuration = this.calculateTotalExperience(experiences) / experiences.length;
      if (avgDuration < 2) {
        patterns.push('job_hopper');
      } else if (avgDuration > 4) {
        patterns.push('stable_career');
      }
    }

    // Verifica se há foco em uma indústria
    const industries = this.identifyIndustries(experiences);
    if (industries.length > 0 && industries[0].percentage > 70) {
      patterns.push('industry_specialist');
    } else if (industries.length > 3) {
      patterns.push('industry_diverse');
    }

    return patterns;
  }

  /**
   * Calcula estabilidade de função
   */
  calculateRoleStability(experiences) {
    if (experiences.length === 0) return 0;
    
    const avgDuration = this.calculateTotalExperience(experiences) / experiences.length;
    return Math.min(avgDuration / 3, 1); // Normaliza para 0-1, onde 3+ anos = 1
  }

  /**
   * Analisa skills
   */
  analyzeSkills(skills, experiences) {
    const skillAnalysis = {
      totalSkills: skills.length,
      categorizedSkills: this.categorizeSkills(skills),
      endorsementAnalysis: this.analyzeEndorsements(skills),
      skillGaps: this.identifySkillGaps(skills, experiences),
      marketDemand: this.assessMarketDemand(skills)
    };

    return skillAnalysis;
  }

  /**
   * Categoriza skills
   */
  categorizeSkills(skills) {
    const categorized = {};
    
    skills.forEach(skill => {
      const skillName = skill.name.toLowerCase();
      let categorized_flag = false;
      
      for (const [category, skillList] of Object.entries(this.skillCategories)) {
        if (skillList.some(s => skillName.includes(s) || s.includes(skillName))) {
          if (!categorized[category]) categorized[category] = [];
          categorized[category].push(skill);
          categorized_flag = true;
          break;
        }
      }
      
      if (!categorized_flag) {
        if (!categorized['Outros']) categorized['Outros'] = [];
        categorized['Outros'].push(skill);
      }
    });

    return categorized;
  }

  /**
   * Analisa endorsements
   */
  analyzeEndorsements(skills) {
    const totalEndorsements = skills.reduce((sum, skill) => sum + (skill.endorsements || 0), 0);
    const avgEndorsements = skills.length > 0 ? totalEndorsements / skills.length : 0;
    
    const topSkills = skills
      .filter(skill => skill.endorsements > 0)
      .sort((a, b) => b.endorsements - a.endorsements)
      .slice(0, 5);

    return {
      totalEndorsements,
      avgEndorsements,
      topSkills,
      skillsWithoutEndorsements: skills.filter(skill => !skill.endorsements || skill.endorsements === 0).length
    };
  }

  /**
   * Identifica gaps de skills
   */
  identifySkillGaps(skills, experiences) {
    // Analisa skills comuns na área baseado nas experiências
    const userSkills = new Set(skills.map(s => s.name.toLowerCase()));
    const industrySkills = this.getIndustryRequiredSkills(experiences);
    
    const gaps = industrySkills.filter(skill => !userSkills.has(skill.toLowerCase()));
    
    return gaps.slice(0, 10); // Top 10 gaps
  }

  /**
   * Obtém skills requeridas por indústria
   */
  getIndustryRequiredSkills(experiences) {
    const industries = this.identifyIndustries(experiences);
    if (industries.length === 0) return [];

    const primaryIndustry = industries[0].industry;
    
    // Retorna skills mais demandadas por indústria
    const industrySkillMap = {
      'Tecnologia': ['javascript', 'python', 'react', 'aws', 'docker', 'sql', 'git', 'agile'],
      'Financeiro': ['excel', 'sql', 'python', 'risk management', 'compliance', 'analytics'],
      'Consultoria': ['project management', 'stakeholder management', 'presentation', 'analytics'],
      'Saúde': ['healthcare', 'compliance', 'patient care', 'medical terminology'],
      'Educação': ['curriculum development', 'learning management', 'assessment', 'pedagogy']
    };

    return industrySkillMap[primaryIndustry] || [];
  }

  /**
   * Avalia demanda de mercado
   */
  assessMarketDemand(skills) {
    // Skills em alta demanda (baseado em tendências de mercado)
    const highDemandSkills = [
      'react', 'python', 'aws', 'kubernetes', 'machine learning',
      'data science', 'cybersecurity', 'cloud computing', 'devops',
      'artificial intelligence', 'blockchain', 'microservices'
    ];

    const userHighDemandSkills = skills.filter(skill => 
      highDemandSkills.some(hds => skill.name.toLowerCase().includes(hds))
    );

    return {
      highDemandSkillsCount: userHighDemandSkills.length,
      highDemandSkills: userHighDemandSkills,
      marketScore: Math.min((userHighDemandSkills.length / 5) * 100, 100) // Score de 0-100
    };
  }

  /**
   * Analisa educação
   */
  analyzeEducation(educations) {
    if (!educations || educations.length === 0) {
      return { level: 'Não informado', institutions: [], relevantEducation: [] };
    }

    const level = this.determineEducationLevel(educations);
    const institutions = educations.map(edu => edu.school);
    const relevantEducation = this.identifyRelevantEducation(educations);

    return {
      level,
      institutions,
      relevantEducation,
      totalEducations: educations.length,
      hasRecentEducation: this.hasRecentEducation(educations)
    };
  }

  /**
   * Determina nível educacional
   */
  determineEducationLevel(educations) {
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
   * Identifica educação relevante
   */
  identifyRelevantEducation(educations) {
    return educations.filter(edu => {
      const text = `${edu.degree} ${edu.field}`.toLowerCase();
      return Object.values(this.industryKeywords)
        .flat()
        .some(keyword => text.includes(keyword));
    });
  }

  /**
   * Verifica se tem educação recente
   */
  hasRecentEducation(educations) {
    const currentYear = new Date().getFullYear();
    return educations.some(edu => {
      const yearMatch = edu.duration.match(/(\d{4})/g);
      if (yearMatch) {
        const lastYear = Math.max(...yearMatch.map(y => parseInt(y)));
        return currentYear - lastYear <= 3;
      }
      return false;
    });
  }

  /**
   * Analisa idiomas
   */
  analyzeLanguages(languages) {
    if (!languages || languages.length === 0) {
      return { totalLanguages: 0, hasEnglish: false, languageScore: 0 };
    }

    const hasEnglish = languages.some(lang => 
      lang.name.toLowerCase().includes('english') || 
      lang.name.toLowerCase().includes('inglês')
    );

    const fluentLanguages = languages.filter(lang => 
      lang.proficiency.toLowerCase().includes('fluent') ||
      lang.proficiency.toLowerCase().includes('fluente') ||
      lang.proficiency.toLowerCase().includes('native') ||
      lang.proficiency.toLowerCase().includes('nativo')
    );

    const languageScore = Math.min((languages.length * 20) + (fluentLanguages.length * 10), 100);

    return {
      totalLanguages: languages.length,
      hasEnglish,
      fluentLanguages: fluentLanguages.length,
      languageScore,
      languages: languages.map(lang => lang.name)
    };
  }

  /**
   * Gera perfil profissional consolidado
   */
  generateProfessionalProfile(profileData) {
    const experienceAnalysis = this.analyzeExperience(profileData.experience);
    const skillsAnalysis = this.analyzeSkills(profileData.skills, profileData.experience);
    const basicAnalysis = this.analyzeBasicInfo(profileData.basicInfo);

    return {
      seniorityLevel: experienceAnalysis.seniorityProgression.current,
      primaryIndustry: experienceAnalysis.industries[0]?.industry || 'Não identificado',
      totalExperience: experienceAnalysis.totalYears,
      topSkills: skillsAnalysis.endorsementAnalysis.topSkills.slice(0, 5),
      location: basicAnalysis.locationAnalysis,
      careerStage: this.determineCareerStage(experienceAnalysis.totalYears, experienceAnalysis.seniorityProgression.current),
      profileStrength: this.calculateProfileStrength(profileData),
      marketPosition: this.assessMarketPosition(experienceAnalysis, skillsAnalysis)
    };
  }

  /**
   * Determina estágio da carreira
   */
  determineCareerStage(totalYears, seniorityLevel) {
    if (totalYears < 2) return 'Iniciante';
    if (totalYears < 5) return 'Desenvolvendo';
    if (totalYears < 10) return 'Estabelecido';
    if (seniorityLevel === 'senior') return 'Especialista';
    return 'Experiente';
  }

  /**
   * Calcula força do perfil
   */
  calculateProfileStrength(profileData) {
    let score = 0;
    
    // Informações básicas (20 pontos)
    if (profileData.basicInfo.name) score += 5;
    if (profileData.basicInfo.headline && profileData.basicInfo.headline.length > 10) score += 5;
    if (profileData.basicInfo.location) score += 5;
    if (profileData.basicInfo.about && profileData.basicInfo.about.length > 50) score += 5;
    
    // Experiência (30 pontos)
    if (profileData.experience.length > 0) score += 10;
    if (profileData.experience.length > 2) score += 10;
    if (profileData.experience.some(exp => exp.description && exp.description.length > 50)) score += 10;
    
    // Skills (25 pontos)
    if (profileData.skills.length > 0) score += 10;
    if (profileData.skills.length > 5) score += 10;
    if (profileData.skills.some(skill => skill.endorsements > 0)) score += 5;
    
    // Educação (15 pontos)
    if (profileData.education.length > 0) score += 15;
    
    // Idiomas (10 pontos)
    if (profileData.languages.length > 0) score += 5;
    if (profileData.languages.length > 1) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Avalia posição no mercado
   */
  assessMarketPosition(experienceAnalysis, skillsAnalysis) {
    const marketScore = skillsAnalysis.marketDemand.marketScore;
    const experienceScore = Math.min(experienceAnalysis.totalYears * 10, 50);
    const industryScore = experienceAnalysis.industries.length > 0 ? 25 : 0;
    
    const totalScore = (marketScore * 0.4) + (experienceScore * 0.4) + (industryScore * 0.2);
    
    if (totalScore >= 80) return 'Muito Competitivo';
    if (totalScore >= 60) return 'Competitivo';
    if (totalScore >= 40) return 'Moderado';
    return 'Em Desenvolvimento';
  }

  /**
   * Gera recomendações de vagas
   */
  generateJobRecommendations(profileData) {
    const experienceAnalysis = this.analyzeExperience(profileData.experience);
    const skillsAnalysis = this.analyzeSkills(profileData.skills, profileData.experience);
    const basicAnalysis = this.analyzeBasicInfo(profileData.basicInfo);

    const recommendations = {
      targetRoles: this.suggestTargetRoles(experienceAnalysis, skillsAnalysis),
      targetIndustries: experienceAnalysis.industries.slice(0, 3),
      salaryRange: this.estimateSalaryRange(experienceAnalysis, skillsAnalysis),
      locationPreferences: this.generateLocationPreferences(basicAnalysis.locationAnalysis),
      skillsToHighlight: skillsAnalysis.endorsementAnalysis.topSkills.slice(0, 8),
      improvementAreas: skillsAnalysis.skillGaps.slice(0, 5)
    };

    return recommendations;
  }

  /**
   * Sugere funções alvo
   */
  suggestTargetRoles(experienceAnalysis, skillsAnalysis) {
    const seniorityLevel = experienceAnalysis.seniorityProgression.current;
    const primaryIndustry = experienceAnalysis.industries[0]?.industry;
    const topSkillCategories = Object.keys(skillsAnalysis.categorizedSkills);

    const roleMap = {
      'Tecnologia': {
        'junior': ['Desenvolvedor Junior', 'Analista de Sistemas Junior', 'Estagiário de TI'],
        'pleno': ['Desenvolvedor', 'Analista de Sistemas', 'Engenheiro de Software'],
        'senior': ['Desenvolvedor Senior', 'Tech Lead', 'Arquiteto de Software', 'Engineering Manager']
      },
      'Financeiro': {
        'junior': ['Analista Financeiro Junior', 'Assistente de Controladoria'],
        'pleno': ['Analista Financeiro', 'Consultor Financeiro', 'Analista de Investimentos'],
        'senior': ['Gerente Financeiro', 'Controller', 'Diretor Financeiro']
      }
    };

    const industryRoles = roleMap[primaryIndustry];
    if (industryRoles && industryRoles[seniorityLevel]) {
      return industryRoles[seniorityLevel];
    }

    // Fallback baseado em skills
    if (topSkillCategories.includes('Frontend')) {
      return seniorityLevel === 'senior' ? ['Frontend Lead', 'UI/UX Lead'] : ['Frontend Developer'];
    }
    if (topSkillCategories.includes('Backend')) {
      return seniorityLevel === 'senior' ? ['Backend Lead', 'System Architect'] : ['Backend Developer'];
    }

    return ['Posições Gerais na Área'];
  }

  /**
   * Estima faixa salarial
   */
  estimateSalaryRange(experienceAnalysis, skillsAnalysis) {
    const baseByExperience = {
      0: { min: 2000, max: 4000 },
      2: { min: 4000, max: 7000 },
      5: { min: 7000, max: 12000 },
      8: { min: 12000, max: 20000 },
      10: { min: 15000, max: 30000 }
    };

    const experience = experienceAnalysis.totalYears;
    let salaryRange = baseByExperience[0];

    for (const [years, range] of Object.entries(baseByExperience)) {
      if (experience >= parseInt(years)) {
        salaryRange = range;
      }
    }

    // Ajusta baseado em skills de alta demanda
    const marketMultiplier = 1 + (skillsAnalysis.marketDemand.marketScore / 200);
    
    return {
      min: Math.round(salaryRange.min * marketMultiplier),
      max: Math.round(salaryRange.max * marketMultiplier),
      currency: 'BRL'
    };
  }

  /**
   * Gera preferências de localização
   */
  generateLocationPreferences(locationAnalysis) {
    const preferences = [];
    
    if (locationAnalysis.isRemote) {
      preferences.push('Remoto');
    }
    
    if (locationAnalysis.city) {
      preferences.push(locationAnalysis.city);
    }
    
    if (locationAnalysis.state && locationAnalysis.state !== locationAnalysis.city) {
      preferences.push(locationAnalysis.state);
    }
    
    // Adiciona opções híbridas
    if (!locationAnalysis.isRemote && locationAnalysis.city) {
      preferences.push(`Híbrido - ${locationAnalysis.city}`);
    }

    return preferences.length > 0 ? preferences : ['Flexível'];
  }

  /**
   * Calcula completude do perfil
   */
  calculateProfileCompleteness(profileData) {
    const checks = [
      { item: 'Nome completo', completed: profileData.basicInfo.name && profileData.basicInfo.name.length > 2, weight: 5 },
      { item: 'Headline profissional', completed: profileData.basicInfo.headline && profileData.basicInfo.headline.length > 10, weight: 10 },
      { item: 'Localização', completed: profileData.basicInfo.location && profileData.basicInfo.location.length > 2, weight: 5 },
      { item: 'Resumo/Sobre', completed: profileData.basicInfo.about && profileData.basicInfo.about.length > 50, weight: 15 },
      { item: 'Experiência profissional', completed: profileData.experience.length > 0, weight: 25 },
      { item: 'Múltiplas experiências', completed: profileData.experience.length > 1, weight: 10 },
      { item: 'Descrições detalhadas', completed: profileData.experience.some(exp => exp.description && exp.description.length > 50), weight: 10 },
      { item: 'Habilidades listadas', completed: profileData.skills.length > 0, weight: 10 },
      { item: 'Habilidades endossadas', completed: profileData.skills.some(skill => skill.endorsements > 0), weight: 5 },
      { item: 'Educação', completed: profileData.education.length > 0, weight: 10 },
      { item: 'Idiomas', completed: profileData.languages.length > 0, weight: 5 }
    ];

    const completedWeight = checks
      .filter(check => check.completed)
      .reduce((sum, check) => sum + check.weight, 0);

    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const percentage = Math.round((completedWeight / totalWeight) * 100);

    return {
      percentage,
      completedItems: checks.filter(check => check.completed).length,
      totalItems: checks.length,
      missingItems: checks.filter(check => !check.completed).map(check => check.item),
      checks
    };
  }

  /**
   * Gera chave de cache
   */
  generateCacheKey(profileData) {
    const keyData = {
      name: profileData.basicInfo.name,
      experienceCount: profileData.experience.length,
      skillsCount: profileData.skills.length,
      extractedAt: profileData.extractedAt
    };
    
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Limpa cache de análise
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

// Torna disponível globalmente
if (typeof window !== 'undefined') {
  window.ProfileAnalyzer = ProfileAnalyzer;
} else if (typeof global !== 'undefined') {
  global.ProfileAnalyzer = ProfileAnalyzer;
} else if (typeof self !== 'undefined') {
  self.ProfileAnalyzer = ProfileAnalyzer;
}