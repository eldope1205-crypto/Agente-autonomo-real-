import React from 'react';
import {
  Activity,
  Play,
  Square,
  Pause,
  RotateCw,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { SystemStatus, AgentMode } from '../types/index.js';

interface HeaderProps {
  status: SystemStatus | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onRunCycle: () => void;
  onExecuteTasks?: () => void;
  onChangeMode: (mode: AgentMode) => void;
  isCycling: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onStart,
  onStop,
  onPause,
  onResume,
  onRunCycle,
  onExecuteTasks,
  onChangeMode,
  isCycling,
  activeTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const agentStatus = status?.agentStatus || 'STOPPED';
  const currentMode = status?.currentMode || 'PREPARE';
  const currentStep = status?.currentCycleStep || 'IDLE';

  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVO / EJECUTANDO
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            PAUSADO
          </span>
        );
      case 'WAITING_HUMAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            REQUIERE INTERVENCIÓN HUMANA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            DETENIDO
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800/70 text-slate-300 hover:bg-slate-700 transition"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0c121e] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AGENTE AUTÓNOMO
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    REAL
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Trabajador Digital • Principio de Realidad Estricto
              </p>
            </div>
          </div>
        </div>

        {/* Center: Status & Cycle Step */}
        <div className="hidden md:flex items-center gap-3">
          {getStatusBadge()}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">Paso:</span>
            <span className="text-cyan-400 font-semibold">{currentStep}</span>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => onChangeMode('OBSERVE')}
              className={`px-2 py-1 rounded transition ${
                currentMode === 'OBSERVE'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Solo búsqueda y análisis de oportunidades"
            >
              OBSERVE
            </button>
            <button
              onClick={() => onChangeMode('PREPARE')}
              className={`px-2 py-1 rounded transition ${
                currentMode === 'PREPARE'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Buscar, analizar y preparar tareas para aprobación"
            >
              PREPARE
            </button>
            <button
              onClick={() => onChangeMode('AUTHORIZED')}
              className={`px-2 py-1 rounded transition ${
                currentMode === 'AUTHORIZED'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ejecutar tareas autorizadas automáticamente"
            >
              AUTHORIZED
            </button>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          {onExecuteTasks && (
            <button
              onClick={onExecuteTasks}
              disabled={isCycling}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition shadow disabled:opacity-50"
              title="Procesa y ejecuta todas las tareas autorizadas y listas"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar Tareas</span>
            </button>
          )}

          <button
            onClick={onRunCycle}
            disabled={isCycling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
            title="Ejecuta manualmente un ciclo completo"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isCycling ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Ejecutar Ciclo</span>
          </button>

          {agentStatus === 'RUNNING' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar</span>
            </button>
          )}

          {agentStatus !== 'STOPPED' && (
            <button
              onClick={onStop}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
              title="Detener agente"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
