/**
 * Jest Setup File for WorkIn Extension
 * Global test configuration and mocks
 */

// Mock Chrome Extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false)
    },
    connect: jest.fn(() => ({
      postMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      },
      onDisconnect: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    })),
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id',
    lastError: null
  },
  
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => result[key] = null);
        } else if (typeof keys === 'string') {
          result[keys] = null;
        } else if (typeof keys === 'object') {
          Object.assign(result, keys);
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      getBytesInUse: jest.fn((keys, callback) => {
        if (callback) callback(0);
        return Promise.resolve(0);
      })
    },
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      const tabs = [{
        id: 1,
        url: 'https://www.linkedin.com/jobs/search',
        title: 'LinkedIn Jobs',
        active: true,
        windowId: 1
      }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    }),
    get: jest.fn((tabId, callback) => {
      const tab = {
        id: tabId,
        url: 'https://www.linkedin.com/jobs/view/123',
        title: 'Job Title - Company | LinkedIn',
        active: true,
        windowId: 1
      };
      if (callback) callback(tab);
      return Promise.resolve(tab);
    }),
    create: jest.fn((createProperties, callback) => {
      const tab = {
        id: Math.floor(Math.random() * 1000),
        url: createProperties.url,
        title: 'New Tab',
        active: createProperties.active || false,
        windowId: 1
      };
      if (callback) callback(tab);
      return Promise.resolve(tab);
    }),
    update: jest.fn((tabId, updateProperties, callback) => {
      const tab = {
        id: tabId,
        url: updateProperties.url || 'https://example.com',
        title: 'Updated Tab',
        active: updateProperties.active || false,
        windowId: 1
      };
      if (callback) callback(tab);
      return Promise.resolve(tab);
    }),
    executeScript: jest.fn((tabId, details, callback) => {
      const result = [{ success: true }];
      if (callback) callback(result);
      return Promise.resolve(result);
    }),
    insertCSS: jest.fn((tabId, details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  },
  
  scripting: {
    executeScript: jest.fn((injection) => {
      return Promise.resolve([{ result: { success: true } }]);
    }),
    insertCSS: jest.fn((injection) => {
      return Promise.resolve();
    }),
    removeCSS: jest.fn((injection) => {
      return Promise.resolve();
    })
  },
  
  action: {
    setBadgeText: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    setBadgeBackgroundColor: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    setIcon: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    setTitle: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    setPopup: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  },
  
  alarms: {
    create: jest.fn((name, alarmInfo) => {}),
    clear: jest.fn((name, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
    clearAll: jest.fn((callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
    get: jest.fn((name, callback) => {
      if (callback) callback(null);
      return Promise.resolve(null);
    }),
    getAll: jest.fn((callback) => {
      if (callback) callback([]);
      return Promise.resolve([]);
    }),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false)
    }
  },
  
  permissions: {
    contains: jest.fn((permissions, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
    request: jest.fn((permissions, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    }),
    remove: jest.fn((permissions, callback) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    })
  }
};

// Mock Web APIs
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          put: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          getAll: jest.fn(),
          createIndex: jest.fn(),
          index: jest.fn()
        }))
      })),
      close: jest.fn()
    }
  })),
  deleteDatabase: jest.fn()
};

// Mock Crypto API
global.crypto = {
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })),
  subtle: {
    generateKey: jest.fn(() => Promise.resolve({})),
    importKey: jest.fn(() => Promise.resolve({})),
    exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    sign: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    verify: jest.fn(() => Promise.resolve(true)),
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(0)))
  }
};

// Mock Performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock DOM APIs
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn((index) => null)
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn((index) => null)
};
global.sessionStorage = sessionStorageMock;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock URL constructor
global.URL = jest.fn((url, base) => ({
  href: url,
  origin: 'https://example.com',
  protocol: 'https:',
  host: 'example.com',
  hostname: 'example.com',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  toString: () => url
}));

// Mock URLSearchParams
global.URLSearchParams = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  toString: jest.fn(() => ''),
  entries: jest.fn(() => []),
  keys: jest.fn(() => []),
  values: jest.fn(() => [])
}));

// Mock TextEncoder/TextDecoder
global.TextEncoder = jest.fn(() => ({
  encode: jest.fn((text) => new Uint8Array(Buffer.from(text, 'utf8')))
}));

global.TextDecoder = jest.fn(() => ({
  decode: jest.fn((buffer) => Buffer.from(buffer).toString('utf8'))
}));

// Mock File API
global.File = jest.fn();
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  onload: null,
  onerror: null,
  result: null
}));

// Mock Blob
global.Blob = jest.fn((parts, options) => ({
  size: parts ? parts.join('').length : 0,
  type: options?.type || '',
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(() => Promise.resolve('')),
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0)))
}));

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset chrome.runtime.lastError
  chrome.runtime.lastError = null;
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create mock job data
  createMockJob: (overrides = {}) => ({
    id: 'job-123',
    title: 'JavaScript Developer',
    company: 'Tech Corp',
    location: 'São Paulo, SP',
    url: 'https://linkedin.com/jobs/view/123',
    description: 'Great opportunity for a JavaScript developer...',
    isEasyApply: true,
    isRemote: false,
    isHybrid: true,
    requirements: ['JavaScript', 'React', 'Node.js'],
    postedDate: new Date().toISOString(),
    extractedAt: Date.now(),
    ...overrides
  }),
  
  // Helper to create mock user profile
  createMockUserProfile: (overrides = {}) => ({
    personalInfo: {
      fullName: 'João Silva',
      email: 'joao@example.com',
      phone: '+55 11 99999-9999',
      location: 'São Paulo, SP',
      linkedinUrl: 'https://linkedin.com/in/joao-silva'
    },
    professional: {
      currentPosition: 'Senior Developer',
      yearsOfExperience: 5,
      seniority: 'SENIOR',
      skills: ['JavaScript', 'React', 'Node.js'],
      preferredJobTypes: ['FULL_TIME', 'REMOTE'],
      preferredLocations: ['São Paulo', 'Remote'],
      salaryExpectation: {
        min: 8000,
        max: 12000,
        currency: 'BRL'
      }
    },
    ...overrides
  }),
  
  // Helper to wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to trigger DOM events
  triggerEvent: (element, eventType, eventData = {}) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    Object.assign(event, eventData);
    element.dispatchEvent(event);
  }
};

// Suppress console warnings in tests unless explicitly testing them
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes && args[0].includes('Warning:')) {
    return;
  }
  originalWarn(...args);
};