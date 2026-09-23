import React, { useState } from 'react';
import { Bot, Cpu, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Play, Pause } from 'lucide-react';
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
    } catch (err: any) {
      setErrorNotice(err.message || 'Error al activar el sub-agente.');
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
            Sub-Agentes Especializados y Expansión Modular ({subAgents.length})
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Regla de Realidad: Solo se pueden desplegar agentes secundarios cuando exista capital real confirmado suficiente para cubrir su cuota mensual de infraestructura.
        </p>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Bloqueo Financiero del Agente:</div>
            <p className="mt-0.5">{errorNotice}</p>
          </div>
        </div>
      )}

      {/* Available Capital Indicator */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Capital Real Disponible del Agente:</span>
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {availableCapital.toFixed(2)} €
        </span>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subAgents.map((agent) => {
          const isFunded = availableCapital >= agent.capitalRequired;
          const isLoading = loadingId === agent.id;

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                agent.status === 'ACTIVE'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : isFunded
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    ROL: {agent.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      agent.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isFunded
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {agent.status === 'ACTIVE'
                      ? 'ACTIVO'
                      : isFunded
                      ? 'LISTO PARA ACTIVAR'
                      : 'FONDOS INSUFICIENTES'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{agent.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {agent.purpose}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Capital requerido:</span>
                  <span className="font-mono font-bold text-white">
                    {agent.capitalRequired} € / mes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Capacidades asignadas:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[180px]">
                    {(agent.capabilities || []).join(', ') || 'General'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    {agent.status === 'ACTIVE'
                      ? 'Operando bajo directiva general'
                      : isFunded
                      ? 'Condición de capital cumplida'
                      : `Requiere ${(agent.capitalRequired - availableCapital).toFixed(2)} € más`}
                  </span>

                  {agent.status === 'ACTIVE' ? (
                    <button
                      onClick={() => onPause(agent.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateClick(agent)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isFunded
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isLoading ? 'Verificando...' : 'Aprovisionar Agente'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
