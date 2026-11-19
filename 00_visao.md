# 00 — Visão

| Metadado | Valor |
|---|---|
| **Finalidade** | Definir propósito, público-alvo, objetivos, limites de escopo e princípios de produto do Uno KaWiHe. |
| **Público-alvo** | Proprietário, Agentes de IA, Desenvolvedores e Operadores. |
| **Status** | **NORMATIVO (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Revisado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `01_casos_de_uso.md`, `02_regras.md`, `11_FREE_TIER_COMPLIANCE.md`. |

## Propósito
Plataforma de UNO online para jogar em família, segura para crianças, operando estritamente sob a **Política Universal de Custo Zero (100% Free Tier Global)** — tanto no ambiente Google AI Studio quanto em execução autônoma via Docker/VM (Oracle Cloud Always Free, DuckDNS, Caddy/Let's Encrypt) — sem depender de serviços externos pagos.

## Público
- Famílias e crianças (prioridade: Modo Kids).
- Grupos pequenos e torneios familiares/comunitários (2 a 4 jogadores por mesa; modo Duplas 2v2; o contrato prevê até 8 em salas casuais).

## Objetivos
1. Jogo fiel às regras do UNO, com opções configuráveis por sala e modo Duplas 2v2.
2. Experiência simples para crianças (Modo Kids, UNO automático, interface clara).
3. Segurança: servidor autoritativo, mãos privadas, identidade ligada ao socket e revogação real de sessão (`sessionVersion`).
4. Conversa em tempo real (chat e voz P2P WebRTC) com controles para responsáveis.
5. Operável por uma pessoa com custo zero: deploy simples em Node.js/Docker, dados em JSON local atômico (`./data/`), backup local e HTTPS gratuito.

## Fora do escopo
- App nativo pago, ranking global comercial, serviços em nuvem pagos, bancos de dados relacionais gerenciados cobrados, servidores de mídia/TURN comerciais ou períodos de teste (`TRIAL_ONLY`) com conversão em cobrança.

## Princípios de produto
- Preservar o comportamento que já funciona antes de inventar novo.
- Segurança, privacidade e integridade acima de conveniência.
- Respeito absoluto à Política Universal de Custo Zero (`/11_FREE_TIER_COMPLIANCE.md`).

