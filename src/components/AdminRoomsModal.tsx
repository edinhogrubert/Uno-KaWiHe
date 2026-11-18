import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminRoomSummary, AdminUserSummary, AdminAuditEntry, UserProfile, UserAccountStatus } from '../types/uno.js';
import { auth } from '../services/auth.js';
import { parseJsonSafe } from '../utils/http.js';
import { AdminImportPanel } from './AdminImportPanel.js';
import { AdminImportHistoryPanel } from './AdminImportHistoryPanel.js';
import { PlayerReportModal } from './PlayerReportModal.js';
import {
  ShieldAlert,
  Users,
  X,
  RefreshCw,
  Trash2,
  RotateCcw,
  UserX,
  Megaphone,
  Clock,
  Bot,
  Crown,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  User,
  Shield,
  Activity,
  Layers,
  KeyRound,
  Plus,
  Key,
  Search,
  Upload,
  History,
  FileBarChart2,
  Ban,
  Check,
  Server,
  Download,
  Sparkles,
  Cpu,
  HardDrive
} from 'lucide-react';

interface AdminRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onJoinRoomAsAdmin?: (roomId: string) => void;
  onWatchRoom?: (roomId: string, revealCards?: boolean) => void;
  ws?: WebSocket | null;
  initialTab?: 'rooms' | 'users' | 'messages' | 'import' | 'import_history' | 'system';
}

export const AdminRoomsModal: React.FC<AdminRoomsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onJoinRoomAsAdmin,
  onWatchRoom,
  ws,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'messages' | 'import' | 'import_history' | 'system'>(initialTab || 'rooms');
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'temporary' | 'inactive' | 'admin'>('all');
  const [inspectedTarget, setInspectedTarget] = useState<{
    id: string;
    name: string;
    avatar?: string;
    username?: string;
    roomId?: string | null;
  } | null>(null);
  const [auditEntries, setAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [systemSummary, setSystemSummary] = useState<{
    cpuPercent?: number;
    ramUsedPercent?: number;
    ramUsedMb?: number;
    ramTotalMb?: number;
    swapUsedMb?: number;
    swapTotalMb?: number;
    eventLoopLagMs?: number;
    uptimeSeconds?: number;
    authServiceStatus?: string;
    totalGamesPlayed?: number;
    activeInvitesCount?: number;
  } | null>(null);
  const [isCleaningEmptyRooms, setIsCleaningEmptyRooms] = useState(false);
  const [confirmToggleStatusUser, setConfirmToggleStatusUser] = useState<{
    id: string;
    username: string;
    nextStatus: UserAccountStatus;
  } | null>(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Confirmation Modals State (avoid window.confirm)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; username: string } | null>(null);
  const [confirmCloseRoomId, setConfirmCloseRoomId] = useState<string | null>(null);
  const [confirmKickPlayer, setConfirmKickPlayer] = useState<{ roomId: string; playerId: string; playerName: string } | null>(null);

  // Create User Form States
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🦸‍♂️');
  const [newRole, setNewRole] = useState<'player' | 'admin'>('player');
  const [newIsTemporary, setNewIsTemporary] = useState(false);
  const [newTemporaryTournamentId, setNewTemporaryTournamentId] = useState('');
  const [openTournaments, setOpenTournaments] = useState<Array<{ config: { id: string; name: string }; status: string }>>([]);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Reset Password States
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Message Sending States
  const [messageTargetRoom, setMessageTargetRoom] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Inline room quick message state
  const [quickMsgRoomId, setQuickMsgRoomId] = useState<string | null>(null);
  const [quickMsgText, setQuickMsgText] = useState('');

  const fetchAdminData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isMountedRef.current) setIsLoading(true);

    try {
      const token = auth.getToken() || localStorage.getItem('kawihe_auth_token') || '';
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [roomsResult, usersResult, tournamentsResult] = await Promise.allSettled([
        fetch('/api/admin/rooms', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/tournaments', { headers }),
      ]);

      let nextPollError: string | null = null;

      if (roomsResult.status === 'fulfilled') {
        const parsedRooms = await parseJsonSafe<{ success?: boolean; rooms?: AdminRoomSummary[]; error?: string }>(
          roomsResult.value
        );
        if (parsedRooms.ok && parsedRooms.isJson && parsedRooms.data?.success && Array.isArray(parsedRooms.data.rooms)) {
          if (isMountedRef.current) setRooms(parsedRooms.data.rooms);
        } else {
          nextPollError = parsedRooms.error || 'Não foi possível atualizar a lista de salas.';
        }
      } else {
        nextPollError = 'Conexão temporariamente indisponível ao buscar salas.';
      }

      if (usersResult.status === 'fulfilled') {
        const parsedUsers = await parseJsonSafe<{ success?: boolean; users?: AdminUserSummary[]; error?: string }>(
          usersResult.value
        );
        if (parsedUsers.ok && parsedUsers.isJson && parsedUsers.data?.success && Array.isArray(parsedUsers.data.users)) {
          if (isMountedRef.current) setUsers(parsedUsers.data.users);
        } else if (!nextPollError) {
          nextPollError = parsedUsers.error || 'Não foi possível atualizar a lista de usuários.';
        }
      } else if (!nextPollError) {
        nextPollError = 'Conexão temporariamente indisponível ao buscar usuários.';
      }

      if (tournamentsResult.status === 'fulfilled') {
        const parsedTourns = await parseJsonSafe<{
          success?: boolean;
          tournaments?: Array<{ config: { id: string; name: string }; status: string }>;
        }>(tournamentsResult.value);
        if (parsedTourns.ok && parsedTourns.isJson && parsedTourns.data?.success && Array.isArray(parsedTourns.data.tournaments)) {
          if (isMountedRef.current) {
            setOpenTournaments(
              parsedTourns.data.tournaments.filter((t) => ['registration', 'rescheduled'].includes(t.status))
            );
          }
        }
      }

      // Fetch audit log & lightweight system snapshot
      const [auditResult, vmResult, cliResult] = await Promise.allSettled([
        fetch('/api/admin/audit-log', { headers }),
        fetch('/api/admin/vm-metrics', { headers }),
        fetch('/api/admin/cli-status', { headers }),
      ]);

      if (auditResult.status === 'fulfilled') {
        const parsedAudit = await parseJsonSafe<{ success?: boolean; entries?: AdminAuditEntry[] }>(auditResult.value);
        if (parsedAudit.ok && parsedAudit.isJson && parsedAudit.data?.success && Array.isArray(parsedAudit.data.entries)) {
          if (isMountedRef.current) setAuditEntries(parsedAudit.data.entries);
        }
      }

      let nextSys: typeof systemSummary = {};
      if (vmResult.status === 'fulfilled') {
        const parsedVm = await parseJsonSafe<any>(vmResult.value);
        if (parsedVm.ok && parsedVm.isJson && parsedVm.data?.success && parsedVm.data.metrics) {
          const m = parsedVm.data.metrics;
          nextSys = {
            ...nextSys,
            cpuPercent: m.cpu?.percent,
            ramUsedPercent: m.memory?.usedPercent,
            ramUsedMb: m.memory?.usedBytes ? Math.round(m.memory.usedBytes / 1048576) : undefined,
            ramTotalMb: m.memory?.totalBytes ? Math.round(m.memory.totalBytes / 1048576) : undefined,
            swapUsedMb: m.memory?.swapUsedBytes ? Math.round(m.memory.swapUsedBytes / 1048576) : undefined,
            swapTotalMb: m.memory?.swapTotalBytes ? Math.round(m.memory.swapTotalBytes / 1048576) : undefined,
            eventLoopLagMs: m.node?.eventLoopLagMs,
            uptimeSeconds: m.node?.uptimeSeconds,
            authServiceStatus: m.app?.authServiceStatus,
          };
        }
      }
      if (cliResult.status === 'fulfilled') {
        const parsedCli = await parseJsonSafe<any>(cliResult.value);
        if (parsedCli.ok && parsedCli.isJson && parsedCli.data?.success && parsedCli.data.summary) {
          nextSys = {
            ...nextSys,
            totalGamesPlayed: parsedCli.data.summary.totalGamesPlayed,
            activeInvitesCount: parsedCli.data.summary.activeInvitesCount,
          };
        }
      }
      if (isMountedRef.current && Object.keys(nextSys).length > 0) {
        setSystemSummary((prev) => ({ ...(prev || {}), ...nextSys }));
      }

      if (isMountedRef.current) {
        setPollError(nextPollError);
      }
    } catch {
      if (isMountedRef.current) {
        setPollError('Conexão temporariamente indisponível ao atualizar painel admin.');
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 3500);
      return () => clearInterval(interval);
    } else {
      setPollError(null);
    }
  }, [isOpen, initialTab, fetchAdminData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setActionError('Informe o nome de usuário e a senha.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }
    if (newUsername.trim().length < 3) {
      setActionError('O nome de usuário deve ter no mínimo 3 caracteres.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }
    if (newPassword.trim().length < 4) {
      setActionError('A senha deve ter no mínimo 4 caracteres.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    if (newRole === 'player' && newIsTemporary && !newTemporaryTournamentId) {
      setActionError('Selecione o torneio vinculado para o usuário temporário.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    setIsSubmittingUser(true);
    setActionError(null);
    try {
      const res = await auth.adminCreateUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        displayName: newDisplayName.trim() || newUsername.trim(),
        avatar: newAvatar,
        role: newRole,
        isTemporary: newRole === 'player' ? newIsTemporary : false,
        temporaryTournamentId: newRole === 'player' && newIsTemporary ? newTemporaryTournamentId : undefined,
      });
      if (res.success && res.user) {
        setActionFeedback(`✅ Usuário @${res.user.username} cadastrado com sucesso!`);
        setShowCreateUserForm(false);
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewAvatar('🦸‍♂️');
        setNewRole('player');
        setNewIsTemporary(false);
        setNewTemporaryTournamentId('');
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4500);
      } else {
        setActionError(res.error || 'Erro ao cadastrar usuário.');
        setTimeout(() => setActionError(null), 5000);
      }
    } catch {
      setActionError('Erro de conexão ao criar usuário.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    if (!newPasswordForReset.trim() || newPasswordForReset.trim().length < 4) {
      setActionError('A nova senha deve ter no mínimo 4 caracteres.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }
    setIsResettingPassword(true);
    setActionError(null);
    try {
      const res = await auth.adminResetPassword(userId, newPasswordForReset.trim());
      if (res.success) {
        setActionFeedback(`🔑 Senha do usuário @${username} alterada com sucesso!`);
        setResettingUserId(null);
        setNewPasswordForReset('');
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4500);
      } else {
        setActionError(res.error || 'Erro ao redefinir senha.');
        setTimeout(() => setActionError(null), 5000);
      }
    } catch {
      setActionError('Erro de conexão ao redefinir senha.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const executeDeleteUser = async (userId: string, username: string) => {
    try {
      const res = await auth.adminDeleteUser(userId);
      if (res.success) {
        setActionFeedback(`🗑️ Usuário @${username} removido com sucesso.`);
        setConfirmDeleteUser(null);
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        setActionError(res.error || 'Erro ao excluir usuário.');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      setActionError('Erro ao excluir usuário.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const executeToggleUserStatus = async (userId: string, username: string, nextStatus: UserAccountStatus) => {
    try {
      const res = await auth.adminSetUserStatus(
        userId,
        nextStatus,
        nextStatus !== 'active' ? 'Status alterado pelo Painel Central de Administração.' : undefined
      );
      if (res.success) {
        setActionFeedback(res.message || `Status de @${username} atualizado!`);
        setConfirmToggleStatusUser(null);
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        setActionError(res.error || 'Erro ao alterar status do usuário.');
        setTimeout(() => setActionError(null), 4500);
      }
    } catch {
      setActionError('Erro ao alterar status do usuário.');
      setTimeout(() => setActionError(null), 4500);
    }
  };

  const handleCleanupEmptyRooms = async () => {
    setIsCleaningEmptyRooms(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/rooms/cleanup-empty', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.getToken() || localStorage.getItem('kawihe_auth_token') || ''}`,
        },
      });
      const parsed = await parseJsonSafe<{ success?: boolean; message?: string; error?: string }>(res);
      if (parsed.ok && parsed.data?.success) {
        setActionFeedback(parsed.data.message || 'Limpeza de salas concluída!');
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4500);
      } else {
        setActionError(parsed.error || 'Erro ao limpar salas vazias.');
        setTimeout(() => setActionError(null), 4500);
      }
    } catch {
      setActionError('Erro de conexão ao limpar salas.');
      setTimeout(() => setActionError(null), 4500);
    } finally {
      setIsCleaningEmptyRooms(false);
    }
  };

  const handleExportAdminSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      systemSummary,
      roomsCount: rooms.length,
      rooms,
      usersCount: users.length,
      users,
      recentAuditEntries: auditEntries,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unokawihe_admin_snapshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionFeedback('📥 Snapshot administrativo exportado com sucesso!');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const executeCloseRoom = async (roomId: string) => {
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.getToken() || localStorage.getItem('kawihe_auth_token') || ''}`,
        },
        body: JSON.stringify({ reason: 'Esta sala foi encerrada pelo Administrador Edinho.' }),
      });
      const parsed = await parseJsonSafe<{ success?: boolean; error?: string }>(res);
      if (parsed.ok && parsed.data?.success) {
        setActionFeedback(`Sala #${roomId} encerrada com sucesso!`);
        setConfirmCloseRoomId(null);
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        setActionError(parsed.error || 'Erro ao fechar sala.');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      setActionError('Erro ao fechar a sala.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const executeKickPlayer = async (roomId: string, playerId: string, playerName: string) => {
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.getToken() || localStorage.getItem('kawihe_auth_token') || ''}`,
        },
        body: JSON.stringify({ targetPlayerId: playerId, reason: 'Expulso pelo Administrador Edinho.' }),
      });
      const parsed = await parseJsonSafe<{ success?: boolean; error?: string }>(res);
      if (parsed.ok && parsed.data?.success) {
        setActionFeedback(`${playerName} foi expulso da sala.`);
        setConfirmKickPlayer(null);
        fetchAdminData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        setActionError(parsed.error || 'Erro ao expulsar jogador.');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      setActionError('Erro ao expulsar jogador.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (!isOpen) return null;

  const handleForceEndGame = (roomId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'admin_force_end_game',
        roomId,
        token: localStorage.getItem('kawihe_auth_token') || '',
      }));
      setActionFeedback(`Partida da sala ${roomId} retornada ao Lobby.`);
      setTimeout(fetchAdminData, 500);
    }
  };

  const handleSendRoomOrGlobalMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSendingMessage(true);
    const sender = currentUser ? `👑 ${currentUser.displayName}` : '👑 Admin Edinho';

    try {
      const token = auth.getToken() || localStorage.getItem('kawihe_auth_token') || '';
      if (messageTargetRoom === 'all') {
        // Broadcast to all rooms
        const res = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageText.trim(),
            sender,
          }),
        });
        const parsed = await parseJsonSafe<{ success?: boolean; error?: string }>(res);
        if (parsed.ok && parsed.data?.success) {
          setActionFeedback('📢 Aviso global transmitido com sucesso!');
          setMessageText('');
        } else {
          setActionError(parsed.error || 'Erro ao enviar aviso global.');
          setTimeout(() => setActionError(null), 4000);
        }
      } else if (messageTargetRoom.startsWith('direct:')) {
        const targetId = messageTargetRoom.slice('direct:'.length);
        const res = await fetch('/api/admin/player-action/alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetId,
            message: messageText.trim(),
          }),
        });
        const parsed = await parseJsonSafe<{ success?: boolean; message?: string; error?: string }>(res);
        if (parsed.ok && parsed.data?.success) {
          setActionFeedback(parsed.data.message || '🔔 Mensagem direta enviada ao jogador!');
          setMessageText('');
          fetchAdminData();
        } else {
          setActionError(parsed.error || 'Erro ao enviar mensagem direta ao jogador.');
          setTimeout(() => setActionError(null), 4000);
        }
      } else {
        // Send to specific room
        const res = await fetch(`/api/admin/rooms/${messageTargetRoom}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: messageText.trim(),
            sender,
          }),
        });
        const parsed = await parseJsonSafe<{ success?: boolean; error?: string }>(res);
        if (parsed.ok && parsed.data?.success) {
          setActionFeedback(`💬 Mensagem enviada para a Sala #${messageTargetRoom}!`);
          setMessageText('');
          fetchAdminData();
        } else {
          setActionError(parsed.error || 'Erro ao enviar mensagem para a sala.');
          setTimeout(() => setActionError(null), 4000);
        }
      }
    } catch {
      setActionError('Erro ao enviar mensagem.');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsSendingMessage(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleSendQuickMessage = async (roomId: string) => {
    if (!quickMsgText.trim()) return;
    const sender = currentUser ? `👑 ${currentUser.displayName}` : '👑 Admin Edinho';

    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.getToken() || localStorage.getItem('kawihe_auth_token') || ''}`,
        },
        body: JSON.stringify({
          text: quickMsgText.trim(),
          sender,
        }),
      });
      const parsed = await parseJsonSafe<{ success?: boolean; error?: string }>(res);
      if (parsed.ok && parsed.data?.success) {
        setActionFeedback(`Mensagem entregue na mesa #${roomId}!`);
        setQuickMsgText('');
        setQuickMsgRoomId(null);
      } else {
        setActionError(parsed.error || 'Erro ao enviar mensagem rápida.');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      setActionError('Erro ao enviar mensagem rápida.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const totalBots = rooms.reduce((acc, r) => acc + r.players.filter((p) => p.isBot).length, 0);
  const onlineUsersList = users.filter((u) => u.isOnline || (currentUser && (currentUser.id === u.id || currentUser.username.toLowerCase() === u.username.toLowerCase())));
  const totalUsersOnline = onlineUsersList.length;
  const temporaryUsersCount = users.filter((u) => u.isTemporary).length;
  const inactiveUsersCount = users.filter((u) => u.status === 'disabled' || u.status === 'archived').length;
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const emptyNonTournamentRoomsCount = rooms.filter(
    (r) => !r.isTournament && r.players.filter((p) => !p.isBot && p.isConnected).length === 0
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-slate-900 border-4 border-amber-500 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-2xl shadow-lg border-2 border-amber-300">
              🛡️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Painel Central de Administração
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Admin Edinho
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Monitoramento de jogadores, moderação de salas e envio de mensagens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={isLoading}
              title="Atualizar agora"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-600 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Overview Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 shrink-0">
          <div className="bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[11px] text-slate-400 font-bold">Salas Abertas</div>
            <div className="text-xl font-black text-amber-400">{rooms.length}</div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[11px] text-slate-400 font-bold">Usuários Online</div>
            <div className="text-xl font-black text-emerald-400">{totalUsersOnline}</div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[11px] text-slate-400 font-bold">Total Cadastrados</div>
            <div className="text-xl font-black text-purple-400">{users.length}</div>
          </div>
          <div className="bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[11px] text-slate-400 font-bold">Robôs Ativos</div>
            <div className="text-xl font-black text-sky-400">{totalBots}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Salas ({rooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários ({users.length})</span>
            {totalUsersOnline > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar em Massa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_history')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'import_history'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico Lotes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'messages'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mensagens</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Sistema & Auditoria</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="p-2.5 mb-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {(actionError || pollError) && (
          <div className="p-2.5 mb-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError || pollError}</span>
          </div>
        )}

        {/* TAB 1: ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
            {rooms.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-800/70 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-300 font-bold">
                  Clique sobre qualquer jogador humano na mesa para abrir o <strong className="text-sky-300">Relatório Completo</strong>.
                </div>
                {emptyNonTournamentRoomsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleCleanupEmptyRooms}
                    disabled={isCleaningEmptyRooms}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/50 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isCleaningEmptyRooms
                        ? 'Limpando...'
                        : `Limpar Salas Sem Humanos (${emptyNonTournamentRoomsCount})`}
                    </span>
                  </button>
                )}
              </div>
            )}
            {rooms.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <div className="text-3xl mb-2">🎴</div>
                <p className="text-sm">Nenhuma sala ativa no momento.</p>
                <p className="text-xs text-slate-500 mt-1">As salas criadas aparecerão aqui em tempo real.</p>
              </div>
            ) : (
              rooms.map((room) => {
                const hostPlayer = room.players.find((p) => p.isHost);
                const isPlaying = room.status === 'playing';

                return (
                  <div
                    key={room.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      isPlaying
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    {/* Room Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-base font-black px-2.5 py-0.5 rounded-xl bg-amber-500 text-slate-950 tracking-wider">
                          #{room.id}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-1 ${
                            isPlaying
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}
                        >
                          {isPlaying ? '🎮 Em Jogo' : '⏳ Aguardando'}
                        </span>
                        {room.gameMode === 'team_2v2' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                            🤝 Duplas 2v2
                          </span>
                        )}
                        {room.kidsMode && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/40">
                            👶 Criança
                          </span>
                        )}
                        {room.isPrivate && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40">
                            🔒 Privada
                          </span>
                        )}
                        {room.isTournament && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
                            🏆 Torneio
                          </span>
                        )}
                        {(room.spectatorsCount ?? 0) > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-700 text-slate-200">
                            👁️ {room.spectatorsCount}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-amber-400" /> {room.turnDuration > 0 ? `${room.turnDuration}s` : 'Ilimitado'}
                        </span>
                      </div>

                      {/* Room Level Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Watch (Hidden / Clean Tournament Table) */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onWatchRoom?.(room.id, false);
                          }}
                          className="px-2.5 py-1 bg-sky-600/40 hover:bg-sky-600 text-sky-200 rounded-lg text-[11px] font-black border border-sky-400/40 transition-all flex items-center gap-1 cursor-pointer"
                          title="Assistir partida em modo Transmissão Limpa (sem ver mãos dos jogadores)"
                        >
                          <span>👁️</span> Assistir (Mesa)
                        </button>

                        {/* Watch TV (Revealed Hands) */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onWatchRoom?.(room.id, true);
                          }}
                          className="px-2.5 py-1 bg-amber-600/40 hover:bg-amber-500 text-amber-200 rounded-lg text-[11px] font-black border border-amber-400/40 transition-all flex items-center gap-1 cursor-pointer"
                          title="Assistir partida em Modo TV / Juiz (com todas as cartas abertas)"
                        >
                          <span>📺</span> Assistir (TV / Cartas Abertas)
                        </button>

                        {/* Copy Stream Link */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}${window.location.pathname}?room=${room.id}&watch=1`;
                            navigator.clipboard.writeText(url).then(() => {
                              setActionFeedback(`Link de Transmissão da Sala #${room.id} copiado!`);
                            });
                          }}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-500 transition-all flex items-center gap-1 cursor-pointer"
                          title="Copiar Link para Espectadores / Transmissão"
                        >
                          <span>🔗</span> Link
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuickMsgRoomId(quickMsgRoomId === room.id ? null : room.id)}
                          className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 rounded-lg text-[11px] font-black border border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> Falar
                        </button>

                        {isPlaying && (
                          <button
                            type="button"
                            onClick={() => handleForceEndGame(room.id)}
                            className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-200 rounded-lg text-[11px] font-black border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Resetar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setConfirmCloseRoomId(room.id)}
                          className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 rounded-lg text-[11px] font-black border border-rose-500/40 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Fechar
                        </button>
                      </div>
                    </div>

                    {/* Quick Inline Message Input */}
                    {quickMsgRoomId === room.id && (
                      <div className="my-2 p-2 bg-purple-950/40 rounded-xl border border-purple-500/50 flex gap-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          value={quickMsgText}
                          onChange={(e) => setQuickMsgText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendQuickMessage(room.id)}
                          placeholder={`Enviar recado do Admin para a Mesa #${room.id}...`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-purple-500/60 text-white font-medium text-xs focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendQuickMessage(room.id)}
                          disabled={!quickMsgText.trim()}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Enviar
                        </button>
                      </div>
                    )}

                    {/* Players list in room */}
                    <div className="mt-2.5">
                      <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Jogadores na Mesa ({room.players.length}/{room.maxPlayers}):</span>
                        {hostPlayer && (
                          <span className="text-amber-300 flex items-center gap-1 text-[10px]">
                            <Crown className="w-3 h-3 text-amber-400" /> Anfitrião: {hostPlayer.name}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {room.players.map((p, idx) => (
                          <div
                            key={`${p.id}-${idx}`}
                            className="p-2 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2"
                          >
                            {!p.isBot ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setInspectedTarget({
                                    id: p.id,
                                    name: p.name,
                                    avatar: p.avatar,
                                    roomId: room.id,
                                  })
                                }
                                title={`Abrir relatório de ${p.name}`}
                                className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-85 cursor-pointer group"
                              >
                                <span className="text-lg shrink-0">{p.avatar}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-slate-100 group-hover:text-sky-300 flex items-center gap-1 truncate transition-colors">
                                    <span className="truncate underline decoration-slate-600 group-hover:decoration-sky-400 underline-offset-2">
                                      {p.name}
                                    </span>
                                    {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {isPlaying ? `${p.cardsCount} cartas` : 'Pronto'} • 📊 Relatório
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg shrink-0">{p.avatar}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-slate-100 flex items-center gap-1 truncate">
                                    <span className="truncate">{p.name}</span>
                                    <Bot className="w-3 h-3 text-sky-400 shrink-0" />
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {isPlaying ? `${p.cardsCount} cartas` : 'Robô'}
                                  </div>
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setConfirmKickPlayer({ roomId: room.id, playerId: p.id, playerName: p.name })}
                              title={`Expulsar ${p.name}`}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer shrink-0"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: REGISTERED USERS & PASSWORD MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-300 font-bold flex items-center gap-3">
                <span>Total de Usuários: <strong className="text-white font-black">{users.length}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1.5 font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {totalUsersOnline} Online
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateUserForm ? 'Fechar Cadastro' : 'Cadastrar Novo Usuário'}</span>
              </button>
            </div>

            {/* Quick Search Bar & Status Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuário por nome, @login ou #tag..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 font-medium text-xs focus:outline-none focus:border-amber-400"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all' as const, label: `Todos (${users.length})` },
                  { key: 'online' as const, label: `🟢 Online (${totalUsersOnline})` },
                  { key: 'temporary' as const, label: `⏳ Temporários (${temporaryUsersCount})` },
                  { key: 'inactive' as const, label: `🚫 Suspensos (${inactiveUsersCount})` },
                  { key: 'admin' as const, label: `👑 Admins (${adminUsersCount})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setUserFilter(f.key)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      userFilter === f.key
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Create User Expandable Form */}
            {showCreateUserForm && (
              <form onSubmit={handleCreateUser} className="p-4 bg-slate-800 border-2 border-amber-400 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <h4 className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Criar Conta de Usuário (Direto sem Convite)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserForm(false)}
                    className="text-slate-400 hover:text-white text-xs font-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-300 mb-1">
                      Nome de Usuário / Login (sem espaços):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: pedrinho"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-300 mb-1">
                      Senha Inicial:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-300 mb-1">
                      Nome / Apelido de Exibição:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pedro Silva"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-300 mb-1">
                      Tipo de Acesso (Cargo):
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const roleVal = e.target.value as 'player' | 'admin';
                        setNewRole(roleVal);
                        if (roleVal !== 'player') {
                          setNewIsTemporary(false);
                          setNewTemporaryTournamentId('');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="player">🎮 Jogador Padrão</option>
                      <option value="admin">👑 Administrador Total</option>
                    </select>
                  </div>
                </div>

                {newRole === 'player' && (
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsTemporary}
                        onChange={(e) => {
                          setNewIsTemporary(e.target.checked);
                          if (!e.target.checked) setNewTemporaryTournamentId('');
                        }}
                        className="mt-0.5 rounded border-slate-600 bg-slate-900"
                      />
                      <div className="text-[11px]">
                        <div className="font-black text-amber-300">
                          Criar como usuário temporário exclusivo de torneio
                        </div>
                        <div className="text-slate-400">
                          Desmarcado por padrão (usuário permanente). Apenas usuários marcados aqui ficam elegíveis para limpeza de temporários do torneio selecionado.
                        </div>
                      </div>
                    </label>

                    {newIsTemporary && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Torneio Vinculado *
                        </label>
                        <select
                          value={newTemporaryTournamentId}
                          onChange={(e) => setNewTemporaryTournamentId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/60 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="">-- Selecione um torneio aberto --</option>
                          {openTournaments.map((t) => (
                            <option key={t.config.id} value={t.config.id}>
                              {t.config.name} ({t.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar Quick Selection */}
                <div>
                  <label className="block text-[11px] font-black text-slate-300 mb-1">
                    Escolha um Avatar Inicial:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['🦸‍♂️', '👑', '🦊', '🦁', '🐼', '🐯', '🦄', '🧙‍♂️', '⚡', '🚀'].map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setNewAvatar(av)}
                        className={`w-9 h-9 rounded-xl border-2 text-xl flex items-center justify-center cursor-pointer transition-all ${
                          newAvatar === av
                            ? 'bg-amber-400 border-white scale-110 shadow-sm'
                            : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingUser ? 'Criando...' : 'Salvar Novo Usuário'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Registered Users List */}
            {(() => {
              const query = userSearchQuery.trim().toLowerCase();
              const filteredUsers = users.filter((u) => {
                const isMeCheck = !!(
                  currentUser &&
                  (currentUser.id === u.id || currentUser.username.toLowerCase() === u.username.toLowerCase())
                );
                const isUserOnline = u.isOnline || isMeCheck;

                if (userFilter === 'online' && !isUserOnline) return false;
                if (userFilter === 'temporary' && !u.isTemporary) return false;
                if (userFilter === 'inactive' && u.status !== 'disabled' && u.status !== 'archived') return false;
                if (userFilter === 'admin' && u.role !== 'admin') return false;

                if (!query) return true;
                return (
                  u.username.toLowerCase().includes(query) ||
                  u.displayName.toLowerCase().includes(query) ||
                  (u.tag && u.tag.toLowerCase().includes(query))
                );
              });

              if (filteredUsers.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                    <p className="text-sm font-bold">Nenhum usuário encontrado{query ? ` para "${userSearchQuery}"` : ''}.</p>
                    {(query || userFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchQuery('');
                          setUserFilter('all');
                        }}
                        className="mt-2 text-xs text-amber-400 font-black hover:underline cursor-pointer"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredUsers.map((u) => {
                    const isResettingThis = resettingUserId === u.id;
                    const isMe = !!(currentUser && (currentUser.id === u.id || currentUser.username.toLowerCase() === u.username.toLowerCase()));
                    const isOnline = u.isOnline || isMe;
                    const isSuspended = u.status === 'disabled' || u.status === 'archived';

                    const openUserReport = () =>
                      setInspectedTarget({
                        id: u.id,
                        name: u.displayName,
                        avatar: u.avatar,
                        username: u.username,
                        roomId: u.currentRoomId ?? null,
                      });

                    return (
                      <div
                        key={u.id}
                        className={`p-3 rounded-2xl border-2 flex flex-col justify-between gap-2.5 transition-all ${
                          isSuspended
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : isOnline
                            ? 'bg-slate-800/90 border-emerald-500/60 shadow-md'
                            : 'bg-slate-800/50 border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={openUserReport}
                            title={`Clique para abrir o Relatório Completo de ${u.displayName}`}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                          >
                            <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{u.avatar}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-white group-hover:text-sky-300 truncate transition-colors underline decoration-slate-600 group-hover:decoration-sky-400 underline-offset-2">
                                  {u.displayName}
                                </span>
                                {isMe && (
                                  <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.2 rounded">
                                    VOCÊ
                                  </span>
                                )}
                                {u.tag && (
                                  <span className="font-mono text-[9px] font-black text-amber-400 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-500/40">
                                    {u.tag}
                                  </span>
                                )}
                                {u.role === 'admin' && (
                                  <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 rounded">
                                    ADMIN
                                  </span>
                                )}
                                {u.isTemporary && u.accountOriginType === 'tournament_temporary' && (
                                  <span
                                    title={`Usuário temporário exclusivo do torneio ${u.temporaryTournamentId || ''}`}
                                    className="text-[9px] font-black bg-sky-900/80 text-sky-200 border border-sky-500/50 px-1.5 rounded"
                                  >
                                    TEMPORÁRIO
                                  </span>
                                )}
                                {u.status === 'disabled' && (
                                  <span className="text-[9px] font-black bg-amber-900/80 text-amber-200 border border-amber-500/50 px-1.5 rounded">
                                    DESATIVADA
                                  </span>
                                )}
                                {u.status === 'archived' && (
                                  <span className="text-[9px] font-black bg-slate-700 text-slate-300 border border-slate-500/50 px-1.5 rounded">
                                    ARQUIVADA
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>@{u.username}</span>
                              </div>
                            </div>
                          </button>

                          <div className="text-right shrink-0">
                            {isOnline ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  Online
                                </span>
                                {u.currentRoomId ? (
                                  <div className="text-[10px] text-amber-400 font-mono font-black mt-0.5">
                                    Sala #{u.currentRoomId}
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    (No Lobby)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">⚪ Offline</span>
                            )}
                          </div>
                        </div>

                        {/* Inline Reset Password Form */}
                        {isResettingThis ? (
                          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-amber-500/60 space-y-2 animate-in fade-in duration-150">
                            <div className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                              <Key className="w-3.5 h-3.5" /> Nova senha para @{u.username}:
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                autoFocus
                                placeholder="Digite nova senha..."
                                value={newPasswordForReset}
                                onChange={(e) => setNewPasswordForReset(e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-600 text-white font-medium text-xs focus:outline-none focus:border-amber-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleResetPassword(u.id, u.username)}
                                disabled={isResettingPassword || !newPasswordForReset.trim()}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                {isResettingPassword ? 'Salvando...' : 'Salvar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResettingUserId(null);
                                  setNewPasswordForReset('');
                                }}
                                className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-lg cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* User Action Toolbar */
                          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-700/60 mt-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={openUserReport}
                                className="px-2 py-1 rounded-lg bg-sky-900/50 hover:bg-sky-700/60 text-sky-200 border border-sky-500/40 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="Abrir relatório completo e ações diretas"
                              >
                                <FileBarChart2 className="w-3 h-3 text-sky-300" />
                                <span>Relatório</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResettingUserId(u.id);
                                  setNewPasswordForReset('');
                                }}
                                className="px-2 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="Trocar a senha deste usuário"
                              >
                                <KeyRound className="w-3 h-3 text-purple-300" />
                                <span>Senha</span>
                              </button>

                              {u.role !== 'admin' && u.username.toLowerCase() !== 'edinho' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmToggleStatusUser({
                                      id: u.id,
                                      username: u.username,
                                      nextStatus: isSuspended ? 'active' : 'disabled',
                                    })
                                  }
                                  className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                                    isSuspended
                                      ? 'bg-emerald-900/40 hover:bg-emerald-700/60 text-emerald-200 border-emerald-500/40'
                                      : 'bg-amber-900/30 hover:bg-amber-700/50 text-amber-200 border-amber-500/40'
                                  }`}
                                  title={isSuspended ? 'Reativar conta' : 'Suspender/Desativar conta'}
                                >
                                  {isSuspended ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-300" />
                                      <span>Reativar</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3 text-amber-300" />
                                      <span>Suspender</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {u.username.toLowerCase() !== 'edinho' && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUser({ id: u.id, username: u.username })}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title={`Excluir @${u.username}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: ROOM, DIRECT & GLOBAL MESSAGE SENDER */}
        {activeTab === 'messages' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[220px]">
            <form onSubmit={handleSendRoomOrGlobalMessage} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-4">
              <div>
                <label className="block text-xs font-black text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" /> Selecione o Destino da Mensagem:
                </label>
                <select
                  value={messageTargetRoom}
                  onChange={(e) => setMessageTargetRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="all">📢 Transmissão Global (Todas as Salas + Lobby)</option>
                  {onlineUsersList.length > 0 && (
                    <optgroup label="👤 Mensagem Direta para Jogador Online">
                      {onlineUsersList.map((ou) => (
                        <option key={`direct-${ou.id}`} value={`direct:${ou.id}`}>
                          👤 Direto para {ou.displayName} (@{ou.username}){ou.currentRoomId ? ` — Sala #${ou.currentRoomId}` : ' — Lobby'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {rooms.length > 0 && (
                    <optgroup label="🏠 Enviar no Chat da Sala">
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          🏠 Sala #{r.id} ({r.status === 'playing' ? 'Em Jogo' : 'Lobby'} - {r.players.length} jogadores)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5">
                  Texto da Mensagem ou Comunicado:
                </label>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ex: Atenção jogadores da mesa, boa sorte! / O servidor receberá atualizações em 10 minutos."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white font-medium text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Enviado como: <strong className="text-amber-400">{currentUser?.displayName || 'Admin Edinho'}</strong>
                </span>
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSendingMessage}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />{' '}
                  {messageTargetRoom === 'all'
                    ? 'Transmitir Global'
                    : messageTargetRoom.startsWith('direct:')
                    ? 'Enviar Alerta Direto'
                    : 'Enviar para a Sala'}
                </button>
              </div>
            </form>

            <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-2xl text-xs text-purple-200">
              💡 <strong>Dica:</strong> Mensagens de sala chegam no chat lateral da mesa. Mensagens diretas e transmissões globais exibem um banner sonoro no topo da tela do jogador.
            </div>
          </div>
        )}

        {/* TAB 4: BULK USER IMPORTER */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-[220px]">
            {currentUser?.role !== 'admin' ? (
              <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Autenticação JWT de Administrador Obrigatória</h4>
                <p className="text-xs text-slate-300">
                  Para garantir rastreabilidade e auditoria, a importação em massa exige login com conta de Administrador (<code className="text-amber-300">role === 'admin'</code>), não apenas desbloqueio por PIN.
                </p>
              </div>
            ) : (
              <AdminImportPanel
                onImportCompleted={() => {
                  fetchAdminData();
                }}
                onOpenHistory={() => setActiveTab('import_history')}
              />
            )}
          </div>
        )}

        {/* TAB 5: IMPORT BATCH HISTORY & SAFE MANAGEMENT */}
        {activeTab === 'import_history' && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-[220px]">
            {currentUser?.role !== 'admin' ? (
              <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Autenticação JWT de Administrador Obrigatória</h4>
                <p className="text-xs text-slate-300">
                  Faça login com uma conta de Administrador para consultar lotes e gerenciar contas importadas.
                </p>
              </div>
            ) : (
              <AdminImportHistoryPanel
                onUsersChanged={() => {
                  fetchAdminData();
                }}
              />
            )}
          </div>
        )}

        {/* TAB 6: SYSTEM HEALTH, MAINTENANCE & AUDIT LOG */}
        {activeTab === 'system' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[220px]">
            {/* VM & Server Live Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-sky-400" /> CPU da VM
                </div>
                <div className="text-lg font-black text-sky-300 mt-0.5">
                  {systemSummary?.cpuPercent !== undefined ? `${systemSummary.cpuPercent}%` : '—'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-400" /> RAM / Swap
                </div>
                <div className="text-sm font-black text-emerald-300 mt-0.5">
                  {systemSummary?.ramUsedMb !== undefined
                    ? `${systemSummary.ramUsedMb}/${systemSummary.ramTotalMb} MB (${systemSummary.ramUsedPercent}%)`
                    : '—'}
                </div>
                {systemSummary?.swapTotalMb !== undefined && systemSummary.swapTotalMb > 0 && (
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Swap: {systemSummary.swapUsedMb}/{systemSummary.swapTotalMb} MB
                  </div>
                )}
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" /> Event Loop Lag
                </div>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {systemSummary?.eventLoopLagMs !== undefined ? `${systemSummary.eventLoopLagMs} ms` : '—'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" /> Partidas / Auth
                </div>
                <div className="text-sm font-black text-purple-300 mt-0.5">
                  {systemSummary?.totalGamesPlayed ?? 0} partidas
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  Auth: {systemSummary?.authServiceStatus || 'embedded'} • Convites: {systemSummary?.activeInvitesCount ?? 0}
                </div>
              </div>
            </div>

            {/* Maintenance Actions */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Manutenção & Diagnóstico Rápido
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ferramentas seguras para limpeza de salas abandonadas e exportação de snapshot administrativo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCleanupEmptyRooms}
                  disabled={isCleaningEmptyRooms}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/50 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Salas Sem Humanos ({emptyNonTournamentRoomsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAdminSnapshot}
                  className="px-3 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-400/50 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Snapshot JSON</span>
                </button>
              </div>
            </div>

            {/* Live Admin Audit Log */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-400" /> Auditoria de Ações Administrativas ({auditEntries.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">Sessão atual do servidor</span>
              </div>

              {auditEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-900/50 rounded-xl border border-slate-700/60">
                  Nenhuma ação administrativa registrada nesta sessão ainda.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {auditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-black">
                          {entry.action}
                        </span>
                        <span className="font-black text-white">{entry.target}</span>
                        {entry.details && <span className="text-slate-400 text-[11px]">• {entry.details}</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold shrink-0">
                        por <strong className="text-amber-300">{entry.adminName}</strong> •{' '}
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Confirmation Overlay: Delete User */}
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border-2 border-rose-500 p-5 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-2xl mx-auto">
                🗑️
              </div>
              <h4 className="text-base font-black text-white">Excluir Usuário?</h4>
              <p className="text-xs text-slate-300 font-medium">
                Tem certeza que deseja excluir permanentemente a conta de <strong className="text-white">@{confirmDeleteUser.username}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteUser(confirmDeleteUser.id, confirmDeleteUser.username)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-sm"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Overlay: Close Room */}
        {confirmCloseRoomId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border-2 border-rose-500 p-5 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-2xl mx-auto">
                🛑
              </div>
              <h4 className="text-base font-black text-white">Encerrar Sala #{confirmCloseRoomId}?</h4>
              <p className="text-xs text-slate-300 font-medium">
                Tem certeza que deseja encerrar e fechar a sala <strong className="text-white">#{confirmCloseRoomId}</strong>? Todos os jogadores conectados serão redirecionados de volta ao Lobby.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmCloseRoomId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => executeCloseRoom(confirmCloseRoomId)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-sm"
                >
                  Sim, Encerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Overlay: Kick Player */}
        {confirmKickPlayer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border-2 border-amber-500 p-5 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl mx-auto">
                ⚠️
              </div>
              <h4 className="text-base font-black text-white">Expulsar Jogador?</h4>
              <p className="text-xs text-slate-300 font-medium">
                Expulsar o jogador <strong className="text-white">{confirmKickPlayer.playerName}</strong> da Sala <strong className="text-white">#{confirmKickPlayer.roomId}</strong>?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmKickPlayer(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => executeKickPlayer(confirmKickPlayer.roomId, confirmKickPlayer.playerId, confirmKickPlayer.playerName)}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
                >
                  Sim, Expulsar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Overlay: Toggle User Status */}
        {confirmToggleStatusUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border-2 border-amber-500 p-5 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl mx-auto">
                {confirmToggleStatusUser.nextStatus === 'active' ? '✅' : '🚫'}
              </div>
              <h4 className="text-base font-black text-white">
                {confirmToggleStatusUser.nextStatus === 'active' ? 'Reativar Conta?' : 'Suspender Conta?'}
              </h4>
              <p className="text-xs text-slate-300 font-medium">
                {confirmToggleStatusUser.nextStatus === 'active'
                  ? `Reativar o acesso da conta @${confirmToggleStatusUser.username} para login e partidas?`
                  : `Suspender a conta @${confirmToggleStatusUser.username}? Sessões ativas serão desconectadas imediatamente.`}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmToggleStatusUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeToggleUserStatus(
                      confirmToggleStatusUser.id,
                      confirmToggleStatusUser.username,
                      confirmToggleStatusUser.nextStatus
                    )
                  }
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Diagnostic Report Modal (opened from Users or Rooms tab) */}
      <PlayerReportModal
        isOpen={!!inspectedTarget}
        onClose={() => setInspectedTarget(null)}
        targetPlayer={inspectedTarget}
        currentUser={currentUser}
        onJoinRoomAsAdmin={(targetRoomId) => {
          setInspectedTarget(null);
          onClose();
          onJoinRoomAsAdmin?.(targetRoomId);
        }}
        onWatchRoom={(targetRoomId, revealCards) => {
          setInspectedTarget(null);
          onClose();
          onWatchRoom?.(targetRoomId, revealCards);
        }}
        onActionCompleted={() => fetchAdminData()}
      />
    </div>
  );
};
