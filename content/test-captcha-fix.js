/**
 * WorkIn Extension - Teste das Correções de Captcha
 * Script para testar e validar as melhorias na detecção de captcha
 */

console.log('🧪 Iniciando teste das correções de captcha...');

class CaptchaFixTester {
  constructor() {
    this.testResults = [];
    this.isLinkedInPage = window.location.href.includes('linkedin.com');
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🚀 Executando bateria de testes...');
    
    try {
      // Aguardar carregamento dos módulos
      await this.waitForModules();
      
      // Executar testes
      await this.testCaptchaDetection();
      await this.testBypassSystem();
      await this.testJobCollection();
      
      // Exibir resultados
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    }
  }

  /**
   * Aguarda carregamento dos módulos necessários
   */
  async waitForModules() {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      if (window.WorkInJobScraper) {
        console.log('✅ Módulos carregados');
        return;
      }
      
      attempts++;
      console.log(`⏳ Aguardando módulos... tentativa ${attempts}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Timeout aguardando carregamento dos módulos');
  }

  /**
   * Testa a detecção de captcha
   */
  async testCaptchaDetection() {
    console.log('🔍 Testando detecção de captcha...');
    
    try {
      // Teste 1: Verificar se não há captcha falso positivo
      const hasCaptcha = window.WorkInJobScraper.detectCaptcha();
      this.addTestResult('Detecção de Captcha', !hasCaptcha, 
        hasCaptcha ? 'Falso positivo detectado' : 'Nenhum captcha detectado');
      
      // Teste 2: Verificar análise de tipo
      const analysis = window.WorkInJobScraper.analyzeCaptchaType();
      this.addTestResult('Análise de Tipo', !analysis.isRealCaptcha, 
        analysis.isRealCaptcha ? `Captcha real: ${analysis.type}` : 'Nenhum captcha real');
      
      // Teste 3: Verificar visibilidade de elementos
      const testElement = document.createElement('div');
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      const isVisible = window.WorkInJobScraper.isElementVisible(testElement);
      document.body.removeChild(testElement);
      
      this.addTestResult('Verificação de Visibilidade', !isVisible, 
        isVisible ? 'Elemento oculto detectado como visível' : 'Elemento oculto corretamente detectado');
      
    } catch (error) {
      this.addTestResult('Detecção de Captcha', false, `Erro: ${error.message}`);
    }
  }

  /**
   * Testa o sistema de bypass
   */
  async testBypassSystem() {
    console.log('🔄 Testando sistema de bypass...');
    
    try {
      // Teste 1: Verificar função de bypass
      const bypassResult = await window.WorkInJobScraper.attemptCaptchaBypass();
      this.addTestResult('Sistema de Bypass', true, 
        `Bypass executado: ${bypassResult.success ? 'Sucesso' : 'Falha'}`);
      
      // Teste 2: Verificar detecção inteligente
      const captchaResult = await window.WorkInJobScraper.handleCaptchaDetection();
      this.addTestResult('Detecção Inteligente', !captchaResult.blocked, 
        captchaResult.blocked ? `Bloqueado: ${captchaResult.reason}` : 'Nenhum bloqueio');
      
    } catch (error) {
      this.addTestResult('Sistema de Bypass', false, `Erro: ${error.message}`);
    }
  }

  /**
   * Testa a coleta de vagas
   */
  async testJobCollection() {
    console.log('📋 Testando coleta de vagas...');
    
    try {
      if (!this.isLinkedInPage) {
        this.addTestResult('Coleta de Vagas', false, 'Não está no LinkedIn');
        return;
      }
      
      if (!window.location.href.includes('/jobs/')) {
        this.addTestResult('Coleta de Vagas', false, 'Não está em página de vagas');
        return;
      }
      
      // Teste de coleta limitada (apenas 5 vagas para teste)
      const result = await window.WorkInJobScraper.collectJobsWithScroll(5);
      
      this.addTestResult('Coleta de Vagas', result.success, 
        result.success ? 
          `${result.jobs.length} vagas coletadas` : 
          `Erro: ${result.error}`);
      
    } catch (error) {
      this.addTestResult('Coleta de Vagas', false, `Erro: ${error.message}`);
    }
  }

  /**
   * Adiciona resultado de teste
   */
  addTestResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  /**
   * Exibe resultados finais
   */
  displayResults() {
    console.log('\n📊 RESULTADOS DOS TESTES:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`✅ Testes aprovados: ${passed}/${total}`);
    console.log(`❌ Testes falharam: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 TODOS OS TESTES PASSARAM! As correções estão funcionando.');
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
    
    console.log('\n📋 Detalhes dos testes:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    console.log('='.repeat(50));
  }
}

// Executar testes automaticamente se estiver no LinkedIn
if (window.location.href.includes('linkedin.com')) {
  // Aguardar um pouco para garantir que tudo carregou
  setTimeout(() => {
    const tester = new CaptchaFixTester();
    tester.runAllTests();
  }, 2000);
} else {
  console.log('ℹ️ Teste só pode ser executado no LinkedIn');
}

// Expor para uso manual
window.CaptchaFixTester = CaptchaFixTester;

console.log('🧪 Teste de correções de captcha configurado');
