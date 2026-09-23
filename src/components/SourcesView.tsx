import React, { useState } from 'react';
import {
  Globe,
  Plus,
  RotateCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Source, SourceType } from '../types/index.js';

interface SourcesViewProps {
  sources: Source[];
  onAddSource: (data: {
    name: string;
    url: string;
    type: SourceType;
    category?: string;
    description?: string;
  }) => Promise<void>;
  onRemoveSource: (id: string) => Promise<void>;
  onToggleSource: (id: string, enabled: boolean) => Promise<void>;
  onTestSource: (id: string) => Promise<{ success: boolean; rawLength: number; error?: string }>;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  onAddSource,
  onRemoveSource,
  onToggleSource,
  onTestSource,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formType, setFormType] = useState<SourceType>('RSS');
  const [formCategory, setFormCategory] = useState('tecnología');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await onTestSource(id);
      if (res.success) {
        setTestResult({
          id,
          success: true,
          msg: `Respuesta exitosa (HTTP 200). Datos recibidos: ${(res.rawLength / 1024).toFixed(1)} KB.`,
        });
      } else {
        setTestResult({
          id,
          success: false,
          msg: `Fallo de conexión: ${res.error || 'Código no exitoso'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        msg: `Error: ${err.message}`,
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await onAddSource({
        name: formName,
        url: formUrl,
        type: formType,
        category: formCategory,
        description: formDesc,
      });
      setShowAddModal(false);
      setFormName('');
      setFormUrl('');
      setFormDesc('');
    } catch (err: any) {
      setFormError(err.message || 'Error al añadir fuente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Gestor de Fuentes Públicas de Internet ({sources.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conectores para fuentes abiertas y legales. Protegidas contra SSRF y redes privadas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Añadir Fuente Pública
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => {
          const isTesting = testingId === src.id;
          const result = testResult?.id === src.id ? testResult : null;

          return (
            <div
              key={src.id}
              className={`p-5 rounded-2xl border transition-all ${
                src.status === 'ERROR'
                  ? 'bg-rose-950/10 border-rose-900/50'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      {src.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        src.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : src.status === 'ERROR'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {src.status === 'ACTIVE' ? 'ACTIVA' : src.status === 'ERROR' ? 'ERROR' : 'NO COMPROBADA'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{src.name}</h3>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-slate-300 truncate block max-w-sm mt-0.5 font-mono"
                  >
                    {src.url}
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTest(src.id)}
                    disabled={isTesting}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
                    title="Probar conexión ahora"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => onRemoveSource(src.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs transition"
                    title="Eliminar fuente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] mb-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">Latencia</div>
                  <div className="font-bold text-slate-300 font-mono">
                    {src.responseTime !== null ? `${src.responseTime} ms` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">Oportunidades</div>
                  <div className="font-bold text-cyan-400 font-mono">{src.opportunitiesFound}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">Última revisión</div>
                  <div className="text-slate-400 font-mono truncate">
                    {src.lastChecked ? new Date(src.lastChecked).toLocaleTimeString() : 'Nunca'}
                  </div>
                </div>
              </div>

              {/* Test Result Message */}
              {result && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-mono mb-3 ${
                    result.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  }`}
                >
                  {result.msg}
                </div>
              )}

              {/* Errors Log */}
              {src.errors.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Historial de fallos ({src.errors.length}):
                  </div>
                  <p className="font-mono text-[10px] text-rose-400 truncate">
                    {src.errors[0]}
                  </p>
                </div>
              )}

              {/* Toggle switch */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Escaneo activo en ciclos:</span>
                <button
                  onClick={() => onToggleSource(src.id, !src.enabled)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                    src.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {src.enabled ? 'HABILITADA' : 'DESHABILITADA'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Añadir Fuente Pública Real</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de la Fuente:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. RemoteOK RSS, HackerNews Jobs..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL Pública (HTTP/HTTPS):
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Se verificará contra SSRF (localhost, 127.0.0.1 y redes privadas están prohibidas).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Formato:
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as SourceType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="RSS">RSS Feed</option>
                  <option value="ATOM">Atom Feed</option>
                  <option value="XML">XML Estructurado</option>
                  <option value="JSON">API JSON Pública</option>
                  <option value="HTML">Página HTML</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría:
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descripción / Notas:
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Canal de contratación o agregador digital..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Verificando...' : 'Guardar Fuente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
