# 📖 MANUAL DE SCRIPTS SHELL (MANUALSH.md) — UNO KAWIHE v2.3.0

Este manual documenta todos os scripts utilitários em Shell Script (`.sh`) e automações Node.js criados no ecossistema do **Uno KaWiHe v2.3.0**. Eles automatizam deploy com verificação de versão, DNS + HTTPS (DuckDNS + Caddy), gerenciamento de usuários, backups seguros, restaurações, monitoramento de saúde da VM e túneis Cloudflare.

---

## 📋 Sumário de Scripts Disponíveis

| Script | Localização | Descrição Principal |
| :--- | :--- | :--- |
| **`deploy.sh`** | Raiz (`./deploy.sh`) | Orquestrador completo em 6 etapas (`edinhogrubert/Uno-KaWiHe`): Sistema/Swap + Docker + Firewall + Git Pull + Compose + Health Check & validação de `/api/version`. |
| **`scripts/deploy.sh`** | `scripts/deploy.sh` | Atualização rápida em 3 passos: auto-backup (`scripts/backup.sh`) + `git pull` + build sequencial dos containers. |
| **`configdns.sh`** | Raiz / `scripts/configdns.sh` | Configura DuckDNS + Proxy Reverso Caddy com SSL/HTTPS automático e suporte a WebSockets (WSS) na porta 3000. |
| **`create-user.sh`** | Raiz / `scripts/create-user.sh` | Criação segura de usuários administradores ou jogadores com hash `bcryptjs` (fator 12). |
| **`create-invite.sh`** | `scripts/create-invite.sh` | Geração de códigos de convite restritos (`@XXXX`) para registro de novos usuários. |
| **`backup.sh`** | Raiz / `scripts/backup.sh` | Ponto de restauração e salvamento de dados com permissões restritas (`chmod 700`/`600`). |
| **`restore.sh`** | Raiz / `scripts/restore.sh` | Restauração de banco de dados a partir de backups gerais ou tags específicas. |
| **`status.sh`** | Raiz / `scripts/status.sh` | Monitoramento rápido de saúde dos serviços (Portas 3000 / 4000). |
| **`sysinfo.sh`** | `scripts/sysinfo.sh` | Diagnóstico completo e interativo do sistema (CPU, Memória, Disco, Uptime, Docker). |
| **`list-users.sh`** | `scripts/list-users.sh` | Listagem em formato tabular de todos os usuários cadastrados e seus papéis (*admin* / *player*). |
| **`cloudflare.sh`** | `cloudflare.sh` | Gerenciador interativo de túnel Cloudflare Tunnel (HTTPS) para acesso externo à VM. |
| **`relatorio-vm.sh`** | `relatorio-vm.sh` | Ferramenta de diagnóstico em **somente leitura** para inspeção segura do estado da VM (mascara segredos). |
| **`limpar.sh`** | `limpar.sh` | Reversão de instalação local (remove `/opt/unokawihe`, `/swapfile` e `.deploy_state`). |
| **`stress-test.mjs` / `capacity-test.mjs`** | `scripts/` | Testes de carga e capacidade WebSocket (`npm run stress` e `npm run capacity`). |
| **`tournament-test.mjs`** | `scripts/` | Simulação completa de torneios Individual e Duplas 2v2 com telemetria (`npm run tournament-test`). |

---

## 🛠️ Detalhes e Exemplos de Uso por Script

### 1. `deploy.sh` (Orquestrador de Deploy em 6 Etapas) e `scripts/deploy.sh`
* **Objetivo:** Automatizar a instalação e atualização da aplicação em `/opt/unokawihe` a partir de `https://github.com/edinhogrubert/Uno-KaWiHe.git` com checkpoint de retomada (`/var/tmp/unokawihe_deploy_state`).
* **O que faz (`./deploy.sh`):**
  1. **Etapa 1:** Prepara sistema e swap (ideal para 1 GB RAM na OCI Micro).
  2. **Etapa 2:** Instala/valida Docker e Docker Compose v2.
  3. **Etapa 3:** Configura firewall local (portas 80, 443 e 3000).
  4. **Etapa 4:** Clona ou atualiza o repositório e prepara `.env` / permissões.
  5. **Etapa 5:** Reconstrói e sobe os containers (`docker compose up -d --build`).
  6. **Etapa 6 (Health Check & Versão):** Consulta `http://localhost:3000/health` e `http://localhost:3000/api/version`, garantindo que a versão viva no container corresponde exatamente ao `package.json` (`v2.3.0`) e abortando o deploy em caso de divergência.
* **Alternativa (`./scripts/deploy.sh`):** Executa backup via `scripts/backup.sh`, faz `git pull`, reconstrói `kawihe-auth` e `uno-game` sequencialmente e exibe `docker compose ps`.
* **Modos de Uso:**
  ```bash
  # Deploy completo (com checkpoint por etapa)
  ./deploy.sh

  # Atualização rápida com backup prévio automático
  ./scripts/deploy.sh

  # Visualizar logs em tempo real
  ./deploy.sh logs

  # Verificar status de execução
  ./deploy.sh status
  ```

---

### 2. `create-user.sh` (Criação de Usuários)
* **Objetivo:** Cadastrar novos usuários ou administradores no sistema sem permitir senhas em texto puro.
* **Segurança:** Exige o pacote `bcryptjs` instalado (fator de custo 12). Aborta com `process.exit(1)` caso ausente.
* **Modos de Uso:**
  ```bash
  # Modo Interativo (pergunta usuário, senha, nome, avatar e papel)
  ./create-user.sh

  # Modo Direto por Argumentos:
  # Sintaxe: ./create-user.sh <username> <senha> <nome_exibicao> <avatar> <role>
  ./scripts/create-user.sh edinho "minhasenha123" "Edinho Admin" 👑 admin
  ./scripts/create-user.sh joao "joao1234" "João da Silva" 🦁 player
  ```

---

### 3. `create-invite.sh` (Gerador de Convites)
* **Objetivo:** Gerar códigos de convite restritos (ex: `@KWH99`) necessários para novos cadastros.
* **Modos de Uso:**
  ```bash
  # Gerar convite padrão
  ./scripts/create-invite.sh

  # Gerar convite personalizado com limite de usos e validade
  ./scripts/create-invite.sh @MINHA_EQUIPE 5
  ```

---

### 4. `backup.sh` (Ponto de Restauração)
* **Objetivo:** Salvar o diretório `./data/` (usuários, convites, estatísticas) em um diretório de backup com permissões restritas.
* **Segurança:** Aplica `chmod 700` no diretório de destino e `chmod 600` nos arquivos gerados, protegendo dados sensíveis de leitura por outros usuários do sistema.
* **Modo de Uso:**
  ```bash
  # Criar backup geral
  ./backup.sh

  # Criar backup com tag nomeada
  ./scripts/backup.sh versao_estavel_v2
  ```

---

### 5. `restore.sh` (Restauração de Dados)
* **Objetivo:** Reverter o banco de dados (`./data/`) para o estado de um backup anterior.
* **Modo de Uso:**
  ```bash
  # Restaurar o backup mais recente
  ./restore.sh

  # Restaurar a partir de uma tag nomeada
  ./scripts/restore.sh versao_estavel_v2
  ```

---

### 6. `status.sh` (Verificação de Saúde)
* **Objetivo:** Consultar rapidamente se os serviços do Uno KaWiHe estão ativos e respondendo.
* **Modo de Uso:**
  ```bash
  ./status.sh
  ```

---

### 7. `sysinfo.sh` (Diagnóstico do Sistema)
* **Objetivo:** Exibir estatísticas detalhadas de uso de CPU, memória RAM, espaço em disco, processos Node.js e status do Docker.
* **Modo de Uso:**
  ```bash
  ./scripts/sysinfo.sh
  ```

---

### 8. `list-users.sh` (Listagem de Contas)
* **Objetivo:** Exibir uma listagem formatada de todos os usuários registrados em `data/users.json`.
* **Modo de Uso:**
  ```bash
  ./scripts/list-users.sh
  ```

---

### 9. `cloudflare.sh` (Gerenciador de Túnel HTTPS)
* **Objetivo:** Expor a aplicação localmente de forma segura via túnel Cloudflare (`trycloudflare.com` ou domínio customizado) para habilitar HTTPS e WebRTC.
* **Modo de Uso:**
  ```bash
  ./cloudflare.sh
  ```

---

### 10. `relatorio-vm.sh` (Relatório Seguro em Somente Leitura)
* **Objetivo:** Gerar um relatório de diagnóstico da VM para fins de auditoria e solução de problemas.
* **Garantia de Segurança:** Executa estritamente em **somente leitura**, sem alterar nenhum arquivo ou container, mascarando senhas, chaves JWT e hashes.
* **Modo de Uso:**
  ```bash
  ./relatorio-vm.sh
  ```

---

### 11. `limpar.sh` (Limpeza de Deploy Local)
* **Objetivo:** Reverter o deploy local em VM/PC removendo `/opt/unokawihe`, `/swapfile` e `.deploy_state`.
* **Modo de Uso:**
  ```bash
  sudo ./limpar.sh
  ```

---

### 12. Testes de Carga e Capacidade (`scripts/stress-test.mjs` & `scripts/capacity-test.mjs`)
* **Objetivo:** Simular múltiplas salas e jogadores simultâneos via WebSocket para validar latência e consumo de memória.
* **Modos de Uso:**
  ```bash
  npm run stress
  npm run capacity
  ```

---

### 13. Simulação Completa de Torneios (`scripts/tournament-test.mjs`)
* **Objetivo:** Simulação automatizada de ponta a ponta de torneios em tempo real (Individual ou Duplas 2v2) com autenticação JWT estrita, jogadores e espectadores via WebSocket, jogadas completas (compra, descarte, UNO), avanço de chaves até a premiação do Campeão e telemetria da VM (preserva `scripts/capacity-test.mjs` intacto).
* **Modos de Uso:** *(use `--password` com a senha real do admin configurada no servidor ou `--token <JWT_ADMIN>`)*
  ```bash
  # Torneio Individual com 4 jogadores
  node scripts/tournament-test.mjs --url http://127.0.0.1:3000 --user edinho --password <SENHA_ADMIN>

  # Torneio de Duplas 2v2 com 4 equipes (8 jogadores) em Md3
  node scripts/tournament-test.mjs --url http://127.0.0.1:3000 --user edinho --password <SENHA_ADMIN> --modality doubles --teams 4 --best-of 3

  # Execução direta via curl sem salvar arquivo local
  curl -sSL https://raw.githubusercontent.com/edinhogrubert/Uno-KaWiHe/main/scripts/tournament-test.mjs | node --input-type=module - --url http://127.0.0.1:3000 --user edinho --password <SENHA_ADMIN>
  ```

---

### 14. `configdns.sh` (Domínio DuckDNS + Proxy Reverso Caddy HTTPS)
* **Objetivo:** Configurar domínio gratuito DuckDNS (com cron de atualização de IP) e proxy reverso Caddy com certificado Let's Encrypt automático para a porta `3000`, habilitando HTTPS e WebSockets (`wss://`) para liberar o microfone WebRTC em todos os navegadores.
* **Pré-requisitos:** Portas TCP **80** e **443** liberadas na Security List / VCN da nuvem (Oracle Cloud).
* **Modo de Uso:**
  ```bash
  sudo ./configdns.sh
  ```

---

## 🔒 Boas Práticas e Permissões
Para garantir que todos os scripts tenham permissão de execução correta na VM após clonar ou atualizar o repositório, execute:
```bash
chmod +x *.sh scripts/*.sh
```
