import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  X,
  ExternalLink,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { Task, TaskStatus } from '../types/index.js';

interface TasksViewProps {
  tasks: Task[];
  onAuthorize: (id: string) => void;
  onExecute: (id: string) => void;
  onExecuteAll?: () => void;
  onCancel: (id: string) => void;
  onResolveHuman: (id: string, notes?: string) => void;
  onViewEvidence: (evidenceFile: string) => void;
  loading: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAuthorize,
  onExecute,
  onExecuteAll,
  onCancel,
  onResolveHuman,
  onViewEvidence,
  loading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [humanNotes, setHumanNotes] = useState('');

  const executableTasksCount = tasks.filter(
    (t) => t.status === 'READY' || t.status === 'AUTHORIZED'
  ).length;

  const filtered = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'NEEDS_HUMAN') return t.status === 'NEEDS_HUMAN';
    if (filterStatus === 'ACTIVE')
      return t.status === 'RUNNING' || t.status === 'AUTHORIZED' || t.status === 'READY';
    if (filterStatus === 'BLOCKED') return t.status === 'BLOCKED';
    if (filterStatus === 'COMPLETED') return t.status === 'COMPLETED';
    return t.status === filterStatus;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            LISTA (PREPARADA)
          </span>
        );
      case 'AUTHORIZED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            AUTORIZADA
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
            EJECUTANDO...
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            ENTREGADA (EN ESPERA)
          </span>
        );
      case 'WAITING_VERIFICATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
            VERIFICANDO...
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-600/50 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            BLOQUEADA (NO EJECUTABLE)
          </span>
        );
      case 'NEEDS_HUMAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            REQUIERE INTERVENCIÓN HUMANA
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETADA
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/40 text-rose-300 border border-rose-800">
            FALLIDA
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Global Execute Tasks Button */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Gestor de Tareas y Ejecutor Autónomo ({tasks.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Las tareas ejecutables se procesan de forma autónoma con firma criptográfica SHA-256 en disco. Las tareas fuera del alcance técnico se marcan como bloqueadas con acceso directo a la oportunidad original.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onExecuteAll && (
            <button
              onClick={onExecuteAll}
              disabled={loading || executableTasksCount === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Inicia la ejecución técnica real de todas las tareas preparadas o autorizadas"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>EJECUTAR TAREAS ({executableTasksCount})</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
            {['ALL', 'ACTIVE', 'NEEDS_HUMAN', 'BLOCKED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg transition text-[11px] font-semibold ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'Todas'
                  : st === 'ACTIVE'
                  ? 'Activas'
                  : st === 'NEEDS_HUMAN'
                  ? 'Requiere Humano'
                  : st === 'BLOCKED'
                  ? 'Bloqueadas'
                  : 'Completadas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No hay tareas en esta sección</p>
          <p className="text-xs text-slate-500 mt-1">
            Planifica una tarea desde la pestaña de Oportunidades o ejecuta un ciclo en modo PREPARE.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => {
            const isHumanNeeded = task.status === 'NEEDS_HUMAN';
            const isBlocked = task.status === 'BLOCKED';
            const originalUrl = task.opportunityUrl || (task.evidence && task.evidence[0]);

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isHumanNeeded
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/10'
                    : isBlocked
                    ? 'bg-amber-950/15 border-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(task.status)}
                      <span className="text-[11px] font-mono text-slate-400">
                        ID: {task.id.substring(0, 16)}...
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl line-clamp-2">
                      {task.description}
                    </p>

                    {/* Deliverable preview if ready */}
                    {task.deliverableFile && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate font-mono">{task.deliverableFile}</span>
                        </div>
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold shrink-0"
                        >
                          Ver Entregable
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 sm:border-l sm:border-slate-800 sm:pl-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Estimación</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {task.estimatedAmount > 0 ? `${task.estimatedAmount} €` : 'A convenir'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {task.status === 'READY' && (
                        <button
                          onClick={() => onAuthorize(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                        >
                          Autorizar
                        </button>
                      )}

                      {(task.status === 'READY' || task.status === 'AUTHORIZED') && (
                        <button
                          onClick={() => onExecute(task.id)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Ejecutar
                        </button>
                      )}

                      {/* HACER TAREA Button for BLOCKED tasks */}
                      {isBlocked && (
                        <div>
                          {originalUrl ? (
                            <a
                              href={originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow inline-flex items-center gap-1.5"
                              title={`Abrir oportunidad en ${originalUrl}`}
                            >
                              <span>HACER TAREA</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono font-bold">
                              URL NO DISPONIBLE
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Ver Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* BLOCKED Task Banner with Real URL access (Section 15) */}
                {isBlocked && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Tarea No Ejecutable Autónomamente por el Agente</span>
                      </div>
                      <p className="text-slate-300">
                        {task.error || 'Requiere capacidades externas o herramientas fuera del entorno autónomo disponible.'}
                      </p>
                      {originalUrl && (
                        <div className="text-[11px] font-mono text-slate-400 truncate max-w-xl">
                          Fuente de origen: <span className="text-amber-200 underline">{originalUrl}</span>
                        </div>
                      )}
                    </div>

                    {originalUrl ? (
                      <a
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow shrink-0 inline-flex items-center justify-center gap-1.5"
                      >
                        <span>HACER TAREA</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-500">
                        URL NO DISPONIBLE
                      </span>
                    )}
                  </div>
                )}

                {/* Real Human Intervention Card (Section 16) */}
                {isHumanNeeded && task.humanRequirement && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      Intervención Humana Requerida para Continuar Ejecución
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-300 mb-1">¿Por qué es requerida?</div>
                        <p className="text-slate-400">{task.humanRequirement.reason}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-300 mb-1">Acción Requerida del Usuario</div>
                        <p className="text-slate-400 whitespace-pre-line">
                          {task.humanRequirement.whatUserMustDo}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="font-bold text-slate-300 mb-1">Continuación Automática</div>
                        <p className="text-slate-400">{task.humanRequirement.whatHappensNext}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Notas o confirmación de la acción completada..."
                        value={humanNotes}
                        onChange={(e) => setHumanNotes(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => {
                          onResolveHuman(task.id, humanNotes);
                          setHumanNotes('');
                        }}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
                      >
                        Marcar Resuelta y Reanudar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Plan & Deliverable Drawer/Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getStatusBadge(selectedTask.status)}
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedTask.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If blocked in modal */}
            {selectedTask.status === 'BLOCKED' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-amber-300">Tarea Bloqueada para el Agente</div>
                  <div className="text-slate-300 mt-0.5">{selectedTask.error}</div>
                </div>
                {selectedTask.opportunityUrl || selectedTask.evidence[0] ? (
                  <a
                    href={selectedTask.opportunityUrl || selectedTask.evidence[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>HACER TAREA</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-slate-500 font-mono font-bold">URL NO DISPONIBLE</span>
                )}
              </div>
            )}

            {/* Plan Steps Accordion */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Pasos del Plan de Ejecución
              </h4>

              {selectedTask.plan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Paso {step.stepNumber}: {step.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : step.status === 'RUNNING'
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{step.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Herramienta requerida: <span className="text-cyan-400">{step.requiredTool}</span>
                  </div>

                  {step.output && (
                    <div className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono whitespace-pre-line max-h-32 overflow-y-auto">
                      {step.output}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Deliverable Full Preview */}
            {selectedTask.deliverablePreview && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Vista Previa del Entregable Digital Generado
                </h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono whitespace-pre-line max-h-60 overflow-y-auto">
                  {selectedTask.deliverablePreview}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
              {(selectedTask.status === 'READY' || selectedTask.status === 'AUTHORIZED') && (
                <button
                  onClick={() => {
                    onExecute(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Ejecutar Tarea Ahora
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
