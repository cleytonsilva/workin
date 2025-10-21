/**
 * WorkIn Extension - Matching Engine
 * Calcula score de compatibilidade entre perfil do usuário e vagas
 */

class MatchingEngine {
  constructor() {
    this.userProfile = null;
    this.lastFactors = null;
    this.isInitialized = false;
    
    // Pesos para diferentes fatores de matching
    this.weights = {
      skills: 0.35,           // 35% - Habilidades técnicas
      experience: 0.25,       // 25% - Experiência relevante
      location: 0.15,         // 15% - Localização
      jobType: 0.10,          // 10% - Tipo de trabalho
      seniority: 0.10,        // 10% - Nível de senioridade
      keywords: 0.05          // 5% - Palavras-chave específicas
    };
    
    // Configurações de matching
    this.config = {
      minSkillMatch: 0.3,     // Mínimo 30% de match em skills
      experienceBonus: 0.1,   // Bônus por experiência extra
      locationPenalty: 0.2,   // Penalidade por localização incompatível
      keywordBonus: 0.05      // Bônus por palavra-chave encontrada
    };
  }

  /**
   * Inicializa o matching engine
   */
  async init(userProfile = null) {
    try {
      if (userProfile) {
        this.userProfile = userProfile;
      }
      
      this.isInitialized = true;
      console.log('Matching Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Matching Engine:', error);
      throw error;
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(userProfile) {
    this.userProfile = userProfile;
  }

  /**
   * Calcula score de compatibilidade
   */
  async calculateScore(jobData) {
    if (!this.userProfile) {
      console.warn('User profile not available for matching');
      return 0;
    }

    try {
      const factors = {
        skills: this.calculateSkillsMatch(jobData),
        experience: this.calculateExperienceMatch(jobData),
        location: this.calculateLocationMatch(jobData),
        jobType: this.calculateJobTypeMatch(jobData),
        seniority: this.calculateSeniorityMatch(jobData),
        keywords: this.calculateKeywordsMatch(jobData)
      };

      // Calcula score ponderado
      let totalScore = 0;
      for (const [factor, score] of Object.entries(factors)) {
        totalScore += score * this.weights[factor];
      }

      // Aplica bônus e penalidades
      totalScore = this.applyBonusesAndPenalties(totalScore, factors, jobData);

      // Garante que o score está entre 0 e 100
      const finalScore = Math.max(0, Math.min(100, Math.round(totalScore * 100)));

      // Salva fatores para análise
      this.lastFactors = {
        ...factors,
        finalScore,
        jobId: jobData.id,
        calculatedAt: Date.now()
      };

      return finalScore;

    } catch (error) {
      console.error('Failed to calculate match score:', error);
      return 0;
    }
  }

  /**
   * Calcula compatibilidade de habilidades
   */
  calculateSkillsMatch(jobData) {
    if (!this.userProfile.skills || this.userProfile.skills.length === 0) {
      return 0;
    }

    const userSkills = this.normalizeSkills(this.userProfile.skills);
    const jobRequirements = this.extractJobSkills(jobData);

    if (jobRequirements.length === 0) {
      return 0.5; // Score neutro se não há requisitos claros
    }

    let matchCount = 0;
    let totalWeight = 0;

    for (const requirement of jobRequirements) {
      const weight = this.getSkillWeight(requirement);
      totalWeight += weight;

      // Verifica match exato ou similar
      const hasMatch = userSkills.some(skill => 
        this.isSkillMatch(skill, requirement)
      );

      if (hasMatch) {
        matchCount += weight;
      }
    }

    return totalWeight > 0 ? matchCount / totalWeight : 0;
  }

  /**
   * Normaliza lista de habilidades
   */
  normalizeSkills(skills) {
    return skills.map(skill => 
      skill.toLowerCase().trim()
    );
  }

  /**
   * Extrai habilidades da vaga
   */
  extractJobSkills(jobData) {
    const text = `${jobData.title} ${jobData.description} ${jobData.requirements?.join(' ') || ''}`;
    const skills = [];

    // Lista de tecnologias e habilidades comuns
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'vue', 'angular', 'node',
      'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'jenkins',
      'agile', 'scrum', 'api', 'rest', 'graphql', 'microservices',
      'machine learning', 'ai', 'data science', 'analytics', 'tableau',
      'power bi', 'excel', 'photoshop', 'figma', 'sketch'
    ];

    const normalizedText = text.toLowerCase();

    for (const skill of techSkills) {
      if (normalizedText.includes(skill)) {
        skills.push(skill);
      }
    }

    return [...new Set(skills)]; // Remove duplicatas
  }

  /**
   * Verifica se duas habilidades são compatíveis
   */
  isSkillMatch(userSkill, jobSkill) {
    // Match exato
    if (userSkill === jobSkill) {
      return true;
    }

    // Match por similaridade
    const similarity = WorkInUtils.StringUtils.calculateSimilarity(userSkill, jobSkill);
    return similarity > 0.8;
  }

  /**
   * Obtém peso da habilidade
   */
  getSkillWeight(skill) {
    // Habilidades mais importantes têm peso maior
    const highValueSkills = [
      'react', 'vue', 'angular', 'node', 'python', 'java', 'aws', 'docker'
    ];
    
    return highValueSkills.includes(skill.toLowerCase()) ? 1.5 : 1.0;
  }

  /**
   * Calcula compatibilidade de experiência
   */
  calculateExperienceMatch(jobData) {
    if (!this.userProfile.experience || this.userProfile.experience.length === 0) {
      return 0;
    }

    // Calcula anos totais de experiência
    const totalExperience = this.calculateTotalExperience();
    
    // Extrai requisitos de experiência da vaga
    const requiredExperience = this.extractRequiredExperience(jobData);
    
    if (requiredExperience === 0) {
      return 0.7; // Score neutro se não há requisitos claros
    }

    // Calcula compatibilidade baseada na experiência
    if (totalExperience >= requiredExperience) {
      // Bônus por experiência extra (até 20%)
      const bonus = Math.min(0.2, (totalExperience - requiredExperience) * 0.05);
      return Math.min(1.0, 0.8 + bonus);
    } else {
      // Penalidade por experiência insuficiente
      const ratio = totalExperience / requiredExperience;
      return Math.max(0, ratio * 0.8);
    }
  }

  /**
   * Calcula anos totais de experiência
   */
  calculateTotalExperience() {
    let totalMonths = 0;
    
    for (const exp of this.userProfile.experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      
      totalMonths += Math.max(0, months);
    }
    
    return totalMonths / 12; // Converte para anos
  }

  /**
   * Extrai experiência requerida da vaga
   */
  extractRequiredExperience(jobData) {
    const text = `${jobData.title} ${jobData.description}`.toLowerCase();
    
    // Padrões para detectar requisitos de experiência
    const patterns = [
      /(\d+)\+?\s*anos?\s*de\s*experiência/,
      /(\d+)\+?\s*years?\s*of\s*experience/,
      /experiência\s*de\s*(\d+)\+?\s*anos?/,
      /(\d+)\+?\s*anos?\s*experiência/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Detecta nível de senioridade
    if (text.includes('senior') || text.includes('sênior')) {
      return 5;
    } else if (text.includes('pleno') || text.includes('mid-level')) {
      return 3;
    } else if (text.includes('júnior') || text.includes('junior') || text.includes('entry')) {
      return 1;
    }
    
    return 0; // Não especificado
  }

  /**
   * Calcula compatibilidade de localização
   */
  calculateLocationMatch(jobData) {
    if (!this.userProfile.location) {
      return 0.5; // Score neutro se localização não especificada
    }

    const userLocation = this.userProfile.location.toLowerCase();
    const jobLocation = jobData.location.toLowerCase();

    // Trabalho remoto sempre compatível
    if (jobData.remote || jobLocation.includes('remot')) {
      return 1.0;
    }

    // Trabalho híbrido - compatibilidade alta se usuário aceita
    if (jobData.hybrid || jobLocation.includes('híbrid')) {
      return this.userProfile.preferences?.hybrid ? 0.9 : 0.6;
    }

    // Verifica se localizações são compatíveis
    if (this.isLocationMatch(userLocation, jobLocation)) {
      return 1.0;
    }

    // Penalidade por localização incompatível
    return 0.3;
  }

  /**
   * Verifica se localizações são compatíveis
   */
  isLocationMatch(userLocation, jobLocation) {
    // Match exato
    if (userLocation === jobLocation) {
      return true;
    }

    // Verifica se estão na mesma cidade/estado
    const userParts = userLocation.split(',').map(part => part.trim());
    const jobParts = jobLocation.split(',').map(part => part.trim());

    // Verifica interseção
    return userParts.some(userPart => 
      jobParts.some(jobPart => 
        userPart.includes(jobPart) || jobPart.includes(userPart)
      )
    );
  }

  /**
   * Calcula compatibilidade de tipo de trabalho
   */
  calculateJobTypeMatch(jobData) {
    if (!this.userProfile.preferences?.jobTypes) {
      return 0.7; // Score neutro se preferências não especificadas
    }

    const preferredTypes = this.userProfile.preferences.jobTypes.map(type => 
      type.toLowerCase()
    );

    // Detecta tipo de trabalho na vaga
    const jobType = this.detectJobType(jobData);

    if (preferredTypes.includes(jobType)) {
      return 1.0;
    }

    // Score parcial para tipos relacionados
    const relatedTypes = this.getRelatedJobTypes(jobType);
    const hasRelated = preferredTypes.some(type => 
      relatedTypes.includes(type)
    );

    return hasRelated ? 0.7 : 0.4;
  }

  /**
   * Detecta tipo de trabalho
   */
  detectJobType(jobData) {
    const text = `${jobData.title} ${jobData.description}`.toLowerCase();

    if (text.includes('desenvolvedor') || text.includes('developer')) {
      return 'developer';
    } else if (text.includes('analista')) {
      return 'analyst';
    } else if (text.includes('gerente') || text.includes('manager')) {
      return 'manager';
    } else if (text.includes('designer')) {
      return 'designer';
    } else if (text.includes('consultor')) {
      return 'consultant';
    }

    return 'other';
  }

  /**
   * Obtém tipos de trabalho relacionados
   */
  getRelatedJobTypes(jobType) {
    const relations = {
      'developer': ['analyst', 'consultant'],
      'analyst': ['developer', 'consultant'],
      'manager': ['consultant', 'analyst'],
      'designer': ['developer'],
      'consultant': ['analyst', 'manager']
    };

    return relations[jobType] || [];
  }

  /**
   * Calcula compatibilidade de senioridade
   */
  calculateSeniorityMatch(jobData) {
    const userSeniority = this.getUserSeniority();
    const jobSeniority = this.detectJobSeniority(jobData);

    if (userSeniority === jobSeniority) {
      return 1.0;
    }

    // Matriz de compatibilidade entre níveis
    const compatibility = {
      'junior': { 'junior': 1.0, 'pleno': 0.7, 'senior': 0.3 },
      'pleno': { 'junior': 0.8, 'pleno': 1.0, 'senior': 0.8 },
      'senior': { 'junior': 0.5, 'pleno': 0.9, 'senior': 1.0 }
    };

    return compatibility[userSeniority]?.[jobSeniority] || 0.5;
  }

  /**
   * Determina senioridade do usuário
   */
  getUserSeniority() {
    const experience = this.calculateTotalExperience();

    if (experience >= 5) {
      return 'senior';
    } else if (experience >= 2) {
      return 'pleno';
    } else {
      return 'junior';
    }
  }

  /**
   * Detecta senioridade da vaga
   */
  detectJobSeniority(jobData) {
    const text = `${jobData.title} ${jobData.description}`.toLowerCase();

    if (text.includes('senior') || text.includes('sênior')) {
      return 'senior';
    } else if (text.includes('pleno') || text.includes('mid-level')) {
      return 'pleno';
    } else if (text.includes('júnior') || text.includes('junior') || text.includes('entry')) {
      return 'junior';
    }

    // Inferir baseado na experiência requerida
    const requiredExp = this.extractRequiredExperience(jobData);
    if (requiredExp >= 5) {
      return 'senior';
    } else if (requiredExp >= 2) {
      return 'pleno';
    } else {
      return 'junior';
    }
  }

  /**
   * Calcula compatibilidade de palavras-chave
   */
  calculateKeywordsMatch(jobData) {
    if (!this.userProfile.preferences?.mustHaveKeywords) {
      return 0.5; // Score neutro se não há palavras-chave obrigatórias
    }

    const keywords = this.userProfile.preferences.mustHaveKeywords;
    const jobText = `${jobData.title} ${jobData.description}`.toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
      if (jobText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return keywords.length > 0 ? matchCount / keywords.length : 0.5;
  }

  /**
   * Aplica bônus e penalidades
   */
  applyBonusesAndPenalties(baseScore, factors, jobData) {
    let adjustedScore = baseScore;

    // Bônus por alta compatibilidade de skills
    if (factors.skills > 0.8) {
      adjustedScore += 0.05;
    }

    // Penalidade por baixa compatibilidade de skills
    if (factors.skills < this.config.minSkillMatch) {
      adjustedScore *= 0.8;
    }

    // Bônus por trabalho remoto se preferido
    if (jobData.remote && this.userProfile.preferences?.remote) {
      adjustedScore += 0.03;
    }

    // Bônus por Easy Apply
    if (jobData.hasEasyApply) {
      adjustedScore += 0.02;
    }

    return adjustedScore;
  }

  /**
   * Obtém fatores da última análise
   */
  getLastFactors() {
    return this.lastFactors;
  }

  /**
   * Gera explicação do score
   */
  generateExplanation(factors) {
    const explanations = [];

    if (factors.skills > 0.8) {
      explanations.push('Excelente compatibilidade de habilidades');
    } else if (factors.skills > 0.6) {
      explanations.push('Boa compatibilidade de habilidades');
    } else {
      explanations.push('Compatibilidade limitada de habilidades');
    }

    if (factors.experience > 0.8) {
      explanations.push('Experiência adequada para a vaga');
    } else if (factors.experience < 0.5) {
      explanations.push('Experiência pode ser insuficiente');
    }

    if (factors.location > 0.8) {
      explanations.push('Localização compatível');
    } else if (factors.location < 0.5) {
      explanations.push('Localização pode ser um desafio');
    }

    return explanations;
  }

  /**
   * Obtém sugestões de melhoria
   */
  getSuggestions(factors, jobData) {
    const suggestions = [];

    if (factors.skills < 0.6) {
      const missingSkills = this.getMissingSkills(jobData);
      if (missingSkills.length > 0) {
        suggestions.push(`Considere desenvolver: ${missingSkills.slice(0, 3).join(', ')}`);
      }
    }

    if (factors.experience < 0.5) {
      suggestions.push('Considere destacar projetos pessoais ou experiências relevantes');
    }

    if (factors.location < 0.5 && !jobData.remote) {
      suggestions.push('Verifique possibilidades de trabalho remoto ou híbrido');
    }

    return suggestions;
  }

  /**
   * Identifica habilidades em falta
   */
  getMissingSkills(jobData) {
    const userSkills = this.normalizeSkills(this.userProfile.skills || []);
    const jobSkills = this.extractJobSkills(jobData);

    return jobSkills.filter(skill => 
      !userSkills.some(userSkill => 
        this.isSkillMatch(userSkill, skill)
      )
    );
  }
}

// Exporta para uso global
if (typeof globalThis !== 'undefined') {
  globalThis.MatchingEngine = MatchingEngine;
}