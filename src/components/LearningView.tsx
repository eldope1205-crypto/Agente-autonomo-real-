import React from 'react';
import { BrainCircuit, TrendingUp, Sparkles, CheckCircle2, RotateCw, Lightbulb } from 'lucide-react';
import { LearningInsight } from '../types/index.js';

interface LearningViewProps {
  insights: LearningInsight[];
  onEvaluate: () => Promise<void>;
  loading: boolean;
}

export const LearningView: React.FC<LearningViewProps> = ({ insights, onEvaluate, loading }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Motor de Aprendizaje y Optimización Heurística
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audita el rendimiento histórico, tasas de aceptación de oportunidades y eficiencia de fuentes públicas.
          </p>
        </div>

        <button
          onClick={onEvaluate}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Evaluar Ciclos Ahora
        </button>
      </div>

      {/* Insights Stream */}
      {insights.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No hay evaluaciones registradas aún</p>
          <p className="text-xs text-slate-500 mt-1">
            El motor evalúa automáticamente al final de cada ciclo, o puedes presionar "Evaluar Ciclos Ahora".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                    CATEGORÍA: {insight.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(insight.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {insight.observation}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Evaluadas</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {insight.metrics.totalOpportunitiesEvaluated} opps
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Tasa de Aceptación</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {insight.metrics.acceptanceRate}%
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Éxito en Tareas</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {insight.metrics.tasksSuccessRate}%
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Tiempo Medio</div>
                  <div className="text-sm font-bold text-indigo-300 font-mono">
                    {insight.metrics.avgExecutionSeconds}s
                  </div>
                </div>
              </div>

              {/* Proposals */}
              {insight.proposals.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Propuestas de Optimización del Agente:
                  </div>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc text-xs">
                    {insight.proposals.map((prop, idx) => (
                      <li key={idx}>{prop}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
