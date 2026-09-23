import React from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Globe,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  Cpu,
  Lock,
} from 'lucide-react';
import { SystemStatus, AgentEvent } from '../types/index.js';

interface DashboardViewProps {
  status: SystemStatus | null;
  events: AgentEvent[];
  onNavigateTab: (tab: string) => void;
  onRunCycle: () => void;
  isCycling: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  events,
  onNavigateTab,
  onRunCycle,
  isCycling,
}) => {
  const fin = status?.finances;
  const opps = status?.opportunitiesCount;
  const tks = status?.tasksCount;

  const cycleSteps = [
    'DISCOVER',
    'ANALYZE',
    'DECIDE',
    'PLAN',
    'EXECUTE',
    'VERIFY',
    'SUBMIT',
    'WAIT_PAYMENT',
    'CONFIRM_PAYMENT',
    'ACCOUNT',
    'LEARN',
    'REPEAT',
  ];

  const currentStep = status?.currentCycleStep || 'IDLE';
  const currentStepIndex = cycleSteps.indexOf(currentStep);

  return (
    <div className="space-y-6">

      {/* Human intervention */}
      {tks && tks.needsHuman > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-rose-300">
                Intervención humana requerida ({tks.needsHuman}{' '}
                {tks.needsHuman === 1 ? 'tarea' : 'tareas'})
              </h3>

              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                Algunas tareas requieren una acción humana, como credenciales,
                2FA, autorización o una acción que el agente no puede realizar
                de forma autónoma.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition"
          >
            Revisar
          </button>
        </div>
      )}

      {/* Blocked tasks */}
      {tks && tks.blocked > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Tareas bloqueadas ({tks.blocked})
              </h3>

              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                Estas tareas no pueden ejecutarse con las capacidades o
                permisos disponibles actualmente.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition"
          >
            Ver tareas
          </button>
        </div>
      )}

      {/* Autonomous cycle */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />

            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Ciclo Autónomo de Trabajo
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Ciclos completados:</span>

            <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {status?.cycleCount || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-12 gap-1.5">
          {cycleSteps.map((step, idx) => {
            const isCurrent = currentStep === step;
            const isPassed =
              currentStepIndex >= 0 &&
              currentStepIndex > idx;

            return (
              <div
                key={step}
                className={`px-2 py-2 rounded-xl text-center border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-md shadow-cyan-500/10 font-bold scale-[1.02]'
                    : isPassed
                    ? 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                }`}
              >
                <div className="text-[9px] font-mono text-slate-400 mb-0.5">
                  {idx + 1}
                </div>

                <div className="text-[10px] truncate font-semibold">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial reality */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Contabilidad Real
          </h3>

          <span className="text-[11px] text-slate-400">
            Solo ingresos y gastos confirmados afectan al capital
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Confirmed income */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-medium text-slate-400">
              Ingresos confirmados
            </div>

            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {fin?.confirmedIncome?.toFixed(2) || '0.00'} €
            </div>

            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Pendientes:</span>

              <span className="text-amber-400 font-mono font-medium">
                {fin?.pendingIncome?.toFixed(2) || '0.00'} €
              </span>
            </div>
          </div>

          {/* Confirmed expenses */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-medium text-slate-400">
              Gastos confirmados
            </div>

            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
              {fin?.confirmedExpense?.toFixed(2) || '0.00'} €
            </div>

            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Pendientes:</span>

              <span className="text-slate-400 font-mono">
                {fin?.pendingExpense?.toFixed(2) || '0.00'} €
              </span>
            </div>
          </div>

          {/* Available capital */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-medium text-slate-400">
              Capital real disponible
            </div>

            <div className="text-2xl font-black text-white mt-1 font-mono">
              {fin?.availableCapital?.toFixed(2) || '0.00'} €
            </div>

            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Reserva:</span>

              <span className="text-slate-300 font-mono">
                {fin?.reserve?.toFixed(2) || '0.00'} €
              </span>
            </div>
          </div>

          {/* Confirmed profit */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-medium text-slate-400">
              Beneficio neto confirmado
            </div>

            <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
              {fin?.confirmedProfit?.toFixed(2) || '0.00'} €
            </div>

            <div className="text-[11px] text-slate-400 mt-1">
              Ingresos confirmados − gastos confirmados
            </div>
          </div>
        </div>
      </div>

      {/* Operational metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">

        {/* Opportunities */}
        <button
          onClick={() => onNavigateTab('opportunities')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Oportunidades</span>
            <Compass className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="text-lg font-bold text-white mt-1 font-mono">
            {opps?.total || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            {opps?.ready || 0} viables
          </div>
        </button>

        {/* Ready tasks */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Listas</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
            {tks?.ready || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Para ejecutar
          </div>
        </button>

        {/* Running */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>En ejecución</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>

          <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
            {tks?.running || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Activas
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Completadas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
            {tks?.completed || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Verificadas
          </div>
        </button>

        {/* Blocked */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Bloqueadas</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
            {tks?.blocked || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Requieren revisión
          </div>
        </button>

        {/* Human */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Req. humano</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>

          <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
            {tks?.needsHuman || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Autorización / 2FA
          </div>
        </button>

        {/* Sources */}
        <button
          onClick={() => onNavigateTab('sources')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Fuentes</span>
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
            {status?.activeSourcesCount || 0} /{' '}
            {status?.totalSourcesCount || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Fuentes configuradas
          </div>
        </button>

        {/* Errors */}
        <button
          onClick={() => onNavigateTab('events')}
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
        >
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Errores</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>

          <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
            {status?.recentErrorsCount || 0}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            Registrados
          </div>
        </button>
      </div>

      {/* Agent directives + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent directives */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Directivas del agente
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              El sistema trabaja con un motor local determinista. Puede
              investigar fuentes públicas, analizar oportunidades, preparar
              tareas y generar entregables locales. Los pagos solo se
              consideran reales cuando existe confirmación verificable.
            </p>

            <div className="mt-4 space-y-2 text-xs">

              {/* Mode */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">
                  Modo de operación:
                </span>

                <span className="font-bold text-cyan-300 font-mono">
                  {status?.currentMode || 'OBSERVE'}
                </span>
              </div>

              {/* Scheduler */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">
                  Programador automático:
                </span>

                <span
                  className={`font-bold font-mono ${
                    status?.schedulerActive
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {status?.schedulerActive
                    ? 'ACTIVO'
                    : 'INACTIVO'}
                </span>
              </div>

              {/* Local engine */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">
                  Motor local:
                </span>

                <span
                  className={`flex items-center gap-1 font-bold font-mono ${
                    status?.localEngineAvailable
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />

                  {status?.localEngineAvailable
                    ? 'DISPONIBLE'
                    : 'NO DISPONIBLE'}
                </span>
              </div>

              {/* Financial reality */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">
                  Contabilidad:
                </span>

                <span className="flex items-center gap-1 font-bold font-mono text-emerald-400">
                  <Lock className="w-3 h-3" />
                  CONFIRMADA
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={onRunCycle}
              disabled={isCycling}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isCycling ? 'animate-spin' : ''
                }`}
              />

              {isCycling
                ? 'Ejecutando...'
                : 'Ejecutar 1 ciclo'}
            </button>

            <button
              onClick={() => onNavigateTab('agent')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Ir al núcleo del agente"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />

              <h3 className="text-sm font-bold text-white">
                Actividad reciente
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver bitácora ({events.length})
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay eventos registrados todavía.
              Inicia el agente o ejecuta un ciclo.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {events.slice(0, 7).map((evt) => {
                let badgeColor =
                  'bg-slate-800 text-slate-300 border-slate-700';

                if (evt.severity === 'SUCCESS') {
                  badgeColor =
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                }

                if (evt.severity === 'WARNING') {
                  badgeColor =
                    'bg-amber-500/10 text-amber-400 border-amber-500/30';
                }

                if (evt.severity === 'ERROR') {
                  badgeColor =
                    'bg-rose-500/10 text-rose-400 border-rose-500/30';
                }

                return (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}
                        >
                          {evt.type}
                        </span>

                        <span className="font-semibold text-slate-200 truncate">
                          {evt.title}
                        </span>
                      </div>

                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {evt.message}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
