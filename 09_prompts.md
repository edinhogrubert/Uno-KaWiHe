# 09 — Prompts prontos

| Metadado | Valor |
|---|---|
| **Finalidade** | Biblioteca de prompts padronizados para auditoria, execução de tarefas e reconstrução do Uno KaWiHe. |
| **Público-alvo** | Proprietário (`edinho.grubert@gmail.com`) e Operadores ao acionar novos Agentes de IA. |
| **Status** | **INFORMATIVO OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `10_RECONSTRUCAO_COMPLETA.md`, `11_FREE_TIER_COMPLIANCE.md`, `13_MATRIZ_RASTREABILIDADE.md`. |

## P1 — Auditoria do estado real (Somente Leitura)
```
Você é auditor técnico do projeto Uno KaWiHe (v2.3.0). NÃO altere nenhum arquivo.
1. Leia AGENTS.md, 11_FREE_TIER_COMPLIANCE.md, 02_regras.md, 04_status.md e 13_MATRIZ_RASTREABILIDADE.md.
2. Execute npm test (126 testes em 12 suítes) e npm run lint.
3. Verifique se todas as dependências, scripts e configurações respeitam a Política Universal de Custo Zero (Free Tier Compliance Gate) e reporte qualquer divergência com evidências (CONFIRMADO, DECLARADO, PROPOSTO, DIVERGENTE, DESCONHECIDO).
```

## P2 — Tarefa padrão de implementação
```
Projeto Uno KaWiHe (repositório oficial: edinhogrubert/Uno-KaWiHe, autoridade Nível 0: edinho.grubert@gmail.com).
1. Leia AGENTS.md, 11_FREE_TIER_COMPLIANCE.md, 02_regras.md e 04_status.md.
2. Tarefa: <descrição objetiva>
3. Restrições: Respeito estrito à Política Universal de Custo Zero (NADA PAGO ou TRIAL_ONLY) e à Regra de Conflitos de AGENTS.md. Não refatore fora do escopo. Se houver mudança funcional, incremente a versão em package.json, deploy.sh e src/utils/versionHistory.ts.
4. Ao terminar: valide npm test (126+ testes), npm run lint e npm run build, atualize 04_status.md, 07_historico.md e 13_MATRIZ_RASTREABILIDADE.md, e responda no formato HANDOFF de 08_handoff.md.
```

## P3 — Reconstrução do Zero / Disaster Recovery
```
Cenário de Disaster Recovery do Uno KaWiHe.
1. Leia AGENTS.md, 10_RECONSTRUCAO_COMPLETA.md, 11_FREE_TIER_COMPLIANCE.md e 12_OPERACAO_E_RECUPERACAO.md.
2. Siga estritamente as 28 etapas de 10_RECONSTRUCAO_COMPLETA.md distinguindo comandos de verificação local e comandos de execução na VM.
3. Valide todos os 10 critérios objetivos de conclusão antes de declarar o ambiente recuperado.
```

