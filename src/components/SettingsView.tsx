import React, { useEffect, useState } from 'react';
import {
  Settings,
  Sliders,
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { AppSettings, AgentMode } from '../types/index.js';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formName, setFormName] = useState('Agente Autónomo');
  const [formMode, setFormMode] = useState<AgentMode>('PREPARE');
  const [formInterval, setFormInterval] = useState(120);

  const [formMaxSpendTask, setFormMaxSpendTask] = useState(0);
  const [formMaxDailySpend, setFormMaxDailySpend] = useState(0);
  const [formMinReserve, setFormMinReserve] = useState(0);

  const [formRequireSpendAuth, setFormRequireSpendAuth] = useState(true);
  const [formRequireExecAuth, setFormRequireExecAuth] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!settings) return;

    setFormName(settings.agentName || 'Agente Autónomo');
    setFormMode(settings.agentMode || 'PREPARE');

    const interval = Number(settings.searchInterval);
    setFormInterval(
      Number.isFinite(interval) && interval >= 30 ? interval : 120
    );

    const limits = settings.financialLimits;

    setFormMaxSpendTask(
      Number.isFinite(Number(limits?.maxSpendPerTask))
        ? Number(limits?.maxSpendPerTask)
        : 0
    );

    setFormMaxDailySpend(
      Number.isFinite(Number(limits?.maxDailySpend))
        ? Number(limits?.maxDailySpend)
        : 0
    );

    setFormMinReserve(
      Number.isFinite(Number(limits?.minReserve))
        ? Number(limits?.minReserve)
        : 0
    );

    setFormRequireSpendAuth(
      limits?.requireSpendAuthorization ?? true
    );

    setFormRequireExecAuth(
      settings.requireExecutionAuthorization ?? false
    );
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg('');

    const interval = Number(formInterval);
    const maxSpendTask = Number(formMaxSpendTask);
    const maxDailySpend = Number(formMaxDailySpend);
    const minReserve = Number(formMinReserve);

    if (!formName.trim()) {
      setErrorMsg('El nombre del agente no puede estar vacío.');
      setSaving(false);
      return;
    }

    if (!Number.isFinite(interval) || interval < 30 || interval > 3600) {
      setErrorMsg('El intervalo debe estar entre 30 y 3600 segundos.');
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(maxSpendTask) ||
      maxSpendTask < 0 ||
      !Number.isFinite(maxDailySpend) ||
      maxDailySpend < 0 ||
      !Number.isFinite(minReserve) ||
      minReserve < 0
    ) {
      setErrorMsg('Los límites financieros deben ser números válidos.');
      setSaving(false);
      return;
    }

    try {
      await onSaveSettings({
        agentName: formName.trim(),
        agentMode: formMode,
        searchInterval: interval,
        requireExecutionAuthorization: formRequireExecAuth,
        financialLimits: {
          maxSpendPerTask: maxSpendTask,
          maxDailySpend: maxDailySpend,
          minReserve,
          requireSpendAuthorization: formRequireSpendAuth,
        },
      });

      setSavedSuccess(true);

      window.setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al guardar la configuración.';

      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />

          <h2 className="text-base font-bold text-white tracking-tight">
            Configuración y Parámetros del Sistema
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Configura el comportamiento del agente, sus ciclos y sus límites
          financieros.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Directivas Generales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nombre del Agente:
              </label>

              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Modo de Operación:
              </label>

              <select
                value={formMode}
                onChange={(e) =>
                  setFormMode(e.target.value as AgentMode)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="OBSERVE">
                  OBSERVE — búsqueda y análisis
                </option>

                <option value="PREPARE">
                  PREPARE — análisis y preparación
                </option>

                <option value="AUTHORIZED">
                  AUTHORIZED — ejecución permitida
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Intervalo de ciclos automáticos:
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                max={3600}
                value={formInterval}
                onChange={(e) =>
                  setFormInterval(Number(e.target.value))
                }
                className="w-full md:w-64 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />

              <span className="text-xs text-slate-500">
                segundos
              </span>
            </div>

            <p className="text-[10px] text-slate-500 mt-1">
              Mínimo 30 segundos. El programador respeta este intervalo para
              evitar ciclos demasiado frecuentes.
            </p>
          </div>
        </div>

        {/* Execution authorization */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Control de Ejecución
          </h3>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formRequireExecAuth}
                onChange={(e) =>
                  setFormRequireExecAuth(e.target.checked)
                }
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />

              <span>
                <span className="block text-slate-200 font-semibold">
                  Exigir autorización humana para ejecutar tareas
                </span>

                <span className="block text-[10px] text-slate-500 mt-1">
                  Si está activo, las tareas no deberían ejecutarse hasta que
                  exista una autorización válida.
                </span>
              </span>
            </label>
          </div>

          <div className="text-[10px] text-slate-500">
            El modo OBSERVE y PREPARE están orientados a investigar y preparar.
            AUTHORIZED permite trabajar con las tareas que superen los
            controles del sistema.
          </div>
        </div>

        {/* Financial limits */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Límites Financieros
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Gasto máximo por tarea (€):
              </label>

              <input
                type="number"
                step="0.01"
                min={0}
                value={formMaxSpendTask}
                onChange={(e) =>
                  setFormMaxSpendTask(Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Gasto máximo diario (€):
              </label>

              <input
                type="number"
                step="0.01"
                min={0}
                value={formMaxDailySpend}
                onChange={(e) =>
                  setFormMaxDailySpend(Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Reserva mínima (€):
              </label>

              <input
                type="number"
                step="0.01"
                min={0}
                value={formMinReserve}
                onChange={(e) =>
                  setFormMinReserve(Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formRequireSpendAuth}
                onChange={(e) =>
                  setFormRequireSpendAuth(e.target.checked)
                }
                className="mt-0.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />

              <span>
                <span className="text-slate-200 font-medium">
                  Exigir autorización humana previa para gastos reales
                </span>

                <span className="block text-[10px] text-slate-500 mt-1">
                  El agente no debe inventar capital ni realizar gastos fuera
                  de los límites configurados.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Reality / accounting notice */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />

            <div>
              <p className="text-xs font-semibold text-emerald-300">
                Contabilidad basada en evidencia
              </p>

              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Los ingresos pendientes no aumentan el capital disponible.
                Solo un ingreso confirmado con evidencia válida puede pasar a
                capital confirmado.
              </p>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="min-h-[24px]">
            {savedSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                Configuración guardada correctamente.
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />

            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
