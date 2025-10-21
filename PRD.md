1) Visão e objetivos

Visão: acelerar candidaturas “Candidatura Simplificada” com segurança, privacidade e controle total do usuário.
Objetivos medidos:

Reduzir tempo médio por candidatura ≤ 20s.

Aumentar taxa de compatibilidade média ≥ 70%.

Erro de submissão ≤ 2% por semana.

100% dos dados sensíveis criptografados em repouso e em trânsito.

2) Escopo

No escopo

Leitura do perfil do usuário no LinkedIn (página Perfil e configurações de Currículo) e armazenamento local de dados relevantes.

Descoberta e ranking de vagas com “Candidatura Simplificada”.

Autopreenchimento e envio da candidatura sob comando do usuário.

Critérios de compatibilidade personalizáveis.

Painel de gerenciamento: aplicadas, salvas, ignoradas.

Feedback de status: enviada, erro, follow-up, entrevistas registradas pelo usuário.

UX em PT-BR; onboarding guiado; logs auditáveis pelo usuário.

Telemetria opt-in sem dados pessoais.

Fora do escopo

Burlar paywalls, captcha externo, ou fluxos que não sejam “Candidatura Simplificada”.

Geração/alteração de currículo em sites de terceiros.

Coleta de dados de terceiros além do LinkedIn/arquivo local do usuário.

Multi-conta simultânea.

Riscos legais e políticas de plataforma

Automação pode violar Termos do LinkedIn. Mitigações: execução assistida (ação explícita do usuário por vaga ou por lote), limites de taxa, transparência, opção “dry-run”. Banner explicando riscos e exigindo consentimento.

3) Personas

Profissional em transição (Júnior/Pleno): quer volume e filtros simples.

Sênior ocupado: quer qualidade e poucas candidaturas, alto match.

Recruiter de si mesmo: deseja logs, tags e notas para priorização.

4) Requisitos funcionais
4.1 Coleta e perfilagem

R1.1 Ler dados do perfil: título, localização, senioridade, áreas, skills, idiomas, escolaridade, experiências.

R1.2 Importar currículo PDF do usuário para parsing local opcional.

R1.3 Criar “Perfil WorkIn” com campos editáveis e versões.

4.2 Descoberta e compatibilidade

R2.1 Detectar páginas de vagas com “Candidatura Simplificada”.

R2.2 Extrair: título, empresa, localização, formato (remoto/híbrido/presencial), requisitos, senioridade, data de publicação.

R2.3 Calcular Score de Compatibilidade (0–100) com pesos configuráveis:

Habilidades-chave

Senioridade

Localização/fuso

Idioma

Palavras-chave incluídas/excluídas

Salário quando visível

R2.4 Exibir badge de score e motivos (match explicável).

R2.5 Filtros: score mínimo, remoto, data, palavra-chave, excluir empresas.

4.3 Candidatura automática assistida

R3.1 Autopreencher formulários “Candidatura Simplificada” usando Perfil WorkIn.

R3.2 Estratégias de anexo: CV A, CV B, sem CV; carta de apresentação opcional com templates.

R3.3 Modos de execução:

Única: aplicar na vaga atual.

Fila: aplicar em N vagas selecionadas.

Dry-run: simular, validar campos e estimar tempo.

R3.4 Rate limit e randomização de delays para comportamento humano.

R3.5 Tratamento de perguntas extras: mapeamento de Q&A por regex/palavras-chave; fallback para intervenção do usuário.

R3.6 Registro: data/hora, link, anexo usado, respostas, status.

4.4 Gestão de vagas

R4.1 Listas: Aplicadas, Salvas, Ignoradas, Erros.

R4.2 Tags customizadas e notas.

R4.3 Ações em massa: salvar, aplicar, excluir, exportar CSV.

R4.4 Lembretes manuais: follow-up X dias após aplicação.

4.5 Feedback e status

R5.1 Status manual: “visualizada”, “contato”, “entrevista”, “reprovada”, “oferta”.

R5.2 Importação semi-automática: detectar mudanças na página da vaga quando visitada.

R5.3 Relatórios: candidaturas por semana, taxa de resposta, tempo médio, empresas mais responsivas.

4.6 Personalização

R6.1 Pesos do score, listas de must-have/ban-words.

R6.2 Perfis múltiplos (Dev, PM, Data) com CV e cartas distintas.

R6.3 Padrões de delay e janelas de aplicação (ex.: 8–11h, 14–18h).

5) Requisitos não funcionais

Privacidade: dados ficam por padrão em chrome.storage.local e IndexedDB. Nada sai do dispositivo sem opt-in explícito.

Segurança: criptografia AES-GCM no storage com chave derivada de passphrase do usuário; TLS em qualquer sincronização opcional.

Desempenho: popup abre ≤ 200ms; avaliação de uma vaga ≤ 300ms; fila de 20 vagas em ≤ 2 min com delays.

Confiabilidade: recuperação de sessão, reexecução idempotente, logs locais.

Acessibilidade: WCAG 2.1 AA; navegação por teclado; textos claros PT-BR.

I18n pronto: estrutura para en-US futura.

Observabilidade local: console interno e exportação de logs anonimizados (opt-in).

6) Arquitetura e técnicas

Manifest: Chrome Extensions v3 (MV3).

Componentes:

Content Scripts: detecção de vagas, extração de campos, UI in-page (badges).

Background Service Worker: fila, rate limit, estado global.

Popup UI: controles rápidos, fila, progresso.

Options Page: perfis, critérios, privacidade, backups.

IndexedDB: vagas, perfis, templates, logs.

Matching Engine: tokenização simples + TF-IDF leve + regras; espaço para plugin LLM offline opcional (WebGPU se disponível).

Anti-fragilidade: selectors resilientes, heurísticas por atributos, testes visuais por snapshot.

7) UX/UI (PT-BR)

Onboarding (3 passos): importar perfil, definir metas (qualidade vs volume), escolher critérios.

Popup:

Cabeçalho com status e botões “Analisar página”, “Aplicar”, “Dry-run”.

Lista de vagas detectadas na página atual com score e toggle.

Indicadores de fila, estimativa e pausa.

Overlay in-page: badge de score na carta da vaga + tooltip “por que esse score”.

Options:

Perfis e currículos.

Critérios e pesos.

Templates de carta.

Privacidade e backups.

Telemetria opt-in.

Painel de vagas: tabelas com filtros, tags, notas e exportação.

8) Modelo de dados (resumo)

UserProfile: id, nome, título, localização, skills[], idiomas[], senioridade, CVs[], cartas[].

Job: id, url, título, empresa, local, remoto, requisitos[], dataPublicação, origem.

Match: jobId, score, razões{skillMatch[], gaps[], palavrasChave[]}.

Application: jobId, perfilId, cvId, cartaId, respostasQA{}, status, timestamps, erro?.

Settings: pesos, mustHave[], banWords[], limites, janelaTempo.

Logs: tipo, mensagem, contexto, timestamp.

9) Segurança e privacidade

Criptografia local com passphrase do usuário; opção de não persistir dados sensíveis.

Backups manuais criptografados pelo usuário.

Telemetria agregada e opcional, sem PII.

Botão “apagar tudo agora”.

Relatório de ameaças: nenhum cookie externo coletado; sem injeção de credenciais; CORS bloqueado; CSP estrita; dependências auditadas (SCA).

10) Compliance e limites de uso

Aviso legal sobre automação e possíveis violações dos Termos do LinkedIn.

Modo “Assistido por clique” como padrão.

Limites de ritmo configuráveis para evitar bloqueios.

Registro transparente das ações executadas.

11) Métricas de sucesso

Conversão onboarding ≥ 80%.

% de candidaturas concluídas sem erro ≥ 98%.

Resposta de recrutadores por 100 aplicações (proxy) + tendência.

Satisfação (CSAT in-app) ≥ 4/5.

Incidentes de privacidade: 0.

12) Roadmap

M0 — Protótipo (2–3 semanas): detecção de vagas, score básico, autopreenchimento em 1 fluxo simples, popup mínimo.

M1 — Beta fechado: fila, dry-run, painel, criptografia local, templates, tags, export CSV.

M2 — Estável: heurísticas robustas, perguntas extras, multi-perfil, relatórios, i18n infra.

M3 — Plus: backup criptografado, regras avançadas, plugin LLM local opcional.

13) Critérios de aceite

Consegue aplicar em 10 vagas “Candidatura Simplificada” seguidas com ≤ 1 erro.

Score exibido com justificativas legíveis.

Usuário altera pesos e o ranking reflete a mudança.

Dados permanecem funcionais com armazenamento criptografado.

Export CSV gera colunas padronizadas.

“Apagar tudo” remove chaves e dados localmente.

14) Testes e QA

Testes de seletor por amostras variadas de páginas.

Testes de regressão visual do overlay e popup.

Testes de performance (Lighthouse) e memória.

Pentest focal em content scripts e storage.

Fuzzing de Q&A de formulários.

15) Falhas e contingências

Mudou o DOM: fallback por texto/aria-labels e aviso ao usuário.

Captcha/etapas extras: pausar e solicitar ação manual.

Bloqueio de conta: parar imediatamente e exibir guia de mitigação.

Formulário com upload obrigatório não mapeado: pedir seleção de CV e salvar preferências.

16) Dependências

Chrome MV3.

IndexedDB, crypto.subtle.

Biblioteca de parsing de PDF local.

Zero dependências de servidor por padrão.

17) Entregáveis

Extensão MV3 assinada (CRX), README, política de privacidade, guia de riscos.

Pacote de testes automatizados.

Ícones e assets em 16/32/48/128 px.