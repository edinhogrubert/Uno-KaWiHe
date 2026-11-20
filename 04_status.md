# 04 — Status e Planejamento

| Metadado | Valor |
|---|---|
| **Finalidade** | Fotografia verificável do estado implementado (`v2.3.0`), métricas empíricas e backlog Free Tier. |
| **Público-alvo** | Proprietário, Agentes de IA, Desenvolvedores e Auditores. |
| **Status** | **INFORMATIVO / OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (**quem digita diretamente aqui no chat**; ref. `edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `02_regras.md`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`, `14_CONFIABILIDADE_IA.md`, `15_FUTURAS_FUNCIONALIDADES.md`. |

## Implementado (`VERIFICADO`)
- Servidor autoritativo com validação das jogadas (`unoEngine.ts` + `server.ts`).
- `reconnectToken` secreto (`crypto.randomUUID()`) obrigatório na reconexão.
- Envelope `protocolVersion: 2` com idempotência por `messageId` (cache 60s).
- `hand_state` privado e suporte a espectadores (`hidden_cards` / `reveal_cards`).
- Persistência atômica sincronizada em JSON local (`data/users.json`, `invites.json`, `stats.json`, `tournaments.json`, `tournament_audit.json`, `import_batches.json`) com `fsyncSync` + `renameSync` + lock `data/.kawihe.lock` (`server/dataLock.ts`).
- Modo Kids com UNO automático (`autoUnoProtection`).
- Modo Duplas 2v2 (`team_2v2`) com assentos alternados `[A1, B1, A2, B2]`, `teammateHand` compartilhada e proteção contra fogo amigo em `catch_uno`.
- Sistema de Torneios (`tournamentEngine.ts` + `tournamentCleanupService.ts` + `TournamentModal.tsx`): Individual e Duplas (Md1/Md3/Md5), simulação pré-início, desempates, W.O. seguro preservando invariante das 108 cartas, recuperação pós-reinício, edição administrativa, reagendamento sem encerramento (`rescheduled`), encerramento seguro (`closed`) preservando histórico/usuários e limpeza independente de usuários temporários com rastreabilidade explícita e desafio matemático validado no servidor.
- **Importador de Usuários em Massa (Fases 1 a 4 — `AdminImportPanel.tsx` + `AdminImportHistoryPanel.tsx` + `server/importService.ts`):**
  - Upload CSV / colagem com parser RFC-4180 (`server/importParser.ts`), limite de 512 KB e 200 registros, senha mínima padronizada em **4 caracteres**, `displayName` obrigatório e único (NFKC), `role` forçado como `'player'`.
  - Modos `create_only`, `create_and_enroll` e `enroll_existing`: suporta torneios `individual` e também torneios `doubles` (`2v2`) agrupando pares consecutivos de linhas válidas (1ª e 2ª = Dupla 1, 3ª e 4ª = Dupla 2) e rejeitando quantidade ímpar (`ODD_ROW_COUNT_DOUBLES` — ver `DIV-02` em `/13_MATRIZ_RASTREABILIDADE.md`).
  - Hashing `bcrypt` (rounds=10) em `worker_threads` nativa (benchmark empírico de 200 registros: ~16s total com **lag médio de Event Loop de ~10,3ms**, mantendo WebSockets sem jitter).
  - Máquina de estados WAL (`running`, `completed`, `failed`, `partial`, `reconciling`) com checkpoint `usersSaved`, proveniência (`createdByImportBatchId` / `createdByImportOperationId`), telemetria por operação e reconciliação automática (`reconcileIncompleteImportBatches`).
  - Ciclo de vida de contas (`active` | `disabled` | `archived`) com bloqueio em login/JWT/WS (close `4003`), preview de impacto e exclusão segura apenas sem dependências históricas.
- **Segurança & Rate Limiting:** autenticação estrita por bcrypt/JWT em `loginUser`, `/api/tournaments/*`, `/api/admin/import/*` e `/api/admin/cli-status`, sem bypass de PIN; rate limit de falhas de login (`5`/5min conta, `20`/5min IP), cadastro (`10`/10min IP) e convites (`20`/5min IP).
- Painel Central Admin completo (`AdminRoomsModal.tsx`): clique direto em qualquer usuário (Salas ou Usuários) para abrir o Relatório Diagnóstico (`PlayerReportModal`), filtros rápidos (`online`, `temporários`, `inativos`, `admins`), suspensão/reativação inline, limpeza de salas sem humanos, envio direto na aba Mensagens e aba Sistema & Auditoria (métricas VM, audit log e card de versão).
- **Desconexão Real de Sessão & Revogação JWT (`v2.3.0`):** encerramento de sessão pelo admin incrementa `sessionVersion` do usuário, invalida JWTs antigos tanto no `server.ts` quanto no `auth-service`, envia `session_revoked` + fecha WebSocket com código `4001` (sem reconexão automática no cliente) e bloqueia entrada/criação de salas para tokens revogados.
- **Versionamento Visível & Histórico Resumido (`v2.3.0`):** `src/utils/versionHistory.ts` como fonte única, endpoint `GET /api/version`, selos clicáveis na Tela de Login, Lobby e Painel Admin abrindo `ChangelogModal` (com detecção de divergência Cliente × Servidor) e validação automática de versão na Etapa 6 do `deploy.sh`.
- **Mensagens Diretas Admin:** entrega garantida por `authenticatedUserId` com banner global z-[90] de 15s e feedback de erro caso o usuário esteja offline.
- Ferramenta de simulação e teste automatizado de torneios de ponta a ponta (`scripts/tournament-test.mjs` / `npm run tournament-test`) via JWT real + WebSockets, preservação de `scripts/capacity-test.mjs`, suporte a Individual e Duplas 2v2, desempates e telemetria da VM.
- Guia de microfone para PC em HTTP/IP (Firefox/Chrome), guia de VM e script `configdns.sh` (DuckDNS + HTTPS via Caddy).
- **Governança, Reconstrução, Conformidade Free Tier, Confiabilidade de IA e Roadmap (`10` a `15`):** manuais normativos `/10_RECONSTRUCAO_COMPLETA.md` (28 etapas), `/11_FREE_TIER_COMPLIANCE.md` (Política Universal de Custo Zero e Gate de 7 perguntas), `/12_OPERACAO_E_RECUPERACAO.md` (DR e persistência), `/13_MATRIZ_RASTREABILIDADE.md` (rastreabilidade ponta a ponta por IDs estáveis, cálculo formal de cobertura `100,0%` e divergências `DIV-01`..`DIV-06`), `/14_CONFIABILIDADE_IA.md` (protocolo de confiabilidade cognitiva, 7 estados oficiais, anti-alucinação, contestação independente e cenários A–J) e `/15_FUTURAS_FUNCIONALIDADES.md` (catálogo normativo de futuras funcionalidades `FUT-*`).
- Suíte de testes: **126 testes** passando em 12 arquivos (`unoEngine`: 26, `serverIntegration`: 19, `participationLogic`: 9, `tournamentEngine`: 22, `tournamentWo`: 19, `tournamentIntegration`: 5, `tournamentStress`: 2, `tournamentAdminLifecycle`: 6, `importParser`: 6, `importService`: 7, `importIntegration`: 3, `sessionRevocation`: 2).

## Planejamento / Backlog (`PROPOSTO` — Detalhado em `/15_FUTURAS_FUNCIONALIDADES.md` · 100% Free Tier)
- **`FUT-JOG-01` a `FUT-JOG-03`:** Regras da Casa opcionais por sala (Empilhamento de `+2`/`+4`, Comprar até encontrar carta jogável *Draw to Match* e Regra do `7` e `0`).
- **`FUT-TOR-01`, `FUT-TOR-02` e `FUT-SAL-01`:** Pódio visual de campeões + Card PNG local no encerramento do torneio, coluna explícita `teamName` no CSV para duplas e placar de série na sala casual ("Revanche Rápida").
- **`FUT-PWA-01` e `FUT-SND-01`:** Modo aplicativo instalável (PWA com *Network-First*) e efeitos sonoros sintetizados via Web Audio API.
- **`FUT-RES-01`, `FUT-SEG-01`, `FUT-SEG-02`, `FUT-OPS-01` e `FUT-RTC-01`:** Timeout de 45s para jogador desconectado em sala com `turnTimeLimit = 0`, senha temporária com troca obrigatória no 1º login, rate limiting por segundo no WebSocket, alinhamento de `/scripts/deploy.sh` (`DIV-04`) e suporte opcional a TURN self-hosted gratuito (`Coturn`).

## Próximo passo sugerido
Publicar o conjunto documental auditado (`AGENTS.md`, `00`–`15`, `README.md` — 24 documentos na raiz) no branch `main` do repositório oficial `https://github.com/edinhogrubert/Uno-KaWiHe` e validar a Etapa 6 do `./deploy.sh` na VM.

