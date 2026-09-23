import React from 'react';
import { Wrench, ShieldAlert, ShieldCheck, Cpu } from 'lucide-react';
import { Tool } from '../types/index.js';

interface ToolsViewProps {
  tools: Tool[];
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools }) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'ALTO':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MEDIO':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Registro de Herramientas del Sistema ({tools.length})
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Utilidades ejecutoras del agente. Cada herramienta opera bajo sandbox de seguridad con límites estrictos de memoria, red y almacenamiento.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{tool.id}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{tool.name}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getRiskBadge(tool.risk)}`}>
                RIESGO: {tool.risk}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {tool.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Permisos del Sistema:</span>
                <span className="font-mono text-slate-300 font-semibold truncate max-w-[200px]">
                  {tool.permissions.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Límites Operativos:</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]">
                  {tool.limits}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 text-[11px]">Disponibilidad:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LISTA PARA EJECUCIÓN
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
