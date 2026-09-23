import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, DollarSign, Clock, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings, AgentMode } from '../types/index.js';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [formName, setFormName] = useState('');
  const [formMode, setFormMode] = useState<AgentMode>('PREPARE');
  const [formInterval, setFormInterval] = useState(120);
  const [formMaxSpendTask, setFormMaxSpendTask] = useState(5);
  const [formMaxDailySpend, setFormMaxDailySpend] = useState(10);
  const [formMinReserve, setFormMinReserve] = useState(0);
  const [formRequireSpendAuth, setFormRequireSpendAuth] = useState(true);
  const [formRequireExecAuth, setFormRequireExecAuth] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setFormName(settings.agentName || 'Agente Autónomo');
      setFormMode(settings.agentMode || 'PREPARE');
      setFormInterval(settings.searchInterval || 120);
      setFormMaxSpendTask(settings.financialLimits?.maxSpendPerTask || 5);
      setFormMaxDailySpend(settings.financialLimits?.maxDailySpend || 10);
      setFormMinReserve(settings.financialLimits?.minReserve || 0);
      setFormRequireSpendAuth(settings.financialLimits?.requireSpendAuthorization ?? true);
      setFormRequireExecAuth(settings.requireExecutionAuthorization ?? false);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg('');

    try {
      await onSaveSettings({
        agentName: formName,
        agentMode: formMode,
        searchInterval: Number(formInterval),
        requireExecutionAuthorization: formRequireExecAuth,
        financialLimits: {
          maxSpendPerTask: Number(formMaxSpendTask),
          maxDailySpend: Number(formMaxDailySpend),
          minReserve: Number(formMinReserve),
          requireSpendAuthorization: formRequireSpendAuth,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la configuración');
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
          Ajuste de directivas de supervisión, límites financieros y programación de ciclos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: General & Mode */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Directivas Generales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nombre del Agente Digital:
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Modo de Operación:
              </label>
              <select
                value={formMode}
                onChange={(e) => setFormMode(e.target.value as AgentMode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <option value="OBSERVE">OBSERVE (Solo búsqueda y análisis)</option>
                <option value="PREPARE">PREPARE (Buscar, analizar y preparar planes)</option>
                <option value="AUTHORIZED">AUTHORIZED (Ejecutar tareas aprobadas)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 text-xs">
              Intervalo de Programación Automática (segundos):
            </label>
            <input
              type="number"
              min={30}
              max={3600}
              value={formInterval}
              onChange={(e) => setFormInterval(Number(e.target.value))}
              className="w-full md:w-64 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Frecuencia mínima de 30s para respetar cuotas y no saturar servidores remotos.
            </p>
          </div>
        </div>

        {/* Section 2: Financial Limits */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Límites Financieros y Políticas de Gasto Real
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Gasto Máx. por Tarea (€):
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formMaxSpendTask}
                onChange={(e) => setFormMaxSpendTask(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Gasto Máx. Diario (€):
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formMaxDailySpend}
                onChange={(e) => setFormMaxDailySpend(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Reserva Mínima Obligatoria (€):
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formMinReserve}
                onChange={(e) => setFormMinReserve(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formRequireSpendAuth}
                onChange={(e) => setFormRequireSpendAuth(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-slate-200 font-medium">
                Exigir autorización humana previa para cualquier gasto de dinero real
              </span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              Configuración guardada y persistida en disco.
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
