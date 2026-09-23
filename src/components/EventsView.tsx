import React, { useState } from 'react';
import { History, Filter, AlertTriangle, CheckCircle2, Info, AlertCircle, Search } from 'lucide-react';
import { AgentEvent } from '../types/index.js';

interface EventsViewProps {
  events: AgentEvent[];
}

export const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = events.filter((evt) => {
    const matchesSev = filterSeverity === 'ALL' || evt.severity === filterSeverity;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
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
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Bitácora Inmutable de Eventos del Sistema ({events.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico auditable de cada acción, error, validación y asentamiento realizado.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar evento, tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
            {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-semibold ${
                  filterSeverity === sev ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Stream */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No hay eventos con estos filtros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-900 transition"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getSeverityBadge(evt.severity)}`}>
                    {evt.severity}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{evt.type}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(evt.timestamp).toLocaleTimeString()} • {new Date(evt.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="font-bold text-white text-sm">{evt.title}</div>
                <p className="text-slate-400 text-xs leading-relaxed">{evt.message}</p>

                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="pt-1 font-mono text-[10px] text-slate-400">
                    Metadata: {JSON.stringify(evt.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
