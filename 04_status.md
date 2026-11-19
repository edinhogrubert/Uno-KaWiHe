# 04 — Status e Planejamento

| Metadado | Valor |
|---|---|
| **Finalidade** | Fotografia verificável do estado implementado (`v2.3.0`), métricas empíricas e backlog Free Tier. |
| **Público-alvo** | Proprietário, Agentes de IA, Desenvolvedores e Auditores. |
| **Status** | **INFORMATIVO / OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `02_regras.md`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`. |

## Implementado (`CONFIRMADO`)
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
- **Governança, Reconstrução e Conformidade Free Tier (`10` a `13`):** manuais normativos `/10_RECONSTRUCAO_COMPLETA.md` (28 etapas), `/11_FREE_TIER_COMPLIANCE.md` (Política Universal de Custo Zero e Gate de 7 perguntas), `/12_OPERACAO_E_RECUPERACAO.md` (DR e persistência) e `/13_MATRIZ_RASTREABILIDADE.md` (rastreabilidade ponta a ponta + registro de divergências `DIV-01`..`DIV-06`).
- Suíte de testes: **126 testes** passando em 12 arquivos (`unoEngine`: 26, `serverIntegration`: 19, `participationLogic`: 9, `tournamentEngine`: 22, `tournamentWo`: 19, `tournamentIntegration`: 5, `tournamentStress`: 2, `tournamentAdminLifecycle`: 6, `importParser`: 6, `importService`: 7, `importIntegration`: 3, `sessionRevocation`: 2).

## Planejamento / Backlog (`PROPOSTO` — Pós-v2.3.0 · 100% Free Tier)
- Evolução futura do Importador: suporte a coluna explícita `teamName` no CSV para nomear equipes em torneios `doubles` (`username;displayName;password;teamName`), exportação de metadados de lote sem credenciais e senha temporária com troca obrigatória no primeiro login.
- Conversão automática para bot ou passagem de turno após 45s quando jogador desconectar em sala com `turnTimeLimit = 0`.
- Rate limiting específico por segundo para chat e sinalização ICE/WebRTC no WebSocket.
- Suporte opcional a servidor TURN self-hosted (Coturn gratuito) caso redes 4G com NAT simétrico exijam relay de voz.
- Hardening automático de permissões (`chmod 700 data/` e `chmod 600` em backups) no script de deploy.

## Próximo passo sugerido
Publicar o conjunto documental auditado (`AGENTS.md`, `00`–`13`, `README.md`) no branch `main` do repositório oficial `https://github.com/edinhogrubert/Uno-KaWiHe` e validar a Etapa 6 do `./deploy.sh` na VM.

