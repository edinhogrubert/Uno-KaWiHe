# 🛡️ 11 — CONFORMIDADE GLOBAL DE CUSTO ZERO (FREE TIER COMPLIANCE) — UNO KAWIHE (`v2.3.0`)

## Metadados Documentais
- **Finalidade:** Estabelecer a política universal e inquebrável de **Custo Zero** para todo o ecossistema do **Uno KaWiHe**, incluindo classificação formal de serviços, matriz completa de conformidade, regras para Oracle Cloud Always Free e o *Free Tier Compliance Gate* obrigatório para qualquer evolução futura.
- **Público-alvo:** Proprietário do projeto, Arquitetos, Auditores e Agentes de IA executores.
- **Status:** Normativo (`CONFIRMADO`).
- **Fonte de Autoridade:** Subordinado ao Proprietário (**Nível 0** — `edinho.grubert@gmail.com`) e à Constituição Operacional (`AGENTS.md` — **Nível 1**).
- **Versão de Referência:** `v2.3.0`.
- **Commit de Referência:** `6d25e83` + revisão documental `v2.3.0`.
- **Data de Revisão:** `2026-11-18` *(Nota: verificações baseadas na documentação técnica e configuração local do repositório em ambiente sem acesso externo à internet; cotas externas de provedores cloud devem ser reconfirmadas pelo operador no painel oficial da conta antes de provisionar novos recursos).*
- **Referências Relacionadas:** `AGENTS.md`, `00_visao.md`, `02_regras.md`, `05_adr.md`, `10_RECONSTRUCAO_COMPLETA.md`, `12_OPERACAO_E_RECUPERACAO.md`.

---

## 1. Regra Universal e Inquebrável — Custo Zero Global (`REG-FREE-01`)

> **Nenhum agente pode introduzir custo financeiro, obrigação de pagamento, cartão de crédito em serviço cobrado por uso ou recurso pago sem autorização expressa e verificável do proprietário (`edinho.grubert@gmail.com`).**

Esta política **não se limita ao Google AI Studio**. Ela abrange todo o ciclo de vida e toda a infraestrutura do projeto:
1. **Google AI Studio Build** e ambiente de desenvolvimento/preview.
2. **Oracle Cloud Infrastructure (OCI) Always Free** (computação, armazenamento, rede, IPs e backups).
3. **GitHub** (repositório Git, armazenamento e automações).
4. **Hospedagem, Proxies Reversos (Caddy), Túneis (Cloudflare) e Rede**.
5. **DNS Dinâmico (DuckDNS), Domínios e Certificados HTTPS/TLS (Let's Encrypt)**.
6. **Persistência e Banco de Dados** (arquivos JSON atômicos locais em `./data/` vs. proibição de RDS/Cloud SQL/bancos gerenciados pagos).
7. **Sistemas de Backup** (scripts locais `backup.sh` + cópia `scp` vs. snapshots pagos).
8. **Tempo Real, Voz e Sinalização** (WebSockets `ws` no Node.js e WebRTC P2P Full Mesh com STUN público gratuito).
9. **Monitoramento e Diagnóstico** (`/api/admin/vm-metrics`, `relatorio-vm.sh`, `sysinfo.sh` nativos vs. APM comercial pago).
10. **Bibliotecas, Pacotes NPM, Ferramentas de Build e Licenças Open-Source** (MIT/ISC/Apache-2.0/BSD).

---

## 2. Classificação Oficial de Serviços e Recursos

Todo serviço, biblioteca, infraestrutura ou integração presente ou proposta no projeto deve receber uma das seis classificações abaixo:

| Classificação | Significado | Política de Uso no Uno KaWiHe |
| :--- | :--- | :--- |
| **`FREE_VERIFIED`** | Gratuidade oficialmente verificada para o uso previsto, sem cobrança por excedente | **Permitido** |
| **`FREE_LIMITED`** | Gratuito dentro de cotas ou condições específicas do provedor | **Permitido com controle e prevenção** |
| **`SELF_HOSTED_FREE`** | Software open-source sem custo de licença, executado nos recursos já autorizados | **Permitido com verificação operacional (RAM/CPU/Disco)** |
| **`UNKNOWN_COST`** | Custos, licenciamento ou cotas não confirmados com evidência | **Bloqueado para adoção** |
| **`TRIAL_ONLY`** | Gratuidade apenas temporária (ex.: créditos de 30 dias que expiram) | **Bloqueado para adoção automática** |
| **`PAID`** | Recurso sujeito a cobrança direta ou indireta | **Bloqueado (exige autorização expressa do Nível 0)** |

---

## 3. Matriz Completa de Conformidade do Ecossistema Atual (`v2.3.0`)

A tabela abaixo documenta todos os componentes tecnológicos do **Uno KaWiHe `v2.3.0`** com suas respectivas classificações, limites, riscos e controles preventivos:

| Serviço / Componente | Finalidade no Sistema | Plano / Licença | Classificação | Documentação / Fonte | Data / Região | Limites de CPU, RAM e Disco | Limites de Tráfego / Requisições / Concorrência | Condições que Geram Cobrança | Riscos de Suspensão / Indisponibilidade | Configuração Preventiva Aplicada | Monitoramento de Consumo | Alternativa Gratuita | Estado da Verificação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js 22 + Express 4 + `ws` + `worker_threads`** | Servidor HTTP, motor UNO/Torneios, WebSocket v2 e hashing bcrypt em Worker | Open-Source (MIT / Node License) | `SELF_HOSTED_FREE` | `package.json` / `Dockerfile` (`node:22-slim`) | `2026-11-18` / Global (Local/VM) | Limitado a `--max-old-space-size=256` e `384M` (`uno-game`) + `160M` (`kawihe-auth`) no Docker | Limitado pela RAM/CPU da VM e rate limiter em memória (`server.ts`) | Nenhuma pelo software em si | OOM se exceder RAM da VM sem Swap | Swap de 2 GB no `deploy.sh`, heap 256 MB no `Dockerfile`, Worker Thread para bcrypt | `/api/admin/vm-metrics`, `VmMonitorModal.tsx`, `sysinfo.sh` | Execução direta sem Docker (`tsx server.ts`) | `CONFIRMADO` (código local) |
| **Persistência JSON Atômica (`./data/*.json` + `.kawihe.lock`)** | Banco de dados local de usuários, convites, stats, torneios e lotes WAL | Código nativo (`fs` Node.js) | `SELF_HOSTED_FREE` | `server/dataLock.ts` | `2026-11-18` / Local | Usa apenas alguns MB do Boot Volume local | Serializado por mutex FIFO + lock file `.kawihe.lock` (timeout 10s, stale 15s); limite de lote 512 KB / 200 linhas | Nenhuma (substitui bancos pagos) | Corrupção se disco encher (`ENOSPC`) | Limite de 512 KB no importador, `fsyncSync` + `renameSync`, backups compactados | `df -h` via `/api/admin/vm-metrics` e `relatorio-vm.sh` | SQLite local em arquivo (`SELF_HOSTED_FREE`) | `CONFIRMADO` (código local) |
| **React 19 + Vite 8 + Tailwind v4 + Vitest** | Frontend SPA, build estático e suíte de 126 testes automatizados | Open-Source (MIT) | `SELF_HOSTED_FREE` | `package.json` / `vite.config.ts` | `2026-11-18` / Local | Build usa até `512M` (`NODE_OPTIONS` no `Dockerfile`); estáticos `dist/` < 5 MB | Servido estaticamente pelo próprio Express em produção | Nenhuma | Falha de build em VM 1 GB se rodar sem Swap | Build multi-stage sequencial no `deploy.sh` com Swap de 2 GB | Tempo e saída do `npm run build` / `docker compose build` | Pre-build local antes de enviar imagem | `CONFIRMADO` (código local) |
| **WebRTC P2P Full Mesh + STUN Google (`stun.l.google.com:19302`)** | Chat de voz em tempo real entre jogadores da mesma mesa | WebRTC W3C nativo + STUN público gratuito | `FREE_LIMITED` | `src/services/voiceChat.ts` | `2026-11-18` / Global | Processamento de áudio 100% na CPU do navegador dos jogadores (zero carga de mídia no servidor) | Malha P2P: $N(N-1)/2$ conexões por sala (2 a 4 jogadores = 1 a 6 conexões P2P) | Nenhuma (não usa servidor TURN pago nem media server cobrado) | NAT simétrico estrito (4G corporativo) pode impedir P2P direto sem TURN | Sinalização higienizada no WS (`fromPlayerId` forçado no servidor); STUN público redundante (`stun` e `stun1.l.google.com`) | Logs de estado de voz WebRTC na mesa (`VoiceControls.tsx`) | Coturn (`SELF_HOSTED_FREE`) instalado na própria VM se necessário | `CONFIRMADO` (código local) |
| **Oracle Cloud (OCI) Always Free Compute & Storage** | Hospedagem da VM Linux de produção (`/opt/unokawihe`) | OCI Always Free Tier | `FREE_LIMITED` | `deploy.sh` / Documentação oficial OCI Always Free | `2026-11-18` / **Exclusivo na Home Region da conta** | Até 2 VMs `VM.Standard.E2.1.Micro` (1 GB RAM) + até 4 OCPUs / 24 GB RAM `VM.Standard.A1.Flex` (ARM); até **200 GB** totais de Block/Boot Volume | Até **10 TB/mês** de tráfego de saída (egress); 1 IPv4 público reservado/efêmero por VM Always Free | Conta convertida para Pay-As-You-Go que crie shapes fora do Always Free, disco total > 200 GB, ou instâncias fora da Home Region | Recolhimento (*reclamation*) pela Oracle se CPU/rede/RAM ficarem abaixo do limiar de ociosidade por 7 dias, ou falta de capacidade ARM A1 | Conta mantida como Free Tier (sem upgrade pago), Boot Volume padrão (~47 GB), build sequencial otimizado para 1 GB RAM | Painel OCI *Cost Analysis* + `/api/admin/vm-metrics` + `./relatorio-vm.sh` | VPS local/doméstica com Cloudflare Tunnel ou `VM.Standard.E2.1.Micro` | `DECLARADO` (requer verificação de cota no painel OCI do proprietário) |
| **DuckDNS (`duckdns.org`)** | DNS dinâmico gratuito apontando o domínio (`uno.grubert.duckdns.org`) para o IP da VM | Plano Gratuito DuckDNS | `FREE_VERIFIED` | `configdns.sh` / `https://www.duckdns.org` | `2026-11-18` / Global | N/A (serviço externo de resolução DNS) | Até 5 subdomínios por conta gratuita | Nenhuma (serviço 100% gratuito mantido pela comunidade) | Indisponibilidade pontual da API de atualização do DuckDNS | Atualização automática via `configdns.sh` e verificação com `getent hosts` | `getent hosts <dominio>` e `./status.sh` | Acesso direto via IP (`http://IP:3000`) ou Cloudflare Tunnel (`cloudflare.sh`) | `CONFIRMADO` (script local) / `DECLARADO` (serviço externo) |
| **Caddy Server 2 + Let's Encrypt ACME** | Proxy reverso HTTP/HTTPS e WebSockets (`wss://`) na porta 443 para `127.0.0.1:3000` | Apache 2.0 (Caddy) + Let's Encrypt gratuito | `SELF_HOSTED_FREE` / `FREE_LIMITED` | `configdns.sh` (`/etc/caddy/Caddyfile`) | `2026-11-18` / Local + Global ACME | Consumo leve na VM (~20–35 MB RAM) | Let's Encrypt: limite de 50 certificados por domínio registrado por semana (renovação automática a cada 60 dias) | Nenhuma | Falha de renovação se portas TCP `80`/`443` forem fechadas na VCN da Oracle Cloud | `Caddyfile` enxuto sem gravação de log customizado com erro de permissão; portas 80 e 443 abertas no `iptables`/`ufw` | `systemctl status caddy` e `journalctl -u caddy -n 20` | Nginx + Certbot (`SELF_HOSTED_FREE`) ou `cloudflare.sh` | `CONFIRMADO` (script local) |
| **Cloudflare Quick Tunnel / Named Tunnel (`cloudflared`)** | Alternativa de exposição HTTPS sem abrir portas 80/443 ou sem domínio próprio | Plano Cloudflare Free (`trycloudflare.com` ou Zero Trust Free) | `FREE_LIMITED` | `cloudflare.sh` | `2026-11-18` / Global | Binário `cloudflared` local (~30 MB RAM) | Quick Tunnels gratuitos não têm SLA de produção e possuem limite de conexões concorrentes | Ativar complementos pagos do Cloudflare (Argo Smart Routing, Load Balancing pago) | URL temporária `*.trycloudflare.com` muda se o processo reiniciar | Usar preferencialmente DuckDNS + Caddy (`configdns.sh`) para domínio fixo gratuito | `./cloudflare.sh` (opção de status/logs) | DuckDNS + Caddy (`configdns.sh`) | `CONFIRMADO` (script local) |
| **Google AI Studio Build** | Ambiente de desenvolvimento assistido por IA e preview em container na porta 3000 | AI Studio Free Tier | `FREE_LIMITED` | `AGENTS.md` / `.env.example` / `vite.config.ts` | `2026-11-18` / Cloud Run Managed Preview | Container de preview na porta 3000 com HMR desativado (`DISABLE_HMR=true`) | Sujeito às cotas gratuitas do Google AI Studio; o jogo **não faz chamadas à API Gemini em tempo de execução** | Chamadas à API Gemini com chave vinculada a projeto GCP com faturamento (Billing) ativado | Hibernação do container de preview quando inativo | O aplicativo **não consome LLM/Gemini API** durante o jogo (`server.ts` e `src/` não chamam `@google/genai`) | Ausência total de chamadas `GoogleGenAI` no código do jogo | Execução local `npm run dev` ou Docker na VM | `CONFIRMADO` (código local) |
| **GitHub (`edinhogrubert/Uno-KaWiHe`)** | Hospedagem do código-fonte Git e distribuição para `deploy.sh` | GitHub Free | `FREE_LIMITED` | `deploy.sh` (`REPO_URL`) | `2026-11-18` / Global | Repositório Git (< 50 MB) | Clone/Pull gratuito; GitHub Actions não é utilizado (0 minutos consumidos) | Ativar GitHub Actions pagos em repositório privado acima da cota ou GitHub LFS pago | Rate limit de clone anônimo em excesso extremo | Build é feito localmente na VM via `deploy.sh`, sem gastar minutos de GitHub Actions | `git status` / painel GitHub Billing | Repositório Git self-hosted / bundle tar.gz | `CONFIRMADO` |

---

## 4. Diretrizes Específicas — Oracle Cloud Always Free

Para garantir que a operação na Oracle Cloud permaneça permanentemente com **custo R$ 0,00 / US$ 0.00**:

### 4.1 Diferenciação entre Always Free, Free Trial e Serviços Pagos
1. **Free Trial (30 dias — `TRIAL_ONLY`):** Ao criar a conta, a Oracle concede créditos promocionais por 30 dias que permitem criar instâncias maiores. **PROIBIDO usar shapes fora do Always Free**, pois ao fim dos 30 dias esses recursos são desativados ou passam a ser cobrados caso a conta seja atualizada.
2. **Always Free (`FREE_LIMITED`):** Permanece gratuito por tempo indeterminado após os 30 dias iniciais, desde que respeitados os limites estritos abaixo:
   - **Região:** Válido **exclusivamente na Home Region** escolhida na criação da conta.
   - **Shapes de Computação Permitidos:**
     - `VM.Standard.E2.1.Micro` (AMD x86_64, 1/8 OCPU, 1 GB RAM) — até 2 instâncias.
     - `VM.Standard.A1.Flex` (ARM64 Ampere, até 4 OCPUs e 24 GB RAM somados entre todas as VMs A1 da conta).
   - **Armazenamento (Block Volume = Boot Volumes + Block Volumes adicionais):** Até **200 GB totais** somados na conta. Cada VM Ubuntu usa por padrão ~47 GB de Boot Volume. Nunca alocar volumes cuja soma passe de 200 GB.
   - **Backups de Volume na Nuvem OCI:** O Always Free inclui até 5 backups de volume gratuitos dentro da cota de armazenamento. Para evitar qualquer risco de ultrapassar a cota de armazenamento em nuvem, o Uno KaWiHe utiliza **backup local em arquivo compactado** (`./backup.sh` em `/opt/unokawihe/backups/`, ocupando < 5 MB) exportável via `scp`.
   - **Rede e Tráfego:** Até **10 TB de saída (outbound/egress) por mês**. O tráfego de WebSockets JSON e páginas estáticas do Uno KaWiHe consome poucos megabytes por dia (< 0,01% da franquia).
   - **Endereçamento IP:** 1 IPv4 público nas instâncias Always Free. **Atenção:** Criar um *Reserved Public IP* e deixá-lo **desanexado** (sem estar vinculado a uma instância rodando) em contas Pay-As-You-Go pode gerar cobrança por hora. Mantenha o IP sempre anexado à VM ativa ou use IP público efêmero + DuckDNS (`configdns.sh`).

### 4.2 Risco de Recolhimento por Ociosidade (*Idle Compute Reclamation*)
- **Regra da Oracle Cloud:** A Oracle pode recolher (*reclaim*) instâncias Always Free se, durante uma janela de 7 dias, o percentil 95 de uso de CPU, rede e memória (em shapes A1) ficar abaixo dos limiares mínimos da plataforma (~15%–20%).
- **Mitigação e Recuperação:**
  1. Manter os containers `uno-game` e `kawihe-auth` ativos (`restart: unless-stopped`).
  2. Manter backups atualizados de `./data/` fora da VM (`scp` para a máquina do proprietário).
  3. Caso uma instância seja recolhida pela Oracle, **nenhum custo é gerado** e a reconstrução completa leva menos de 10 minutos executando `./deploy.sh` + `./restore.sh` + `sudo ./configdns.sh` conforme `10_RECONSTRUCAO_COMPLETA.md`.

### 4.3 Contingência para Falta de Capacidade (`Out of Host Capacity`)
- Se a região não tiver disponibilidade imediata para `VM.Standard.A1.Flex` (ARM), o projeto está **100% homologado e otimizado para `VM.Standard.E2.1.Micro` (1 GB RAM)**:
  - `deploy.sh` cria automaticamente 2 GB de Swap na Etapa 1.
  - Os builds Docker são executados sequencialmente na Etapa 5.
  - O servidor Node.js roda em produção puro (`node --max-old-space-size=256 dist-server/server.mjs`) sem o peso do `tsx` ou `esbuild` em memória.

---

## 5. Free Tier Compliance Gate (Controle Obrigatório para Mudanças Futuras)

> **Nota de Transparência:** Este *Compliance Gate* é um **procedimento normativo documental obrigatório** na governança dos Agentes (`AGENTS.md`). Ele não é um bloqueador automatizado de billing na nuvem; portanto, **nenhum agente pode executá-lo superficialmente ou ignorar suas 7 perguntas**.

Antes de propor, instalar ou codificar qualquer nova dependência NPM, banco de dados, serviço externo, container adicional ou ferramenta de infraestrutura, o Agente deve preencher e apresentar ao Proprietário o checklist abaixo:

```text
FREE TIER COMPLIANCE GATE — CHECKLIST OBRIGATÓRIO
1. A solução pode gerar cobrança direta ou indireta? [SIM / NÃO + evidência]
2. Quais são as cotas gratuitas exatas do recurso? [Limites de CPU/RAM/Disco/Req]
3. O aplicativo Uno KaWiHe pode ultrapassá-las em uso normal ou pico (ex.: torneio com 32 jogadores / importação de 200 contas)? [Análise de capacidade]
4. Há mecanismo técnico confiável de prevenção no código (hard limit, rate limit, max payload, cap de memória)? [Qual arquivo/constante implementa?]
5. Como detectar aproximação dos limites antes de falha ou cobrança? [Endpoint/script de monitoramento]
6. Existe alternativa 100% local / self-hosted gratuita? [Se sim, priorizar a alternativa local]
7. O proprietário (edinho.grubert@gmail.com) autorizou expressamente a adoção? [SIM / PENDENTE]
```

**Regra de Bloqueio:** Se a resposta à pergunta 1 for `SIM` ou `DESCONHECIDO`, ou se a pergunta 7 estiver `PENDENTE` para qualquer serviço externo, **a implementação está bloqueada**.
