# 15 — Futuras Funcionalidades e Roteiro de Evolução (Roadmap Free Tier)

| Metadado | Valor |
|---|---|
| **Finalidade** | Catálogo normativo e especificações de engenharia para as próximas funcionalidades e evoluções do Uno KaWiHe (`PROPOSTO`), garantindo 100% de aderência à arquitetura autoritativa, ao protocolo de confiabilidade (`14_CONFIABILIDADE_IA.md`) e à Política Universal de Custo Zero. |
| **Público-alvo** | Proprietário / Operador humano ativo no chat (Nível 0 — quem digita aqui; ref. `edinho.grubert@gmail.com`), Agentes de IA executores (Nível 4), Arquitetos e Desenvolvedores. |
| **Status** | **NORMATIVO DE PLANEJAMENTO (`PROPOSTO` — Nível 2)** |
| **Fonte de Autoridade** | Subordinado à **Autoridade Máxima de quem digita aqui no chat (Nível 0 — Proprietário / Operador ativo; ref. `edinho.grubert@gmail.com`)** e ao Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-20` |
| **Referências Relacionadas** | `AGENTS.md`, `02_regras.md`, `04_status.md`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`, `14_CONFIABILIDADE_IA.md`. |

---

## 1. Regras de Governança para Novas Funcionalidades

Toda funcionalidade listada neste documento possui estado oficial **`PROPOSTO`** (conforme vocabulário de `14_CONFIABILIDADE_IA.md`) até que sua implementação seja expressamente autorizada pela **Autoridade Máxima (Nível 0: quem está digitando aqui no chat)**. Ao implementar qualquer item deste catálogo, o Agente executor deve obrigatoriamente:

1. **Passar pelo Free Tier Compliance Gate (`/11_FREE_TIER_COMPLIANCE.md`):** Nenhuma evolução pode introduzir serviços pagos (`PAID`), testes temporários (`TRIAL_ONLY`), APIs externas cobradas ou dependências com custo não verificado (`UNKNOWN_COST`).
2. **Preservar a Autoridade do Servidor (`REG-AUT-01`):** Nenhuma regra de jogo, sorteio, pontuação ou permissão pode ser decidida no frontend. O cliente envia apenas intenções e o servidor valida.
3. **Preservar o Invariante das 108 Cartas (`REG-BAR-01`):** Qualquer mecânica nova de compra, troca de mãos ou descarte deve manter `deck.length + discardPile.length + soma(players.hand.length) + (stagedCardPlay ? 1 : 0) === 108`.
4. **Proteger o Modo Kids (`REG-UNO-04`):** Regras da casa punitivas ou complexas devem vir **desativadas por padrão** quando `isKidsMode === true`.
5. **Incrementar Versão e Testes (`REG-VER-01`):** Toda entrega funcional deve adicionar testes automatizados em `tests/*.test.ts` (mantendo 100% de aprovação `VERIFICADO`) e incrementar a versão sincronizadamente em `package.json`, `deploy.sh` e `src/utils/versionHistory.ts`.

---

## 2. Eixo 1 — Regras da Casa Clássicas (Opcionais por Sala)

### `FUT-JOG-01` · Empilhamento de Cartas de Compra (`+2` e `+4` Stacking)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Permitir que um jogador alvo de um `+2` (ou `+4`) rebata jogando outra carta de compra compatível, acumulando a penalidade (`pendingDrawCount`) para o próximo jogador na direção da mesa.
- **Configuração em `RoomSettings`:**
  - `allowStacking?: boolean` (default: `false`; forçado `false` se `isKidsMode === true`).
  - Modalidades possíveis: `+2 sobre +2`, `+4 sobre +4`, ou `+4 sobre +2`.
- **Impacto Arquitetural:**
  - `src/types/uno.ts`: Adicionar `allowStacking: boolean` em `RoomSettings` e `pendingDrawCount: number` em `GameState`.
  - `server/unoEngine.ts`: Quando `pendingDrawCount > 0`, o jogador da vez só pode jogar uma carta de empilhamento válida ou executar `draw_card` (comprando todas as `pendingDrawCount` cartas acumuladas e perdendo a vez).
  - `src/components/GameBoard.tsx` e `SettingsModal.tsx`: Exibir badge visual de acúmulo (`+4 ACUMULADO!`, `+6 ACUMULADO!`) no centro da mesa e switch na criação/configuração da sala.
- **Testes Exigidos:** Suíte em `tests/unoEngine.test.ts` validando cadeia `+2 → +2 → compra 4`, bloqueio de cartas normais durante acúmulo, interação com Modo Duplas 2v2 e preservação das 108 cartas.

### `FUT-JOG-02` · Comprar até Encontrar Carta Jogável (*Draw to Match*)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Substituir opcionalmente a compra única por turno (`REG-CMP-01`) pela compra contínua até que o jogador obtenha uma carta jogável ou atinja um teto de segurança configurável.
- **Configuração em `RoomSettings`:**
  - `drawToMatch?: boolean` (default: `false`).
  - `maxDrawPerTurn?: number` (default: `5` cartas, evitando esgotamento excessivo do baralho em uma única jogada).
- **Impacto Arquitetural:**
  - `server/unoEngine.ts`: Ajustar `drawCard()` para avaliar se a carta comprada é jogável ou se o contador de compras do turno atingiu `maxDrawPerTurn`, reciclando o descarte (`REG-JOG-05`) caso o monte acabe no meio da sequência.
- **Testes Exigidos:** Testes unitários cobrindo reciclagem do descarte durante compras múltiplas e parada exata ao sacar carta jogável ou atingir o limite.

### `FUT-JOG-03` · Regra do `7` e do `0` (*7-0 Swap & Rotate*)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:**
  - Ao jogar um **`0`** de qualquer cor: todas as mãos da mesa giram uma posição no sentido atual do jogo (`direction`).
  - Ao jogar um **`7`** de qualquer cor (tendo ainda ao menos 1 carta na mão): o jogador escolhe um participante ativo para trocar de mão.
- **Restrição em Duplas 2v2 (`team_2v2`):** No modo 2v2, se ativada, deve atualizar imediatamente `teammateHand` via WebSocket privado para todos os integrantes após a troca/rotação.
- **Impacto Arquitetural:**
  - `src/types/uno.ts`: Adicionar `sevenZeroRule?: boolean` em `RoomSettings` e `targetSwapPlayerId?: string` na intenção `play_card`.
  - `server/unoEngine.ts`: Executar rotação atômica de arrays `hand` sem alterar o total de 108 cartas e recalcular `isUnoVulnerable` / `hasCalledUno`.

---

## 3. Eixo 2 — Torneios, Competição e Pós-Jogo

### `FUT-TOR-01` · Pódio Visual de Campeões e Certificado/Card Exportável Localmente
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00` — HTML5 Canvas local no navegador)
- **Objetivo:** Ao encerrar a última rodada de um torneio (`status === 'finished'`), apresentar um pódio celebrativo (Campeão, Vice-Campeão e 3º lugar no Individual, ou Dupla Campeã e Vice no 2v2) com confetes, resumo de vitórias/partidas e botão **"Baixar Card de Campeão (PNG)"**.
- **Impacto Arquitetural:**
  - `src/components/TournamentModal.tsx`: Novo componente/aba de Pódio renderizado quando `tournament.status === 'finished'` e `winnerUserId` / `winnerTeamId` estiver definido.
  - Geração de imagem 100% client-side via API nativa `HTMLCanvasElement.toDataURL('image/png')`, sem depender de bibliotecas pagas ou processamento pesado na VM.

### `FUT-TOR-02` · Coluna Opcional `teamName` na Importação em Massa de Duplas (`doubles`)
- **Status:** `PROPOSTO` (Complemento à `DIV-02`) · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Contexto Atual (`CONFIRMADO`):** Hoje `server/importService.ts` já suporta importação em torneios `doubles` agrupando pares consecutivos de linhas válidas (1ª e 2ª = Dupla 1, 3ª e 4ª = Dupla 2) e nomeando automaticamente a equipe como `"DisplayName1 & DisplayName2"`.
- **Objetivo:** Permitir uma 4ª coluna opcional `teamName` no CSV (`username;displayName;password;teamName`) nos modos `create_and_enroll` e `enroll_existing` para definir o nome personalizado da dupla ou agrupar parceiros pelo mesmo `teamName` (exigindo exatamente 2 jogadores por `teamName`).
- **Impacto Arquitetural:**
  - `server/importParser.ts`: Reconhecer cabeçalho opcional `teamName` / `equipe` / `dupla`.
  - `server/importService.ts`: Se `teamName` for informado no par, usar o nome sanitizado (2–28 caracteres NFKC) na criação do `TournamentTeam`.

### `FUT-SAL-01` · Placar de Série na Sala Casual ("Revanche Rápida")
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Manter na memória da sala casual (`Room`) um contador de rodadas vencidas por jogador ou por dupla (`sessionWins`) enquanto os participantes permanecerem na sala clicando em *"Jogar Novamente"*, exibindo um placar de série no topo da mesa (ex.: `Série da Mesa: Equipe Azul 2 x 1 Equipe Laranja`).
- **Impacto Arquitetural:**
  - `src/types/uno.ts` e `server/unoEngine.ts`: Incrementar `roundWins` no `Player` (já existente para torneios) também em salas casuais ao clicar em `restart_game`, com opção para o Host zerar a série (`reset_series`).

---

## 4. Eixo 3 — Experiência de Aplicativo (PWA) e Imersão Sonora

### `FUT-PWA-01` · Progressive Web App (PWA) Instalável no Celular e Desktop
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Permitir que jogadores em Android, iOS e Desktop instalem o Uno KaWiHe na tela inicial e joguem em tela cheia (sem barra de endereço do navegador), melhorando o espaço vertical para visualizar a mão de cartas e o tabuleiro em telas pequenas.
- **Impacto Arquitetural:**
  - `public/manifest.webmanifest` e ícones estáticos em `public/assets/`.
  - Tags `<link rel="manifest">` e `apple-mobile-web-app-capable` em `index.html`.
  - **Regra Crítica de Versionamento (`REG-VER-01`):** Caso um Service Worker seja adicionado, ele **nunca** deve fazer cache agressivo de `/api/version`, `/api/*` ou `/ws`, usando estratégia *Network-First* para o HTML/JS principal a fim de nunca mascarar atualizações de deploy verificadas pelo `ChangelogModal`.

### `FUT-SND-01` · Pacote de Efeitos Sonoros Sintetizados via Web Audio API
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00` — Web Audio API nativa do navegador, zero arquivos MP3 externos pesados)
- **Objetivo:** Enriquecer `src/services/sound.ts` com efeitos sintetizados leves e controle de volume independente (Mudo / Efeitos / Voz):
  - Alerta sonoro suave de contagem regressiva nos últimos 5 segundos do turno (`turnTimeRemaining <= 5`).
  - Som dramático ao receber `+2` ou `Wild +4`.
  - Fanfarra curta ao gritar `"UNO!"` (`call_uno`) e sirene de penalidade ao ser pego no `catch_uno`.

---

## 5. Eixo 4 — Resiliência Operacional, Segurança e Administração

### `FUT-RES-01` · Proteção Contra Travamento em Salas Sem Limite de Tempo (`turnTimeLimit = 0`)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Em salas casuais configuradas com tempo de turno infinito (`turnTimeLimit === 0`), se o jogador da vez desconectar (`isConnected === false`), iniciar um timer de segurança de **45 segundos** (ou botão imediato para o Host *"Forçar Compra/Passar do Desconectado"*) para que a partida nunca fique congelada indefinidamente.
- **Impacto Arquitetural:**
  - `server.ts`: Agendar timer de 45s ao detectar `ws.on('close')` do jogador cujo turno está ativo em sala com `turnTimeLimit === 0` e sem `tournamentId` (já que salas de torneio possuem a regra própria de W.O. `REG-TOR-04`).

### `FUT-SEG-01` · Senha Temporária com Troca Obrigatória no Primeiro Login (`mustChangePassword`)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Quando o Admin criar um usuário no painel, redefinir sua senha ou importar um lote CSV com uma flag opcional `"Exigir troca de senha no 1º acesso"`, marcar `mustChangePassword: true` no `UserRecord`. Após o login bem-sucedido, exibir um modal simples solicitando que o próprio jogador escolha sua nova senha definitiva (mínimo 4 caracteres, `REG-IMP-01`).
- **Impacto Arquitetural:**
  - `server/authService.ts` e `auth-service/server.ts`: Campo opcional `mustChangePassword?: boolean` em `UserRecord` e endpoint `POST /api/auth/change-password` autenticado por JWT (incrementando `sessionVersion` e emitindo novo token).

### `FUT-SEG-02` · Rate Limiting Granular por Segundo no WebSocket (Chat e Sinalização WebRTC)
- **Status:** `PROPOSTO` · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:** Proteger o processo Node.js contra *flood* de mensagens de chat (`chat_message`), emotes (`send_emote`) ou pacotes de sinalização ICE (`rtc_ice_candidate`) no mesmo socket.
- **Impacto Arquitetural:**
  - `server.ts`: Token bucket leve em memória por conexão WebSocket (ex.: máx. 5 mensagens de chat/emote a cada 3 segundos; máx. 40 candidatos ICE por segundo).

### `FUT-OPS-01` · Sincronização e Hardening Automático nos Scripts Shell (`scripts/deploy.sh`)
- **Status:** `PROPOSTO` (Saneamento da `DIV-04`) · **Custo:** `FREE_VERIFIED` (`R$ 0,00`)
- **Objetivo:**
  1. Atualizar a URL de fallback em `/scripts/deploy.sh` para `https://github.com/edinhogrubert/Uno-KaWiHe.git` (alinhando 100% com o `/deploy.sh` principal da raiz) e incluir a validação de `/api/version` também no script rápido.
  2. Garantir `chmod 700 data/` e `chmod 600 data/*.json` automaticamente durante o `./deploy.sh`.

### `FUT-RTC-01` · Suporte Opcional a Relay TURN Self-Hosted Gratuito (`Coturn`) para Redes 4G Restritas
- **Status:** `PROPOSTO` · **Custo:** `SELF_HOSTED_FREE` (`R$ 0,00` na mesma VM Oracle Cloud Always Free, se necessário)
- **Objetivo:** Caso jogadores em redes móveis 4G/5G com *NAT Simétrico* estrito não consigam estabelecer áudio P2P direto apenas com o STUN gratuito do Google (`stun.l.google.com:19302`), permitir configurar variáveis opcionais `VITE_TURN_URL`, `VITE_TURN_USER` e `VITE_TURN_CREDENTIAL` apontando para um container `coturn/coturn` open-source na própria VM (mantendo o tráfego bem abaixo da franquia gratuita de 10 TB/mês da Oracle Cloud).

---

## 6. Eixo 5 — Projeto Sentinel KaWiHe: Resiliência, Aprendizado e Recuperação Distribuída Ordenada (`FUT-RES-02`)

### `FUT-RES-02` · Arquitetura Sentinel KaWiHe — Proteção Autônoma, Aprendizado de Capacidade e Recuperação Distribuída com Ordem de Admissão Preservada
- **Status:** `PROPOSTO` · **Custo:** `SELF_HOSTED_FREE` / `FREE_VERIFIED` (`R$ 0,00` — operação na 2ª VM `VM.Standard.E2.1.Micro` incluída na franquia gratuita Oracle Cloud Always Free de 2 VMs AMD + 200 GB Block Volume total)
- **Síntese Executiva:** Sistema externo independente de proteção, aprendizado empírico de limites e recuperação automática capaz de manter o Uno KaWiHe estável diante de sobrecargas, travamentos, reinicializações e atualizações, preservando a organização dos jogadores e o estado integral das partidas sem provocar efeito manada (*thundering herd*) no retorno.

#### 6.1 Princípio Arquitetural Normativo (`REG-RES-SENTINEL-01` — `PROPOSTO`)
> *"O Uno KaWiHe deverá preservar a identidade, a prioridade de admissão e o direito de recuperação das sessões independentemente da disponibilidade do servidor principal. O Sentinel deverá continuar comunicando o estado do serviço aos usuários e coordenar o restabelecimento progressivo e consistente das sessões e partidas, respeitando os limites operacionais aprendidos. A queda do servidor de jogo não deve significar perda da organização dos jogadores nem provocar uma segunda queda durante o retorno."*

#### 6.2 Os 7 Pilares do Sentinel KaWiHe
1. **Sentinel Independente (Isolamento de Falha):** Executado em outra VM (`Always Free`), permanece 100% operacional e acessível aos clientes mesmo que o processo principal do Uno KaWiHe ou a VM de jogo parem completamente.
2. **Aprendizado Contínuo de Capacidade:** Combina telemetria de testes de estresse (`stress-test.mjs`, `capacity-test.mjs`) e operação real para mapear empiricamente os limites de CPU, RAM, Swap, Event Loop lag do Node.js, sockets WebSocket concorrentes e mesas ativas.
3. **Limites Dinâmicos Adaptativos:** Mantém tetos operacionais elásticos. Não bloqueia artificialmente o crescimento apenas por atingir uma marca histórica, mas aplica recuos táticos automáticos (`N - 1` ou `N - 10%`, conforme a severidade/tipo da anomalia) quando detecta degradação real.
4. **Proteção Antecipada Não-Intrusiva:** Identifica sinais precoces de esgotamento (pressão de memória, latência de `fsync`, atraso de tick de turno) e prepara snapshots de recuperação enquanto o servidor segue operando, intervindo apenas quando estritamente necessário.
5. **Espera Protegida (Sala de Espera no Sentinel):** Em vez de desconectar abruptamente ou expulsar jogadores durante uma falha ou reinício, o frontend comuta automaticamente para a **Tela de Modo de Recuperação** conectada diretamente ao Sentinel, exibindo a posição original da sessão (`#42`) e o estado em tempo real.
6. **Recuperação Ordenada e Coerente por Conjunto Lógico:** Servidor, Sentinel e clientes preservam a identidade criptográfica e a ordem de entrada. Após o reinício, o Sentinel libera o retorno em lotes progressivos (*staged admission*), respeitando tanto a sequência de admissão quanto a coesão das mesas (restaurando os 2 ou 4 jogadores de uma partida ativa como um conjunto lógico indivisível).
7. **Autoproteção e Contingência Dual:** O próprio Sentinel possui limites de recursos, persistência enxuta e watchdog. Se o Sentinel ficar indisponível, o servidor principal do KaWiHe aplica uma **Política de Contingência Local (*Fallback Fail-Safe*)** com teto conservador fixo e *rate-limit* de admissão, jamais permitindo admissões ilimitadas por ausência do controlador.

#### 6.3 Fluxo Operacional em 3 Fases (Antes, Durante e Após a Falha)

##### Fase 1 — Antes da Falha (Conhecimento Prévio e Sincronização Contínua)
> **Premissa Fundamental:** O Sentinel precisa conhecer a ordem dos jogadores e a topologia das salas **antes** da falha, e não tentar descobri-las depois.

1. **Admissão no Servidor Principal (`KaWiHe Game Server`):**
   - Ao autenticar/conectar um jogador, o servidor atribui um número sequencial monotônico de admissão (`admissionSeq`, ex.: `#42`), vinculado à geração atual (`recoveryEpoch`).
2. **Ticket Criptográfico no Cliente (Zero Confiança no Navegador):**
   - Guardar apenas um número inteiro no navegador é inseguro (sujeito a perda de `localStorage`, dados obsoletos ou adulteração maliciosa do número de fila).
   - O cliente recebe um **`RecoverySessionTicket`** assinado via HMAC/JWT contendo:
     `{ sessionId, userId, admissionSeq, roomId, tournamentId, recoveryEpoch, issuedAt, signature }`.
   - O cliente guarda sua identificação, mas **não determina sozinho sua posição nem seu direito de retorno**.
3. **Replicação Assíncrona Leve para o Sentinel + Snapshot Local de Jogo:**
   - O servidor replica continuamente (via canal interno autenticado/deltas leves) a tabela de sessões autorizadas (`admissionLedger`) e o agrupamento de salas (`roomRoster`) para o Sentinel.
   - Paralelamente, para que **recuperar a conexão signifique também recuperar o jogo exatamente de onde parou**, o servidor principal persiste snapshots atômicos periódicos/por evento crítico em `data/active_rooms_snapshot.json` (usando `atomicWriteFileSync`), preservando as 108 cartas (`deck`, `discardPile`, `hands`), turno atual, cronômetro, direção, estado de UNO e vínculos de torneio. O Sentinel **coordena a recuperação**, mas **não assume o papel do motor de UNO**.

##### Fase 2 — Durante a Falha (Comutação para Espera Protegida no Sentinel)
1. **Detecção pelo Cliente:**
   - Quando o WebSocket principal cai e o endpoint `/health` do servidor de jogo não responde dentro da janela de tolerância, o frontend entra automaticamente em **Modo de Recuperação** e abre conexão leve com o endpoint público do Sentinel (`VITE_SENTINEL_URL`).
2. **Apresentação do Ticket ao Sentinel:**
   - O cliente envia seu `RecoverySessionTicket`. O Sentinel valida a assinatura criptográfica, confirma o registro no seu `admissionLedger` independente e devolve o status oficial da fila.
3. **Interface Visual do Jogador (Modo de Recuperação KaWiHe):**
   - O jogador permanece informado sem sobrecarregar o servidor principal em reinicialização:
     ```text
     ┌────────────────────────────────────────────────────────────┐
     │ 🛡️ KaWiHe — Modo de Recuperação Protegida (Sentinel)      │
     ├────────────────────────────────────────────────────────────┤
     │ O servidor de partidas está temporariamente em recuperação.│
     │ Sua sessão e sua mesa foram preservadas pelo Sentinel.     │
     │                                                            │
     │ • Sua Ordem Original de Admissão: #42                      │
     │ • Época de Recuperação (Epoch):   E-104                    │
     │ • Vínculo de Mesa / Partida:      Sala #ABCD (4 jogadores) │
     │ • Estado Atual:                   Aguardando liberação     │
     └────────────────────────────────────────────────────────────┘
     ```

##### Fase 3 — Quando o Servidor Reinicia (Reconciliação e Retorno Progressivo)
1. **Rotação de Época (`recoveryEpoch`) e Restauração do Snapshot de Mesas:**
   - Ao iniciar, o servidor principal incrementa o `recoveryEpoch` (invalidando autorizações de quedas antigas), carrega `data/active_rooms_snapshot.json` em modo **`PAUSED_RECOVERY`** (congelando timers de turno e W.O. para ninguém perder por tempo durante a reconexão) e notifica o Sentinel que está vivo.
2. **Sondagem de Prontidão (*Readiness Probe*):**
   - O Sentinel **não libera todos os jogadores imediatamente**. Primeiro verifica a saúde real do servidor de jogo (CPU, memória livre, tempo de resposta do Event Loop e integridade do snapshot restaurado).
3. **Liberação em Etapas por Prioridade e Conjunto Lógico (*Logical Set Admission*):**
   - A ordem de entrada (`admissionSeq`) define a prioridade base, mas **partidas em andamento são restauradas como conjuntos lógicos**: se o jogador `#42` estava em uma partida com `#15`, `#42`, `#67` e `#89`, o Sentinel agrupa os 4 participantes daquela mesa no mesmo lote de reconexão para que a partida retome de forma íntegra assim que todos reconectarem (ou após janela segura de reconexão).
   - Para cada lote liberado, o Sentinel emite um `ReconnectGrantToken` de curta duração vinculando a sessão ao novo `recoveryEpoch`.
   - O servidor principal só retoma o relógio do turno da mesa quando o conjunto lógico da sala é restabelecido.

#### 6.4 Ciclo Contínuo de Funcionamento do Sentinel (8 Etapas)
1. **Monitorar e aprender** limites reais sob carga normal e testes de estresse.
2. **Identificar aproximação dos limites** (CPU, RAM, Swap, Event Loop, I/O).
3. **Preparar proteção** (forçar flush de snapshot de salas e sincronizar ledger) sem interromper o jogo desnecessariamente.
4. **Intervir apenas quando necessário** (congelar novas criações de salas ou acionar reciclagem controlada).
5. **Pausar sessões ou partidas com segurança** preservando as 108 cartas e o estado exato do turno.
6. **Recuperar o servidor e informar os jogadores** através da Tela de Espera Protegida do Sentinel.
7. **Coordenar o retorno progressivo e ordenado** por `admissionSeq` e conjunto lógico de mesa (`roomId`).
8. **Registrar resultados e ajustar limites** (`N - 1` ou `N - 10%`) no histórico de aprendizado.

#### 6.5 Matriz de Requisitos Inegociáveis e Proteções Arquiteturais

| Requisito / Desafio | Solução Arquitetural Especificada (`FUT-RES-02`) |
|---|---|
| **Custo Financeiro Zero (`P2`)** | Execução na 2ª VM `VM.Standard.E2.1.Micro` (1 GB RAM) da própria conta Oracle Cloud Always Free, com comunicação HTTPS/WSS via DuckDNS + Caddy gratuitos (`R$ 0,00`). |
| **Prevenção contra Fraude de Fila no Cliente** | O cliente não envia `"sou o #42"`; envia o `RecoverySessionTicket` assinado pelo servidor/Sentinel e validado contra o `admissionLedger` persistido fora do navegador. |
| **Prevenção contra Replay de Quedas Antigas** | Uso de `recoveryEpoch` monotônico: tokens de liberação emitidos em épocas anteriores são rejeitados imediatamente. |
| **Recuperar o Jogo (e não só o Socket)** | Persistência atômica de `data/active_rooms_snapshot.json` no servidor de jogo com pausa automática dos relógios de turno/W.O. (`PAUSED_RECOVERY`) até a reconexão do conjunto lógico da mesa. |
| **Queda Simultânea do Sentinel (*Fail-Safe*)** | Se o Sentinel não responder ao servidor principal por $> 10\text{s}$, o KaWiHe ativa o **Modo Autônomo Conservador**: aplica teto estático seguro (ex.: 80% do último limite estável salvo localmente em `data/learned_limits.json`) e *token bucket* local de reconexão (ex.: máx. 5 reconexões/segundo), impedindo enxurrada de conexões sem controlador. |
| **Não Bloquear Crescimento Artificialmente** | O teto dinâmico opera em modo de *exploração gradual* quando os indicadores de saúde (CPU $< 70\%$, Event Loop lag $< 40\text{ms}$, Swap estável) estão verdes, só aplicando corte (`N - 1` / `N - 10%`) diante de degradação comprovada. |

#### 6.6 Plano Recomendado de Implementação Gradual (4 Fases — Quando Autorizado pelo Nível 0)
- **Fase A — Especificação de Contratos e Simulador Local:** Definir interfaces TypeScript (`RecoverySessionTicket`, `AdmissionLedgerEntry`, `ActiveRoomSnapshot`, `LearnedCapacityProfile`) e suíte de testes automatizados (`tests/sentinelRecovery.test.ts`) simulando queda do servidor, validação de tickets, agrupamento por conjunto lógico de 4 jogadores e rotação de `recoveryEpoch`.
- **Fase B — Persistência de Estado de Partidas Ativas (`active_rooms_snapshot.json`):** Instrumentar `server.ts` e `server/unoEngine.ts` para serializar e restaurar salas em andamento em modo `PAUSED_RECOVERY` preservando o invariante das 108 cartas (`REG-BAR-01`).
- **Fase C — Microserviço `sentinel-service/` e Contingência Local:** Criar o serviço leve do Sentinel (Node.js/TypeScript, consumo $< 80\text{ MB}$ RAM) com aprendizado de métricas (`N - 1` / `N - 10%`), `admissionLedger` e fallback autônomo no `server.ts`.
- **Fase D — Tela de Espera Protegida no Frontend:** Integrar o componente `SentinelWaitingScreen.tsx` em `src/App.tsx` com comutação automática quando o servidor principal falhar e reconexão guiada por lote autorizado.

---

## 7. Matriz de Priorização Sugerida (Impacto × Complexidade × Custo)

| Ordem | ID | Funcionalidade | Impacto na Experiência / Resiliência | Complexidade | Custo |
|---|---|---|---|---|---|
| **1º** | `FUT-RES-02` | **Projeto Sentinel KaWiHe (Resiliência, Aprendizado e Recuperação Distribuída Ordenada)** | ⭐⭐⭐⭐⭐ Crítico / Estrutural | Alta (Faseada A→D) | `R$ 0,00` |
| **2º** | `FUT-JOG-01` | Empilhamento de `+2` e `+4` (opcional na sala) | ⭐⭐⭐⭐⭐ Muito Alto | Média (`unoEngine` + UI) | `R$ 0,00` |
| **3º** | `FUT-TOR-01` | Pódio Visual de Campeões + Card PNG no Torneio | ⭐⭐⭐⭐⭐ Muito Alto | Baixa (Frontend Canvas) | `R$ 0,00` |
| **4º** | `FUT-SAL-01` | Placar de Série na Sala Casual ("Revanche Rápida") | ⭐⭐⭐⭐ Alto | Baixa (`Room` + `GameOverModal`) | `R$ 0,00` |
| **5º** | `FUT-TOR-02` | Coluna opcional `teamName` no CSV de Duplas | ⭐⭐⭐⭐ Alto | Baixa (`importParser`/`Service`) | `R$ 0,00` |
| **6º** | `FUT-RES-01` | Timeout de 45s para desconectado em sala sem tempo | ⭐⭐⭐⭐ Alto | Baixa (`server.ts`) | `R$ 0,00` |
| **7º** | `FUT-PWA-01` | Modo App Instalável (PWA com *Network-First*) | ⭐⭐⭐⭐ Alto | Baixa (`manifest` + ícones) | `R$ 0,00` |
| **8º** | `FUT-SEG-01` | Senha temporária com troca no 1º login | ⭐⭐⭐ Médio-Alto | Média (`authService` + Modal) | `R$ 0,00` |
| **9º** | `FUT-JOG-02` | Comprar até encontrar carta jogável (*Draw to Match*) | ⭐⭐⭐ Médio-Alto | Baixa (`unoEngine.ts`) | `R$ 0,00` |
| **10º** | `FUT-OPS-01` | Alinhamento de `scripts/deploy.sh` (`DIV-04`) | ⭐⭐⭐ Médio | Muito Baixa (Script `.sh`) | `R$ 0,00` |
| **11º** | `FUT-JOG-03` | Regra do `7` e do `0` (Troca e Rotação de Mãos) | ⭐⭐⭐ Médio | Média-Alta (`unoEngine` + UI) | `R$ 0,00` |

