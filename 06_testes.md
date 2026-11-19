# 06 — Testes e critérios de aceitação

| Metadado | Valor |
|---|---|
| **Finalidade** | Especificar a suíte de testes automatizados (126 testes em 12 arquivos) e critérios de aceitação. |
| **Público-alvo** | Engenheiros de Software, QA, Agentes de IA e Auditores. |
| **Status** | **NORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |
| **Referências Relacionadas** | `02_regras.md`, `13_MATRIZ_RASTREABILIDADE.md`. |

Total atual (`CONFIRMADO`): **126 testes** em 12 suítes executadas via `npm test` (Vitest, 100% gratuito e local):
- `tests/unoEngine.test.ts` (**26 testes**): regras do baralho de 108 cartas, jogabilidade, turnos, UNO, reciclagem e 2v2.
- `tests/serverIntegration.test.ts` (**19 testes**): protocolo WS v2, reconexão, segurança de sockets, JWT admin, relatório de jogador e bloqueio de fogo amigo 2v2.
- `tests/participationLogic.test.ts` (**9 testes**): regras de participação, exclusão de espectadores, presença e desempate em sala.
- `tests/tournamentEngine.test.ts` (**22 testes**): domínio puro de torneios (permissões, distribuição, byes, Md1/Md3/Md5, desempate, W.O., reinício e simulação).
- `tests/tournamentWo.test.ts` (**19 testes**): remoção de jogador por W.O. preservando as 108 cartas, `stagedCardPlay`, índices e bloqueio em 2v2.
- `tests/tournamentIntegration.test.ts` (**5 testes**): integração real HTTP/WS de torneios (Individual + Duplas 2v2).
- `tests/tournamentStress.test.ts` (**2 testes**): progressão completa ponta a ponta em escala Individual (8/16/32) com desempates e Duplas 2v2 Md3 (4/8) com *early clinch*.
- `tests/tournamentAdminLifecycle.test.ts` (**6 testes**): reagendamento, encerramento seguro preservando histórico/usuários, desafio matemático e exclusão exclusiva de contas temporárias com rollback.
- `tests/importParser.test.ts` (**6 testes**): parser RFC-4180 CSV/TSV/texto, UTF-8 BOM, colunas reordenadas, ambiguidade de delimitador, limites de 512 KB / 200 registros e lista simples no Modo C.
- `tests/importService.test.ts` (**7 testes**): padronização de senha 4 caracteres (incluindo rejeição de `ADMIN_PIN` como senha), `displayName` obrigatório/NFKC, proveniência (`createdByImportBatchId` / `createdByImportOperationId`), privacidade zero-credencial, Modos A/B/C, inscrição em torneios `doubles` por pares consecutivos com rejeição de contagem ímpar (`ODD_ROW_COUNT_DOUBLES`), WAL recovery multi-item, gestão de ciclo de vida + benchmark empírico de 200 hashes `bcrypt` em Worker Thread.
- `tests/importIntegration.test.ts` (**3 testes**): autorização JWT estrita (sem PIN fallback), parser HTTP 1 MB em `/api/admin/import/*`, ciclo completo Fases 1–4 com desconexão WebSocket ao vivo (código `4003`) e bloqueio de login HTTP 403.
- `tests/sessionRevocation.test.ts` (**2 testes**): revogação real de sessão por `sessionVersion` com `session_revoked` + fechamento WS `4001`, rejeição de JWT antigo em `/api/auth/me` e WS, liberação após novo login e verificação do endpoint `GET /api/version`.

Scripts auxiliares de carga e torneio (sob demanda): `npm run stress`, `npm run capacity` e `npm run tournament-test`.

## Critérios de contrato
- UNO-001 a UNO-010 (Regras de baralho, cartas especiais, compra, UNO).
- SEC-001 a SEC-006 (Segurança de sockets, JWT admin, restrições).
- WS-001 a WS-005 (Idempotência, envelopes versionados).
- REC-001 a REC-005 (Reconexão segura e grace period).
- RTC-001 a RTC-004 (Sinalização e voz WebRTC).
- REG-2V2-01 a REG-2V2-06 e REG-TOR-01 a REG-TOR-09 (Modo Duplas 2v2, Torneios, Encerramento & Limpeza de Temporários).
- REG-IMP-01 a REG-IMP-09 (Importador de Usuários em Massa, WAL, Concorrência, Privacidade e Ciclo de Vida).
- REG-ADM-01, REG-ADM-02, REG-VER-01 e REG-FREE-01 (Revogação de Sessão, Versionamento & Política Universal de Custo Zero).

## Regra
Nenhuma tarefa está concluída sem rodar `npm test` e verificar que todos os **126 testes** passam com sucesso.

