# Guia de Teste - Sistema de Onboarding WorkIn

## 🧪 Como Testar o Sistema de Onboarding

### Pré-requisitos
1. **Google Chrome** instalado
2. **Perfil LinkedIn** ativo e preenchido
3. **Extensão WorkIn** carregada no Chrome

### Passo 1: Carregar a Extensão no Chrome

1. Abra o Google Chrome
2. Digite `chrome://extensions/` na barra de endereços
3. Ative o **Modo do desenvolvedor** (canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `c:\Users\LENOVO\Documents\WorkIN`
6. A extensão WorkIn deve aparecer na lista

### Passo 2: Verificar Instalação

1. Clique no ícone de extensões (quebra-cabeça) na barra do Chrome
2. Procure pela extensão **WorkIn**
3. Fixe a extensão clicando no ícone de alfinete
4. Clique no ícone da extensão para abrir o popup

### Passo 3: Iniciar o Onboarding

1. **No popup da extensão**, procure pelo botão **"Iniciar Configuração"**
2. Clique no botão para abrir o wizard de onboarding
3. Uma nova aba será aberta com a página de onboarding

### Passo 4: Testar Etapa 1 - Escaneamento de Perfil

1. **Navegue até seu perfil LinkedIn** em uma aba separada
2. **Volte para a aba do onboarding**
3. Clique em **"Escanear Perfil"**
4. **Aguarde o processo** (pode levar alguns segundos)
5. **Verifique se os dados foram extraídos**:
   - Nome e headline
   - Experiências profissionais
   - Educação
   - Skills
   - Idiomas

### Passo 5: Testar Etapa 2 - Configuração de Preferências

1. **Revise as informações** extraídas do seu perfil
2. **Configure suas preferências**:
   - Palavras-chave de interesse
   - Localizações preferidas
   - Nível de senioridade
   - Tipo de trabalho (remoto, presencial, híbrido)
3. **Ajuste configurações de aplicação**:
   - Máximo de candidaturas por dia
   - Score mínimo de compatibilidade
   - Apenas vagas com Easy Apply
4. Clique em **"Próximo"**

### Passo 6: Testar Etapa 3 - Descoberta de Vagas

1. **Aguarde a busca automática** de vagas compatíveis
2. **Revise as vagas encontradas**:
   - Título da vaga
   - Empresa
   - Localização
   - Score de compatibilidade
3. **Selecione vagas de interesse** marcando as caixas
4. Clique em **"Finalizar Configuração"**

### Passo 7: Verificar Configuração Completa

1. **Retorne ao popup da extensão**
2. **Verifique se o botão "Iniciar Configuração" desapareceu**
3. **Navegue pelas abas do popup**:
   - **Dashboard**: Estatísticas gerais
   - **Vagas**: Lista de vagas encontradas
   - **Fila**: Vagas na fila de aplicação

## 🔍 Pontos de Verificação

### ✅ Checklist de Funcionalidades

#### Extração de Perfil
- [ ] Nome extraído corretamente
- [ ] Headline/título profissional presente
- [ ] Experiências listadas com cargo, empresa e período
- [ ] Educação extraída (instituição, curso)
- [ ] Skills identificadas
- [ ] Idiomas detectados

#### Análise Inteligente
- [ ] Senioridade calculada (Junior/Mid/Senior/Lead)
- [ ] Área principal identificada
- [ ] Anos de experiência calculados
- [ ] Skills principais destacadas
- [ ] Score de completude do perfil

#### Busca de Vagas
- [ ] Vagas compatíveis encontradas
- [ ] Score de compatibilidade calculado
- [ ] Filtros aplicados corretamente
- [ ] Informações das vagas completas

#### Interface do Onboarding
- [ ] Navegação entre etapas funcional
- [ ] Barra de progresso atualizada
- [ ] Botões de ação responsivos
- [ ] Loading states visíveis
- [ ] Mensagens de erro/sucesso

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Extensão não carrega
**Solução**: 
- Verifique se o modo desenvolvedor está ativo
- Recarregue a extensão em `chrome://extensions/`
- Verifique se não há erros no console

#### 2. Perfil não é detectado
**Solução**:
- Certifique-se de estar na página do seu perfil LinkedIn
- Aguarde a página carregar completamente
- Tente recarregar a página do LinkedIn

#### 3. Dados incompletos extraídos
**Solução**:
- Verifique se seu perfil LinkedIn está completo
- Certifique-se de que as seções estão públicas
- Tente atualizar seu perfil LinkedIn

#### 4. Vagas não encontradas
**Solução**:
- Ajuste as palavras-chave nas preferências
- Amplie os critérios de localização
- Reduza o score mínimo de compatibilidade

#### 5. Onboarding não inicia
**Solução**:
- Verifique se há erros no console do navegador (F12)
- Recarregue a extensão
- Limpe o cache do navegador

## 📊 Logs e Debug

### Console do Navegador
1. Pressione **F12** para abrir as ferramentas de desenvolvedor
2. Vá para a aba **Console**
3. Procure por mensagens do WorkIn
4. Verifique erros em vermelho

### Logs Detalhados
- Logs de extração de perfil
- Logs de análise de dados
- Logs de busca de vagas
- Logs de aplicações automáticas

### Storage Local
1. Vá para **Application** > **Local Storage**
2. Procure por dados do WorkIn
3. Verifique se as configurações foram salvas

## 📈 Métricas de Sucesso

### Indicadores de Funcionamento
- **Tempo de extração**: < 10 segundos
- **Dados extraídos**: > 80% das seções preenchidas
- **Vagas encontradas**: > 5 vagas compatíveis
- **Score médio**: > 70% de compatibilidade

### Experiência do Usuário
- **Tempo total de onboarding**: < 5 minutos
- **Cliques necessários**: < 10 cliques
- **Etapas manuais**: < 3 ajustes necessários

## 🚀 Próximos Testes

### Testes Avançados
1. **Teste com diferentes perfis**: Júnior, Pleno, Sênior
2. **Teste com áreas diversas**: Tech, Marketing, Vendas
3. **Teste de performance**: Múltiplas execuções
4. **Teste de edge cases**: Perfis incompletos

### Automação de Testes
```bash
# Execute o teste automatizado
node test-onboarding.js
```

---

**Importante**: Este é um sistema em desenvolvimento. Reporte qualquer bug ou comportamento inesperado para a equipe de desenvolvimento.