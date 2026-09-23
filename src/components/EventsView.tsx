import React, { useState } from 'react';
import { History, Search } from 'lucide-react';
import { AgentEvent } from '../types/index.js';

interface EventsViewProps {
  events: AgentEvent[];
}

export const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = events.filter((evt) => {
    const matchesSeverity =
      filterSeverity === 'ALL' || evt.severity === filterSeverity;

    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      query === '' ||
      evt.title.toLowerCase().includes(query) ||
      evt.message.toLowerCase().includes(query) ||
      evt.type.toLowerCase().includes(query);

    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';

      case 'INFO':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';

      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return `${date.toLocaleTimeString()} • ${date.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />

            <h2 className="text-base font-bold text-white tracking-tight">
              Bitácora de Eventos ({events.length})
            </h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico de acciones, validaciones, errores,
            operaciones financieras y cambios del agente.
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
            {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-semibold ${
                  filterSeverity === severity
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />

          <p className="text-sm font-semibold text-slate-300">
            No hay eventos con estos filtros
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Prueba con otro término de búsqueda o cambia el nivel de severidad.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-900 transition"
            >
              <div className="space-y-1 flex-1 min-w-0">
                {/* Event metadata */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getSeverityBadge(
                      evt.severity,
                    )}`}
                  >
                    {evt.severity}
                  </span>

                  <span className="font-mono text-slate-400 text-[11px]">
                    {evt.type}
                  </span>

                  <span className="text-slate-500 font-mono text-[10px]">
                    {formatTimestamp(evt.timestamp)}
                  </span>
                </div>

                {/* Title */}
                <div className="font-bold text-white text-sm">
                  {evt.title}
                </div>

                {/* Message */}
                <p className="text-slate-400 text-xs leading-relaxed break-words">
                  {evt.message}
                </p>

                {/* Metadata */}
                {evt.metadata &&
                  Object.keys(evt.metadata).length > 0 && (
                    <details className="pt-1">
                      <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-300">
                        Ver metadatos
                      </summary>

                      <pre className="mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(evt.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
