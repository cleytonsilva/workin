/**
 * WorkIn Extension - Shared Types and Interfaces
 * Definições de tipos baseadas na arquitetura técnica
 */

// Enums e constantes
const SENIORITY_LEVELS = {
  JUNIOR: 'junior',
  MID: 'mid', 
  SENIOR: 'senior',
  LEAD: 'lead',
  MANAGER: 'manager'
};

const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  VIEWED: 'viewed',
  CONTACTED: 'contacted',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  OFFER: 'offer'
};

const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

const JOB_SOURCES = {
  LINKEDIN: 'linkedin'
};

// Estruturas de dados principais

/**
 * Perfil do usuário
 * @typedef {Object} UserProfile
 * @property {string} id - ID único do perfil
 * @property {string} name - Nome completo
 * @property {string} title - Título profissional
 * @property {string} location - Localização
 * @property {string} seniority - Nível de senioridade
 * @property {string[]} skills - Lista de habilidades
 * @property {string[]} languages - Lista de idiomas
 * @property {Education[]} education - Formação acadêmica
 * @property {Experience[]} experience - Experiência profissional
 * @property {number} createdAt - Timestamp de criação
 * @property {number} updatedAt - Timestamp de atualização
 */

/**
 * Vaga de emprego
 * @typedef {Object} Job
 * @property {string} id - ID único da vaga
 * @property {string} url - URL da vaga no LinkedIn
 * @property {string} title - Título da vaga
 * @property {string} company - Nome da empresa
 * @property {string} location - Localização da vaga
 * @property {boolean} remote - Se é remoto
 * @property {boolean} hybrid - Se é híbrido
 * @property {string[]} requirements - Requisitos da vaga
 * @property {string} description - Descrição completa
 * @property {number} publishedDate - Data de publicação
 * @property {string} source - Fonte da vaga
 * @property {number} extractedAt - Timestamp de extração
 */

/**
 * Compatibilidade entre perfil e vaga
 * @typedef {Object} Match
 * @property {string} jobId - ID da vaga
 * @property {string} profileId - ID do perfil
 * @property {number} score - Score de 0-100
 * @property {MatchReasons} reasons - Justificativas do score
 * @property {number} calculatedAt - Timestamp do cálculo
 */

/**
 * Razões do match
 * @typedef {Object} MatchReasons
 * @property {SkillMatch[]} skillMatches - Matches de habilidades
 * @property {number} locationMatch - Match de localização
 * @property {number} seniorityMatch - Match de senioridade
 * @property {number} languageMatch - Match de idiomas
 * @property {string[]} keywordMatches - Palavras-chave encontradas
 * @property {string[]} gaps - Lacunas identificadas
 */

/**
 * Match de habilidade
 * @typedef {Object} SkillMatch
 * @property {string} skill - Nome da habilidade
 * @property {number} match - Nível de match (0-100)
 */

/**
 * Candidatura
 * @typedef {Object} Application
 * @property {string} id - ID único da candidatura
 * @property {string} jobId - ID da vaga
 * @property {string} profileId - ID do perfil
 * @property {string} [cvId] - ID do CV usado
 * @property {string} [coverLetterId] - ID da carta de apresentação
 * @property {string} status - Status da candidatura
 * @property {QuestionResponse[]} responses - Respostas a perguntas
 * @property {number} submittedAt - Timestamp de submissão
 * @property {string} [error] - Erro ocorrido
 * @property {string} [notes] - Notas do usuário
 * @property {string[]} tags - Tags da candidatura
 */

/**
 * Resposta a pergunta
 * @typedef {Object} QuestionResponse
 * @property {string} id - ID da resposta
 * @property {string} applicationId - ID da candidatura
 * @property {string} question - Pergunta feita
 * @property {string} response - Resposta dada
 * @property {string} type - Tipo da pergunta
 */

/**
 * Currículo
 * @typedef {Object} CV
 * @property {string} id - ID único do CV
 * @property {string} profileId - ID do perfil
 * @property {string} name - Nome do CV
 * @property {string} [filePath] - Caminho do arquivo
 * @property {Blob} [content] - Conteúdo criptografado
 * @property {number} createdAt - Timestamp de criação
 */

/**
 * Configurações do sistema
 * @typedef {Object} Settings
 * @property {MatchingWeights} matchingWeights - Pesos para cálculo de match
 * @property {AutomationLimits} automationLimits - Limites de automação
 * @property {PrivacySettings} privacySettings - Configurações de privacidade
 * @property {Filters} filters - Filtros de candidatura
 */

/**
 * Pesos para matching
 * @typedef {Object} MatchingWeights
 * @property {number} skill - Peso das habilidades
 * @property {number} location - Peso da localização
 * @property {number} seniority - Peso da senioridade
 * @property {number} language - Peso dos idiomas
 */

/**
 * Limites de automação
 * @typedef {Object} AutomationLimits
 * @property {number} delayMin - Delay mínimo entre ações (ms)
 * @property {number} delayMax - Delay máximo entre ações (ms)
 * @property {number} maxPerHour - Máximo de candidaturas por hora
 * @property {WorkingHours} workingHours - Horário de funcionamento
 */

/**
 * Horário de funcionamento
 * @typedef {Object} WorkingHours
 * @property {string} start - Hora de início (HH:MM)
 * @property {string} end - Hora de fim (HH:MM)
 */

/**
 * Configurações de privacidade
 * @typedef {Object} PrivacySettings
 * @property {boolean} encryptionEnabled - Se criptografia está ativa
 * @property {boolean} telemetryEnabled - Se telemetria está ativa
 * @property {boolean} backupEnabled - Se backup está ativo
 */

/**
 * Filtros de candidatura
 * @typedef {Object} Filters
 * @property {number} minScore - Score mínimo para candidatura
 * @property {string[]} mustHaveKeywords - Palavras-chave obrigatórias
 * @property {string[]} excludeKeywords - Palavras-chave a excluir
 * @property {string[]} excludeCompanies - Empresas a excluir
 */

/**
 * Dados criptografados
 * @typedef {Object} EncryptedData
 * @property {number[]} data - Dados criptografados
 * @property {number[]} iv - Vetor de inicialização
 * @property {string} algorithm - Algoritmo usado
 */

/**
 * Log do sistema
 * @typedef {Object} LogEntry
 * @property {string} id - ID único do log
 * @property {string} level - Nível do log
 * @property {string} message - Mensagem
 * @property {Object} [context] - Contexto adicional
 * @property {number} timestamp - Timestamp
 */

/**
 * Educação
 * @typedef {Object} Education
 * @property {string} institution - Instituição
 * @property {string} degree - Grau/Curso
 * @property {string} field - Área de estudo
 * @property {number} startYear - Ano de início
 * @property {number} [endYear] - Ano de fim
 */

/**
 * Experiência profissional
 * @typedef {Object} Experience
 * @property {string} company - Empresa
 * @property {string} title - Cargo
 * @property {string} description - Descrição
 * @property {number} startDate - Data de início
 * @property {number} [endDate] - Data de fim
 * @property {boolean} current - Se é o emprego atual
 */

// Exportar constantes e tipos para uso global
if (typeof window !== 'undefined') {
  window.WorkInTypes = {
    SENIORITY_LEVELS,
    APPLICATION_STATUS,
    LOG_LEVELS,
    JOB_SOURCES
  };
}

// Também expõe em contextos sem window (ex.: Service Worker)
try {
  if (typeof globalThis !== 'undefined') {
    globalThis.WorkInTypes = {
      SENIORITY_LEVELS,
      APPLICATION_STATUS,
      LOG_LEVELS,
      JOB_SOURCES
    };
  }
} catch (_) { /* noop */ }
