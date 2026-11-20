# 🃏 Uno KaWiHe v2.3.0 — Multiplayer, Duplas 2v2, Torneios & Voz P2P

> Plataforma Full-Stack de UNO Multiplayer em Tempo Real com Chat de Voz P2P (WebRTC), Modo Duplas 2v2, Sistema de Torneios, Contas Privadas por Convite, Painel Administrativo Seguro (JWT), Versionamento Visível e Persistência Atômica — operando sob a **Política Universal de Custo Zero (`100% Free Tier Global`)**.

| Metadado | Valor |
|---|---|
| **Finalidade** | Visão geral do projeto, destaques da versão, guia rápido de execução e índice da documentação. |
| **Público-alvo** | Proprietário, Desenvolvedores, Operadores de VM e Agentes de IA. |
| **Status** | **INFORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (**quem digita diretamente aqui no chat**; ref. `edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Repositório Oficial** | `https://github.com/edinhogrubert/Uno-KaWiHe` (`main`) |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |

---

## 🚀 Destaques da Versão 2.3.0

- 🏷️ **Versionamento Visível & Histórico Resumido (`GET /api/version` + `ChangelogModal`):** Selo clicável `v2.3.0` na Tela de Login, Lobby e Painel Admin com histórico resumido das entregas, detecção automática de divergência Cliente × Servidor (cache ou deploy antigo) e validação obrigatória na Etapa 6 do `deploy.sh`.
- 🔌 **Desconexão Real de Sessão pelo Admin (`sessionVersion`):** Encerrar uma sessão pelo painel administrativo revoga imediatamente JWTs antigos no servidor principal e no `auth-service`, envia `session_revoked`, fecha o WebSocket com código `4001` (sem auto-reconexão) e bloqueia criação/entrada em salas.
- 🛡️ **Painel Central Admin Aprimorado (`AdminRoomsModal`):** Clique direto em qualquer usuário (nas abas *Salas* ou *Usuários*) abre o **Relatório Diagnóstico**, além de filtros rápidos (`online`, `temporários`, `inativos`, `admins`), suspensão/reativação inline, limpeza de salas sem humanos, mensagens diretas garantidas por `authenticatedUserId` e aba *Sistema & Auditoria*.
- 🎮 **Multiplayer Autoritativo em Tempo Real:** Motor de regras centralizado (`server/unoEngine.ts`) com broadcast público (`GameState`) e envio privado de cartas (`HandState`) via WebSockets v2.
- 🤝 **Modo Duplas 2v2 (`team_2v2`):** Assentos alternados `[A1, B1, A2, B2]`, compartilhamento seguro da mão do parceiro (`teammateHand`), bloqueio de fogo amigo no `catch_uno` e pontuação pela equipe perdedora.
- 🏆 **Sistema de Torneios (`server/tournamentEngine.ts` + `server/tournamentCleanupService.ts`):** Modalidades **Individual** (mesas 2..4, classificação por vitórias, desempate por partida extra ou decisão admin) e **Duplas 2v2** (Md1/Md3/Md5 com *byes* e *early clinch*), simulação pré-início, W.O. seguro preservando as 108 cartas, pausa automática em reinício, reagendamento (`rescheduled`), encerramento seguro (`closed`) preservando histórico/contas e limpeza independente de contas temporárias com desafio matemático no servidor.
- 🎙️ **Chat de Voz P2P (WebRTC Full-Mesh):** Comunicação por voz direta entre os jogadores na mesa, sem servidor de mídia pago no backend.
- 🔐 **Segurança & Autenticação Robusta:**
  - Autenticação e painel administrativo via **JSON Web Tokens (JWT)** assinados com verificação de perfil (`role === 'admin'`) e `sessionVersion`.
  - Bootstrap dinâmico com geração de credencial temporária de alta entropia (`crypto.randomBytes`) caso `INITIAL_ADMIN_PASSWORD` não seja informada.
  - Rate limiting composto por conta e IP (`trust proxy` + `CF-Connecting-IP`).
- 📁 **Persistência Atômica Sincronizada (`./data/`):** Dados salvos em `users.json`, `invites.json`, `stats.json`, `tournaments.json`, `tournament_audit.json` e `import_batches.json` com escrita segura (`fsyncSync` + `renameSync`) e lock multi-processo (`data/.kawihe.lock`).
- 🛡️ **Scripts de Manutenção & HTTPS (`configdns.sh` / `deploy.sh`):**
  - `deploy.sh`: Repositório oficial `edinhogrubert/Uno-KaWiHe` com validação da versão viva `/api/version` no Health Check.
  - `configdns.sh`: Configura DuckDNS + Proxy Reverso Caddy com HTTPS automático (liberando WebRTC/Microfone sem precisar de flags HTTP no navegador).
  - `scripts/create-user.sh`: Exigência estrita de `bcryptjs` (fator 12), abortando com `process.exit(1)` caso ausente.
  - `scripts/backup.sh`: Permissões restritas (`chmod 700` no diretório e `chmod 600` nos arquivos gerados) com salvamento de `./data` e volumes Docker.
- 🧪 **Suíte de Testes Automatizados:** **126 testes** executados via Vitest em 12 suítes (`unoEngine`: 26, `serverIntegration`: 19, `participationLogic`: 9, `tournamentEngine`: 22, `tournamentWo`: 19, `tournamentIntegration`: 5, `tournamentStress`: 2, `tournamentAdminLifecycle`: 6, `importParser`: 6, `importService`: 7, `importIntegration`: 3, `sessionRevocation`: 2).
- 📥 **Importador de Usuários em Massa (JWT Admin):** Upload CSV ou colagem (até 512 KB / 200 registros) com hashing `bcrypt` em Worker Thread nativa, WAL (`running`/`completed`/`failed`/`partial`/`reconciling`) entre JSONs, inscrição direta em torneios individuais e de duplas (por pares consecutivos de linhas válidas) e gestão segura de ciclo de vida (`active`/`disabled`/`archived`/exclusão sem dependências).
- 👑 **Diagnóstico e Monitor de VM:** Inspeção em tempo real de jogadores (`/api/admin/player-report/:target`), ações de moderação (Kick, Alerta, Desconectar, Redefinir Senha, Criar/Excluir Usuário) e métricas da VM (`/api/admin/vm-metrics`).
- 🎙️ **Guia de Microfone no PC:** Instruções passo a passo integradas para liberação de áudio e microfone em HTTP/IP no Firefox (`about:config`) e Google Chrome (`chrome://flags`).

---

## 📚 Documentação do Projeto (24 Documentos na Raiz)

- 🤖 [**AGENTS.md**](./AGENTS.md) — Constituição operacional de Nível 1 (autoridade subordinada ao Nível 0: **quem digita diretamente aqui no chat**; Hierarquia Níveis 0–4, 5 Princípios `P1`–`P5`, Regra de Conflitos e mapa mestre).
- 📜 [**00_visao.md**](./00_visao.md) a [**09_prompts.md**](./09_prompts.md) — Especificação modular de visão (`00`), casos de uso (`01`), regras (`02`), arquitetura (`03`), status (`04`), ADRs com parecer divergente (`05`), testes (`06`), histórico (`07`), handoff em 8 seções (`08`) e prompts (`09`).
- 🏗️ [**10_RECONSTRUCAO_COMPLETA.md**](./10_RECONSTRUCAO_COMPLETA.md) — Manual normativo de reconstrução do zero e recuperação de desastres em **28 etapas** reproduzíveis + 10 critérios objetivos de conclusão.
- 💸 [**11_FREE_TIER_COMPLIANCE.md**](./11_FREE_TIER_COMPLIANCE.md) — Política Universal de Custo Zero, classificação de serviços, matriz de conformidade, regras Oracle Cloud Always Free e **Free Tier Compliance Gate**.
- ⚙️ [**12_OPERACAO_E_RECUPERACAO.md**](./12_OPERACAO_E_RECUPERACAO.md) — Manual de operação diária, persistência atômica (`fsync`+`rename`), lock multi-processo (`data/.kawihe.lock`), WAL e runbooks de Disaster Recovery.
- 🔗 [**13_MATRIZ_RASTREABILIDADE.md**](./13_MATRIZ_RASTREABILIDADE.md) — Matriz de rastreabilidade ponta a ponta (IDs estáveis `RF-*`/`RN-*`/`API-*`/`WS-*`/`UI-*`/`DATA-*`/`ENV-*`/`OPS-*` × código × 126 testes), cálculo formal de cobertura (`100,0%`) e registro auditado de divergências (`DIV-01` a `DIV-06`).
- 🧠 [**14_CONFIABILIDADE_IA.md**](./14_CONFIABILIDADE_IA.md) — Protocolo normativo único de Confiabilidade de Agentes de IA: 5 princípios (`P1`–`P5`), 7 estados oficiais (`VERIFICADO`..`CONTRADITÓRIO`), anti-alucinação, contestação técnica independente, auditoria adversarial (9 perguntas), gestão de contexto, ritual de 10 passos e cenários de aceitação **A–J**.
- 🔮 [**15_FUTURAS_FUNCIONALIDADES.md**](./15_FUTURAS_FUNCIONALIDADES.md) — Catálogo normativo e especificação técnica de futuras funcionalidades e regras da casa (`PROPOSTO` · 100% Free Tier).
- 🃏 [**GAME_MANUAL.md**](./GAME_MANUAL.md) — Manual oficial de regras do jogo, cartas especiais, penalidades de UNO, 2v2, torneios e guia de microfone no PC.
- 📄 [**SYSTEM_SPECIFICATION.md**](./SYSTEM_SPECIFICATION.md) — Especificação técnica completa de arquitetura, envelopes de WebSocket v2, reconexão segura e persistência.
- 🛠️ [**manualSH.md**](./manualSH.md) — Manual completo dos scripts shell (`.sh` e `.mjs`) de deploy, DNS/HTTPS, backup e administração.
- 📊 [**USE_CASES.md**](./USE_CASES.md) — Mapeamento detalhado dos fluxos de uso, segurança e cenários de teste do sistema.
- ⚖️ [**Game_funcionalidades**](./Game_funcionalidades) e [**Game_changes.MD**](./Game_changes.MD) — Contrato normativo detalhado de comportamento/UI e histórico de evolução técnica.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Node.js, Express, WebSockets (`ws`), TypeScript (`tsx`).
- **Criptografia:** `bcryptjs`, `jsonwebtoken`, `crypto` nativo do Node.js.
- **Testes:** Vitest.
- **Deploy:** Docker, Docker Compose.

---

## 🏃 Como Rodar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/edinhogrubert/Uno-KaWiHe.git
cd Uno-KaWiHe
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
Defina sua chave secreta no `.env`:
```env
JWT_SECRET="sua_chave_secreta_longa_e_aleatoria_aqui"
INITIAL_ADMIN_PASSWORD="sua_senha_forte_para_admin"
```

### 3. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse em: `http://localhost:3000`

---

## 🧪 Executar Testes Automatizados

```bash
# Executa os 126 testes em 12 suítes com relatório detalhado
npm test

# Validação estrita de tipos TypeScript
npm run lint

# Compilação de produção
npm run build
```

---

## 👥 Scripts Administrativos e Manutenção

### Criar Novo Usuário via Linha de Comando
```bash
# Modo Interativo:
./scripts/create-user.sh

# Modo Direto:
./scripts/create-user.sh joao "minhasenha123" "João Silva" 🦁 player
./scripts/create-user.sh admin2 "senhaAdminForte" "Admin 2" 👑 admin
```

### Listar Usuários Cadastrados
```bash
./scripts/list-users.sh
```

### Fazer Backup Seguro
```bash
# Backup geral:
./backup.sh

# Backup com identificador / tag:
./backup.sh antes_do_deploy
```

### Restaurar Backup
```bash
./restore.sh antes_do_deploy
```

---

## 🐳 Deploy com Docker Compose

```bash
# 1. Garanta que o arquivo .env contenha o JWT_SECRET
# 2. Inicie os serviços em segundo plano:
docker compose up -d --build

# 3. Verifique os logs:
docker compose logs -f
```

---

## 🔒 Licença e Privacidade

Projeto privado desenvolvido para momentos de lazer e diversão em família com máxima segurança, privacidade e controle autoritativo.
