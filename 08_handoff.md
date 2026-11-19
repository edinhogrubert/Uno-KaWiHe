# 08 — Protocolo de passagem entre Agentes

| Metadado | Valor |
|---|---|
| **Finalidade** | Protocolo formal de passagem de turno (`HANDOFF`) entre Agentes de IA executores (Nível 4). |
| **Público-alvo** | Agentes de IA, Proprietário e Auditores. |
| **Status** | **NORMATIVO OPERACIONAL (Nível 2)** |
| **Fonte de Autoridade** | Subordinado ao Nível 0 (`edinho.grubert@gmail.com`) e Nível 1 (`AGENTS.md`). |
| **Versão / Commit / Data** | `v2.3.0` · Commit ref. `6d25e83` · Atualizado em `2026-11-18` |
| **Referências Relacionadas** | `AGENTS.md`, `04_status.md`, `07_historico.md`, `13_MATRIZ_RASTREABILIDADE.md`. |

Objetivo: qualquer Agente assume o projeto lendo os arquivos na raiz na ordem obrigatória de `AGENTS.md`, trabalha, e deixa tudo registrado para o próximo.

## Bloco HANDOFF
```
HANDOFF
tarefa: <o que foi pedido>
feito: <lista curta>
arquivos alterados: <caminhos>
regras alteradas/criadas: <IDs>
testes: <rodados? passaram/falharam, quantos>
divergências encontradas: <código x documentação>
regra Universal de Custo Zero (Free Tier): <respeitada?>
próximo passo sugerido: <1 item>
```

## Regras
- Respeito absoluto à Hierarquia Oficial de Autoridade (Níveis 0 a 4) e à Política Universal de Custo Zero (`/11_FREE_TIER_COMPLIANCE.md`).
- Nunca introduzir dependências ou serviços pagos (`PAID` ou `TRIAL_ONLY`).

## Último registro
```
HANDOFF
tarefa: MISSÃO OFICIAL — Governança, Auditoria Documental, Reconstrução do Zero (28 etapas), Política Universal de Custo Zero e Matriz de Rastreabilidade do Uno KaWiHe (v2.3.0) — exclusivamente documental, sem alterar código funcional
feito:
  - Executada pré-checagem obrigatória do ambiente (permissões de escrita confirmadas, ausência de diretório .git no container AI Studio registrada, commit de referência 6d25e83 de edinhogrubert/Uno-KaWiHe documentado)
  - Criado /10_RECONSTRUCAO_COMPLETA.md com todas as 28 etapas reproduzíveis (Objetivo, Pré-requisitos, Comando exato, Local de execução, Resultado esperado, Validação, Erros conhecidos, Recuperação, Riscos de segurança e Riscos de cobrança) + 10 critérios objetivos de conclusão
  - Criado /11_FREE_TIER_COMPLIANCE.md com Política Universal de Custo Zero, 6 classificações (FREE_VERIFIED, FREE_LIMITED, SELF_HOSTED_FREE, UNKNOWN_COST, TRIAL_ONLY, PAID), matriz de 10 serviços, regras Oracle Cloud Always Free e Free Tier Compliance Gate (7 perguntas)
  - Criado /12_OPERACAO_E_RECUPERACAO.md com operação diária, arquitetura de atomicWriteFileSync (temp + fsyncSync + renameSync), lock em 2 camadas (withDataLock + data/.kawihe.lock), reconciliação WAL (reconcileIncompleteImportBatches), política de backup/restore e 5 runbooks de Disaster Recovery
  - Criado /13_MATRIZ_RASTREABILIDADE.md com taxonomia de evidências (CONFIRMADO, DECLARADO, PROPOSTO, DIVERGENTE, DESCONHECIDO), matriz requisitos x casos de uso x código x rotas x 126 testes, inventário completo e registro de 6 divergências auditadas (DIV-01 a DIV-06)
  - Atualizados /AGENTS.md (Constituição de Nível 1 com autoridade subordinada ao Nível 0 edinho.grubert@gmail.com, Hierarquia Níveis 0-4, Regra de Conflitos e índice dos 22 documentos), /00_visao.md a /09_prompts.md e /README.md com blocos de metadados normativos e alinhamento de DIV-02 (suporte a doubles por pares consecutivos em importService.ts) e data/tournament_audit.json
arquivos alterados: AGENTS.md, 00_visao.md, 01_casos_de_uso.md, 02_regras.md, 03_arquitetura.md, 04_status.md, 05_adr.md, 06_testes.md, 07_historico.md, 08_handoff.md, 09_prompts.md, 10_RECONSTRUCAO_COMPLETA.md (novo), 11_FREE_TIER_COMPLIANCE.md (novo), 12_OPERACAO_E_RECUPERACAO.md (novo), 13_MATRIZ_RASTREABILIDADE.md (novo), README.md
regras alteradas/criadas: REG-FREE-01 (expandida para escopo global universal), REG-IMP-03 (alinhada à evidência CONFIRMADO de suporte a doubles por pares consecutivos com ODD_ROW_COUNT_DOUBLES)
testes: npm test (126/126 passando em 12 suítes), npm run lint (tsc --noEmit OK) e compile_applet executados sem falhas; zero arquivos de código alterados
divergências encontradas: 6 registradas e classificadas em /13_MATRIZ_RASTREABILIDADE.md (DIV-01: diretório /var/log/caddy no Caddy manual vs configdns.sh; DIV-02: importService.ts já suporta torneios doubles por pares consecutivos; DIV-03: data/tournament_audit.json omitido nos resumos anteriores; DIV-04: repositório legado wgruberts-jpg em scripts/deploy.sh secundário; DIV-05: cap de 4 jogadores no motor vs até 8 previsto em contrato futuro; DIV-06: ausência de .git no container AI Studio)
regra Universal de Custo Zero (Free Tier): respeitada integralmente (100% gratuito em todo o ecossistema)
próximo passo sugerido: exportar/commitar os 22 documentos no branch main do repositório oficial https://github.com/edinhogrubert/Uno-KaWiHe
```


