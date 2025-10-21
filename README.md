# 🚀 WorkIn - Automação de Candidaturas LinkedIn

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/seu-usuario/workin-extension)

Uma extensão Chrome inteligente que automatiza e otimiza o processo de candidaturas no LinkedIn, utilizando análise de perfil e matching inteligente para maximizar suas chances de sucesso profissional.

## 📋 Índice

- [Características](#-características)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Funcionalidades](#-funcionalidades)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## ✨ Características

### 🎯 **Análise Inteligente de Perfil**
- Análise automática do seu perfil LinkedIn
- Identificação de pontos fortes e áreas de melhoria
- Sugestões personalizadas de otimização

### 🔍 **Matching Avançado**
- Algoritmo de compatibilidade com vagas
- Análise de requisitos vs. qualificações
- Score de adequação em tempo real

### 🤖 **Automação Inteligente**
- Candidaturas automáticas baseadas em critérios
- Personalização de mensagens
- Gestão de fila de candidaturas

### 📊 **Analytics e Relatórios**
- Dashboard com métricas de performance
- Histórico de candidaturas
- Taxa de sucesso e insights

## 🚀 Instalação

### Método 1: Chrome Web Store (Recomendado)
*Em breve disponível na Chrome Web Store*

### Método 2: Instalação Manual

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/workin-extension.git
   cd workin-extension
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute os testes**
   ```bash
   npm test
   ```

4. **Carregue a extensão no Chrome**
   - Abra o Chrome e vá para `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta do projeto

## 📖 Como Usar

### 1. **Configuração Inicial**
- Após instalar, clique no ícone da extensão
- Complete o processo de onboarding
- Configure suas preferências de candidatura

### 2. **Análise de Perfil**
- Visite seu perfil LinkedIn
- A extensão analisará automaticamente suas informações
- Visualize o relatório de análise no popup

### 3. **Busca e Candidatura**
- Navegue pelas vagas no LinkedIn
- Veja o score de compatibilidade em tempo real
- Use a automação para candidaturas em massa

### 4. **Monitoramento**
- Acompanhe suas candidaturas no dashboard
- Analise métricas de performance
- Ajuste estratégias baseado nos insights

## 🛠 Funcionalidades

### Core Features
- ✅ **Análise de Perfil LinkedIn**
- ✅ **Sistema de Matching Inteligente**
- ✅ **Automação de Candidaturas**
- ✅ **Dashboard de Analytics**
- ✅ **Sistema de Onboarding**

### Recursos Avançados
- 🔄 **Sincronização em Tempo Real**
- 📱 **Interface Responsiva**
- 🎨 **Tema Personalizado**
- 🔒 **Segurança e Privacidade**
- 📈 **Relatórios Detalhados**

## 💻 Desenvolvimento

### Pré-requisitos
- Node.js >= 18.0.0
- npm ou yarn
- Chrome Browser

### Estrutura do Projeto
```
workin-extension/
├── background/          # Service Workers
├── content/            # Content Scripts
├── popup/              # Interface do Popup
├── options/            # Página de Opções
├── onboarding/         # Sistema de Onboarding
├── shared/             # Utilitários Compartilhados
├── docs/               # Documentação
├── tests/              # Testes Automatizados
└── manifest.json       # Configuração da Extensão
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Modo desenvolvimento
npm run build           # Build para produção
npm run build:css       # Compilar CSS com Tailwind

# Testes
npm test                # Executar todos os testes
npm run test:watch      # Testes em modo watch
npm run lint            # Verificar código

# Utilitários
npm run check           # Lint + Testes
```

### Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Styling**: Tailwind CSS
- **Testing**: Jest, JSDOM
- **Build**: Babel, PostCSS
- **Linting**: ESLint
- **APIs**: Chrome Extensions API, LinkedIn (via DOM)

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md) antes de submeter PRs.

### Como Contribuir

1. **Fork o projeto**
2. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. **Commit suas mudanças**
   ```bash
   git commit -m 'feat: adiciona nova funcionalidade'
   ```
4. **Push para a branch**
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. **Abra um Pull Request**

### Padrões de Commit
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes

## 🔒 Privacidade e Segurança

- ✅ **Dados processados localmente**
- ✅ **Nenhuma informação enviada para servidores externos**
- ✅ **Permissões mínimas necessárias**
- ✅ **Código open source auditável**

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 **Email**: suporte@workin.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/workin-extension/issues)
- 📖 **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/workin-extension/wiki)

## 🎯 Roadmap

### Versão 1.1
- [ ] Integração com outras plataformas de emprego
- [ ] Sistema de templates de mensagens
- [ ] Exportação de relatórios

### Versão 1.2
- [ ] Análise de mercado de trabalho
- [ ] Recomendações de cursos
- [ ] Integração com calendário

---

**Desenvolvido com ❤️ pela equipe WorkIn**

*Transformando a busca por emprego em uma experiência inteligente e eficiente.*