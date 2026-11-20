# 08 — Protocolo de Passagem Entre Agentes (`HANDOFF`)

| Metadado | Valor |
|---|---|
| **Finalidade** | Protocolo único e obrigatório de transferência de contexto (`HANDOFF`) entre Agentes de IA (Nível 4). |
| **Público-alvo** | Proprietário / Operador no chat (Nível 0), Agentes de IA (Coordenador, Implementador, Auditor Independente). |
| **Status** | **NORMATIVO OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado à **Autoridade Máxima de quem digita aqui no chat (Nível 0 — Proprietário / Operador ativo; ref. `edinho.grubert@gmail.com`)** e ao Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-20` |
| **Referências Relacionadas** | `AGENTS.md`, `04_status.md`, `13_MATRIZ_RASTREABILIDADE.md`, `14_CONFIABILIDADE_IA.md`, `15_FUTURAS_FUNCIONALIDADES.md`. |

> **Regra de Revalidação (`14_CONFIABILIDADE_IA.md`):** O handoff é uma referência temporal vinculada ao commit/versão, e **não uma verdade permanente**. Todo agente receptor deve revalidar o estado dos arquivos e testes antes de agir.

---

## Modelo Único e Obrigatório de `HANDOFF` (8 Seções)

```markdown
### 1. Identidade
- Repositório:
- Branch:
- Commit de referência:
- Versão do sistema:
- Data e ambiente observado:

### 2. Autoridade
- Autoridade Máxima (Nível 0): Quem digita diretamente no chat (Proprietário / Operador ativo; ref. cadastral edinho.grubert@gmail.com)
- Tarefa autorizada:
- Limites da missão:
- Política Universal de Custo Zero:

### 3. Estado Verificado (`VERIFICADO`)
- Funcionalidades verificadas:
- Testes executados:
- Evidências primárias:
- Ambiente observado:

### 4. Estado Não Verificado (`DOCUMENTADO` / `RELATADO` / `INFERIDO` / `PROPOSTO` / `DESCONHECIDO` / `CONTRADITÓRIO`)
- Declarações documentais (`DOCUMENTADO`):
- Relatos (`RELATADO`):
- Inferências (`INFERIDO`):
- Hipóteses / Propostas (`PROPOSTO` / `DESCONHECIDO`):
- Contradições (`CONTRADITÓRIO`):

### 5. Trabalho Realizado
- Alterações efetuadas:
- Arquivos criados / atualizados:
- Commits produzidos:
- Contratos afetados:

### 6. Não Executado
- Testes pendentes:
- Verificações ausentes:
- Ações não realizadas (e motivo):

### 7. Riscos
- Segurança:
- Dados:
- Custos:
- Infraestrutura:

### 8. Próximo Passo
- Objetivo:
- Pré-condições:
- Critérios de aceitação:
```

---

## Último Registro Oficial de Handoff (`v2.3.0`)

### 1. Identidade
- **Repositório:** `https://github.com/edinhogrubert/Uno-KaWiHe`
- **Branch:** `main`
- **Commit de referência:** `6d25e83` (`RELATADO` nos logs de deploy da VM; container local do AI Studio não possui diretório `.git` montado — `VERIFICADO`).
- **Versão do sistema:** `v2.3.0` (`VERIFICADO` em `package.json`, `src/utils/versionHistory.ts` e `deploy.sh`).
- **Data e ambiente observado:** `2026-11-20` · Container Linux AI Studio (`/app/applet`, Node.js v22, `WRITABLE`, sem `.git` local).

### 2. Autoridade
- **Autoridade Máxima (Nível 0):** **Aquele que digita aqui diretamente no chat** (Proprietário / Operador humano ativo da sessão; referência cadastral do projeto: `edinho.grubert@gmail.com`).
- **Tarefa autorizada:** Inclusão e especificação técnica completa do **Projeto Sentinel KaWiHe (`FUT-RES-02`)** — Resiliência, Aprendizado de Capacidade e Recuperação Distribuída Ordenada — no catálogo `/15_FUTURAS_FUNCIONALIDADES.md`, mantendo o código funcional inalterado.
- **Limites da missão:** Exclusivamente documental em `/15_FUTURAS_FUNCIONALIDADES.md` e `/08_handoff.md`; zero alterações em código `.ts`/`.tsx` ou scripts de produção.
- **Política Universal de Custo Zero:** 100% respeitada (`11_FREE_TIER_COMPLIANCE.md` — `SELF_HOSTED_FREE` na 2ª VM `VM.Standard.E2.1.Micro` da franquia Oracle Cloud Always Free).

### 3. Estado Verificado (`VERIFICADO`)
- **Funcionalidades verificadas no código-fonte (`v2.3.0`):** Motor UNO 108 cartas (`server/unoEngine.ts`), Modo Kids, Modo Duplas 2v2 (`team_2v2`), Torneios Individual e Duplas (`server/tournamentEngine.ts`), Ciclo de vida admin e limpeza segura de temporários com desafio matemático e `data/tournament_audit.json` (`server/tournamentCleanupService.ts`), Importador em massa com Worker bcrypt, lock `data/.kawihe.lock`, WAL e suporte a `doubles` por pares consecutivos (`server/importService.ts`), Revogação real de sessão via `sessionVersion` + close `4001` (`server/authService.ts`, `auth-service/server.ts`, `server.ts`, `src/App.tsx`), Versionamento visível (`src/utils/versionHistory.ts`, `ChangelogModal.tsx`, `GET /api/version`).
- **Testes executados:**
  - `npm test` (Vitest): **12 suítes aprovadas, 126/126 testes passando**.
  - `npm run lint` (`tsc --noEmit`): **0 erros de tipagem**.
  - `compile_applet` (`vite build`): **Compilação de produção concluída com sucesso**.
- **Evidências primárias:** Leitura e atualização verificada de `/15_FUTURAS_FUNCIONALIDADES.md` e `/08_handoff.md`.
- **Ambiente observado:** Diretório `/app/applet` gravável, zero arquivos de código funcional alterados.

### 4. Estado Não Verificado (`DOCUMENTADO` / `RELATADO` / `INFERIDO` / `PROPOSTO` / `DESCONHECIDO` / `CONTRADITÓRIO`)
- **Declarações documentais (`DOCUMENTADO`):** Cotas comerciais do Oracle Cloud Always Free (até 2 VMs `VM.Standard.E2.1.Micro` e 200 GB Block Volume total), DuckDNS, Let's Encrypt e Cloudflare em `11_FREE_TIER_COMPLIANCE.md`; runbooks de DR em nova VM (`10_RECONSTRUCAO_COMPLETA.md` e `12_OPERACAO_E_RECUPERACAO.md`).
- **Relatos (`RELATADO`):** Hash do commit `6d25e83` na VM e logs anteriores do `journalctl -u caddy` enviados pelo proprietário no chat.
- **Inferências (`INFERIDO`):** Capacidade da 2ª VM Always Free de 1 GB RAM hospedar o microserviço `sentinel-service` ($< 80\text{ MB}$ RAM) com folga operacional.
- **Hipóteses / Propostas (`PROPOSTO` / `DESCONHECIDO`):** Os 12 itens de evolução futura em `15_FUTURAS_FUNCIONALIDADES.md` — incluindo o novo Eixo 5 **`FUT-RES-02` (Projeto Sentinel KaWiHe)** — são estritamente `PROPOSTO`; o estado ao vivo do painel externo da Oracle Cloud é `DESCONHECIDO` a partir deste container.
- **Contradições (`CONTRADITÓRIO`):**
  - `DIV-02`: Contrato antigo afirmava bloqueio de `doubles` no importador, mas `server/importService.ts` já suporta `doubles` por pares consecutivos (`VERIFICADO` no código, sincronizado na documentação).
  - `DIV-04`: `/deploy.sh` da raiz usa `edinhogrubert/Uno-KaWiHe.git`, enquanto `/scripts/deploy.sh` secundário ainda possui fallback `wgruberts-jpg` (preservado sem alterar script por restrição da missão documental; registrado para usar `/deploy.sh` da raiz).

### 5. Trabalho Realizado
- **Alterações efetuadas:** Estruturado e especificado o **Eixo 5 — Projeto Sentinel KaWiHe (`FUT-RES-02`)** em `/15_FUTURAS_FUNCIONALIDADES.md` contendo: Princípio Arquitetural (`REG-RES-SENTINEL-01`), os 7 Pilares, o Fluxo Operacional em 3 Fases (Antes, Durante e Após a Falha com `RecoverySessionTicket` assinado, `admissionLedger`, `recoveryEpoch`, `active_rooms_snapshot.json` em modo `PAUSED_RECOVERY` e reconexão por Conjunto Lógico de mesa), Ciclo de 8 Etapas, Matriz de Proteções Arquiteturais (incluindo fallback *Fail-Safe* caso o próprio Sentinel fique indisponível) e Plano de Implementação Gradual em 4 Fases (Fases A a D).
- **Arquivos criados / atualizados:** `/15_FUTURAS_FUNCIONALIDADES.md`, `/08_handoff.md`.
- **Commits produzidos:** Nenhum commit local pôde ser criado porque o container AI Studio não possui `.git` montado (`DIV-06`).
- **Contratos afetados:** `/15_FUTURAS_FUNCIONALIDADES.md` (`PROPOSTO`), `/08_handoff.md`.

### 6. Não Executado
- **Testes pendentes:** Simulado prático de reconstrução completa em uma nova VM Oracle Cloud limpa (classificado como `DOCUMENTADO`) e futura suíte `tests/sentinelRecovery.test.ts` (prevista para a Fase A de `FUT-RES-02`).
- **Verificações ausentes:** `git push origin main` direto do container (impossibilitado pela ausência de `.git` no container AI Studio).
- **Ações não realizadas (e motivo):** Nenhuma alteração em código `.ts`/`.tsx` foi executada, pois o Nível 0 determinou que o Projeto Sentinel KaWiHe deve primeiramente ser registrado e especificado em `/15_FUTURAS_FUNCIONALIDADES.md`.

### 7. Riscos
- **Segurança:** Na futura implementação de `FUT-RES-02`, o número de fila nunca deve ser confiado ao navegador em texto puro; o uso do `RecoverySessionTicket` assinado via HMAC/JWT + `recoveryEpoch` é obrigatório.
- **Dados:** Para que recuperar a sessão também recupere a partida, o snapshot `data/active_rooms_snapshot.json` deverá respeitar `atomicWriteFileSync` e o invariante das 108 cartas (`REG-BAR-01`).
- **Custos:** Risco zero (`R$ 0,00`) desde que o Sentinel utilize a 2ª VM `VM.Standard.E2.1.Micro` dentro do limite gratuito da Oracle Cloud Always Free (`11_FREE_TIER_COMPLIANCE.md`).
- **Infraestrutura:** Caso o Sentinel fique inacessível, o servidor principal do KaWiHe deve obrigatoriamente operar em Modo Autônomo Conservador (*Fail-Safe*), nunca liberando admissões ilimitadas.

### 8. Próximo Passo
- **Objetivo:** Aguardar deliberação de quem digita aqui no chat (Nível 0) para iniciar a **Fase A de `FUT-RES-02`** (contratos TypeScript e simulador/testes de recuperação `tests/sentinelRecovery.test.ts`) ou outra funcionalidade priorizada em `/15_FUTURAS_FUNCIONALIDADES.md`.
- **Pré-condições:** Autorização expressa do Nível 0 no chat.
- **Critérios de aceitação:** `npm test`, `npm run lint` e `npm run build` 100% aprovados.
