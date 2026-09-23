import React, { useState } from 'react';
import { FileCheck2, Hash, Download, CheckCircle2, Search, FileText, ExternalLink } from 'lucide-react';
import { EvidenceItem } from '../types/index.js';

interface EvidenceViewProps {
  evidence: EvidenceItem[];
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ evidence }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  const filtered = evidence.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fileHash && item.fileHash.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Almacén Inmutable de Evidencias y Auditoría ({evidence.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cada entregable generado por el agente se firma criptográficamente con SHA-256 y se conserva en disco para supervisión legal y técnica.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar evidencia, hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Evidence List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No hay evidencias registradas aún</p>
          <p className="text-xs text-slate-500 mt-1">
            Las evidencias se crean automáticamente al finalizar y firmar tareas autorizadas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    VERIFICADO
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  {item.fileSize && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      {(item.fileSize / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-sm">{item.title}</h3>

                {item.fileHash && (
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] truncate">
                    <Hash className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">SHA-256: {item.fileHash}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Inspeccionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Inspector */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Evidencia Auditada
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="text-slate-400">
                <strong className="text-slate-300">Ruta en Disco:</strong>{' '}
                <span className="text-slate-300 break-all">{selectedItem.filePath || 'data/evidence/'}</span>
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Hash SHA-256:</strong>{' '}
                <span className="text-cyan-400 break-all">{selectedItem.fileHash}</span>
              </div>
              <div className="text-slate-400">
                <strong className="text-slate-300">Fecha UTC:</strong> {selectedItem.timestamp}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1">Instantánea del Contenido:</h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono whitespace-pre-line max-h-60 overflow-y-auto">
                {selectedItem.contentSnapshot || 'Sin contenido de previsualización disponible'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
