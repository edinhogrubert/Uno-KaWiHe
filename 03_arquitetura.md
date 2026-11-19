# 03 — Arquitetura

| Metadado | Valor |
|---|---|
| **Finalidade** | Visão arquitetural de alto nível, divisão de módulos, estrutura de dados em `./data/` e segurança. |
| **Público-alvo** | Arquitetos, Engenheiros de Software, Agentes de IA e Auditores. |
| **Status** | **NORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |
| **Referências Relacionadas** | `SYSTEM_SPECIFICATION.md`, `10_RECONSTRUCAO_COMPLETA.md`, `12_OPERACAO_E_RECUPERACAO.md`. |

## Visão
```
Navegador (React 19 + Vite + Tailwind)
   │  WebSocket v2 (jogo, chat, sinalização)   │ HTTP (login, cadastro, /api/admin/*, /api/tournaments/*)
   ▼                                           ▼
Servidor Node/Express/TypeScript  ── unoEngine + tournamentEngine ── persistência JSON local (data/)
   ▲                                                                      ▲
   │                                           Microserviço kawihe-auth (porta 4000, volume ./data)
   └── WebRTC P2P (voz) entre navegadores; servidor só retransmite a sinalização
Ambiente 100% gratuito (Política Universal de Custo Zero: AI Studio / Docker em Oracle Cloud Always Free).
```

## Módulos
| Módulo | Responsabilidade |
|---|---|
| `server/unoEngine.ts` | Regras do jogo UNO (108 cartas), modo 2v2, W.O. seguro e bots |
| `server/tournamentEngine.ts` | Domínio puro e determinístico de torneios (Individual e Duplas) |
| `server/tournamentCleanupService.ts` | Encerramento seguro, reagendamento, desafio matemático, auditoria (`tournament_audit.json`) e exclusão de contas temporárias |
| `server/authService.ts` | Usuários (`UserRecord`, `status`, `sessionVersion`), convites (`InviteCode`), JWT, bcrypt |
| `server/dataLock.ts` | Escrita atômica (`fsync` + `rename`), mutex FIFO e file lock `data/.kawihe.lock` |
| `server/importParser.ts` | Parser RFC-4180 CSV/TSV/texto (512 KB / 200 registros, auto-detecção de delimitador) |
| `server/importService.ts` | Importador em massa (Individual e Duplas por pares consecutivos), `worker_threads` bcrypt, WAL/reconciliação, ciclo de vida e impacto |
| `server.ts` | HTTP (parser 1 MB em `/api/admin/import/*`, `/api/version`), WS v2, salas, torneios, rate limit |
| `auth-service/server.ts` | Microserviço SSO de autenticação (porta `4000`) compartilhando `./data` e `data/.kawihe.lock` |
| `src/types/uno.ts` | Tipos compartilhados entre servidor e cliente |
| `src/utils/versionHistory.ts` | Fonte única da versão atual (`APP_VERSION`) e histórico resumido (`RELEASE_HISTORY`) |
| `src/components/ChangelogModal.tsx` | Modal de versão e histórico com comparação Cliente × Servidor (`/api/version`) |
| `src/services/voiceChat.ts` | WebRTC no cliente (voz P2P Full-Mesh com STUN público gratuito) |
| Persistência (`./data/`) | Escrita atômica sincronizada em `users.json`, `invites.json`, `stats.json`, `tournaments.json`, `tournament_audit.json`, `import_batches.json` |

## Estrutura dos Dados (`./data/`)
- **`users.json`** (`UserRecord[]`): `id`, `username`, `passwordHash`, `displayName`, `avatar`, `role`, `tag`, `createdAt`, `status` (`active` \| `disabled` \| `archived`), `statusUpdatedAt`, `statusReason`, `accountOriginType`, `isTemporary`, `temporaryTournamentId`, `createdByImportBatchId`, `createdByImportOperationId`, `sessionVersion`.
- **`invites.json`** (`InviteCode[]`): `code`, `createdBy`, `createdAt`, `expiresAt`, `maxUses`, `usedCount`, `usedBy`, `status`.
- **`stats.json`**: mapa indexado por usuário com `PlayerCareerStats`.
- **`tournaments.json`**: lista persistida de torneios, inscrições, rodadas, jogos e logs de auditoria/limpeza.
- **`tournament_audit.json`** (`TournamentAuditRecord[]`): trilha dedicada de ações administrativas sobre torneios e limpeza/rollback de contas temporárias.
- **`import_batches.json`** (`ImportBatch[]`): metadados de lotes, máquina de estados WAL (`running`, `completed`, `failed`, `partial`, `reconciling`), resumo, itens rastreados (`relationType`, `userOpStatus`, `enrollOpStatus`, `outcome`), `stepsCompleted` e `auditTrail` — sem senhas ou hashes.

## Segurança
JWT com `role` e `sessionVersion` (revogação imediata via desconexão admin com close `4001`; JWT estrito sem PIN fallback em `/api/admin/import/*`, `/api/tournaments/*` e `/api/auth/login`), `/api/admin/cli-status` protegido, rate limit composto por falhas, bcrypt em Worker Thread para lotes, `JWT_SECRET` via ambiente em produção, lock multi-processo `data/.kawihe.lock` e persistência local em JSON atômico (sem banco pago ou custos externos). Operável em HTTP ou HTTPS automático via `configdns.sh` (DuckDNS + Caddy).


