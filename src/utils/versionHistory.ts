export interface ReleaseHistoryEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const APP_VERSION = '2.3.0';
export const APP_RELEASE_DATE = '2026-11-18';

export const RELEASE_HISTORY: ReleaseHistoryEntry[] = [
  {
    version: '2.3.0',
    date: '2026-11-18',
    title: 'Versionamento Visível, Desconexão Real de Sessão & Painel Admin Centralizado',
    highlights: [
      'Versionamento visível na Tela de Login, Lobby, Painel Admin e /api/version com histórico resumido e verificação no deploy.sh.',
      'Desconexão real de sessão pelo Admin: revogação de JWT via sessionVersion, WebSocket 4001/session_revoked sem reconexão automática e bloqueio imediato de entrada em jogos.',
      'Painel Central Admin aprimorado: clique em qualquer usuário (aba Usuários ou Salas) abre o Relatório Diagnóstico; filtros rápidos, suspensão/reativação inline, limpeza de salas sem humanos, envio direto na aba Mensagens e nova aba Sistema & Auditoria.',
      'Correção das mensagens diretas do Admin para jogadores no Lobby/Sala (resolução por authenticatedUserId, banner z-[90] de 15s e retorno de erro se offline).',
      'Deploy oficial migrado para edinhogrubert/Uno-KaWiHe e criação do configdns.sh para DuckDNS + HTTPS via Caddy.',
    ],
  },
  {
    version: '2.2.3',
    date: '2026-11-17',
    title: 'Importador em Massa, Endurecimento JWT/WAL & Ciclo de Vida de Torneios',
    highlights: [
      'Importador de usuários em massa (CSV/colagem até 200 registros) com bcrypt em Worker Thread, WAL (data/import_batches.json) e reconciliação automática no boot.',
      'Endurecimento de segurança: JWT estrito nas rotas de torneio e importação, remoção de fallback ADMIN_PIN no login e rate limiting por conta e IP.',
      'Encerramento seguro de torneios preservando histórico e limpeza exclusiva de contas temporárias com desafio matemático.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-11-15',
    title: 'Torneios Individual & Duplas 2v2, W.O. Seguro & Monitor de VM',
    highlights: [
      'Modo Duplas 2v2 (team_2v2) com assentos alternados, visão das cartas do parceiro e proteção contra fogo amigo.',
      'Sistema completo de Torneios (Md1/Md3/Md5, desempate e remoção por W.O. preservando as 108 cartas do baralho).',
      'Monitor de métricas da VM em tempo real (/api/admin/vm-metrics) e relatório diagnóstico por jogador.',
    ],
  },
];
