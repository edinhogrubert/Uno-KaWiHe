import React, { useEffect, useState } from 'react';
import { APP_VERSION, APP_RELEASE_DATE, RELEASE_HISTORY, ReleaseHistoryEntry } from '../utils/versionHistory.js';
import { parseJsonSafe } from '../utils/http.js';
import { X, Tag, CheckCircle2, AlertTriangle, History, RefreshCw } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VersionApiResponse {
  success?: boolean;
  version?: string;
  releaseDate?: string;
  latestRelease?: ReleaseHistoryEntry;
  history?: ReleaseHistoryEntry[];
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [serverHistory, setServerHistory] = useState<ReleaseHistoryEntry[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkServerVersion = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      const parsed = await parseJsonSafe<VersionApiResponse>(res);
      if (parsed.ok && parsed.isJson && parsed.data?.version) {
        setServerVersion(parsed.data.version);
        if (Array.isArray(parsed.data.history) && parsed.data.history.length > 0) {
          setServerHistory(parsed.data.history);
        }
      }
    } catch {
      // Keep client history fallback
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkServerVersion();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const entries = serverHistory || RELEASE_HISTORY;
  const isMismatch = Boolean(serverVersion && serverVersion !== APP_VERSION);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[88vh] my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Versão & Histórico de Atualizações
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Uno KaWiHe • Build cliente v{APP_VERSION} ({APP_RELEASE_DATE})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkServerVersion}
              disabled={isChecking}
              title="Verificar versão ativa do servidor"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Client vs Server Sync Indicator */}
        <div className="my-3 shrink-0">
          {isMismatch ? (
            <div className="p-3 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  Divergência detectada: seu navegador está em <strong>v{APP_VERSION}</strong>, mas o servidor respondeu{' '}
                  <strong>v{serverVersion}</strong>.
                </div>
                <div className="text-[11px] text-rose-300">
                  Recarregue a página com <strong>F5 / Ctrl+Shift+R</strong> ou confirme se o deploy concluiu corretamente.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Versão em execução: <strong className="text-white">v{serverVersion || APP_VERSION}</strong> (Cliente e Servidor sincronizados)
                </span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black">
                ATIVO
              </span>
            </div>
          )}
        </div>

        {/* Release Timeline */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {entries.map((entry, idx) => (
            <div
              key={entry.version}
              className={`p-4 rounded-2xl border ${
                idx === 0
                  ? 'bg-slate-800/90 border-amber-400/60 shadow-md'
                  : 'bg-slate-800/50 border-slate-700'
              } space-y-2`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />v{entry.version}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black uppercase">
                      Atual
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-400">{entry.date}</span>
              </div>

              <h4 className="text-sm font-black text-white">{entry.title}</h4>

              <ul className="space-y-1.5 text-xs text-slate-300">
                {entry.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-black mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
