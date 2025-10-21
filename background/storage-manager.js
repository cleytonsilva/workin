/**
 * WorkIn Extension - Storage Manager
 * Gerencia armazenamento seguro com IndexedDB e criptografia AES-256-GCM
 */

class StorageManager {
  constructor() {
    this.dbName = 'WorkInDB';
    this.dbVersion = 1;
    this.db = null;
    this.cryptoService = new CryptoService();
    this.isInitialized = false;
  }

  /**
   * Inicializa o storage manager
   */
  async init() {
    if (this.isInitialized) return;

    try {
      await this.initDatabase();
      await this.cryptoService.init();
      this.isInitialized = true;
      console.log('Storage Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Storage Manager:', error);
      throw error;
    }
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para perfis de usuário
        if (!db.objectStoreNames.contains('userProfiles')) {
          const userStore = db.createObjectStore('userProfiles', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Store para vagas
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('company', 'company', { unique: false });
          jobStore.createIndex('title', 'title', { unique: false });
          jobStore.createIndex('publishedDate', 'publishedDate', { unique: false });
          jobStore.createIndex('source', 'source', { unique: false });
        }

        // Store para matches/scores
        if (!db.objectStoreNames.contains('matches')) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchStore.createIndex('jobId', 'jobId', { unique: true });
          matchStore.createIndex('score', 'score', { unique: false });
        }

        // Store para candidaturas
        if (!db.objectStoreNames.contains('applications')) {
          const appStore = db.createObjectStore('applications', { keyPath: 'id' });
          appStore.createIndex('jobId', 'jobId', { unique: true });
          appStore.createIndex('status', 'status', { unique: false });
          appStore.createIndex('appliedAt', 'appliedAt', { unique: false });
        }

        // Store para CVs
        if (!db.objectStoreNames.contains('cvs')) {
          const cvStore = db.createObjectStore('cvs', { keyPath: 'id' });
          cvStore.createIndex('name', 'name', { unique: false });
          cvStore.createIndex('isDefault', 'isDefault', { unique: false });
        }

        // Store para configurações
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Store para logs
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('level', 'level', { unique: false });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('action', 'action', { unique: false });
        }
      };
    });
  }

  /**
   * Salva dados criptografados
   */
  async saveEncrypted(storeName, data) {
    await this.ensureInitialized();
    
    try {
      const encryptedData = await this.cryptoService.encrypt(JSON.stringify(data));
      return await this.save(storeName, {
        ...data,
        encryptedData,
        isEncrypted: true
      });
    } catch (error) {
      console.error('Failed to save encrypted data:', error);
      throw error;
    }
  }

  /**
   * Carrega dados criptografados
   */
  async loadEncrypted(storeName, id) {
    await this.ensureInitialized();
    
    try {
      const data = await this.load(storeName, id);
      if (!data || !data.isEncrypted) {
        return data;
      }

      const decryptedString = await this.cryptoService.decrypt(data.encryptedData);
      const decryptedData = JSON.parse(decryptedString);
      
      return {
        ...data,
        ...decryptedData,
        isEncrypted: undefined,
        encryptedData: undefined
      };
    } catch (error) {
      console.error('Failed to load encrypted data:', error);
      throw error;
    }
  }

  /**
   * Salva dados no IndexedDB
   */
  async save(storeName, data) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Carrega dados do IndexedDB
   */
  async load(storeName, id) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Lista dados com filtros
   */
  async list(storeName, filters = {}) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        let results = request.result;
        
        // Aplica filtros
        if (Object.keys(filters).length > 0) {
          results = results.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
              if (Array.isArray(value)) {
                return value.includes(item[key]);
              }
              return item[key] === value;
            });
          });
        }
        
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove dados
   */
  async remove(storeName, id) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Salva perfil do usuário
   */
  async saveUserProfile(profile) {
    const profileData = {
      id: profile.id || 'default',
      ...profile,
      updatedAt: Date.now()
    };
    
    return await this.saveEncrypted('userProfiles', profileData);
  }

  /**
   * Carrega perfil do usuário
   */
  async getUserProfile(id = 'default') {
    const profile = await this.loadEncrypted('userProfiles', id);
    
    if (!profile) {
      // Retorna perfil padrão
      return this.getDefaultUserProfile();
    }
    
    return profile;
  }

  /**
   * Perfil padrão do usuário
   */
  getDefaultUserProfile() {
    return {
      id: 'default',
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      preferences: {
        jobTypes: [],
        locations: [],
        salaryRange: { min: 0, max: 0 },
        remote: false,
        hybrid: false
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Salva vaga
   */
  async saveJob(jobData) {
    const job = {
      id: jobData.id || WorkInUtils.StringUtils.generateId(),
      ...jobData,
      savedAt: Date.now()
    };
    
    return await this.save('jobs', job);
  }

  /**
   * Carrega vaga
   */
  async getJob(jobId) {
    return await this.load('jobs', jobId);
  }

  /**
   * Lista vagas
   */
  async getJobs(filters = {}) {
    const jobs = await this.list('jobs', filters);
    
    // Ordena por data de publicação (mais recentes primeiro)
    return jobs.sort((a, b) => (b.publishedDate || 0) - (a.publishedDate || 0));
  }

  /**
   * Salva match/score
   */
  async saveMatch(matchData) {
    const match = {
      id: matchData.id || WorkInUtils.StringUtils.generateId(),
      ...matchData
    };
    
    return await this.save('matches', match);
  }

  /**
   * Carrega match por job ID
   */
  async getMatchByJobId(jobId) {
    const matches = await this.list('matches', { jobId });
    return matches[0] || null;
  }

  /**
   * Salva candidatura
   */
  async saveApplication(applicationData) {
    const application = {
      id: applicationData.id || WorkInUtils.StringUtils.generateId(),
      ...applicationData
    };
    
    return await this.save('applications', application);
  }

  /**
   * Carrega candidatura por job ID
   */
  async getApplicationByJobId(jobId) {
    const applications = await this.list('applications', { jobId });
    return applications[0] || null;
  }

  /**
   * Lista candidaturas
   */
  async getApplications(filters = {}) {
    const applications = await this.list('applications', filters);
    
    // Ordena por data de candidatura (mais recentes primeiro)
    return applications.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));
  }

  /**
   * Atualiza status da vaga
   */
  async updateJobStatus(jobId, status) {
    const application = await this.getApplicationByJobId(jobId);
    
    if (application) {
      application.status = status;
      application.updatedAt = Date.now();
      return await this.save('applications', application);
    } else {
      // Cria nova candidatura
      return await this.saveApplication({
        jobId,
        status,
        appliedAt: Date.now()
      });
    }
  }

  /**
   * Salva CV
   */
  async saveCV(cvData) {
    const cv = {
      id: cvData.id || WorkInUtils.StringUtils.generateId(),
      ...cvData,
      savedAt: Date.now()
    };
    
    return await this.saveEncrypted('cvs', cv);
  }

  /**
   * Lista CVs
   */
  async getCVs() {
    const cvs = await this.list('cvs');
    
    // Descriptografa CVs
    const decryptedCVs = [];
    for (const cv of cvs) {
      if (cv.isEncrypted) {
        const decrypted = await this.loadEncrypted('cvs', cv.id);
        decryptedCVs.push(decrypted);
      } else {
        decryptedCVs.push(cv);
      }
    }
    
    return decryptedCVs.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }

  /**
   * Salva configurações
   */
  async saveSettings(settings) {
    const settingsData = {
      key: 'main',
      ...settings,
      updatedAt: Date.now()
    };
    
    return await this.save('settings', settingsData);
  }

  /**
   * Carrega configurações
   */
  async getSettings() {
    const settings = await this.load('settings', 'main');
    
    if (!settings) {
      return this.getDefaultSettings();
    }
    
    return settings;
  }

  /**
   * Configurações padrão
   */
  getDefaultSettings() {
    return {
      key: 'main',
      filters: {
        minScore: 60,
        mustHaveKeywords: [],
        excludeKeywords: [],
        excludeCompanies: []
      },
      automationLimits: {
        delayMin: 3000,
        delayMax: 8000,
        maxPerHour: 20,
        maxPerDay: 100
      },
      notifications: {
        newJobs: true,
        applications: true,
        errors: true
      },
      privacy: {
        encryptData: true,
        clearLogsAfterDays: 30
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Salva log
   */
  async saveLog(logData) {
    const log = {
      id: WorkInUtils.StringUtils.generateId(),
      timestamp: Date.now(),
      ...logData
    };
    
    return await this.save('logs', log);
  }

  /**
   * Lista logs
   */
  async getLogs(filters = {}) {
    const logs = await this.list('logs', filters);
    
    // Ordena por timestamp (mais recentes primeiro)
    return logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  /**
   * Obtém estatísticas
   */
  async getStats() {
    try {
      const [jobs, applications, matches] = await Promise.all([
        this.getJobs(),
        this.getApplications(),
        this.list('matches')
      ]);

      const stats = {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        totalMatches: matches.length,
        
        // Estatísticas de candidaturas
        applicationStats: {
          applied: applications.filter(app => app.status === 'applied').length,
          pending: applications.filter(app => app.status === 'pending').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
          interview: applications.filter(app => app.status === 'interview').length
        },
        
        // Estatísticas de scores
        scoreStats: {
          averageScore: matches.length > 0 
            ? Math.round(matches.reduce((sum, match) => sum + match.score, 0) / matches.length)
            : 0,
          highScoreJobs: matches.filter(match => match.score >= 80).length,
          mediumScoreJobs: matches.filter(match => match.score >= 60 && match.score < 80).length,
          lowScoreJobs: matches.filter(match => match.score < 60).length
        },
        
        // Estatísticas temporais
        recentActivity: {
          jobsThisWeek: jobs.filter(job => 
            job.savedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length,
          applicationsThisWeek: applications.filter(app => 
            app.appliedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length
        }
      };

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {};
    }
  }

  /**
   * Limpeza de dados antigos
   */
  async cleanup() {
    try {
      const settings = await this.getSettings();
      const cutoffDate = Date.now() - (settings.privacy.clearLogsAfterDays * 24 * 60 * 60 * 1000);
      
      // Remove logs antigos
      const oldLogs = await this.list('logs');
      for (const log of oldLogs) {
        if (log.timestamp < cutoffDate) {
          await this.remove('logs', log.id);
        }
      }
      
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Backup de dados
   */
  async backup() {
    try {
      const data = {
        userProfiles: await this.list('userProfiles'),
        jobs: await this.list('jobs'),
        applications: await this.list('applications'),
        matches: await this.list('matches'),
        cvs: await this.list('cvs'),
        settings: await this.list('settings'),
        timestamp: Date.now()
      };
      
      // Salva backup no Chrome Storage
      await chrome.storage.local.set({
        'workin_backup': data
      });
      
      console.log('Backup completed');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  /**
   * Restaura backup
   */
  async restore() {
    try {
      const result = await chrome.storage.local.get('workin_backup');
      const backup = result.workin_backup;
      
      if (!backup) {
        throw new Error('No backup found');
      }
      
      // Restaura dados
      for (const [storeName, items] of Object.entries(backup)) {
        if (storeName === 'timestamp') continue;
        
        for (const item of items) {
          await this.save(storeName, item);
        }
      }
      
      console.log('Restore completed');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * Garante que o storage está inicializado
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }
}

/**
 * Serviço de criptografia AES-256-GCM
 */
class CryptoService {
  constructor() {
    this.key = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa o serviço de criptografia
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Tenta carregar chave existente
      const result = await chrome.storage.local.get('workin_crypto_key');
      
      if (result.workin_crypto_key) {
        // Importa chave existente
        this.key = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(result.workin_crypto_key),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Gera nova chave
        this.key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Salva chave
        const keyData = await crypto.subtle.exportKey('raw', this.key);
        await chrome.storage.local.set({
          'workin_crypto_key': Array.from(new Uint8Array(keyData))
        });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize crypto service:', error);
      throw error;
    }
  }

  /**
   * Criptografa dados
   */
  async encrypt(data) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Gera IV aleatório
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Criptografa
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        dataBuffer
      );
      
      // Combina IV + dados criptografados
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return Array.from(result);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Descriptografa dados
   */
  async decrypt(encryptedData) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const dataArray = new Uint8Array(encryptedData);
      
      // Extrai IV e dados
      const iv = dataArray.slice(0, 12);
      const encrypted = dataArray.slice(12);
      
      // Descriptografa
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
}

// Exporta para uso global
if (typeof globalThis !== 'undefined') {
  globalThis.StorageManager = StorageManager;
  globalThis.CryptoService = CryptoService;
}