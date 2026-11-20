# 05 — Decisões (ADR curto)

| Metadado | Valor |
|---|---|
| **Finalidade** | Registro consolidado de Decisões Arquiteturais (Architecture Decision Records), incluindo registro formal de **Parecer divergente** quando aplicável. |
| **Público-alvo** | Proprietário / Operador no chat (Nível 0), Arquitetos, Engenheiros de Software, Agentes de IA e Auditores. |
| **Status** | **NORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado à **Autoridade Máxima de quem digita aqui no chat (Nível 0 — Proprietário / Operador ativo; ref. `edinho.grubert@gmail.com`)** e ao Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |
| **Referências Relacionadas** | `03_arquitetura.md`, `11_FREE_TIER_COMPLIANCE.md`, `12_OPERACAO_E_RECUPERACAO.md`, `14_CONFIABILIDADE_IA.md`. |

## Formato Padrão para Novas Decisões (e Registro de Parecer Divergente)
Conforme a Política Anti-Concordância Automática (`14_CONFIABILIDADE_IA.md`, Seção 3), toda nova decisão arquitetural deve registrar:
- **Motivo & Consequência:** Contexto técnico e efeito nos contratos/código.
- **Parecer divergente:** `Nenhum (consenso técnico)` **OU** descrição objetiva do parecer técnico original do agente, riscos apontados, decisão final autorizada por quem comanda o chat (Nível 0) e justificativas aplicáveis.

---

## ADR-001 · v2.1 · Servidor autoritativo
Motivo: impedir trapaça e vazamento de cartas. Consequência: cliente só envia intenções; mãos vão por `hand_state`. Parecer divergente: Nenhum.

## ADR-002 · v2.2 · `reconnectToken` separado do `playerId`
Motivo: `playerId` é público; usá-lo como segredo permitiria usurpação. Consequência: token gerado por sala, enviado só no `room_joined`. Parecer divergente: Nenhum.

## ADR-003 · v2.2 · Persistência em JSON local com escrita atômica (`fsync` + `rename`)
Motivo: simplicidade operacional, zero custo, sem necessidade de banco de dados pago externo. Consequência: `atomicWriteFileSync` (`temp` → `fsyncSync` → `renameSync`). Parecer divergente: Nenhum.

## ADR-004 · v2.2 · Voz em malha P2P sem servidor de mídia pago
Motivo: custo zero e simplicidade. Consequência: WebRTC direto entre navegadores com STUN público gratuito (`stun.l.google.com`). Parecer divergente: Nenhum (risco residual em NAT 4G simétrico documentado como `FUT-RTC-01` em `15_FUTURAS_FUNCIONALIDADES.md`).

## ADR-005 · v2.2 / v2.3.0 · Política Universal e Inquebrável de Custo Zero (`11_FREE_TIER_COMPLIANCE.md`)
Motivo: garantir que nenhuma dependência, infraestrutura, domínio, proxy ou serviço pago seja introduzido em qualquer ambiente (AI Studio, Oracle Cloud Always Free, GitHub, Caddy, DuckDNS, Let's Encrypt, Cloudflare). Consequência: proibição estrita de serviços `PAID` ou `TRIAL_ONLY` e aplicação obrigatória do **Free Tier Compliance Gate (7 perguntas)**. Parecer divergente: Nenhum.

## ADR-006 · v2.2.3 · Domínio Puro de Torneios (`tournamentEngine.ts`)
Motivo: isolar chaves, byes, classificação V1 (sem desempate por `roundPointsWon`) e recuperação pós-reinício de transporte HTTP/WS. Consequência: lógica 100% determinística e testável sem mocks de rede. Parecer divergente: Nenhum.

## ADR-007 · v2.2.3 · Remoção por W.O. com Preservação das 108 Cartas
Motivo: em torneios individuais, desconexão após prazo não pode travar a mesa nem duplicar/sumir cartas. Consequência: `removeTournamentPlayerWO` devolve mão e `stagedCardPlay` abaixo do topo do descarte e ajusta `currentTurnIndex` nos dois sentidos. Parecer divergente: Nenhum.

## ADR-008 · v2.2.3 · Hashing `bcrypt` em Worker Thread fora do Mutex
Motivo: calcular até 200 hashes `bcrypt` na thread principal congelaria o Event Loop (~20s) e causaria quedas/jitter nas partidas WebSocket em andamento. Consequência: `hashPasswordsInWorker` processa senhas fora do lock mantendo o lag médio de Event Loop em ~10,6ms, e o lock é adquirido apenas na etapa rápida de revalidação e persistência. Parecer divergente: Nenhum.

## ADR-009 · v2.2.3 · WAL entre JSONs + File Lock Multi-Processo (`data/.kawihe.lock`)
Motivo: escrita atômica individual não impede inconsistência entre `users.json`, `tournaments.json` e `import_batches.json` em falhas parciais, nem concorrência entre `uno-game` e `kawihe-auth`. Consequência: todo escritor usa `withDataLock` (mutex FIFO + `data/.kawihe.lock`) e o importador grava WAL reconciliado automaticamente no boot (`reconcileIncompleteImportBatches`). Parecer divergente: Nenhum.

## ADR-010 · v2.2.3 · Ciclo de Vida `disabled`/`archived` Preservando Histórico
Motivo: excluir contas com histórico quebraria estatísticas, tabelas de torneios e auditoria. Consequência: contas com dependências são desativadas/arquivadas (bloqueando login, JWT e WS ativo com close `4003`), reservando exclusão física apenas para contas sem vínculos criadas pelo lote. Parecer divergente: Nenhum.

## ADR-011 · v2.2.3 · Encerramento Seguro de Torneios & Limpeza Explícita de Temporários (`tournamentCleanupService.ts`)
Motivo: encerrar torneio não deve apagar contas permanentes nem heurísticas por nome/data podem apagar usuários errados. Consequência: reagendamento (`rescheduled`) e encerramento (`closed`) preservam histórico/contas, e exclusão de temporários exige proveniência explícita (`accountOriginType === 'tournament_temporary' && isTemporary && temporaryTournamentId`), trilha em `data/tournament_audit.json` e desafio matemático de uso único no servidor. Parecer divergente: Nenhum.

## ADR-012 · v2.3.0 · Revogação Real de Sessão via `sessionVersion` (`4001` / `session_revoked`)
Motivo: derrubar apenas o socket sem invalidar o JWT fazia o cliente reconectar em 1s e continuar entrando em salas. Consequência: desconexão administrativa incrementa `sessionVersion` no `UserRecord` (verificado em `server.ts` e `auth-service`), envia `session_revoked`, fecha WS com `4001` e força logout imediato sem auto-reconexão. Parecer divergente: Nenhum.

## ADR-013 · v2.3.0 · Fonte Única de Versionamento (`versionHistory.ts`), `/api/version` e Validação no Deploy
Motivo: sem versão visível no aplicativo e conferida no container, cache de navegador ou falha silenciosa no deploy deixava dúvidas se a VM atualizou. Consequência: `src/utils/versionHistory.ts` abastece UI e `/api/version`, `ChangelogModal` alerta divergência Cliente × Servidor e a Etapa 6 do `deploy.sh` exige `LIVE_VERSION == package.json`. Parecer divergente: Nenhum.

## ADR-014 · v2.3.0 · Governança de Confiabilidade de IA (`14_CONFIABILIDADE_IA.md`) e Autoridade de Quem Digita no Chat (Nível 0)
Motivo: impedir alucinações, concordância automática sem crítica técnica, perda de contexto entre chats e confusão sobre a autoridade decisória máxima. Consequência: adoção do vocabulário único de 7 estados (`VERIFICADO`, `DOCUMENTADO`, `RELATADO`, `INFERIDO`, `PROPOSTO`, `DESCONHECIDO`, `CONTRADITÓRIO`), protocolo de contestação técnica e definição explícita de que a **Autoridade Máxima (Nível 0) é aquele que digita diretamente no chat** (com `edinho.grubert@gmail.com` como referência cadastral do projeto). Parecer divergente: Nenhum.


