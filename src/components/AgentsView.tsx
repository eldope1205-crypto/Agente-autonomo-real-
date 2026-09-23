import React, { useState } from 'react';
import {
  Bot,
  AlertTriangle,
  Play,
  Pause,
  ShieldCheck,
  Server,
  Wallet,
} from 'lucide-react';
import { SubAgent } from '../types/index.js';

interface AgentsViewProps {
  subAgents: SubAgent[];
  availableCapital: number;
  onActivate: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  subAgents,
  availableCapital,
  onActivate,
  onPause,
}) => {
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleActivateClick = async (agent: SubAgent) => {
    setErrorNotice(null);
    setLoadingId(agent.id);

    try {
      await onActivate(agent.id);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo activar el sub-agente.';

      setErrorNotice(message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />

          <h2 className="text-base font-bold text-white tracking-tight">
            Sub-Agentes Especializados ({subAgents.length})
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Los sub-agentes solo pueden activarse cuando existe capital confirmado
          suficiente y la infraestructura necesaria está preparada.
        </p>
      </div>

      {/* Error */}
      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />

          <div>
            <div className="font-bold">
              Activación bloqueada
            </div>

            <p className="mt-1 leading-relaxed">
              {errorNotice}
            </p>
          </div>
        </div>
      )}

      {/* Capital */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />

          <span className="text-xs text-slate-400">
            Capital confirmado disponible
          </span>
        </div>

        <span className="font-mono font-bold text-emerald-400 text-sm">
          {availableCapital.toFixed(2)} €
        </span>
      </div>

      {/* Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subAgents.map((agent) => {
          const hasCapital =
            availableCapital >= agent.capitalRequired;

          const infrastructureReady =
            agent.infrastructureReady === true;

          const isActive =
            agent.status === 'ACTIVE';

          const isLoading =
            loadingId === agent.id;

          const canActivate =
            hasCapital && infrastructureReady && !isActive;

          let statusLabel = 'BLOQUEADO';

          if (isActive) {
            statusLabel = 'ACTIVO';
          } else if (!hasCapital) {
            statusLabel = 'CAPITAL INSUFICIENTE';
          } else if (!infrastructureReady) {
            statusLabel = 'INFRAESTRUCTURA PENDIENTE';
          } else {
            statusLabel = 'LISTO PARA ACTIVAR';
          }

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : canActivate
                  ? 'bg-slate-900/80 border-indigo-500/30'
                  : 'bg-slate-950/40 border-slate-800/60'
              }`}
            >
              <div>
                {/* Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    ROL: {agent.role}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : canActivate
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-white mb-1">
                  {agent.name}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {agent.purpose}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                {/* Capital */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">
                    Capital requerido:
                  </span>

                  <span className="font-mono font-bold text-white">
                    {agent.capitalRequired.toFixed(2)} € / mes
                  </span>
                </div>

                {/* Infrastructure */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">
                    Infraestructura:
                  </span>

                  <span
                    className={`flex items-center gap-1 font-medium ${
                      infrastructureReady
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />

                    {infrastructureReady
                      ? 'Preparada'
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Authorization */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">
                    Autorización:
                  </span>

                  <span
                    className={`flex items-center gap-1 font-medium ${
                      agent.authorizationGranted
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />

                    {agent.authorizationGranted
                      ? 'Concedida'
                      : 'No concedida'}
                  </span>
                </div>

                {/* Capabilities */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 shrink-0">
                    Capacidades:
                  </span>

                  <span className="font-mono text-slate-300 text-right truncate max-w-[190px]">
                    {(agent.capabilities || []).join(', ') ||
                      'General'}
                  </span>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400 leading-relaxed">
                    {isActive
                      ? 'Operando bajo la directiva general.'
                      : !hasCapital
                      ? `Faltan ${Math.max(
                          0,
                          agent.capitalRequired - availableCapital
                        ).toFixed(2)} € de capital confirmado.`
                      : !infrastructureReady
                      ? 'La infraestructura todavía no está preparada.'
                      : 'Puede solicitarse la activación.'}
                  </span>

                  {isActive ? (
                    <button
                      onClick={() => onPause(agent.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 hover:bg-amber-500/30"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateClick(agent)}
                      disabled={!canActivate || isLoading}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        canActivate
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />

                      {isLoading
                        ? 'Verificando...'
                        : 'Activar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reality / security note */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-bold text-slate-300">
              Control de seguridad
            </p>

            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              La activación no crea dinero ni infraestructura por sí sola.
              El sistema solo considera ingresos confirmados y no marca una
              infraestructura como disponible si todavía no está preparada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
