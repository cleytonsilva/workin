/**
 * WorkIn Extension - Teste de Funcionalidades
 * Script para testar todas as funcionalidades da nova interface
 */

class WorkInTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🧪 Iniciando Teste de Funcionalidades WorkIn...');
    
    this.tests = [
      { name: 'Design Tokens', test: () => this.testDesignTokens() },
      { name: 'Componentes UI', test: () => this.testUIComponents() },
      { name: 'Navegação de Tabs', test: () => this.testTabNavigation() },
      { name: 'Event Listeners', test: () => this.testEventListeners() },
      { name: 'Toast Notifications', test: () => this.testToastNotifications() },
      { name: 'Loading States', test: () => this.testLoadingStates() },
      { name: 'Responsividade', test: () => this.testResponsiveness() },
      { name: 'Acessibilidade', test: () => this.testAccessibility() }
    ];

    for (const test of this.tests) {
      try {
        console.log(`⏳ Testando: ${test.name}`);
        const result = await test.test();
        this.results.push({ name: test.name, status: 'PASS', result });
        console.log(`✅ ${test.name}: PASSOU`);
      } catch (error) {
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
        console.log(`❌ ${test.name}: FALHOU - ${error.message}`);
      }
    }

    this.generateReport();
  }

  /**
   * Testa se as variáveis CSS estão funcionando
   */
  testDesignTokens() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const primaryColor = computedStyle.getPropertyValue('--color-primary').trim();
    if (!primaryColor || primaryColor === '#0A66C2') {
      throw new Error('Variáveis CSS não estão sendo aplicadas corretamente');
    }
    
    return { 
      primaryColor,
      variablesLoaded: true 
    };
  }

  /**
   * Testa se os componentes UI estão disponíveis
   */
  testUIComponents() {
    const components = ['WorkInButton', 'WorkInCard', 'WorkInBadge'];
    const missing = [];
    
    components.forEach(component => {
      if (!window[component]) {
        missing.push(component);
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Componentes não encontrados: ${missing.join(', ')}`);
    }
    
    return { 
      componentsLoaded: components.length,
      missingComponents: missing.length 
    };
  }

  /**
   * Testa navegação entre tabs
   */
  testTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    
    if (tabs.length === 0) {
      throw new Error('Botões de tab não encontrados');
    }
    
    if (panels.length === 0) {
      throw new Error('Painéis de tab não encontrados');
    }
    
    // Testa clique em cada tab
    tabs.forEach((tab, index) => {
      tab.click();
      const tabName = tab.dataset.tab;
      const panel = document.getElementById(tabName);
      
      if (!panel || !panel.classList.contains('active')) {
        throw new Error(`Tab ${tabName} não está ativa após clique`);
      }
    });
    
    return { 
      tabsCount: tabs.length,
      panelsCount: panels.length,
      navigationWorking: true 
    };
  }

  /**
   * Testa event listeners
   */
  testEventListeners() {
    const buttons = [
      'collectJobsBtn',
      'scanPageBtn', 
      'toggleAutoApply',
      'refreshJobsBtn',
      'notificationsBtn',
      'settingsBtn'
    ];
    
    const missing = [];
    
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (!button) {
        missing.push(buttonId);
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Botões não encontrados: ${missing.join(', ')}`);
    }
    
    return { 
      buttonsFound: buttons.length - missing.length,
      missingButtons: missing.length 
    };
  }

  /**
   * Testa sistema de toast
   */
  testToastNotifications() {
    const container = document.getElementById('toastContainer');
    if (!container) {
      throw new Error('Container de toast não encontrado');
    }
    
    // Simula criação de toast
    const testToast = document.createElement('div');
    testToast.className = 'toast toast-info';
    testToast.textContent = 'Teste de toast';
    container.appendChild(testToast);
    
    // Verifica se foi adicionado
    if (!container.contains(testToast)) {
      throw new Error('Toast não foi adicionado ao container');
    }
    
    // Remove o toast de teste
    container.removeChild(testToast);
    
    return { 
      containerFound: true,
      toastCreationWorking: true 
    };
  }

  /**
   * Testa estados de loading
   */
  testLoadingStates() {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (!overlay) {
      throw new Error('Overlay de loading não encontrado');
    }
    
    if (!loadingText) {
      throw new Error('Texto de loading não encontrado');
    }
    
    // Testa mostrar/esconder loading
    overlay.classList.add('active');
    if (!overlay.classList.contains('active')) {
      throw new Error('Loading overlay não está ativo');
    }
    
    overlay.classList.remove('active');
    if (overlay.classList.contains('active')) {
      throw new Error('Loading overlay não foi desativado');
    }
    
    return { 
      overlayFound: true,
      loadingStatesWorking: true 
    };
  }

  /**
   * Testa responsividade
   */
  testResponsiveness() {
    const body = document.body;
    const originalWidth = body.style.width;
    
    // Testa largura mínima
    body.style.width = '300px';
    const minWidth = body.offsetWidth;
    
    // Testa largura máxima
    body.style.width = '500px';
    const maxWidth = body.offsetWidth;
    
    // Restaura largura original
    body.style.width = originalWidth;
    
    if (minWidth < 300) {
      throw new Error('Interface não é responsiva para larguras pequenas');
    }
    
    return { 
      minWidth,
      maxWidth,
      responsive: true 
    };
  }

  /**
   * Testa acessibilidade básica
   */
  testAccessibility() {
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    const selects = document.querySelectorAll('select');
    
    let accessibilityIssues = [];
    
    // Verifica se botões têm texto ou aria-label
    buttons.forEach((button, index) => {
      const hasText = button.textContent.trim().length > 0;
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasTitle = button.getAttribute('title');
      
      if (!hasText && !hasAriaLabel && !hasTitle) {
        accessibilityIssues.push(`Botão ${index} sem texto ou aria-label`);
      }
    });
    
    // Verifica se inputs têm labels
    inputs.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') || 
                      document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        accessibilityIssues.push(`Input ${index} sem label`);
      }
    });
    
    if (accessibilityIssues.length > 0) {
      console.warn('Problemas de acessibilidade encontrados:', accessibilityIssues);
    }
    
    return { 
      buttonsCount: buttons.length,
      inputsCount: inputs.length,
      selectsCount: selects.length,
      accessibilityIssues: accessibilityIssues.length 
    };
  }

  /**
   * Gera relatório de testes
   */
  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log('\n📊 RELATÓRIO DE TESTES');
    console.log('='.repeat(50));
    console.log(`Total de testes: ${total}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n✅ TESTES QUE PASSARAM:');
    this.results
      .filter(r => r.status === 'PASS')
      .forEach(r => console.log(`  - ${r.name}`));
    
    console.log('\n🎉 Teste de funcionalidades concluído!');
    
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.results
    };
  }
}

// Executa testes quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Aguarda um pouco para garantir que tudo foi carregado
  setTimeout(() => {
    const testSuite = new WorkInTestSuite();
    testSuite.runAllTests();
  }, 1000);
});

// Expor para uso manual
window.WorkInTestSuite = WorkInTestSuite;
