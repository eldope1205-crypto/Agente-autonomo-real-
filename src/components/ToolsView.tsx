import React from 'react';
import {
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Globe,
  FileText,
} from 'lucide-react';
import { Tool } from '../types/index.js';

interface ToolsViewProps {
  tools: Tool[];
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools }) => {
  const getRiskBadge = (risk: Tool['risk']) => {
    switch (risk) {
      case 'ALTO':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';

      case 'MEDIO':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';

      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const getRiskIcon = (risk: Tool['risk']) => {
    if (risk === 'ALTO' || risk === 'MEDIO') {
      return <ShieldAlert className="w-3.5 h-3.5" />;
    }

    return <ShieldCheck className="w-3.5 h-3.5" />;
  };

  const getToolIcon = (toolId: string) => {
    if (toolId.includes('http') || toolId.includes('rss')) {
      return <Globe className="w-4 h-4 text-cyan-400" />;
    }

    if (toolId.includes('file') || toolId.includes('evidence')) {
      return <FileText className="w-4 h-4 text-violet-400" />;
    }

    if (toolId.includes('llm')) {
      return <Cpu className="w-4 h-4 text-indigo-400" />;
    }

    return <Wrench className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />

          <h2 className="text-base font-bold text-white tracking-tight">
            Herramientas del Sistema ({tools.length})
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Registro de las herramientas disponibles para investigación,
          procesamiento, generación de archivos y ejecución local.
          Las operaciones están sujetas a las validaciones y límites
          definidos por el servidor.
        </p>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />

          <div>
            <h3 className="text-xs font-bold text-indigo-300">
              Controles de seguridad
            </h3>

            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Las herramientas no reciben permisos ilimitados. Las
              operaciones externas pasan por las validaciones disponibles
              del servidor y el contenido obtenido de fuentes externas se
              trata como no confiable.
            </p>
          </div>
        </div>
      </div>

      {/* Tools */}
      {tools.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-3" />

          <p className="text-sm font-semibold text-slate-300">
            No hay herramientas registradas
          </p>

          <p className="text-xs text-slate-500 mt-1">
            El sistema todavía no tiene herramientas disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
            >
              {/* Tool header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {getToolIcon(tool.id)}

                    <span className="text-[10px] font-mono text-slate-500 uppercase truncate">
                      {tool.id}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1">
                    {tool.name}
                  </h3>
                </div>

                <div
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getRiskBadge(
                    tool.risk
                  )}`}
                >
                  {getRiskIcon(tool.risk)}
                  <span>RIESGO: {tool.risk}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed">
                {tool.description}
              </p>

              {/* Details */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">
                    Permisos declarados
                  </div>

                  <div className="font-mono text-slate-300 break-words leading-relaxed">
                    {tool.permissions?.length
                      ? tool.permissions.join(', ')
                      : 'Sin permisos declarados'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">
                    Límites operativos
                  </div>

                  <div className="font-mono text-slate-300 break-words leading-relaxed">
                    {tool.limits || 'Sin límites especificados'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">
                    Coste declarado
                  </div>

                  <div className="font-mono text-slate-300">
                    {Number.isFinite(tool.cost)
                      ? `${tool.cost} €`
                      : 'No especificado'}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <span className="text-slate-500 text-[11px]">
                  Disponibilidad
                </span>

                {tool.enabled ? (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    HABILITADA
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
                    DESHABILITADA
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
