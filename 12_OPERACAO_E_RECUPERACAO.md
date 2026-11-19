# 🚨 12 — MANUAL DE OPERAÇÃO, BACKUP E RECUPERAÇÃO DE DESASTRES — UNO KAWIHE (`v2.3.0`)

## Metadados Documentais
- **Finalidade:** Documentar os procedimentos operacionais de rotina, política de backup/restauração, reconciliação transacional (WAL), administração ao vivo e runbooks de recuperação de desastres (DR) do **Uno KaWiHe `v2.3.0`**.
- **Público-alvo:** Proprietário do projeto, Administradores de Sistema, Engenheiros de Confiabilidade (SRE) e Agentes de IA.
- **Status:** Normativo e Operacional (`CONFIRMADO` contra os scripts e código `v2.3.0`).
- **Fonte de Autoridade:** Subordinado ao Proprietário (**Nível 0** — `edinho.grubert@gmail.com`) e à Constituição Operacional (`AGENTS.md` — **Nível 1**).
- **Versão de Referência:** `v2.3.0`.
- **Commit de Referência:** `6d25e83` + revisão documental `v2.3.0`.
- **Data de Revisão:** `2026-11-18`.
- **Referências Relacionadas:** `AGENTS.md`, `10_RECONSTRUCAO_COMPLETA.md`, `11_FREE_TIER_COMPLIANCE.md`, `manualSH.md`, `SYSTEM_SPECIFICATION.md`.

---

## 1. Operação Diária e Monitoramento de Saúde

### 1.1 Verificação Rápida via Interface Web (Painel Central Admin)
O administrador (`role === 'admin'`) monitora e opera o sistema em tempo real sem precisar abrir conexão SSH:
1. **Selo de Versão (`v2.3.0`) e `ChangelogModal`:** Disponível na Tela de Login, no Lobby e no Painel Central Admin. Compara em tempo real a versão carregada no navegador com `GET /api/version` (`Cache-Control: no-store`).
2. **Aba `Salas` (`AdminRoomsModal.tsx`):** Lista salas ativas, status (`waiting`/`playing`/`paused`/`ended`), modo (`standard`/`team_2v2`/torneio), quantidade de humanos/bots/espectadores. Permite:
   - Clicar em qualquer jogador para abrir o **Relatório Diagnóstico** (`PlayerReportModal.tsx`).
   - Enviar aviso para uma sala (`POST /api/admin/rooms/:id/message`), expulsar jogador (`POST /api/admin/rooms/:id/kick`), encerrar sala (`POST /api/admin/rooms/:id/close`) ou **limpar todas as salas sem humanos conectados** (`POST /api/admin/rooms/cleanup-empty`).
3. **Aba `Usuários`:** Busca por nome/`@username`/`#tag`, filtros rápidos (`online`, `temporários`, `inativos`, `admins`), criação de conta permanente ou temporária de torneio, redefinição de senha, suspensão/reativação inline (`active` ↔ `disabled` / `archived`), exclusão segura e abertura do Relatório Diagnóstico com botão de **Desconectar Sessão** (`sessionVersion` + WS `4001`).
4. **Aba `Mensagens`:** Envio de comunicado global (`POST /api/admin/broadcast`) ou alerta direto para um jogador específico (`POST /api/admin/player-action/alert`, entregue via `authenticatedUserId` com banner global `z-[90]` por 15s e retorno de erro caso o jogador esteja offline).
5. **Aba `Importar`:** Upload CSV ou colagem de até 200 registros (`AdminImportPanel.tsx`) e gestão de histórico, auditoria, análise de impacto e ciclo de vida por lote (`AdminImportHistoryPanel.tsx`).
6. **Aba `Sistema & Auditoria`:** Card de verificação de sincronia de versão Cliente × Servidor, métricas ao vivo da VM (`GET /api/admin/vm-metrics`: CPU, Load Average, RAM do Host, Swap, Disco, Heap/RSS do Node.js, contadores de salas/sockets), trilha de auditoria (`GET /api/admin/audit-log`) e exportação de snapshot JSON.

### 1.2 Verificação Rápida via Linha de Comando (CLI)
> **Nota:** Comandos marcados como `[VERIFICAÇÃO SOMENTE LEITURA]` são seguros para auditoria. Comandos marcados como `[AÇÃO OPERACIONAL NA VM]` alteram estado e só devem ser executados pelo operador em manutenção real.

| Operação | Comando (em `/opt/unokawihe`) | Tipo | O que verifica / executa |
| :--- | :--- | :--- | :--- |
| Status dos Serviços | `./status.sh` | `[VERIFICAÇÃO SOMENTE LEITURA]` | Containers Docker, portas `3000`/`4000`, `/health` e contagem de arquivos em `./data` |
| Diagnóstico de Recursos | `./scripts/sysinfo.sh` | `[VERIFICAÇÃO SOMENTE LEITURA]` | CPU, RAM, Swap, Disco, Uptime, processos Node e containers Docker |
| Relatório Completo da VM | `./relatorio-vm.sh` | `[VERIFICAÇÃO SOMENTE LEITURA]` | Auditoria completa da VM mascarando `JWT_SECRET` e `passwordHash` |
| Listar Contas | `./scripts/list-users.sh` | `[VERIFICAÇÃO SOMENTE LEITURA]` | Tabela formatada de usuários em `data/users.json` (`id`, `username`, `displayName`, `role`, `tag`) |
| Criar Conta via CLI | `./create-user.sh` | `[AÇÃO OPERACIONAL NA VM]` | Cria jogador ou admin com hash `bcryptjs` (custo 12) |
| Criar Convite via CLI | `./scripts/create-invite.sh @CODIGO 10` | `[AÇÃO OPERACIONAL NA VM]` | Gera convite `@XXXX` com limite de usos em `data/invites.json` |

---

## 2. Arquitetura de Persistência, Locks e Autocurativos (Self-Healing)

### 2.1 Escrita Atômica Física (`atomicWriteFileSync`)
Implementada em `server/dataLock.ts` (linhas 28–40):
1. Cria arquivo temporário único no mesmo filesystem: `<arquivo>.tmp.<pid>.<timestamp>_<rand>`.
2. Abre file descriptor (`fs.openSync(tempPath, 'w')`), grava o payload UTF-8 (`fs.writeSync`) e força descarga física no disco (`fs.fsyncSync(fd)`).
3. Fecha o descritor (`fs.closeSync(fd)`) e executa substituição atômica POSIX (`fs.renameSync(tempPath, filePath)`).
- **Garantia:** Uma queda brusca de energia ou `SIGKILL` jamais deixa um arquivo `.json` truncado pela metade.

### 2.2 Exclusão Mútua em Duas Camadas (`withDataLock`)
Implementada em `server/dataLock.ts` (linhas 42–114):
1. **Camada 1 (In-Process FIFO Queue):** Serializa todas as Promises concorrentes dentro do mesmo processo Node.js.
2. **Camada 2 (File Lock Multi-Processo `data/.kawihe.lock`):** Criado com flag atômica `'wx'` (`O_CREAT | O_EXCL`), serializando escritas entre `uno-game` (porta 3000) e `kawihe-auth` (porta 4000).
3. **Recuperação Automática de Lock Órfão (`STALE_LOCK_MS = 15000`):** Se um processo morrer segurando `data/.kawihe.lock`, qualquer operação subsequente verifica `stat.mtimeMs`; se o lock tiver mais de 15 segundos, ele é removido automaticamente e a operação prossegue sem travar o servidor.

### 2.3 Reconciliação Automática de WAL no Boot (`reconcileIncompleteImportBatches`)
Implementada em `server/importService.ts` (linhas 1075–1235) e invocada automaticamente na inicialização do `server.ts`:
- Se o servidor cair no meio de uma importação em massa (após gravar `users.json`, mas antes de finalizar `tournaments.json` ou `import_batches.json`), o lote fica com `status: 'running'` (ou `'in_progress'`/`'reconciling'`).
- Ao subir novamente, `reconcileIncompleteImportBatches`:
  1. Muda o estado do lote para `'reconciling'`.
  2. Verifica quais usuários do lote foram efetivamente persistidos em `users.json` (`userOpStatus = 'persisted'`) e quais falharam antes do checkpoint `usersSaved`.
  3. Se o lote era `create_and_enroll` ou `enroll_existing` e o torneio ainda está aberto (`registration` ou `rescheduled`), conclui as inscrições pendentes sem duplicar inscritos já existentes.
  4. Finaliza o lote como `'completed'`, `'partial'` ou `'failed'` e registra o evento `'batch_reconciled'` na `auditTrail`.

### 2.4 Recuperação Segura de Torneios Pós-Reinício (`recoverTournamentAfterServerRestart`)
Implementada em `server/tournamentEngine.ts` e invocada na inicialização do `server.ts`:
- As salas de jogo (`RoomData`) residem em memória RAM para baixa latência.
- Se o processo Node.js reiniciar enquanto um torneio estava com status `'running'` e possuía partidas em `'playing'`, o motor **nunca inventa um vencedor aleatório**:
  - As partidas interrompidas recebem `status: 'needs_intervention'` e `resultReason: 'server_restart'`.
  - O torneio entra em `status: 'paused'` com `pauseReason: 'server_restart'`.
  - O Administrador pode então reabrir a partida ou decidir o desfecho pelo painel de torneios.

---

## 3. Política de Backup e Restauração

### 3.1 Escopo do Backup (`backup.sh` / `scripts/backup.sh`)
O backup separa estritamente **dados mutáveis** de **código-fonte**:
- **O que é salvo no backup:** Diretório `./data/` (`users.json`, `invites.json`, `stats.json`, `tournaments.json`, `tournament_audit.json`, `import_batches.json`) e volumes Docker associados.
- **Segurança aplicada pelo script:**
  - Diretório de destino (`/opt/unokawihe/backups/geral` ou `/opt/unokawihe/backups/<tag>`) criado com `chmod 700`.
  - Arquivos gerados (`data_backup_<TIMESTAMP>.tar.gz`) protegidos com `chmod 600`.
  - Retenção automática: mantém os últimos 5 backups no diretório geral para não esgotar o disco da VM.

### 3.2 Procedimento de Backup Manual e Pré-Manutenção
`[AÇÃO OPERACIONAL NA VM]`
```bash
cd /opt/unokawihe
# Backup geral rotativo:
./backup.sh

# Backup nomeado antes de um campeonato ou mudança crítica:
./backup.sh pre_torneio_familia
```

### 3.3 Exportação Off-Site (Proteção contra Perda Total da VM)
Como qualquer VM em nuvem gratuita pode sofrer falha física ou recolhimento, o proprietário deve periodicamente copiar o arquivo `.tar.gz` e o `.env` para sua máquina local:
`[AÇÃO OPERACIONAL NA MÁQUINA DO PROPRIETÁRIO]`
```bash
scp ubuntu@<IP_DA_VM>:/opt/unokawihe/backups/geral/data_backup_*.tar.gz ./
```

### 3.4 Procedimento de Restauração (`restore.sh` / `scripts/restore.sh`)
`[AÇÃO OPERACIONAL NA VM]`
```bash
cd /opt/unokawihe
# Restaurar o último backup do diretório geral:
./restore.sh

# OU restaurar um backup com tag específica:
./restore.sh pre_torneio_familia

# Garantir propriedade do UID 1000 (usuário node do container):
sudo chown -R 1000:1000 /opt/unokawihe/data
```

---

## 4. Runbooks de Resposta a Incidentes e Recuperação de Desastres

### Cenário DR-01: Atualização Feita no GitHub, mas a VM Continua na Versão Antiga
- **Sintoma:** O código novo foi enviado, mas ao abrir o jogo na VM o visual/comportamento antigo permanece ou o `ChangelogModal` acusa divergência Cliente × Servidor.
- **Diagnóstico `[VERIFICAÇÃO SOMENTE LEITURA]`:**
  ```bash
  curl -s http://localhost:3000/api/version | jq .
  git -C /opt/unokawihe remote -v
  git -C /opt/unokawihe log -n 3 --oneline
  ```
- **Causas Comuns & Correção:**
  1. **Remoto Git apontando para fork antigo (`wgruberts-jpg`):** O `./deploy.sh` atual (`v2.3.0`) corrige automaticamente o remote para `https://github.com/edinhogrubert/Uno-KaWiHe.git` na Etapa 3 e valida `/api/version` na Etapa 6.
  2. **Cache do navegador do cliente:** Pressionar `Ctrl+Shift+R` (ou clicar no botão *"Recarregar Agora (F5)"* dentro do `ChangelogModal`).
  3. **Executar atualização limpa `[AÇÃO OPERACIONAL NA VM]`:**
     ```bash
     cd /opt/unokawihe && ./deploy.sh
     ```

### Cenário DR-02: Jogo Acessível por `http://dominio:3000`, mas Não Abre em `https://dominio` (Caddy / SSL)
- **Sintoma:** A porta 3000 responde, mas as portas 80/443 não conectam ou o serviço `caddy` está parado.
- **Diagnóstico `[VERIFICAÇÃO SOMENTE LEITURA]`:**
  ```bash
  sudo ss -tulpn | grep -E ':80|:443|:3000'
  cat /etc/caddy/Caddyfile
  sudo journalctl -u caddy -n 25 --no-pager
  ```
- **Causas Comuns & Correção:**
  1. **`Caddyfile` com erro de permissão em `/var/log/caddy/access.log` ou domínio errado (`uno.duckdns.org`):**
     Reexecutar `sudo ./configdns.sh` informando o domínio completo correto (`uno.grubert.duckdns.org`) e o token DuckDNS.
  2. **Portas 80 e 443 bloqueadas na Security List (VCN) da Oracle Cloud:**
     No painel da Oracle Cloud (*Networking → Virtual Cloud Networks → Security Lists → Ingress Rules*), adicionar regra permitindo `0.0.0.0/0` para TCP `80` e TCP `443`.

### Cenário DR-03: Sessão de Usuário Indesejado ou Comprometido Precisa Ser Derrubada Imediatamente
- **Sintoma:** Administrador precisa encerrar imediatamente o acesso de um usuário logado e impedir que ele continue entrando em salas.
- **Procedimento Operacional (`v2.3.0`):**
  1. No **Painel Central Admin** (`AdminRoomsModal`), clicar sobre o usuário na aba *Usuários* ou *Salas* (ou diretamente na lista do Lobby) para abrir o **Relatório Diagnóstico** (`PlayerReportModal`).
  2. Clicar em **`[ Desconectar Sessão ]`** (ou **`[ Suspender ]`** na aba *Usuários* para bloqueio permanente).
  3. **O que ocorre no servidor (`CONFIRMADO`):** `bumpUserSessionVersion` incrementa `sessionVersion` em `data/users.json`, invalidando todos os JWTs emitidos anteriormente; o servidor envia `{ type: 'session_revoked' }` e fecha todos os WebSockets do usuário com código `4001`; o cliente limpa o token local, bloqueia a auto-reconexão e volta à Tela de Login.

### Cenário DR-04: Limpeza Pós-Torneio de Contas Temporárias
- **Sintoma:** Um campeonato terminou e o administrador deseja encerrar o torneio e limpar as contas temporárias criadas exclusivamente para aquele evento sem afetar nenhum jogador permanente nem apagar o histórico do campeão.
- **Procedimento Operacional (`server/tournamentCleanupService.ts`):**
  1. Abrir o modal de **Torneios** (`TournamentModal.tsx`) como Admin.
  2. Garantir que não existam mesas com partida em andamento (`playing` ou `paused`).
  3. Clicar em **Encerrar Torneio (`closed`)**: todas as partidas concluídas, tabela de classificação, troféu do campeão e contas permanecem 100% preservados.
  4. Para remover as contas temporárias (`accountOriginType === 'tournament_temporary' && isTemporary === true && temporaryTournamentId === id`): clicar em **Limpar Usuários Temporários**, revisar a contagem de temporários × permanentes preservados, resolver o **desafio matemático de uso único** gerado pelo servidor e confirmar.
  5. Caso qualquer erro de disco ocorra durante a limpeza, o serviço executa **rollback transacional completo** restaurando os snapshots em memória e em disco (`users.json`, `tournaments.json`, `stats.json`, `tournament_audit.json`).

### Cenário DR-05: Perda Total da VM (Reconstrução em Nova Máquina)
- **Procedimento:** Seguir sequencialmente as **Etapas 1 a 28** do manual `10_RECONSTRUCAO_COMPLETA.md`:
  1. Provisionar nova VM gratuita autorizada.
  2. Clonar `https://github.com/edinhogrubert/Uno-KaWiHe.git` em `/opt/unokawihe`.
  3. Restaurar o arquivo `.tar.gz` de backup em `/opt/unokawihe/backups/geral/` e executar `./restore.sh`.
  4. Executar `./deploy.sh` (valida `/api/version` = `2.3.0`).
  5. Executar `sudo ./configdns.sh` para atualizar o IP da nova VM no DuckDNS e emitir o certificado HTTPS no Caddy.
