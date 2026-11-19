# 🔧 10 — MANUAL DE RECONSTRUÇÃO COMPLETA DO ZERO — UNO KAWIHE (`v2.3.0`)

## Metadados Documentais
- **Finalidade:** Manual operacional passo a passo e determinístico para reconstruir, configurar, validar, publicar e recuperar o sistema **Uno KaWiHe** a partir do zero em infraestrutura gratuita autorizada.
- **Público-alvo:** Proprietário do projeto, Engenheiros de Infraestrutura/SRE e Agentes de IA executores.
- **Status:** Normativo e Operacional (`CONFIRMADO` contra o código `v2.3.0`).
- **Fonte de Autoridade:** Subordinado ao Proprietário (**Nível 0** — `edinho.grubert@gmail.com`) e à Constituição Operacional (`AGENTS.md` — **Nível 1**).
- **Versão de Referência:** `v2.3.0` (`package.json` = `2.3.0`, `src/utils/versionHistory.ts` = `2.3.0`, `deploy.sh` = `v2.3.0`).
- **Commit de Referência:** `6d25e83` (último commit verificado no remoto `edinhogrubert/Uno-KaWiHe` / `main`) + revisão documental `v2.3.0`.
- **Data de Revisão:** `2026-11-18`.
- **Referências Relacionadas:** `AGENTS.md`, `11_FREE_TIER_COMPLIANCE.md`, `12_OPERACAO_E_RECUPERACAO.md`, `13_MATRIZ_RASTREABILIDADE.md`, `SYSTEM_SPECIFICATION.md`, `manualSH.md`.

---

## ⚠️ Distinção Fundamental: Reconstrução de Software vs. Recuperação de Dados
1. **Reconstrução do Software (`100% reproduzível via repositório`):** Todo o código-fonte, motor UNO (`server/unoEngine.ts`), motor de torneios (`server/tournamentEngine.ts`), limpeza de temporários (`server/tournamentCleanupService.ts`), importador em massa (`server/importService.ts`), microserviço SSO (`auth-service/`), frontend React (`src/`), scripts `.sh`/`.mjs`, `Dockerfile` e `docker-compose.yml` são integralmente reconstruídos a partir do repositório Git oficial.
2. **Recuperação de Dados Persistidos (`Depende de Backup Preservado`):** Contas de usuários (`data/users.json`), códigos de convite (`data/invites.json`), estatísticas de carreira (`data/stats.json`), torneios históricos (`data/tournaments.json`), auditoria de torneios (`data/tournament_audit.json`), lotes de importação (`data/import_batches.json`) e segredos (`.env` / `JWT_SECRET` / token DuckDNS) **só podem ser restaurados se houver backup externo preservado**. Caso não exista backup, o sistema realiza *Cold Start* seguro gerando as 7 contas iniciais (`edinho`, `will`, `henry`, `grazy`, `milly`, `aline`, `guilherme`) com senhas criptográficas aleatórias exibidas uma única vez no log e o convite inicial `@KWH1`.

## ⚠️ Separação de Comandos
- **[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]:** Comando somente leitura que pode ser executado a qualquer momento sem alterar estado ou infraestrutura.
- **[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]:** Comando destinado exclusivamente à execução pelo operador ou agente autorizado durante o provisionamento/recuperação real em uma VM Linux (Ubuntu 22.04/24.04 LTS).

---

## Etapa 1 — Requisitos Mínimos da Máquina
- **Objetivo:** Garantir recursos mínimos de hardware e sistema operacional para compilar e executar os containers `uno-game` e `kawihe-auth` sem *Out-Of-Memory (OOM)* e sem custos.
- **Pré-requisitos:** Conta ativa em provedor Always Free autorizado ou máquina local Linux.
- **Especificação Mínima Confirmada (`Dockerfile` + `docker-compose.yml` + `deploy.sh`):**
  - **CPU:** 1 OCPU / 2 vCPUs (x86_64 AMD EPYC ou ARM64 Ampere A1).
  - **Memória RAM Física:** Mínimo **1 GB RAM** (obriga criação de **2 GB de Swap** em disco antes do build Docker) ou **2+ GB RAM**.
  - **Alocação de Memória dos Containers (`docker-compose.yml`):**
    - `uno-game`: limite `384M` (reserva `96M`, processo Node com `--max-old-space-size=256`).
    - `kawihe-auth`: limite `160M` (`0.35` CPU).
  - **Armazenamento em Disco:** Mínimo **20 GB** livres (Boot Volume padrão OCI Always Free: 47 GB–50 GB).
  - **Sistema Operacional:** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (64-bit).
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  uname -a && free -m && df -h /
  ```
- **Local de Execução:** Terminal da máquina host / VM.
- **Resultado Esperado:** Kernel Linux 64-bit (`x86_64` ou `aarch64`), memória total visível e pelo menos 10 GB livres em `/`.
- **Método de Validação:** Conferir coluna `Avail` do `df -h /` e `Mem:` do `free -m`.
- **Erros Conhecidos:** Máquina com 1 GB de RAM sem Swap falha durante `npm install` ou `vite build` com `Killed (SIGKILL / Exit 137)`.
- **Procedimento de Recuperação:** Executar obrigatoriamente a criação do `/swapfile` de 2 GB na Etapa 4 antes de qualquer build.
- **Riscos de Segurança:** Nenhum.
- **Riscos de Cobrança:** Selecionar imagem de SO paga (ex.: RHEL comercial) ou disco acima da cota Always Free (200 GB totais na conta OCI) gera cobrança. Use exclusivamente **Canonical Ubuntu Minimal/Standard**.

---

## Etapa 2 — Escolha de Infraestrutura Gratuita
- **Objetivo:** Selecionar e provisionar o ambiente de execução respeitando estritamente a **Regra Universal de Custo Zero** (`11_FREE_TIER_COMPLIANCE.md`).
- **Pré-requisitos:** Conta verificada no provedor gratuito.
- **Opções Classificadas e Autorizadas:**
  1. **Oracle Cloud Infrastructure (OCI) — Always Free (`FREE_LIMITED`):**
     - `VM.Standard.E2.1.Micro` (AMD x86_64, 1 GB RAM, até 2 VMs na Home Region) **OU**
     - `VM.Standard.A1.Flex` (ARM64 Ampere, até 4 OCPUs e 24 GB RAM totais na Home Region).
  2. **Desenvolvimento / Preview — Google AI Studio Build (`FREE_LIMITED`):**
     - Execução direta na porta `3000` (`npm run dev`).
  3. **Hardware Local / Self-Hosted (`SELF_HOSTED_FREE`):**
     - Mini-PC / servidor doméstico Linux com túnel opcional ou rede local.
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  lscpu | grep -E "Architecture|Model name|CPU\(s\)" || uname -m
  ```
- **Local de Execução:** Painel da nuvem (provisionamento) e terminal SSH da VM.
- **Resultado Esperado:** Instância marcada com o selo **"Always Free"** na Home Region da conta.
- **Método de Validação:** Verificar no painel de Billing/Cost Analysis que o custo estimado da instância e do Boot Volume é `0.00`.
- **Erros Conhecidos:** `Out of capacity for shape VM.Standard.A1.Flex`.
- **Procedimento de Recuperação:** Utilizar `VM.Standard.E2.1.Micro` (1 GB RAM + 2 GB Swap via `deploy.sh`) ou aguardar disponibilidade na Home Region sem converter a conta para Pay-As-You-Go sem autorização do Proprietário.
- **Riscos de Segurança:** Expor porta SSH (`22`) sem chave criptográfica pública/privada. Sempre exigir autenticação por chave SSH (`id_ed25519` ou `id_rsa`).
- **Riscos de Cobrança:** **CRÍTICO:** Criar instância fora da *Home Region*, escolher shape não marcado como *Always Free*, alocar > 200 GB de Block Volume total ou ativar serviços pagos de backup/Load Balancer comercial.

---

## Etapa 3 — Confirmação de Limites Free Tier
- **Objetivo:** Auditar os recursos alocados na VM antes de iniciar a instalação para confirmar que nenhuma cota gratuita foi excedida.
- **Pré-requisitos:** Acesso SSH à VM recém-criada.
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  lsblk && free -h && ip addr show
  ```
- **Local de Execução:** Terminal SSH da VM.
- **Resultado Esperado:** Disco de boot dentro do limite (ex.: ~47 GB), 1 IPv4 público efêmero/reservado gratuito, sem volumes iSCSI adicionais cobrados.
- **Método de Validação:** Comparar saída com a matriz da seção 3 de `11_FREE_TIER_COMPLIANCE.md`.
- **Erros Conhecidos:** Volume de boot configurado acidentalmente com 250 GB.
- **Procedimento de Recuperação:** Excluir a instância imediatamente e recriar com o tamanho padrão de 47 GB–50 GB.
- **Riscos de Segurança:** Nenhum.
- **Riscos de Cobrança:** Qualquer Block Volume acima de 200 GB somados na conta OCI gera cobrança mensal.

---

## Etapa 4 — Preparação do Sistema Operacional e Swap (2 GB)
- **Objetivo:** Atualizar pacotes de base do Ubuntu e configurar 2 GB de Swap em arquivo (`/swapfile`) para impedir falhas por falta de memória em VMs de 1 GB RAM.
- **Pré-requisitos:** Acesso `sudo` na VM Ubuntu.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  sudo apt-get update -y
  sudo apt-get install -y curl git jq ca-certificates gnupg lsb-release
  if [ ! -f /swapfile ] && [ "$(swapon --show | wc -l)" -eq 0 ]; then
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
  fi
  ```
- **Local de Execução:** Terminal SSH da VM (`/` ou `~`).
- **Resultado Esperado:** Pacotes básicos instalados e `/swapfile` de 2048 MB ativo e persistido no `/etc/fstab`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  swapon --show && free -m
  ```
- **Erros Conhecidos:** `fallocate`/`dd` falhar em sistemas de arquivos especiais ou permissão `chmod` incorreta.
- **Procedimento de Recuperação:** Garantir `sudo chmod 600 /swapfile` antes de `sudo mkswap /swapfile`.
- **Riscos de Segurança:** `/swapfile` com permissão diferente de `0600` permite leitura de páginas de memória por usuários locais não privilegiados.
- **Riscos de Cobrança:** O `/swapfile` reside no próprio Boot Volume existente (custo zero).

---

## Etapa 5 — Instalação de Ferramentas (Docker Engine, Docker Compose v2 e Node.js opcional)
- **Objetivo:** Instalar o Docker Engine e o plugin `docker compose` v2 (para execução containerizada de produção) ou Node.js 22 LTS (para execução direta/desenvolvimento e scripts CLI).
- **Pré-requisitos:** Etapa 4 concluída.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  # 1. Instalar Docker e Docker Compose Plugin
  if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker "${SUDO_USER:-$USER}" || true
    rm -f /tmp/get-docker.sh
  fi
  if ! docker compose version &> /dev/null; then
    sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin
  fi
  ```
- **Local de Execução:** Terminal SSH da VM.
- **Resultado Esperado:** Binários `docker` e `docker compose` instalados e daemon `docker.service` ativo.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  docker --version && docker compose version
  ```
- **Erros Conhecidos:** `permission denied while trying to connect to the Docker daemon socket`.
- **Procedimento de Recuperação:** Fazer logout/login na sessão SSH após `usermod -aG docker` ou prefixar comandos com `sudo`.
- **Riscos de Segurança:** Usuários no grupo `docker` possuem equivalência a `root` no host. Adicionar apenas o usuário administrativo da VM.
- **Riscos de Cobrança:** Docker Engine CE (`get.docker.com`) é `SELF_HOSTED_FREE` (gratuito). Não utilizar Docker Desktop comercial.

---

## Etapa 6 — Configuração do Git
- **Objetivo:** Configurar diretórios seguros (`safe.directory`) e preservação de permissões no Git para evitar conflitos com `chmod +x` nos scripts `.sh`.
- **Pré-requisitos:** Pacote `git` instalado na Etapa 4.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  git config --global --add safe.directory /opt/unokawihe
  git config --global core.fileMode false
  ```
- **Local de Execução:** Terminal SSH da VM.
- **Resultado Esperado:** Configurações gravadas no `~/.gitconfig`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  git config --global --list
  ```
- **Erros Conhecidos:** `fatal: detected dubious ownership in repository at '/opt/unokawihe'`.
- **Procedimento de Recuperação:** Reexecutar `sudo git config --system --add safe.directory /opt/unokawihe`.
- **Riscos de Segurança:** Nenhum.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 7 — Obtenção do Repositório e Commit Oficial
- **Objetivo:** Clonar o repositório oficial autorizado pelo proprietário (`https://github.com/edinhogrubert/Uno-KaWiHe.git`) na pasta padrão `/opt/unokawihe`.
- **Pré-requisitos:** Etapas 4 e 6 concluídas.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  sudo mkdir -p /opt/unokawihe
  sudo chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" /opt/unokawihe
  git clone https://github.com/edinhogrubert/Uno-KaWiHe.git /opt/unokawihe
  cd /opt/unokawihe
  git checkout main
  ```
- **Local de Execução:** Terminal SSH da VM.
- **Resultado Esperado:** Código-fonte completo em `/opt/unokawihe` apontando para `origin https://github.com/edinhogrubert/Uno-KaWiHe.git`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  git -C /opt/unokawihe remote -v && git -C /opt/unokawihe rev-parse --short HEAD && jq -r '.version' /opt/unokawihe/package.json
  ```
- **Erros Conhecidos:** Repositório apontando para fork antigo `wgruberts-jpg/Uno-KaWiHe.git`.
- **Procedimento de Recuperação:**
  ```bash
  git -C /opt/unokawihe remote set-url origin https://github.com/edinhogrubert/Uno-KaWiHe.git
  git -C /opt/unokawihe fetch origin main && git -C /opt/unokawihe reset --hard origin/main
  ```
- **Riscos de Segurança:** Clonar repositórios de terceiros não verificados pode introduzir código malicioso. Sempre verificar a URL `https://github.com/edinhogrubert/Uno-KaWiHe.git`.
- **Riscos de Cobrança:** Repositório GitHub público tem clone/pull gratuito (`FREE_LIMITED`).

---

## Etapa 8 — Instalação de Dependências (Modo Local / CLI / Testes)
- **Objetivo:** Instalar os pacotes `node_modules` caso se deseje rodar testes (`npm test`), scripts CLI (`create-user.sh`, `tournament-test.mjs`) ou execução sem Docker. *(Nota: No modo Docker, o próprio `Dockerfile` executa `npm install --legacy-peer-deps` dentro do estágio `builder`).*
- **Pré-requisitos:** Node.js 22 instalado (se fora do Docker) e `/opt/unokawihe` clonado.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  npm install --legacy-peer-deps --no-audit --no-fund
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Diretório `/opt/unokawihe/node_modules` populado com `bcryptjs`, `express`, `ws`, `jsonwebtoken`, `react`, `vite`, `vitest`, `tsx`, `esbuild`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  node -e "require('bcryptjs'); require('jsonwebtoken'); require('ws'); console.log('DEPS_OK');"
  ```
- **Erros Conhecidos:** `ERESOLVE unable to resolve dependency tree` se omitido `--legacy-peer-deps`.
- **Procedimento de Recuperação:** Sempre incluir a flag `--legacy-peer-deps` conforme especificado no `Dockerfile` (linha 12).
- **Riscos de Segurança:** Não executar `npm audit fix --force` automaticamente sem testar, pois pode quebrar versões majoritárias.
- **Riscos de Cobrança:** Registro público npmjs.org é gratuito (`FREE_VERIFIED`).

---

## Etapa 9 — Preparação de Diretórios e Permissões (`./data/` e scripts)
- **Objetivo:** Criar o diretório de persistência `/opt/unokawihe/data` com propriedade compatível com o usuário não-root `node` (`UID 1000:GID 1000`) usado dentro dos containers Docker e aplicar permissão de execução aos scripts `.sh`.
- **Pré-requisitos:** Etapa 7 concluída.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  chmod +x *.sh scripts/*.sh
  mkdir -p /opt/unokawihe/data
  sudo chown -R 1000:1000 /opt/unokawihe/data
  sudo chmod 700 /opt/unokawihe/data
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Pasta `data/` pertencente ao UID `1000` com permissão `drwx------` (`700`) e todos os scripts `.sh` executáveis.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  ls -ld /opt/unokawihe/data && ls -l /opt/unokawihe/*.sh /opt/unokawihe/scripts/*.sh
  ```
- **Erros Conhecidos:** `EACCES: permission denied, open '/app/data/users.json.tmp...'` dentro do container `uno-game` porque `Dockerfile` roda com `USER node` (UID 1000) e a pasta `./data` no host pertencia a `root` (UID 0).
- **Procedimento de Recuperação:** Executar `sudo chown -R 1000:1000 /opt/unokawihe/data`.
- **Riscos de Segurança:** Não usar `chmod 777` em `data/`, pois `users.json` contém `passwordHash`.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 10 — Configuração das Variáveis de Ambiente (`.env`)
- **Objetivo:** Configurar todas as variáveis de ambiente exigidas pelo backend (`server.ts`, `server/authService.ts`) e pelo Docker Compose (`docker-compose.yml`).
- **Pré-requisitos:** Etapa 9 concluída.
- **Mapa Completo de Variáveis de Ambiente (`CONFIRMADO` no código):**
  | Variável | Obrigatória | Default no Código | Onde é Lida | Finalidade |
  | :--- | :--- | :--- | :--- | :--- |
  | `NODE_ENV` | Sim (Prod) | `development` | `server.ts`, `Dockerfile` | Ativa entrega estática de `dist/` quando `production` |
  | `PORT` | Não | `3000` (app) / `4000` (auth) | `server.ts`, `auth-service/server.ts` | Porta TCP de escuta HTTP/WS |
  | `JWT_SECRET` | **Sim (Prod)** | Fallback dev apenas | `server/authService.ts`, `auth-service/server.ts` | Chave HMAC-SHA256 de assinatura e verificação de JWT |
  | `INITIAL_ADMIN_PASSWORD` | Recomendada | Gerada aleatoriamente (`24 hex`) no cold start | `server/authService.ts`, `auth-service/server.ts` | Senha inicial do admin `edinho` se `users.json` não existir |
  | `INITIAL_PLAYER_PASSWORD`| Opcional | Gerada aleatoriamente (`16 hex`) no cold start | `server/authService.ts`, `auth-service/server.ts` | Senha inicial das 6 contas familiares no cold start |
  | `DATA_DIR` | Não | `./data` | `server/dataLock.ts` | Caminho físico dos arquivos JSON e `.kawihe.lock` |
  | `AUTH_SERVICE_URL` | Opcional | `undefined` (ou `http://kawihe-auth:4000` no Compose) | `server.ts` | URL interna do microserviço `kawihe-auth` |
  | `ADMIN_PIN` | Opcional | `undefined` (desativado) | `server/authService.ts` | Habilita header legado `x-admin-pin` apenas se definido |
  | `APP_URL` | Opcional | Injetado pelo AI Studio | `.env.example` | URL pública base da aplicação |
  | `DISABLE_HMR` | Opcional | `undefined` | `vite.config.ts` | Desativa HMR e file watcher no AI Studio (`true`) |
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  test -f /opt/unokawihe/.env && stat -c "%a %n" /opt/unokawihe/.env
  ```
- **Erros Conhecidos:** Divergência de `JWT_SECRET` entre `uno-game` e `kawihe-auth` invalida todos os tokens emitidos.
- **Procedimento de Recuperação:** Garantir que ambos os serviços no `docker-compose.yml` leiam o mesmo `JWT_SECRET` do arquivo `/opt/unokawihe/.env` e reiniciar com `sudo docker compose up -d --force-recreate`.
- **Riscos de Segurança:** Nunca versionar `.env` no Git (`.gitignore` já bloqueia `.env`).
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 11 — Geração Segura de Segredos
- **Objetivo:** Gerar `JWT_SECRET` criptograficamente forte (256 bits / 64 caracteres hexadecimais) e gravar o arquivo `.env` com permissão restrita `0600`.
- **Pré-requisitos:** Etapa 10 compreendida.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  if [ ! -f /opt/unokawihe/.env ]; then
    RAND_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
    cat > /opt/unokawihe/.env <<EOF
  NODE_ENV=production
  PORT=3000
  JWT_SECRET=${RAND_SECRET}
  DATA_DIR=./data
  EOF
    chmod 600 /opt/unokawihe/.env
  fi
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Arquivo `/opt/unokawihe/.env` criado com `chmod 600` e `JWT_SECRET` de 64 caracteres hexadecimais.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  grep -E "^(NODE_ENV|PORT|DATA_DIR)=" /opt/unokawihe/.env && grep -q "^JWT_SECRET=.\{32,\}" /opt/unokawihe/.env && echo "JWT_SECRET_FORTE_OK"
  ```
- **Erros Conhecidos:** `JWT_SECRET` vazio faz o sistema cair no segredo default de desenvolvimento.
- **Procedimento de Recuperação:** Regenerar `RAND_SECRET` e reiniciar os serviços. *(Nota: trocar `JWT_SECRET` desconecta todas as sessões logadas exigindo novo login).*
- **Riscos de Segurança:** Jamais exibir o valor de `JWT_SECRET` em logs públicos ou relatórios.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 12 — Inicialização do Backend (Desenvolvimento / Diagnóstico Direto)
- **Objetivo:** Validar a inicialização do servidor Node.js/Express + WebSocket (`server.ts`), criação do diretório `data/` e reconciliação de lotes WAL (`reconcileIncompleteImportBatches`).
- **Pré-requisitos:** Etapas 8 a 11 concluídas (quando executando fora do Docker).
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  npm run dev
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Console exibe `Server running on http://0.0.0.0:3000` (e, em *Cold Start* sem `users.json`, exibe as senhas temporárias geradas para `edinho` e jogadores iniciais).
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  curl -s http://localhost:3000/health && echo "" && curl -s http://localhost:3000/api/version
  ```
- **Erros Conhecidos:** `EADDRINUSE: address already in use 0.0.0.0:3000`.
- **Procedimento de Recuperação:** Verificar com `sudo ss -tulpn | grep :3000` se o container Docker `uno-game` já está ocupando a porta 3000.
- **Riscos de Segurança:** Em *Cold Start*, anote a senha temporária do admin `edinho` e troque-a imediatamente.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 13 — Inicialização do Frontend
- **Objetivo:** Entender e validar como o frontend React 19 + Vite + Tailwind CSS v4 é servido em desenvolvimento e em produção.
- **Arquitetura Confirmada (`server.ts` + `Dockerfile`):**
  - **Modo Desenvolvimento (`NODE_ENV !== 'production'`):** `server.ts` instancia o servidor Vite em modo middleware (`vite.middlewares`) na mesma porta `3000`, servindo `index.html` e compilando `src/main.tsx` sob demanda.
  - **Modo Produção (`NODE_ENV === 'production'`):** `vite build` gera os estáticos otimizados em `/app/dist`, e `server.ts` serve `express.static('dist')` + fallback SPA `app.get('*', ...)` na mesma porta `3000`.
- **Comando Exato de Teste de Compilação do Frontend `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  npm run build
  ```
- **Local de Execução:** Raiz do projeto (`/opt/unokawihe`).
- **Resultado Esperado:** Diretório `dist/` gerado contendo `dist/index.html` e `dist/assets/*`.
- **Método de Validação:** Verificar existência de `dist/index.html` e código de saída `0`.
- **Erros Conhecidos:** Erro de tipagem ou import ausente em `src/`.
- **Procedimento de Recuperação:** Executar `npm run lint` (`tsc --noEmit`) para identificar arquivo e linha exatos.
- **Riscos de Segurança:** Nenhum segredo deve usar prefixo `VITE_`, pois variáveis `VITE_*` são embutidas no bundle público do navegador.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 14 — Inicialização dos Serviços Auxiliares (`kawihe-auth` SSO)
- **Objetivo:** Compreender e inicializar o microserviço auxiliar de autenticação central `kawihe-auth` (`auth-service/server.ts`, porta `4000`), utilizado na topologia Docker Compose.
- **Arquitetura Confirmada (`docker-compose.yml` + `auth-service/server.ts`):**
  - Compartilha o mesmo volume `./data:/app/data` e o mesmo `JWT_SECRET` com `uno-game`.
  - Respeita `sessionVersion` (claim `sv`) para revogação imediata de sessões e `data/.kawihe.lock` para exclusão mútua de escrita.
  - Caso `AUTH_SERVICE_URL` não esteja definida (ex.: AI Studio ou execução single-node), `server.ts` processa todas as rotas `/api/auth/*`, `/api/invites/*` e `/api/user/stats` localmente usando `server/authService.ts`.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  sudo docker compose up -d --build kawihe-auth
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Container `kawihe-auth` rodando na porta `4000`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  curl -s http://localhost:4000/health
  ```
  *(Retorno esperado: `{"status":"ok","service":"KaWiHe Central Auth Service","usersCount":...}`)*
- **Erros Conhecidos:** Falha de permissão em `/app/data` se a Etapa 9 não tiver sido executada.
- **Procedimento de Recuperação:** `sudo chown -R 1000:1000 /opt/unokawihe/data && sudo docker compose restart kawihe-auth`.
- **Riscos de Segurança:** A porta `4000` não precisa e **não deve** ser aberta na Security List pública da Oracle Cloud, pois o `uno-game` comunica-se com ela internamente via rede Docker `kawihe-net` (`http://kawihe-auth:4000`).
- **Riscos de Cobrança:** Custo zero (roda na mesma VM, limitado a 160 MB RAM).

---

## Etapa 15 — Configuração de Rede e Firewall (Host + Nuvem OCI)
- **Objetivo:** Liberar as portas TCP necessárias no firewall do sistema operacional (`ufw` ou `iptables`) e na Virtual Cloud Network (VCN / Security List) da Oracle Cloud.
- **Matriz de Portas:**
  | Porta / Protocolo | Origem | Destino | Finalidade | Expor na Internet (VCN)? |
  | :--- | :--- | :--- | :--- | :--- |
  | `22/tcp` | IP do Admin | Host SSH | Administração remota SSH | Sim (restrito se possível) |
  | `80/tcp` | `0.0.0.0/0` | Caddy Server | Redirecionamento HTTP → HTTPS e desafio ACME Let's Encrypt | **Sim (obrigatório p/ HTTPS)** |
  | `443/tcp` | `0.0.0.0/0` | Caddy Server | Acesso seguro HTTPS + WebSockets (`wss://`) + WebRTC Voz | **Sim (obrigatório p/ HTTPS)** |
  | `3000/tcp` | `0.0.0.0/0` ou `127.0.0.1` | `uno-game` | Acesso HTTP direto por IP (fallback sem domínio) e proxy local do Caddy | Opcional após HTTPS ativo |
  | `4000/tcp` | Rede Docker `kawihe-net` | `kawihe-auth` | Microserviço interno de autenticação | **NÃO (manter privada)** |
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 3000/tcp
  elif command -v iptables &> /dev/null; then
    for port in 80 443 3000; do
      if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
        sudo iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
      fi
    done
  fi
  ```
- **Local de Execução:** Terminal SSH da VM + Console Web da Oracle Cloud (*Networking → Virtual Cloud Networks → Security Lists → Ingress Rules*).
- **Resultado Esperado:** Regras `ACCEPT` para `tcp dpt:80`, `tcp dpt:443` e `tcp dpt:3000` posicionadas **antes** da regra `REJECT ... icmp-host-prohibited` da imagem Ubuntu da Oracle Cloud.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  sudo iptables -L INPUT -n --line-numbers | head -n 12
  ```
- **Erros Conhecidos:** Na Oracle Cloud, a imagem padrão do Ubuntu traz uma regra `REJECT all -- 0.0.0.0/0 0.0.0.0/0 reject-with icmp-host-prohibited`. Usar `iptables -A` (append no final) coloca a porta depois do `REJECT` e o tráfego continua bloqueado.
- **Procedimento de Recuperação:** Sempre usar `sudo iptables -I INPUT 1 ...` (insert no topo), exatamente como implementado em `deploy.sh` e `configdns.sh`.
- **Riscos de Segurança:** Não abrir a porta `4000` nem intervalos amplos de portas na VCN.
- **Riscos de Cobrança:** Regras de Security List / VCN Ingress na OCI são 100% gratuitas (`FREE_VERIFIED`).

---

## Etapa 16 — Configuração de DNS (DuckDNS Gratuito)
- **Objetivo:** Associar o IP público da VM a um subdomínio gratuito DuckDNS (ex.: `uno.grubert.duckdns.org` atualizando o domínio base `grubert.duckdns.org`).
- **Pré-requisitos:** Conta gratuita em `https://www.duckdns.org`, subdomínio criado (ex.: `grubert`) e Token DuckDNS em mãos.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  # Exemplo: atualizar o domínio base 'grubert' no DuckDNS (que resolve *.grubert.duckdns.org e grubert.duckdns.org)
  curl -s "https://www.duckdns.org/update?domains=grubert&token=SEU_TOKEN_DUCKDNS&ip="
  ```
- **Local de Execução:** Terminal SSH da VM (ou automatizado via `sudo ./configdns.sh`).
- **Resultado Esperado:** Resposta literal `OK` da API do DuckDNS.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  getent hosts uno.grubert.duckdns.org
  ```
  *(Deve retornar o IP público atual da VM).*
- **Erros Conhecidos:** Retorno `KO` quando o token está inválido ou quando se passa `uno.grubert.duckdns.org` inteiro no parâmetro `domains=` em vez do subdomínio raiz `grubert` (o script `configdns.sh` já extrai automaticamente `DUCKDNS_SUB="${STRIPPED_DOMAIN##*.}"`).
- **Procedimento de Recuperação:** Conferir o token no painel do DuckDNS e testar a resolução com `getent hosts`.
- **Riscos de Segurança:** Não gravar o token do DuckDNS em arquivos versionados pelo Git.
- **Riscos de Cobrança:** DuckDNS é 100% gratuito (`FREE_VERIFIED`, até 5 domínios por conta).

---

## Etapa 17 — Configuração de HTTPS e Proxy Reverso WebSockets (Caddy Server)
- **Objetivo:** Configurar HTTPS automático (Let's Encrypt) e proxy reverso WebSocket (`wss://`) para `127.0.0.1:3000` usando Caddy Server via `configdns.sh`, liberando microfone WebRTC em todos os navegadores sem necessidade de ajustes manuais no cliente.
- **Pré-requisitos:** Etapas 15 e 16 concluídas (portas `80` e `443` abertas na VM e na VCN da nuvem, e DNS apontando para o IP público da VM).
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  sudo ./configdns.sh
  ```
- **Configuração Exata Gerada em `/etc/caddy/Caddyfile` (`CONFIRMADO` em `configdns.sh` linhas 103–109):**
  ```caddyfile
  uno.grubert.duckdns.org {
  	# Proxy reverso para o Uno KaWiHe na porta 3000
  	# Suporta HTTP, HTTPS, WebSockets (WSS) e headers de IP real automaticamente
  	reverse_proxy 127.0.0.1:3000
  }
  ```
- **Local de Execução:** `/opt/unokawihe` na VM.
- **Resultado Esperado:** Serviço `caddy.service` ativo (`active (running)`), escutando nas portas `80` e `443` e emitindo certificado TLS Let's Encrypt automaticamente.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  sudo systemctl status caddy --no-pager && sudo ss -tulpn | grep -E ':80|:443'
  ```
- **Erros Conhecidos (Documentados a partir de Incidentes Reais da VM):**
  1. **Erro de Permissão de Log Antigo:** `open /var/log/caddy/access.log: permission denied` causando `status=1/FAILURE` no `caddy.service`.
     - *Solução implementada no `configdns.sh` atual:* O `Caddyfile` enxuto não usa bloco `log { output file /var/log/caddy/access.log }` (usa o journald nativo do systemd) e remove `header_up X-Forwarded-*` redundantes.
  2. **Domínio incorreto no `/etc/caddy/Caddyfile`:** Estar escrito `uno.duckdns.org` em vez de `uno.grubert.duckdns.org`.
     - *Solução:* Reexecutar `sudo ./configdns.sh` informando `uno.grubert.duckdns.org` ou editar `/etc/caddy/Caddyfile` e rodar `sudo systemctl restart caddy`.
- **Procedimento de Recuperação:**
  ```bash
  sudo caddy fmt --overwrite /etc/caddy/Caddyfile
  sudo caddy validate --config /etc/caddy/Caddyfile
  sudo systemctl restart caddy
  sudo journalctl -u caddy -n 30 --no-pager
  ```
- **Riscos de Segurança:** O Caddy renova certificados automaticamente e descarta conexões HTTP inseguras redirecionando para HTTPS (`308 Permanent Redirect`).
- **Riscos de Cobrança:** Caddy Server (`SELF_HOSTED_FREE`) e certificados Let's Encrypt (`FREE_VERIFIED`) têm custo zero.

---

## Etapa 18 — Configuração de Persistência Atômica (`./data/`)
- **Objetivo:** Verificar a estrutura e integridade dos arquivos JSON de persistência em `/opt/unokawihe/data`.
- **Arquivos Gerenciados (`server/dataLock.ts`, `server/authService.ts`, `server/tournamentCleanupService.ts`, `server/importService.ts`):**
  - `data/.kawihe.lock` (lock file transitório para exclusão mútua multi-processo; stale timeout = `15000ms`).
  - `data/users.json` (`UserRecord[]`).
  - `data/invites.json` (`InviteCode[]`).
  - `data/stats.json` (`Record<string, PlayerCareerStats>`).
  - `data/tournaments.json` (`Tournament[]`).
  - `data/tournament_audit.json` (`TournamentAuditLogEntry[]`).
  - `data/import_batches.json` (`ImportBatch[]` — diário WAL e auditoria de lotes).
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  for f in /opt/unokawihe/data/*.json; do
    [ -f "$f" ] && jq empty "$f" && echo "JSON_VALIDO: $f"
  done
  ```
- **Erros Conhecidos:** Arquivo `.kawihe.lock` órfão após queda abrupta de energia.
- **Procedimento de Recuperação:** O próprio `acquireAdvisoryFileLock` em `server/dataLock.ts` remove automaticamente qualquer `.kawihe.lock` com `mtime > 15000ms` (`STALE_LOCK_MS`). Se necessário manualmente com os serviços parados: `rm -f /opt/unokawihe/data/.kawihe.lock`.
- **Riscos de Segurança:** Jamais servir a pasta `/data` via Express estático (`server.ts` serve apenas `dist/`).
- **Riscos de Cobrança:** Armazenamento em arquivo JSON local no Boot Volume tem custo zero.

---

## Etapa 19 — Restauração de Backups Existentes (Quando Disponíveis)
- **Objetivo:** Restaurar os dados reais (`users.json`, `invites.json`, `stats.json`, `tournaments.json`, `import_batches.json`) a partir de um backup preservado antes de abrir o servidor aos jogadores.
- **Pré-requisitos:** Backup gerado previamente por `./backup.sh` ou `./scripts/backup.sh` (localizado em `/opt/unokawihe/backups/geral` ou `/opt/unokawihe/backups/<tag>`).
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  # Restaurar backup geral mais recente:
  ./restore.sh
  # OU restaurar backup de uma tag específica:
  ./restore.sh <nome_da_tag>
  sudo chown -R 1000:1000 /opt/unokawihe/data
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Arquivos JSON restaurados em `/opt/unokawihe/data/` e containers reiniciados com as contas e estatísticas originais.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  ./scripts/list-users.sh
  ```
- **Erros Conhecidos:** Se nenhum backup foi preservado após perda total da VM, os usuários antigos não podem ser adivinhados.
- **Procedimento de Recuperação (Sem Backup):** Utilizar o *Cold Start* automático + **Importador de Usuários em Massa** (`AdminImportPanel` ou `POST /api/admin/import/commit`) ou `./scripts/create-user.sh` para recriar a base de jogadores.
- **Riscos de Segurança:** Manter os arquivos de backup com `chmod 600` e pasta `backups/` com `chmod 700`.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 20 — Execução da Suíte Completa de Testes e Linter
- **Objetivo:** Comprovar matematicamente que o motor UNO, modo 2v2, torneios, W.O. das 108 cartas, ciclo de vida de temporários, importador em massa, WAL, revogação de sessão (`sessionVersion`/`4001`) e tipagem TypeScript estão 100% íntegros.
- **Pré-requisitos:** Dependências instaladas (Etapa 8).
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  npm run lint && npm test
  ```
- **Local de Execução:** Raiz do projeto (`/opt/unokawihe`).
- **Resultado Esperado (`CONFIRMADO`):**
  - `npm run lint` (`tsc --noEmit`): `0 erros`.
  - `npm test` (`vitest run`): **`12 passed (12)` suítes e `126 passed (126)` testes**:
    1. `tests/unoEngine.test.ts` (26 testes)
    2. `tests/serverIntegration.test.ts` (19 testes)
    3. `tests/participationLogic.test.ts` (9 testes)
    4. `tests/tournamentEngine.test.ts` (22 testes)
    5. `tests/tournamentWo.test.ts` (19 testes)
    6. `tests/tournamentIntegration.test.ts` (5 testes)
    7. `tests/tournamentStress.test.ts` (2 testes)
    8. `tests/tournamentAdminLifecycle.test.ts` (6 testes)
    9. `tests/importParser.test.ts` (6 testes)
    10. `tests/importService.test.ts` (7 testes)
    11. `tests/importIntegration.test.ts` (3 testes)
    12. `tests/sessionRevocation.test.ts` (2 testes)
- **Método de Validação:** Código de saída `0` em ambos os comandos.
- **Erros Conhecidos:** Timeout no benchmark de 200 hashes bcrypt em CPUs extremamente sobrecarregadas.
- **Procedimento de Recuperação:** Executar `npm test` sem processos concorrentes pesados na VM.
- **Riscos de Segurança:** Os testes usam diretórios temporários isolados (`os.tmpdir()`) e `JWT_SECRET` de teste isolado no `vite.config.ts`, sem tocar nos dados reais de produção.
- **Riscos de Cobrança:** Custo zero (100% local via Vitest).

---

## Etapa 21 — Build de Produção (Frontend + Bundle Backend + Imagens Docker)
- **Objetivo:** Compilar o bundle de produção do frontend (`dist/`) e do servidor (`dist-server/server.mjs`) ou construir as imagens Docker multi-stage (`kawihe-auth` e `uno-game`) de forma sequencial para economizar RAM.
- **Pré-requisitos:** Etapas 4 a 11 concluídas.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  sudo docker compose down --remove-orphans || true
  sudo docker compose build kawihe-auth
  sudo docker compose build uno-game
  ```
- **O que o `Dockerfile` faz internamente (`CONFIRMADO` em `Dockerfile` linha 16):**
  ```bash
  npm run build && npx --no-install esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile=dist-server/server.mjs && npm prune --omit=dev --legacy-peer-deps
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Imagens `unokawihe-kawihe-auth` e `unokawihe-uno-game` criadas sem erro.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  sudo docker images | grep -E "uno-game|kawihe-auth"
  ```
- **Erros Conhecidos:** `docker compose build` paralelo (sem especificar um serviço por vez) pode exceder 1 GB de RAM na VM Micro.
- **Procedimento de Recuperação:** Sempre construir sequencialmente (`build kawihe-auth` e depois `build uno-game`) com os containers antigos parados (`docker compose down`), exatamente como faz a Etapa 5 do `deploy.sh`.
- **Riscos de Segurança:** O estágio final `runner` do `Dockerfile` remove `devDependencies` e executa como `USER node` (não-root).
- **Riscos de Cobrança:** Build 100% local na VM, sem uso de minutos pagos de CI/CD externo.

---

## Etapa 22 — Inicialização em Produção
- **Objetivo:** Subir os containers de produção em background com política `restart: unless-stopped` (ou executar `./deploy.sh` que automatiza as Etapas 1, 2, 3, 4, 5 e 6).
- **Pré-requisitos:** Etapa 21 concluída.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  sudo docker compose up -d --no-build
  # OU usando o orquestrador completo em 6 etapas:
  ./deploy.sh
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Containers `kawihe-auth` (porta `4000`) e `uno-game` (porta `3000`) em estado `Up`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  sudo docker compose ps
  ```
- **Erros Conhecidos:** Container em loop `Restarting (1)`.
- **Procedimento de Recuperação:** Inspecionar logs com `sudo docker compose logs --tail=50 uno-game`.
- **Riscos de Segurança:** Nenhum.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 23 — Verificações de Saúde e Sincronização de Versão (`Health Check`)
- **Objetivo:** Confirmar que os serviços HTTP/WebSocket estão respondendo e que a versão viva reportada por `GET /api/version` corresponde exatamente à versão `2.3.0` do `package.json`.
- **Pré-requisitos:** Etapa 22 concluída.
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  curl -s http://localhost:3000/health | jq .
  curl -s http://localhost:3000/api/version | jq '{version, tag, releaseDate, title: .latestRelease.title}'
  ./status.sh
  ```
- **Local de Execução:** Terminal da VM (`/opt/unokawihe`).
- **Resultado Esperado (`CONFIRMADO`):**
  - `/health`: `{"status":"ok","service":"Uno KaWiHe Game Server","activeRooms":0,"timestamp":...}`
  - `/api/version`: `{"version":"2.3.0","tag":"v2.3.0","releaseDate":"2026-11-18","title":"Versionamento Visível, Desconexão Real de Sessão & Painel Admin Centralizado"}`
- **Método de Validação:** A Etapa 6 do `deploy.sh` compara automaticamente `LIVE_VERSION` com `APP_PKG_VERSION` e aborta com erro caso haja qualquer divergência.
- **Erros Conhecidos:** Navegador do usuário exibindo versão antiga por cache local após atualização da VM.
- **Procedimento de Recuperação:** Clicar no selo de versão (`v2.3.0`) na Tela de Login ou Lobby: o `ChangelogModal` detecta a divergência Cliente × Servidor e instrui o usuário a recarregar (`Ctrl+Shift+R` / `F5`).
- **Riscos de Segurança:** `/health` e `/api/version` não expõem segredos nem dados de usuários.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 24 — Testes Funcionais Pós-Reconstrução
- **Objetivo:** Validar ponta a ponta a experiência de login, salas, motor UNO, torneios, painel administrativo e WebSockets na instância reconstruída.
- **Pré-requisitos:** Etapa 23 aprovada.
- **Roteiro de Verificação Funcional:**
  1. **Acesso Web / HTTPS:** Abrir `https://<SEU_DOMINIO_DUCKDNS>` (ou `http://<IP_DA_VM>:3000`) e verificar o selo **`v2.3.0`** no canto da Tela de Login.
  2. **Login Admin:** Autenticar com `edinho` e a senha configurada. Verificar acesso ao Lobby e abertura do **Painel Central de Administração** (`AdminRoomsModal`).
  3. **Verificação de Versão Sincronizada:** Clicar no selo `v2.3.0` ou abrir a aba **Sistema & Auditoria** no Painel Admin e confirmar o status verde **"Cliente e Servidor sincronizados na v2.3.0"**.
  4. **Partida Solo / Bots:** Iniciar treino solo com bots, jogar carta, comprar carta, passar turno e validar som/animação.
  5. **Simulação Automatizada de Torneio (Opcional via CLI) `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
     ```bash
     node scripts/tournament-test.mjs --url http://127.0.0.1:3000 --user edinho --password "<SENHA_ADMIN>"
     ```
- **Resultado Esperado:** Fluxos de autenticação, WebSocket v2 (`room_joined`, `game_state`, `hand_state`), torneio e moderação funcionando sem erros no console.
- **Método de Validação:** Log de auditoria em `GET /api/admin/audit-log` e conclusão do torneio de teste com Campeão declarado.
- **Erros Conhecidos:** Microfone bloqueado pelo navegador se acessado via `http://<IP>:3000` sem HTTPS.
- **Procedimento de Recuperação:** Acessar via `https://<DOMINIO_DUCKDNS>` configurado pelo `configdns.sh` ou seguir o guia de flags do Firefox/Chrome no `GAME_MANUAL.md` (Seção 8).
- **Riscos de Segurança:** Remover torneios/usuários temporários de teste após homologação usando o desafio matemático do painel de torneios.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 25 — Procedimento de Backup Regular
- **Objetivo:** Gerar cópia de segurança íntegra e com permissões restritas (`chmod 700` no diretório e `chmod 600` nos arquivos) de todos os dados persistidos em `./data/`.
- **Pré-requisitos:** Sistema operacional e em produção.
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  ./backup.sh pos_reconstrucao_v230
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Diretório `/opt/unokawihe/backups/pos_reconstrucao_v230/` contendo `data_backup_<DATA>.tar.gz` com permissão `600`.
- **Método de Validação `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  ls -la /opt/unokawihe/backups/pos_reconstrucao_v230/
  ```
- **Recomendações de Retenção Externa (Desastre de Perda de VM):** Copiar o arquivo `.tar.gz` para fora da VM via `scp` para o computador pessoal do proprietário:
  ```bash
  scp ubuntu@<IP_DA_VM>:/opt/unokawihe/backups/pos_reconstrucao_v230/data_backup_*.tar.gz ./
  ```
- **Riscos de Segurança:** O arquivo `.tar.gz` contém `users.json` (`passwordHash`). Mantê-lo criptografado ou em pasta local restrita do proprietário.
- **Riscos de Cobrança:** Transferência `scp` de poucos kilobytes está muito abaixo da franquia gratuita de 10 TB/mês de saída da OCI.

---

## Etapa 26 — Procedimento de Rollback
- **Objetivo:** Reverter rapidamente código e/ou dados para um estado anterior estável caso uma atualização apresente falha.
- **Pré-requisitos:** Histórico Git e backup gerado antes da atualização (`scripts/deploy.sh` gera backup automático antes de atualizar).
- **Comando Exato `[COMANDO DE EXECUÇÃO FUTURA NA VM — NÃO EXECUTAR DURANTE AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  # 1. Reverter código para um commit específico estável:
  git fetch origin
  git checkout <COMMIT_HASH_ANTERIOR>
  # 2. Restaurar dados (se houve migração/alteração indesejada em ./data):
  ./restore.sh <TAG_DO_BACKUP>
  sudo chown -R 1000:1000 /opt/unokawihe/data
  # 3. Reconstruir e subir containers:
  sudo docker compose down --remove-orphans
  sudo docker compose build kawihe-auth
  sudo docker compose build uno-game
  sudo docker compose up -d --no-build
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Serviços operacionais na revisão anterior e dados restaurados.
- **Método de Validação:** `curl -s http://localhost:3000/health` e `curl -s http://localhost:3000/api/version`.
- **Riscos de Segurança:** Se o rollback reverter `users.json` para antes de uma revogação de sessão (`sessionVersion`), desconectar novamente o usuário pelo Painel Admin.
- **Riscos de Cobrança:** Custo zero.

---

## Etapa 27 — Diagnóstico de Incidentes
- **Objetivo:** Inspecionar o estado completo da VM, containers, rede, memória e logs de forma 100% segura e **somente leitura**, mascarando segredos.
- **Pré-requisitos:** Scripts do repositório disponíveis em `/opt/unokawihe`.
- **Comando Exato `[COMANDO DE VERIFICAÇÃO LOCAL — SEGURO PARA AUDITORIA]`:**
  ```bash
  cd /opt/unokawihe
  ./relatorio-vm.sh
  # OU diagnóstico interativo resumido:
  ./scripts/sysinfo.sh
  ```
- **Local de Execução:** `/opt/unokawihe`.
- **Resultado Esperado:** Relatório completo no terminal (e arquivo de log sanitizado) com uso de CPU/RAM/Swap, status do Docker, portas abertas, firewall e saúde dos endpoints, sem expor `JWT_SECRET` nem `passwordHash`.
- **Referência Detalhada de Runbooks:** Consulte `12_OPERACAO_E_RECUPERACAO.md` para tabelas completas de diagnóstico de incidentes (Caddy, DuckDNS, WebSocket 4001/4003, Lock `.kawihe.lock`, WAL recovery e OOM).

---

## Etapa 28 — Critérios Objetivos para Declarar a Reconstrução Concluída
A reconstrução do **Uno KaWiHe `v2.3.0`** só pode ser declarada **CONCLUÍDA** quando **todos os 10 critérios objetivos abaixo** forem comprovados com evidência verificável:

| # | Critério Objetivo | Comando / Método de Verificação | Resultado Obrigatório |
| :---: | :--- | :--- | :--- |
| **1** | Repositório Oficial Conectado | `git remote -v` | `https://github.com/edinhogrubert/Uno-KaWiHe.git` |
| **2** | Tipagem TypeScript Íntegra | `npm run lint` (`tsc --noEmit`) | Código de saída `0` (`0 erros`) |
| **3** | Build de Produção Íntegro | `npm run build` (`vite build`) | Código de saída `0` (`dist/` gerado) |
| **4** | Suíte Completa de Testes Aprovada | `npm test` (`vitest run`) | **12/12 suítes e 126/126 testes passando** |
| **5** | Sintaxe dos Scripts Shell e Node | `bash -n *.sh scripts/*.sh && node --check scripts/*.mjs` | Código de saída `0` |
| **6** | Persistência e Permissões Seguras | `ls -ld data` e validação `jq empty data/*.json` | UID `1000:1000` (Docker), JSONs válidos, `.env` `600` |
| **7** | Saúde dos Serviços Ativos | `curl -s http://localhost:3000/health` | `"status": "ok"` |
| **8** | Sincronia Cliente × Servidor | `curl -s http://localhost:3000/api/version` | `"version": "2.3.0"` igual ao `package.json` |
| **9** | HTTPS & WSS Operacionais (se VM pública) | `systemctl is-active caddy` e acesso `https://<dominio>` | Certificado TLS válido e WebSocket conectado |
| **10** | Conformidade Custo Zero | Verificação contra `11_FREE_TIER_COMPLIANCE.md` | Zero recursos pagos ou trials com cobrança automática |
