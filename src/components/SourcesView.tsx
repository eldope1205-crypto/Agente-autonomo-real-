import React, { useState } from 'react';
import {
  Globe,
  Plus,
  RotateCw,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  XCircle,
  CheckCircle2,
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
  onTestSource: (
    id: string
  ) => Promise<{
    success: boolean;
    rawLength: number;
    error?: string;
  }>;
}

interface TestResult {
  id: string;
  success: boolean;
  msg: string;
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
  const [testResult, setTestResult] = useState<TestResult | null>(null);

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
      const result = await onTestSource(id);

      if (result.success) {
        setTestResult({
          id,
          success: true,
          msg: `Respuesta correcta. Datos recibidos: ${(
            result.rawLength / 1024
          ).toFixed(1)} KB.`,
        });
      } else {
        setTestResult({
          id,
          success: false,
          msg: `Fallo de conexión: ${
            result.error || 'respuesta no válida'
          }`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        id,
        success: false,
        msg:
          err instanceof Error
            ? `Error: ${err.message}`
            : 'Error desconocido al probar la fuente.',
      });
    } finally {
      setTestingId(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormType('RSS');
    setFormCategory('tecnología');
    setFormDesc('');
    setFormError('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError('');

    const name = formName.trim();
    const url = formUrl.trim();
    const category = formCategory.trim();
    const description = formDesc.trim();

    if (!name) {
      setFormError('El nombre de la fuente es obligatorio.');
      return;
    }

    if (!url) {
      setFormError('La URL de la fuente es obligatoria.');
      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== 'http:' &&
        parsedUrl.protocol !== 'https:'
      ) {
        setFormError(
          'Solo se permiten URLs HTTP o HTTPS.'
        );
        return;
      }

      if (parsedUrl.username || parsedUrl.password) {
        setFormError(
          'No se permiten credenciales incrustadas en la URL.'
        );
        return;
      }
    } catch {
      setFormError('La URL introducida no es válida.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddSource({
        name,
        url,
        type: formType,
        category: category || 'general',
        description,
      });

      setShowAddModal(false);
      resetForm();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Error al añadir la fuente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await onRemoveSource(id);

      if (testResult?.id === id) {
        setTestResult(null);
      }
    } catch {
      // El componente padre gestiona el error.
    }
  };

  const getStatusLabel = (status: Source['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'ACTIVA';
      case 'ERROR':
        return 'ERROR';
      case 'DISABLED':
        return 'DESHABILITADA';
      case 'UNCHECKED':
      default:
        return 'NO COMPROBADA';
    }
  };

  const getStatusClass = (status: Source['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';

      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';

      case 'DISABLED':
        return 'bg-slate-800 text-slate-500 border border-slate-700';

      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
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
              Fuentes Públicas de Internet ({sources.length})
            </h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Fuentes abiertas utilizadas para descubrir oportunidades. Las
            URLs se validan antes de ser utilizadas por el servidor.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Añadir Fuente
        </button>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/40">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />

          <div>
            <p className="text-xs font-semibold text-cyan-300">
              Validación de fuentes
            </p>

            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              El servidor restringe los esquemas permitidos y bloquea
              destinos locales, internos y redes privadas conocidas.
              El contenido recibido se trata como externo y no confiable.
            </p>
          </div>
        </div>
      </div>

      {/* Sources */}
      {sources.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
          <Globe className="w-8 h-8 text-slate-600 mx-auto mb-3" />

          <h3 className="text-sm font-bold text-slate-300">
            No hay fuentes configuradas
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Añade una fuente pública para comenzar a descubrir
            oportunidades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => {
            const isTesting = testingId === src.id;
            const result =
              testResult?.id === src.id ? testResult : null;

            return (
              <div
                key={src.id}
                className={`p-5 rounded-2xl border transition-all ${
                  src.status === 'ERROR'
                    ? 'bg-rose-950/10 border-rose-900/50'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Source header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        {src.type}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusClass(
                          src.status
                        )}`}
                      >
                        {getStatusLabel(src.status)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">
                      {src.name}
                    </h3>

                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-slate-300 truncate block max-w-sm mt-0.5 font-mono"
                    >
                      {src.url}
                    </a>

                    {src.category && (
                      <div className="text-[10px] text-slate-600 mt-1">
                        Categoría: {src.category}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleTest(src.id)}
                      disabled={isTesting}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
                      title="Probar conexión"
                    >
                      <RotateCw
                        className={`w-3.5 h-3.5 ${
                          isTesting
                            ? 'animate-spin text-cyan-400'
                            : ''
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleRemove(src.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition"
                      title="Eliminar fuente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {src.description && (
                  <p className="text-[11px] text-slate-500 mb-3">
                    {src.description}
                  </p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Latencia
                    </div>

                    <div className="font-bold text-slate-300 font-mono mt-0.5">
                      {src.responseTime !== null &&
                      src.responseTime !== undefined
                        ? `${src.responseTime} ms`
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Oportunidades
                    </div>

                    <div className="font-bold text-cyan-400 font-mono mt-0.5">
                      {src.opportunitiesFound}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Última revisión
                    </div>

                    <div className="text-slate-400 font-mono truncate mt-0.5">
                      {src.lastChecked
                        ? new Date(
                            src.lastChecked
                          ).toLocaleTimeString()
                        : 'Nunca'}
                    </div>
                  </div>
                </div>

                {/* Test result */}
                {result && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-mono mb-3 flex items-start gap-2 ${
                      result.success
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}

                    <span>{result.msg}</span>
                  </div>
                )}

                {/* Error history */}
                {src.errors.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Historial de fallos ({src.errors.length})
                    </div>

                    <p className="font-mono text-[10px] text-rose-400 truncate">
                      {src.errors[0]}
                    </p>
                  </div>
                )}

                {/* Toggle */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Escaneo activo en ciclos:
                  </span>

                  <button
                    onClick={() =>
                      onToggleSource(src.id, !src.enabled)
                    }
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                      src.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {src.enabled
                      ? 'HABILITADA'
                      : 'DESHABILITADA'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Añadir Fuente Pública
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  La URL será validada por el servidor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre:
              </label>

              <input
                type="text"
                required
                placeholder="Ej. RemoteOK RSS"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL pública:
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
                Solo HTTP/HTTPS. El servidor rechazará destinos locales o
                privados conocidos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo:
                </label>

                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as SourceType)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="RSS">RSS Feed</option>
                  <option value="ATOM">Atom Feed</option>
                  <option value="XML">XML</option>
                  <option value="JSON">JSON</option>
                  <option value="HTML">HTML</option>
                  <option value="SITEMAP">Sitemap</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría:
                </label>

                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descripción:
              </label>

              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Descripción de la fuente..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Validando...'
                  : 'Guardar Fuente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
