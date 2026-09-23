import React, { useState } from 'react';
import {
  Compass,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  CheckSquare,
} from 'lucide-react';
import { Opportunity, OpportunityStatus } from '../types/index.js';

interface OpportunitiesViewProps {
  opportunities: Opportunity[];
  onPlanTask: (opportunityId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  onPlanTask,
  onRefresh,
  loading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const filtered = opportunities.filter((opp) => {
    const matchesFilter = filterStatus === 'ALL' || opp.status === filterStatus;
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: OpportunityStatus) => {
    switch (status) {
      case 'READY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            LISTA (VIABLE)
          </span>
        );
      case 'PLANNED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            PLANIFICADA
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            DESCARTADA
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            BLOQUEADA (RIESGO)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            COMPLETADA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            NUEVA
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Oportunidades Descubiertas en Internet ({opportunities.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Extracción limpia de canales públicos (RSS, JSON, XML). El agente evalúa si la ejecución técnica es viable.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar título, fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
            {['ALL', 'READY', 'PLANNED', 'NEW', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-semibold ${
                  filterStatus === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todas' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No se encontraron oportunidades</p>
          <p className="text-xs text-slate-500 mt-1">
            Ejecuta un ciclo o añade nuevas fuentes públicas para descubrir trabajos digitales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpp(opp)}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(opp.status)}
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    {opp.source}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(opp.detectedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{opp.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>

                {opp.requirements.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {opp.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:border-l sm:border-slate-800/80 sm:pl-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Puntuación</div>
                  <div className="text-base font-black text-white font-mono flex items-center gap-1 justify-end">
                    <span className={opp.score >= 50 ? 'text-emerald-400' : 'text-slate-400'}>
                      {opp.score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {opp.paymentText || 'Por cotizar'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {opp.status === 'READY' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlanTask(opp.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Planificar
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {getStatusBadge(selectedOpp.status)}
                  <span className="text-xs font-mono text-slate-400">
                    Fuente: {selectedOpp.source}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedOpp.title}</h3>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Link to Source */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-md font-mono">
                {selectedOpp.url || 'URL NO DISPONIBLE'}
              </span>
              {selectedOpp.url ? (
                <a
                  href={selectedOpp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 font-medium"
                >
                  Abrir fuente original <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-slate-500 font-mono font-bold">URL NO DISPONIBLE</span>
              )}
            </div>

            {/* Score Breakdown Grid */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Desglose Transparente del Motor de Decisión
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Compatibilidad</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {selectedOpp.scoreBreakdown?.capabilityMatchScore || 0} / 30 pts
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Automatización</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {selectedOpp.scoreBreakdown?.automationFeasibilityScore || 0} / 25 pts
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Fiabilidad Fuente</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {selectedOpp.scoreBreakdown?.sourceReliabilityScore || 0} / 15 pts
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Penalización Riesgo</div>
                  <div className="text-sm font-bold text-rose-400 font-mono">
                    -{selectedOpp.scoreBreakdown?.riskPenalty || 0} pts
                  </div>
                </div>
              </div>

              {selectedOpp.rejectionReason && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-bold">Motivo de Descarte / Bloqueo:</span>{' '}
                  {selectedOpp.rejectionReason}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1">Descripción Completa:</h4>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-mono">
                {selectedOpp.description}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
              {selectedOpp.status === 'READY' && (
                <button
                  onClick={() => {
                    onPlanTask(selectedOpp.id);
                    setSelectedOpp(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Planificar Tarea de Trabajo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
