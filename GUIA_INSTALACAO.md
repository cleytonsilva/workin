# 🚀 Guia de Instalação - WorkIn Extension

## 📋 Pré-requisitos

- ✅ Google Chrome (versão 88 ou superior)
- ✅ Node.js (versão 18 ou superior) - **JÁ INSTALADO**
- ✅ npm ou pnpm - **JÁ INSTALADO**

## 🔧 Instalação da Extensão

### 1. Preparar o Projeto

O projeto já está configurado e pronto! Os testes passaram com sucesso:

```bash
# Verificar se tudo está funcionando
npm test
# ✅ 20 testes passaram

# Compilar CSS (se necessário)
npm run build:css
# ✅ CSS compilado com sucesso
```

### 2. Carregar no Chrome

1. **Abra o Chrome** e navegue para:
   ```
   chrome://extensions/
   ```

2. **Ative o Modo Desenvolvedor**:
   - Clique no toggle "Modo do desenvolvedor" no canto superior direito

3. **Carregue a Extensão**:
   - Clique em "Carregar sem compactação"
   - Selecione a pasta: `C:\Users\LENOVO\Documents\WorkIN`
   - A extensão "WorkIn" deve aparecer na lista

4. **Fixar a Extensão** (opcional):
   - Clique no ícone de quebra-cabeça na barra de ferramentas
   - Clique no ícone de "pin" ao lado do WorkIn

## 🧪 Teste Rápido

### 1. Verificar Instalação

1. **Clique no ícone da extensão** na barra de ferramentas
2. **Deve abrir o popup** com 3 abas:
   - 📊 Dashboard
   - 💼 Vagas  
   - 📋 Fila

### 2. Testar no LinkedIn

1. **Navegue para o LinkedIn**:
   ```
   https://www.linkedin.com/jobs/search/
   ```

2. **Abra o popup da extensão**

3. **Verifique a aba "Vagas"**:
   - Deve mostrar vagas detectadas
   - Cada vaga deve ter um score de compatibilidade
   - Botões de ação devem estar disponíveis

### 3. Configurar Perfil

1. **Clique com botão direito** no ícone da extensão
2. **Selecione "Opções"**
3. **Preencha seu perfil** na aba "Profile":
   - Nome completo
   - Email
   - Telefone
   - Localização
   - Habilidades
   - Experiência

4. **Configure automação** na aba "Automation":
   - Limites de aplicação
   - Horários de trabalho
   - Delays entre ações

## 🎯 Funcionalidades Disponíveis

### ✅ Detecção Automática de Vagas
- Detecta vagas em páginas do LinkedIn
- Extrai informações básicas (título, empresa, localização)
- Identifica vagas "Easy Apply"

### ✅ Score de Compatibilidade
- Calcula compatibilidade baseada em:
  - 🎯 Skills (30%)
  - 💼 Experiência (25%)
  - 📍 Localização (15%)
  - 🏢 Tipo de trabalho (10%)
  - 📈 Senioridade (10%)
  - 🔍 Keywords (10%)

### ✅ Autopreenchimento Inteligente
- Preenche formulários automaticamente
- Usa dados do seu perfil
- Delays humanos para naturalidade

### ✅ Gerenciamento de Filas
- Adiciona vagas à fila de aplicação
- Rate limiting inteligente:
  - Máximo 10 aplicações/hora
  - Máximo 50 aplicações/dia
  - Delay mínimo de 30 segundos

### ✅ Interface Intuitiva
- **Dashboard**: Estatísticas e controles
- **Vagas**: Lista com scores e filtros
- **Fila**: Gerenciamento de aplicações

## 🔒 Segurança

- ✅ **Criptografia AES-256-GCM** para dados sensíveis
- ✅ **Rate limiting** para evitar spam
- ✅ **Validação** de todas as entradas
- ✅ **Armazenamento local** seguro

## 🐛 Solução de Problemas

### Extensão não carrega
1. Verifique se o "Modo desenvolvedor" está ativo
2. Recarregue a extensão em `chrome://extensions/`
3. Verifique o console para erros

### Vagas não são detectadas
1. Certifique-se de estar em uma página de vagas do LinkedIn
2. Atualize a página
3. Abra o popup novamente

### Autopreenchimento não funciona
1. Configure seu perfil nas opções
2. Verifique se a vaga tem "Easy Apply"
3. Tente em uma vaga diferente

### Performance lenta
1. Feche outras abas desnecessárias
2. Verifique se há muitas extensões ativas
3. Reinicie o Chrome

## 📞 Suporte

### Logs de Debug
1. Abra `chrome://extensions/`
2. Clique em "Detalhes" na extensão WorkIn
3. Clique em "Inspecionar visualizações: service worker"
4. Verifique o console para logs

### Teste Manual Avançado
Execute no console do LinkedIn:
```javascript
// Cole o conteúdo do arquivo test-extension.js
// Verifique os resultados dos testes
```

### Arquivos de Log
- Logs são salvos no storage local da extensão
- Acesse via DevTools > Application > Storage

## 🚀 Próximos Passos

Após confirmar que tudo está funcionando:

1. **Teste em vagas reais** do LinkedIn
2. **Configure seu perfil** completamente
3. **Ajuste as configurações** de automação
4. **Monitore os resultados** no dashboard

## 📊 Status do Projeto

- ✅ **Milestone 0 Concluído**: Protótipo funcional
- 🔄 **Próximo**: Milestone 1 - IA e análise semântica
- 📈 **Versão atual**: 1.0.0

---

**🎉 Parabéns! A extensão WorkIn está pronta para uso!**

Para dúvidas ou problemas, consulte a documentação completa em `docs/README.md` ou os logs de teste em `docs/TESTE_MILESTONE_0.md`.