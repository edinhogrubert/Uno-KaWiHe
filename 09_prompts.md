# 09 — Prompts prontos

| Metadado | Valor |
|---|---|
| **Finalidade** | Biblioteca de prompts padronizados para auditoria, execução de tarefas e reconstrução do Uno KaWiHe. |
| **Público-alvo** | Proprietário (**quem digita diretamente aqui no chat**; ref. `edinho.grubert@gmail.com`) e Operadores ao acionar novos Agentes de IA. |
| **Status** | **INFORMATIVO OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (**quem digita diretamente aqui no chat**) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `10_RECONSTRUCAO_COMPLETA.md`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`, `14_CONFIABILIDADE_IA.md`, `15_FUTURAS_FUNCIONALIDADES.md`. |

## P1 — Auditoria Adversarial do estado real (Somente Leitura)
```
Você é Agente Auditor Independente do projeto Uno KaWiHe (v2.3.0). Autoridade máxima (Nível 0): quem digita diretamente aqui no chat. NÃO altere nenhum arquivo.
1. Execute o Ritual de Início de Conversa (10 passos) de 14_CONFIABILIDADE_IA.md lendo AGENTS.md, 14_CONFIABILIDADE_IA.md, 11_FREE_TIER_COMPLIANCE.md, 02_regras.md, 04_status.md, 08_handoff.md e 13_MATRIZ_RASTREABILIDADE.md.
2. Execute npm test (126 testes em 12 suítes) e npm run lint.
3. Aplique o protocolo de Auditoria Adversarial (9 perguntas de 14_CONFIABILIDADE_IA.md) e o Free Tier Compliance Gate (7 perguntas de 11_FREE_TIER_COMPLIANCE.md), classificando cada achado exclusivamente com os 7 estados oficiais (VERIFICADO, DOCUMENTADO, RELATADO, INFERIDO, PROPOSTO, DESCONHECIDO, CONTRADITÓRIO).
```

## P2 — Tarefa padrão de implementação
```
Projeto Uno KaWiHe (repositório oficial: edinhogrubert/Uno-KaWiHe, autoridade máxima Nível 0: quem digita diretamente aqui no chat).
1. Execute o Ritual de 10 Passos de 14_CONFIABILIDADE_IA.md e leia AGENTS.md, 11_FREE_TIER_COMPLIANCE.md, 02_regras.md, 04_status.md e 08_handoff.md.
2. Tarefa: <descrição objetiva>
3. Restrições: Respeito estrito à Política Universal de Custo Zero (NADA PAGO ou TRIAL_ONLY), à Contestação Técnica Independente (P4 de 14_CONFIABILIDADE_IA.md) e à Regra de Conflitos de AGENTS.md. Não refatore fora do escopo. Se houver mudança funcional autorizada, incremente a versão em package.json, deploy.sh e src/utils/versionHistory.ts.
4. Ao terminar: valide npm test (126+ testes), npm run lint e npm run build, atualize 04_status.md, 07_historico.md e 13_MATRIZ_RASTREABILIDADE.md, e entregue o bloco HANDOFF nas 8 seções obrigatórias de 08_handoff.md.
```

## P3 — Reconstrução do Zero / Disaster Recovery
```
Cenário de Disaster Recovery do Uno KaWiHe (autoridade máxima Nível 0: quem digita diretamente aqui no chat).
1. Leia AGENTS.md, 14_CONFIABILIDADE_IA.md, 10_RECONSTRUCAO_COMPLETA.md, 11_FREE_TIER_COMPLIANCE.md e 12_OPERACAO_E_RECUPERACAO.md.
2. Siga estritamente as 28 etapas de 10_RECONSTRUCAO_COMPLETA.md distinguindo comandos VERIFICADO localmente e comandos DOCUMENTADO para execução na VM.
3. Valide todos os 10 critérios objetivos de conclusão antes de declarar o ambiente recuperado.
```

