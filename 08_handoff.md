# 08 — Protocolo de passagem entre Agentes

Objetivo: qualquer Agente assume o projeto lendo os arquivos na raiz, trabalha, e deixa tudo registrado para o próximo.

## Bloco HANDOFF
```
HANDOFF
tarefa: <o que foi pedido>
feito: <lista curta>
arquivos alterados: <caminhos>
regras alteradas/criadas: <IDs>
testes: <rodados? passaram/falharam, quantos>
divergências encontradas: <código x documentação>
regra AI Studio Free Tier: <respeitada?>
próximo passo sugerido: <1 item>
```

## Regras
- Respeito absoluto ao ambiente AI Studio e uso gratuito (Free Tier).
- Nunca introduzir dependências ou serviços pagos.

## Último registro
```
HANDOFF
tarefa: corrigir desconexão real de sessão, melhorar Painel Central Admin, corrigir mensagens diretas, criar configdns.sh e implementar versionamento explícito (v2.3.0) com histórico resumido visível e validação no deploy
feito:
  - Revogação real de sessão pelo Admin: sessionVersion em UserRecord/JWT (server/authService.ts e auth-service/server.ts), fechamento WS 4001 + evento session_revoked em server.ts e logout forçado imediato sem auto-reconexão em App.tsx/LoginScreen.tsx
  - Versionamento v2.3.0: fonte única em src/utils/versionHistory.ts, endpoint GET /api/version, ChangelogModal.tsx com checagem de sincronização Cliente × Servidor, selos clicáveis em LoginScreen, Lobby e AdminRoomsModal (aba Sistema & Auditoria) e validação LIVE_VERSION == APP_PKG_VERSION na Etapa 6 do deploy.sh
  - Painel Central Admin (AdminRoomsModal.tsx): abertura do PlayerReportModal por usuário, filtros, suspensão/reativação inline, limpeza de salas sem humanos e correção da leitura de /api/admin/vm-metrics
  - Adicionados testes em tests/sessionRevocation.test.ts cobrindo revogação de sessão + /api/version
arquivos alterados: package.json, deploy.sh, server.ts, server/authService.ts, auth-service/server.ts, src/types/uno.ts, src/App.tsx, src/utils/versionHistory.ts, src/components/ChangelogModal.tsx, src/components/LoginScreen.tsx, src/components/Lobby.tsx, src/components/AdminRoomsModal.tsx, tests/sessionRevocation.test.ts, 04_status.md, 07_historico.md, 08_handoff.md
regras alteradas/criadas: nenhuma alteração de regra de jogo; reforçada auditoria e controle de sessão
testes: npm test (126/126 em 12 suítes passando), tsc --noEmit, vite build e bash -n deploy.sh verdes
divergências encontradas: AdminRoomsModal lia parsedVm.data.metrics inexistente (corrigido para parsedVm.data.metrics || parsedVm.data)
regra AI Studio Free Tier: respeitada (100% gratuito/local, zero serviços externos pagos)
próximo passo sugerido: enviar commit para edinhogrubert/Uno-KaWiHe (main) e executar deploy.sh na VM confirmando v2.3.0 na Etapa 6 e nos selos do aplicativo
```

