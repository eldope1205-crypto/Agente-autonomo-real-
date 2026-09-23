import React from 'react';
import { Zap, CheckCircle2, AlertCircle, Wrench, Shield } from 'lucide-react';
import { Capability } from '../types/index.js';

interface CapabilitiesViewProps {
  capabilities: Capability[];
  onToggle: (id: string) => void;
}

export const CapabilitiesView: React.FC<CapabilitiesViewProps> = ({ capabilities, onToggle }) => {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'EXPERTO':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'AVANZADO':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'INTERMEDIO':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Matriz de Capacidades Técnicas ({capabilities.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Habilidades que el agente posee técnicamente. Las oportunidades que demanden habilidades no disponibles son descartadas de inmediato.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((cap) => (
          <div
            key={cap.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              cap.enabled && cap.status === 'AVAILABLE'
                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/40 border-slate-800/40 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getLevelBadge(cap.level)}`}>
                  NIVEL: {cap.level}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cap.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {cap.status === 'AVAILABLE' ? 'DISPONIBLE' : 'REQUIERE CONFIG'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{cap.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {cap.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  Herramientas:
                </span>
                <span className="font-mono text-slate-300 font-semibold truncate max-w-[160px]">
                  {cap.requiredTools.join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Coste marginal:</span>
                <span className="font-mono text-emerald-400 font-semibold">{cap.cost}</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Estado activo:</span>
                <button
                  onClick={() => onToggle(cap.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                    cap.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {cap.enabled ? 'HABILITADA' : 'DESHABILITADA'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
