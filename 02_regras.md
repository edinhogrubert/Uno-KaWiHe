# 02 — Regras (contrato de comportamento)

| Metadado | Valor |
|---|---|
| **Finalidade** | Contrato normativo de regras de negócio, invariantes de domínio, segurança e custo zero. |
| **Público-alvo** | Agentes de IA, Engenheiros de Software, QA e Auditores. |
| **Status** | **NORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |
| **Referências Relacionadas** | `Game_funcionalidades`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`. |

Fonte de verdade das regras de domínio. Taxonomia oficial de evidência: **`CONFIRMADO`** (implementado e testado), **`DECLARADO`** (documentado em regra operacional), **`PROPOSTO`** (evolução futura planejada), **`DIVERGENTE`** (registrado em `/13_MATRIZ_RASTREABILIDADE.md`).

## Princípios & Política Universal de Custo Zero
- **REG-FREE-01 (`CONFIRMADO`)** **REGRA UNIVERSAL E INQUEBRÁVEL DE CUSTO ZERO:** O sistema deve rodar exclusivamente com **custo financeiro zero (`100% Free Tier Global`)** em todos os ambientes (Google AI Studio, Oracle Cloud Always Free, GitHub, Caddy, DuckDNS, Let's Encrypt, Cloudflare Tunnel, Node.js/Docker, JSON local, WebSockets `ws` e WebRTC P2P). É proibido implantar, ativar ou sugerir como padrão serviços pagos, bancos de dados cobrados, servidores TURN pagos ou períodos de avaliação (`TRIAL_ONLY`) sujeitos a cobrança automática. Toda adição deve passar pelo **Free Tier Compliance Gate** em `/11_FREE_TIER_COMPLIANCE.md`.
- **REG-AUT-01 (`CONFIRMADO`)** Servidor é a única autoridade (cartas, mãos, deck, turnos, efeitos, pontuação, UNO, vitória, configurações, identidade, permissões).
- **REG-AUT-02 (`CONFIRMADO`)** Cliente envia intenções (`play_card`, `draw_card`, `pass_turn`, `call_uno`, `catch_uno`...), nunca estado.
- **REG-AUT-03 (`CONFIRMADO`)** `playerId` enviado pelo cliente não é confiável; divergência com o socket → `PLAYER_MISMATCH`.
- **REG-AUT-04 (`CONFIRMADO`)** Ação rejeitada não altera estado.

## Baralho e início
- **REG-BAR-01 (`CONFIRMADO`)** 108 cartas: 0×4, 1–9×72, Skip/Reverse/+2×8 cada, Wild×4, Wild+4×4.
- **REG-BAR-02 (`CONFIRMADO`)** Embaralhar no servidor; ordem do deck nunca vai ao cliente.
- **REG-INI-01 (`CONFIRMADO`)** Mínimo 2 jogadores; 7 cartas cada.
- **REG-INI-02 (`CONFIRMADO`)** Carta inicial `wild_draw_four` volta ao deck e outra é sorteada.
- **REG-INI-03 (`CONFIRMADO`)** Regra da casa: carta especial inicial NÃO dispara efeito; coringa inicial fixa cor vermelha.

## Jogadas
- **REG-JOG-01 (`CONFIRMADO`)** Carta jogável: mesma cor, ou mesmo tipo, ou mesmo valor. Wild sempre jogável.
- **REG-JOG-02 (`CONFIRMADO`)** `activeColor` ∈ {red, blue, green, yellow}, nunca `wild`. Coringa exige `chosenColor`.
- **REG-JOG-03 (`CONFIRMADO`)** `strictWildDrawFour`: quando ligado, Wild+4 é proibido se o jogador tiver a cor ativa.
- **REG-JOG-04 (`CONFIRMADO`)** Reverse com 2 jogadores equivale a Skip.
- **REG-JOG-05 (`CONFIRMADO`)** Deck esgotado: manter o topo do descarte e embaralhar o resto como novo deck.

## Compra e passar
- **REG-CMP-01 (`CONFIRMADO`)** Uma compra por turno (`hasDrawnThisTurn`).
- **REG-CMP-02 (`CONFIRMADO`)** Passar exige compra antes; senão `MUST_DRAW_FIRST`.

## Tempo
- **REG-TMP-01 (`CONFIRMADO`)** `turnTimeLimit` em segundos; 0 = ilimitado; padrão 30.
- **REG-TMP-02 (`CONFIRMADO`)** Ao estourar: se não comprou, compra 1 e passa; se já comprou, só passa.

## UNO
- **REG-UNO-01 (`CONFIRMADO`)** Ao ficar com 1 carta, jogador fica vulnerável por `unoWindowMs` (5000ms).
- **REG-UNO-02 (`CONFIRMADO`)** `call_uno` só pelo próprio jogador; válido com 1 carta.
- **REG-UNO-03 (`CONFIRMADO`)** `catch_uno` só dentro da janela; alvo compra 2; não pode acusar a si mesmo (`UNO_SELF_CATCH`).
- **REG-UNO-04 (`CONFIRMADO`)** Modo Kids (`autoUnoProtection`): grito automático.

## Protocolo WebSocket
- **REG-WS-01 (`CONFIRMADO`)** Envelope com `protocolVersion: 2`; versão diferente → `UNSUPPORTED_VERSION`.
- **REG-WS-02 (`CONFIRMADO`)** Ações levam `messageId`; repetição em 60s retorna o mesmo resultado.
- **REG-WS-03 (`CONFIRMADO`)** `game_state` público (sem mãos/deck); `hand_state` privado ao dono.

## Identidade e reconexão
- **REG-ID-01 (`CONFIRMADO`)** `reconnectToken` é secreto, não derivado do `playerId`, e obrigatório para reconectar.
- **REG-ID-02 (`CONFIRMADO`)** Desconectado mantém assento, mão e score durante o grace period.
- **REG-ID-03 (`CONFIRMADO`)** Sala sem humanos conectados é destruída após ~5 min.

## Modo Duplas 2v2 (Equipes)
- **REG-2V2-01 (`CONFIRMADO`)** Modo 2v2 consiste em 4 jogadores divididos em Equipe A (Azul) e Equipe B (Laranja).
- **REG-2V2-02 (`CONFIRMADO`)** Assentos alternados `[A1, B1, A2, B2]` para intercalar turnos entre equipes opostas.
- **REG-2V2-03 (`CONFIRMADO`)** Visibilidade de cartas: cada membro da equipe recebe em tempo real pelo socket a mão do seu parceiro (`teammateHand`), mantendo cartas de adversários ocultas.
- **REG-2V2-04 (`CONFIRMADO`)** Condição de vitória: a rodada encerra imediatamente quando qualquer membro da equipe zerar suas cartas (`player.hand.length === 0`), concedendo a vitória à dupla (`winnerTeam`).
- **REG-2V2-05 (`CONFIRMADO`)** Pontuação da vitória: soma dos pontos das cartas restantes de ambos os adversários da equipe perdedora.
- **REG-2V2-06 (`CONFIRMADO`)** Fogo amigo de UNO: bloqueado acusar ou penalizar o próprio parceiro via `catch_uno`.

## Torneios (`tournamentEngine.ts` + `tournamentCleanupService.ts`)
- **REG-TOR-01 (`CONFIRMADO`)** Criação, início, simulação e decisões administrativas de torneio exigem `role === 'admin'`.
- **REG-TOR-02 (`CONFIRMADO`)** Individual distribui mesas de 2 a 4 jogadores de forma determinística (por `seed`); Duplas 2v2 usa chaveamento eliminatório em potência de 2 com byes e séries ímpares (Md1, Md3 ou Md5) com *early clinch*.
- **REG-TOR-03 (`CONFIRMADO`)** Classificação individual na V1 ordena por vitórias; `roundPointsWon` é apenas informativo e **nunca** desempata. Empates na linha de corte exigem partida extra (`extra_match`) ou decisão admin (`admin_decision`).
- **REG-TOR-04 (`CONFIRMADO`)** W.O. individual só se aplica a salas com `tournamentId` após `reconnectGraceMs`: remove o jogador, preserva as 108 cartas devolvendo sua mão (e eventual `stagedCardPlay`) abaixo do topo do descarte, e encerra com `void_insufficient_players` se restar menos de 2 ativos.
- **REG-TOR-05 (`CONFIRMADO`)** Proibido W.O. individual em salas 2v2 (`team_2v2` / `doubles_elimination`); em duplas, desistência/W.O. de 1 integrante concede vitória da partida à equipe adversária.
- **REG-TOR-06 (`CONFIRMADO`)** Em reinício do servidor com partidas em andamento, o torneio é pausado (`server_restart`) sem inventar vencedor automático.
- **REG-TOR-07 (`CONFIRMADO`)** **Encerramento (`closed`):** altera o status para `closed`, bloqueia novas inscrições, participações e partidas, preserva integralmente histórico, resultados, estatísticas e TODOS os usuários. Bloqueia se houver partidas ao vivo na mesa (`playing` / `paused`).
- **REG-TOR-08 (`CONFIRMADO`)** **Reagendamento (`rescheduled`):** transfere a data do torneio sem encerrá-lo; torneios `rescheduled` permanecem abertos para inscrição (individual, duplas e importação em massa) e início posterior.
- **REG-TOR-09 (`CONFIRMADO`)** **Exclusão de Usuários Temporários:** operação administrativa estritamente independente do encerramento, restrita a contas com proveniência explícita (`accountOriginType === 'tournament_temporary' && isTemporary === true && temporaryTournamentId === id`, jamais heurísticas por nome/data), protegendo usuários permanentes/admins/outros torneios, exigindo desafio matemático aleatório validado e consumido uma única vez no servidor, verificação de dependências, trilha em `data/tournament_audit.json` e rollback transacional atômico em caso de erro.

## Admin, Sessões, Versionamento e Segurança
- **REG-ADM-01 (`CONFIRMADO`)** Rotas `/api/admin/*` exigem JWT com `role === 'admin'` (ou `ADMIN_PIN` apenas quando configurado explicitamente via variável de ambiente). Rotas do Importador (`/api/admin/import/*`) e gestão de torneios (`/api/tournaments/*`) exigem **exclusivamente** JWT válido (`role === 'admin'` para ações administrativas), rejeitando `x-admin-pin` isolado; `/api/admin/cli-status` exige validação admin (`403`); `POST /api/auth/login` exige senha verificada via bcrypt sem fallback de PIN.
- **REG-ADM-02 (`CONFIRMADO`)** **Desconexão real de sessão:** `POST /api/admin/player-action/disconnect` incrementa `sessionVersion` do usuário alvo (`server/authService.ts`), invalidando imediatamente todos os JWTs anteriores tanto no servidor principal quanto no `auth-service`, envia `{ type: 'session_revoked' }`, encerra o WebSocket com código `4001` (impedindo auto-reconexão no cliente) e bloqueia criação/entrada em salas para tokens revogados.
- **REG-VER-01 (`CONFIRMADO`)** **Versionamento explícito e verificável:** a versão oficial e o histórico resumido residem em `src/utils/versionHistory.ts`, servidos por `GET /api/version`, exibidos na Tela de Login, Lobby e Painel Admin (`ChangelogModal`) com alerta de divergência Cliente × Servidor e validados na Etapa 6 do `deploy.sh`.
- **REG-SEG-01 (`CONFIRMADO`)** `JWT_SECRET` via ambiente em produção; senhas com bcrypt (fator 10 no cadastro/importação, 12 no bootstrap/CLI); rate limit por falhas de login (`5`/5min por conta, `20`/5min por IP), cadastro (`10`/10min por IP) e convites (`20`/5min por IP). Nenhuma cobrança ou dependência paga.

## Importador de Usuários em Massa e Ciclo de Vida (`importService.ts` + `dataLock.ts`)
- **REG-IMP-01 (`CONFIRMADO`)** **Senha mínima padronizada:** mínimo de **4 caracteres** consistente entre cadastro público, criação administrativa, redefinição de senha, importação em massa e CLI.
- **REG-IMP-02 (`CONFIRMADO`)** **DisplayName obrigatório e único:** modos de criação (`create_only`, `create_and_enroll`) exigem `displayName` (2–18 caracteres, normalizado em Unicode NFKC sem caracteres invisíveis/Bidi) e rejeitam duplicidade no sistema ou no mesmo lote (nunca usa `username` como fallback).
- **REG-IMP-03 (`CONFIRMADO` no código / `DIV-02` auditada)** **Inscrição em torneios `individual` e `doubles` (`2v2`):** nos modos `create_and_enroll` e `enroll_existing`, o importador inscreve linhas válidas individualmente quando `tournament.modality === 'individual'`, e **forma duplas automaticamente por pares consecutivos de linhas válidas** (1ª e 2ª linhas válidas = Dupla 1; 3ª e 4ª = Dupla 2) quando `tournament.modality === 'doubles'`, rejeitando lote com quantidade ímpar de linhas válidas (`ODD_ROW_COUNT_DOUBLES`, `server/importService.ts` linhas 591–622 e 930–983, validado em `tests/importService.test.ts`). Coluna explícita `teamName` no CSV permanece como evolução `PROPOSTO`.
- **REG-IMP-04 (`CONFIRMADO`)** **Limites operacionais:** máximo de **200 registros** por lote e **512 KB** por payload/arquivo; hashing `bcrypt` (rounds=10) executado em `worker_threads` nativa fora do mutex para manter o lag médio do Event Loop em ~10ms sem afetar partidas WebSocket.
- **REG-IMP-05 (`CONFIRMADO`)** **Concorrência global (`data/.kawihe.lock`):** toda escrita em `DATA_DIR` (cadastro normal, cadastro admin, edição de perfil, reset de senha, importação, status e `auth-service`) é serializada por mutex FIFO em memória + file lock exclusivo `data/.kawihe.lock`.
- **REG-IMP-06 (`CONFIRMADO`)** **Consistência entre arquivos JSON (WAL):** lotes utilizam idempotencyKey, proveniência (`createdByImportBatchId`, `createdByImportOperationId`), telemetria por item (`userOpStatus`, `enrollOpStatus`) e máquina de estados (`running` → `completed` | `failed` | `partial` | `reconciling`, mantendo `'in_progress'` apenas para leitura legada) em `data/import_batches.json` com checkpoint intermediário (`usersSaved`) e reconciliação automática na inicialização (`reconcileIncompleteImportBatches`).
- **REG-IMP-07 (`CONFIRMADO`)** **Privacidade absoluta:** `import_batches.json`, trilhas de auditoria, logs e APIs jamais persistem ou retornam senhas em texto puro, `passwordHash` ou conteúdo bruto do CSV; estado de senhas na UI é limpo após o commit.
- **REG-IMP-08 (`CONFIRMADO`)** **Ciclo de vida de contas (`active` | `disabled` | `archived`):** contas desativadas ou arquivadas são bloqueadas em login (HTTP 403), `/api/auth/me`, validação de JWT (`getUserFromToken`), handshake WebSocket (close `4003`), criação/entrada em salas, reconexão (`sync_session`) e inscrições em torneios, mantendo histórico e estatísticas preservados.
- **REG-IMP-09 (`CONFIRMADO`)** **Exclusão segura:** contas pré-existentes vinculadas via `enroll_existing` e contas `admin` são protegidas contra gestão pelo lote; exclusão só é permitida para contas criadas pelo lote (`created_by_batch`) sem histórico de partidas, torneios, salas ativas ou convites.

