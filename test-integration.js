/**
 * WorkIn Extension - Integration Test
 * Teste de integração para verificar o fluxo completo
 */

class WorkInIntegrationTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Executa todos os testes de integração
   */
  async runAllTests() {
    if (this.isRunning) {
      console.log('Teste já em execução');
      return;
    }

    this.isRunning = true;
    this.testResults = [];

    console.log('🚀 Iniciando testes de integração WorkIn...');

    try {
      // Teste 1: Verificar módulos carregados
      await this.testModuleLoading();

      // Teste 2: Verificar configurações
      await this.testConfiguration();

      // Teste 3: Verificar segurança
      await this.testSafetyChecks();

      // Teste 4: Verificar comunicação entre módulos
      await this.testModuleCommunication();

      // Teste 5: Verificar storage
      await this.testStorageOperations();

      // Teste 6: Verificar UI
      await this.testUIComponents();

      // Relatório final
      this.generateReport();

    } catch (error) {
      console.error('❌ Erro durante testes:', error);
      this.addTestResult('ERRO_GERAL', false, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Testa carregamento de módulos
   */
  async testModuleLoading() {
    console.log('📦 Testando carregamento de módulos...');

    const modules = [
      { name: 'WorkInJobScraper', obj: window.WorkInJobScraper },
      { name: 'WorkInSafetyManager', obj: window.WorkInSafetyManager },
      { name: 'WorkInUtils', obj: window.WorkInUtils }
    ];

    for (const module of modules) {
      const loaded = module.obj !== undefined;
      this.addTestResult(`MODULE_${module.name}`, loaded, 
        loaded ? 'Módulo carregado' : 'Módulo não encontrado');
    }
  }

  /**
   * Testa configurações
   */
  async testConfiguration() {
    console.log('⚙️ Testando configurações...');

    try {
      // Verificar manifest
      const manifest = chrome.runtime.getManifest();
      const hasRequiredPermissions = manifest.permissions.includes('scripting') &&
                                   manifest.permissions.includes('tabs') &&
                                   manifest.permissions.includes('storage');

      this.addTestResult('MANIFEST_PERMISSIONS', hasRequiredPermissions,
        hasRequiredPermissions ? 'Permissões corretas' : 'Permissões faltando');

      // Verificar content scripts
      const hasContentScripts = manifest.content_scripts && 
                               manifest.content_scripts.length > 0;

      this.addTestResult('CONTENT_SCRIPTS', hasContentScripts,
        hasContentScripts ? 'Content scripts configurados' : 'Content scripts faltando');

    } catch (error) {
      this.addTestResult('CONFIGURATION', false, error.message);
    }
  }

  /**
   * Testa verificações de segurança
   */
  async testSafetyChecks() {
    console.log('🔒 Testando verificações de segurança...');

    if (!window.WorkInSafetyManager) {
      this.addTestResult('SAFETY_MANAGER', false, 'SafetyManager não carregado');
      return;
    }

    try {
      const safetyCheck = await window.WorkInSafetyManager.checkSafety('test');
      
      this.addTestResult('SAFETY_CHECK', true, 
        `Verificação de segurança: ${safetyCheck.safe ? 'OK' : safetyCheck.reason}`);

      // Testar registro de operação
      await window.WorkInSafetyManager.recordOperation('test', { test: true });
      
      this.addTestResult('SAFETY_RECORD', true, 'Operação registrada com sucesso');

    } catch (error) {
      this.addTestResult('SAFETY_CHECKS', false, error.message);
    }
  }

  /**
   * Testa comunicação entre módulos
   */
  async testModuleCommunication() {
    console.log('📡 Testando comunicação entre módulos...');

    try {
      // Testar comunicação com service worker
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      
      this.addTestResult('SERVICE_WORKER_COMM', response !== undefined,
        response ? 'Comunicação com SW OK' : 'Falha na comunicação');

      // Testar comunicação com content script (se estivermos em uma aba)
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url.includes('linkedin.com')) {
        try {
          const contentResponse = await chrome.tabs.sendMessage(tab.id, { 
            action: 'getCollectionStatus' 
          });
          
          this.addTestResult('CONTENT_SCRIPT_COMM', true, 
            'Comunicação com content script OK');
        } catch (error) {
          this.addTestResult('CONTENT_SCRIPT_COMM', false, 
            'Falha na comunicação com content script');
        }
      } else {
        this.addTestResult('CONTENT_SCRIPT_COMM', true, 
          'Não em página do LinkedIn - teste ignorado');
      }

    } catch (error) {
      this.addTestResult('MODULE_COMMUNICATION', false, error.message);
    }
  }

  /**
   * Testa operações de storage
   */
  async testStorageOperations() {
    console.log('💾 Testando operações de storage...');

    try {
      // Testar escrita
      const testData = { test: true, timestamp: Date.now() };
      await chrome.storage.local.set({ integrationTest: testData });

      // Testar leitura
      const result = await chrome.storage.local.get(['integrationTest']);
      
      const writeReadOK = result.integrationTest && 
                         result.integrationTest.test === true;

      this.addTestResult('STORAGE_WRITE_READ', writeReadOK,
        writeReadOK ? 'Storage OK' : 'Falha no storage');

      // Limpar dados de teste
      await chrome.storage.local.remove(['integrationTest']);

    } catch (error) {
      this.addTestResult('STORAGE_OPERATIONS', false, error.message);
    }
  }

  /**
   * Testa componentes da UI
   */
  async testUIComponents() {
    console.log('🎨 Testando componentes da UI...');

    try {
      // Verificar se estamos no popup
      if (window.location.pathname.includes('popup.html')) {
        const requiredElements = [
          'collectJobsBtn',
          'toggleAutoApply',
          'autoApplyBtn',
          'scanPageBtn'
        ];

        let allElementsFound = true;
        const missingElements = [];

        for (const elementId of requiredElements) {
          const element = document.getElementById(elementId);
          if (!element) {
            allElementsFound = false;
            missingElements.push(elementId);
          }
        }

        this.addTestResult('UI_ELEMENTS', allElementsFound,
          allElementsFound ? 'Todos os elementos encontrados' : 
          `Elementos faltando: ${missingElements.join(', ')}`);

      } else {
        this.addTestResult('UI_ELEMENTS', true, 
          'Não no popup - teste ignorado');
      }

    } catch (error) {
      this.addTestResult('UI_COMPONENTS', false, error.message);
    }
  }

  /**
   * Adiciona resultado de teste
   */
  addTestResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString()
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    console.log('\n📊 RELATÓRIO DE TESTES DE INTEGRAÇÃO');
    console.log('=====================================');
    console.log(`Total de testes: ${totalTests}`);
    console.log(`✅ Aprovados: ${passedTests}`);
    console.log(`❌ Falharam: ${failedTests}`);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    if (failedTests > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
    }

    if (successRate >= 80) {
      console.log('\n🎉 Sistema funcionando bem!');
    } else if (successRate >= 60) {
      console.log('\n⚠️ Sistema com alguns problemas');
    } else {
      console.log('\n🚨 Sistema com problemas críticos');
    }

    // Salvar relatório
    this.saveTestReport();
  }

  /**
   * Salva relatório de testes
   */
  async saveTestReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.passed).length,
        failedTests: this.testResults.filter(r => !r.passed).length,
        successRate: this.testResults.length > 0 ? 
          (this.testResults.filter(r => r.passed).length / this.testResults.length * 100).toFixed(1) : 0,
        results: this.testResults
      };

      await chrome.storage.local.set({ 
        integrationTestReport: report 
      });

      console.log('📄 Relatório salvo no storage');

    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  }

  /**
   * Executa teste rápido
   */
  async quickTest() {
    console.log('⚡ Executando teste rápido...');
    
    const quickTests = [
      () => this.testModuleLoading(),
      () => this.testConfiguration(),
      () => this.testSafetyChecks()
    ];

    for (const test of quickTests) {
      try {
        await test();
      } catch (error) {
        console.error('Erro no teste rápido:', error);
      }
    }

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`⚡ Teste rápido: ${passed}/${total} aprovados`);
    
    return { passed, total };
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WorkInIntegrationTest = WorkInIntegrationTest;
}

// Auto-executar teste rápido se estivermos no popup
if (typeof window !== 'undefined' && window.location.pathname.includes('popup.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tester = new WorkInIntegrationTest();
      tester.quickTest();
    }, 2000); // Aguardar 2s para carregar tudo
  });
}
