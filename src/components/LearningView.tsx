import React from 'react';
import {
  BrainCircuit,
  RotateCw,
  Lightbulb,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { LearningInsight } from '../types/index.js';

interface LearningViewProps {
  insights: LearningInsight[];
  onEvaluate: () => Promise<void>;
  loading: boolean;
}

export const LearningView: React.FC<LearningViewProps> = ({
  insights,
  onEvaluate,
  loading,
}) => {
  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />

            <h2 className="text-base font-bold text-white tracking-tight">
              Aprendizaje y Optimización
            </h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Analiza el historial real de oportunidades, tareas y fuentes para generar propuestas de mejora.
          </p>
        </div>

        <button
          onClick={onEvaluate}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
          />

          {loading ? 'Evaluando...' : 'Evaluar Ahora'}
        </button>
      </div>

      {/* Security / behavior notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />

        <div>
          <div className="text-xs font-bold text-slate-200">
            Aprendizaje controlado
          </div>

          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Las evaluaciones se basan en datos registrados. Las propuestas no
            conceden permisos, no cambian las reglas de seguridad y no inventan
            ingresos ni resultados.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {insights.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto mb-2" />

          <p className="text-sm font-semibold text-slate-300">
            No hay evaluaciones registradas
          </p>

          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Ejecuta un ciclo o pulsa «Evaluar Ahora» para analizar los datos
            disponibles.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
            >
              {/* Insight header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                    {insight.category}
                  </span>

                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(insight.createdAt)}
                  </span>
                </div>
              </div>

              {/* Observation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Observación
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {insight.observation}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">
                    Oportunidades
                  </div>

                  <div className="text-sm font-bold text-white font-mono">
                    {insight.metrics.totalOpportunitiesEvaluated}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">
                    Aceptación
                  </div>

                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {insight.metrics.acceptanceRate}%
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">
                    Éxito tareas
                  </div>

                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {insight.metrics.tasksSuccessRate}%
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">
                    Tiempo medio
                  </div>

                  <div className="text-sm font-bold text-indigo-300 font-mono">
                    {insight.metrics.avgExecutionSeconds}s
                  </div>
                </div>
              </div>

              {/* Proposals */}
              {insight.proposals.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Propuestas de optimización
                  </div>

                  <ul className="space-y-1.5 text-slate-300 pl-5 list-disc text-xs leading-relaxed">
                    {insight.proposals.map((proposal, index) => (
                      <li key={`${insight.id}-proposal-${index}`}>
                        {proposal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.proposals.length === 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                  No se generaron propuestas para esta evaluación.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
