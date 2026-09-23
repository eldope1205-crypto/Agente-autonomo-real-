import React from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Shield,
} from 'lucide-react';
import { Capability } from '../types/index.js';

interface CapabilitiesViewProps {
  capabilities: Capability[];
  onToggle: (id: string) => void;
}

export const CapabilitiesView: React.FC<CapabilitiesViewProps> = ({
  capabilities,
  onToggle,
}) => {
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

  const availableCount = capabilities.filter(
    (cap) =>
      cap.enabled &&
      cap.status === 'AVAILABLE'
  ).length;

  const configuredCount = capabilities.filter(
    (cap) => cap.status === 'AVAILABLE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />

              <h2 className="text-base font-bold text-white tracking-tight">
                Matriz de Capacidades ({capabilities.length})
              </h2>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Capacidades que el agente puede utilizar. Una capacidad debe
              estar disponible y habilitada para poder ser utilizada durante
              una tarea.
            </p>
          </div>

          <div className="flex gap-2 text-[10px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {availableCount} ACTIVAS
            </span>

            <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              {configuredCount} DISPONIBLES
            </span>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-bold text-indigo-300">
              Control de capacidades
            </p>

            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Deshabilitar una capacidad impide que el sistema la considere
              habilitada para nuevas tareas. No se conceden permisos externos
              automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((cap) => {
          const isAvailable =
            cap.status === 'AVAILABLE';

          const isEnabled =
            cap.enabled && isAvailable;

          return (
            <div
              key={cap.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isEnabled
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-80'
              }`}
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getLevelBadge(
                      cap.level
                    )}`}
                  >
                    NIVEL: {cap.level}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isAvailable
                      ? 'DISPONIBLE'
                      : 'REQUIERE CONFIG'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-bold text-white mb-1">
                  {cap.name}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {cap.description}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                {/* Tools */}
                <div className="flex items-start justify-between gap-3 text-slate-400">
                  <span className="flex items-center gap-1 shrink-0">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    Herramientas:
                  </span>

                  <span className="font-mono text-slate-300 font-semibold text-right truncate max-w-[170px]">
                    {cap.requiredTools.length > 0
                      ? cap.requiredTools.join(', ')
                      : 'Ninguna'}
                  </span>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between text-slate-400">
                  <span>Coste marginal:</span>

                  <span className="font-mono text-emerald-400 font-semibold">
                    {cap.cost}
                  </span>
                </div>

                {/* Availability */}
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    {isAvailable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}

                    Disponibilidad:
                  </span>

                  <span
                    className={
                      isAvailable
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    {isAvailable
                      ? 'Configurada'
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    Uso por el agente:
                  </span>

                  <button
                    onClick={() => onToggle(cap.id)}
                    disabled={!isAvailable}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                      !isAvailable
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : cap.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {!isAvailable
                      ? 'NO DISPONIBLE'
                      : cap.enabled
                      ? 'HABILITADA'
                      : 'DESHABILITADA'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {capabilities.length === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <Zap className="w-8 h-8 text-slate-600 mx-auto mb-3" />

          <p className="text-sm font-bold text-slate-300">
            No hay capacidades registradas
          </p>

          <p className="text-xs text-slate-500 mt-1">
            El sistema todavía no tiene capacidades configuradas.
          </p>
        </div>
      )}
    </div>
  );
};
