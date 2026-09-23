import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Pause,
  Square,
  RotateCw,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

import {
  SystemStatus,
  AgentMode,
  CycleStep,
} from '../types/index.js';

interface AgentViewProps {
  status: SystemStatus | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onRunCycle: () => void;
  onChangeMode: (mode: AgentMode) => void;
  isCycling: boolean;
  cycleResult?: any;
}

interface StepInfo {
  title: string;
  objective: string;
  tools: string[];
  logic: string;
}

export const AgentView: React.FC<AgentViewProps> = ({
  status,
  onStart,
  onStop,
  onPause,
  onResume,
  onRunCycle,
  onChangeMode,
  isCycling,
  cycleResult,
}) => {
  const [selectedStep, setSelectedStep] =
    useState<CycleStep>('DISCOVER');

  const stepsInfo: Record<CycleStep, StepInfo> = {
    IDLE: {
      title: 'En espera',
      objective:
        'El agente espera el siguiente ciclo automático o una activación manual.',
      tools: ['scheduler'],
      logic:
        'Comprueba el estado general y evita ejecutar ciclos cuando el agente está detenido o ocupado.',
    },

    DISCOVER: {
      title: '1. Descubrimiento de oportunidades',
      objective:
        'Consulta fuentes públicas para encontrar oportunidades digitales.',
      tools: ['http_fetcher', 'rss_parser'],
      logic:
        'Obtiene contenido de fuentes habilitadas, valida las URLs, normaliza los datos y evita duplicados.',
    },

    ANALYZE: {
      title: '2. Análisis',
      objective:
        'Analiza requisitos, remuneración, capacidades necesarias y restricciones.',
      tools: ['text_processor', 'llm_worker'],
      logic:
        'Utiliza el motor local determinista y reglas de análisis para extraer información útil sin depender de Gemini.',
    },

    DECIDE: {
      title: '3. Decisión',
      objective:
        'Evalúa si una oportunidad es compatible con las capacidades y reglas del agente.',
      tools: ['decision_engine'],
      logic:
        'Tiene en cuenta capacidad, automatización, remuneración, fiabilidad, tiempo y riesgos. Las oportunidades peligrosas o incompatibles se rechazan.',
    },

    PLAN: {
      title: '4. Planificación',
      objective:
        'Convierte una oportunidad aceptada en una tarea estructurada.',
      tools: ['task_manager'],
      logic:
        'Crea pasos de análisis, ejecución, verificación, evidencia y preparación de entrega.',
    },

    EXECUTE: {
      title: '5. Ejecución técnica',
      objective:
        'Realiza trabajos digitales que puedan ejecutarse con las herramientas disponibles.',
      tools: ['llm_worker', 'file_generator'],
      logic:
        'Utiliza herramientas locales para generar entregables. No se inventa trabajo realizado ni resultados externos.',
    },

    VERIFY: {
      title: '6. Verificación',
      objective:
        'Comprueba que el resultado generado existe y puede ser verificado.',
      tools: ['text_processor', 'file_generator'],
      logic:
        'Comprueba el entregable, su existencia y su integridad antes de registrarlo como evidencia.',
    },

    SUBMIT: {
      title: '7. Preparación de entrega',
      objective:
        'Prepara el resultado y registra la evidencia generada.',
      tools: ['evidence_recorder'],
      logic:
        'Guarda los archivos y calcula su hash SHA-256. No intenta saltarse CAPTCHA, autenticación ni controles de plataformas externas.',
    },

    WAIT_PAYMENT: {
      title: '8. Espera de pago',
      objective:
        'Mantiene separados los pagos esperados del dinero realmente recibido.',
      tools: ['finance_manager'],
      logic:
        'Un pago PENDING no aumenta el capital disponible.',
    },

    CONFIRM_PAYMENT: {
      title: '9. Confirmación de pago',
      objective:
        'Registra un ingreso solamente cuando existe confirmación y evidencia.',
      tools: ['finance_manager'],
      logic:
        'Solo una transacción CONFIRMED puede incorporarse al capital disponible.',
    },

    ACCOUNT: {
      title: '10. Contabilidad',
      objective:
        'Actualiza el estado financiero utilizando las transacciones registradas.',
      tools: ['finance_manager'],
      logic:
        'El capital disponible se basa en ingresos confirmados menos gastos confirmados.',
    },

    LEARN: {
      title: '11. Aprendizaje',
      objective:
        'Analiza resultados anteriores para generar propuestas de mejora.',
      tools: ['learning_engine'],
      logic:
        'Analiza tasas de éxito, rechazos, errores y fuentes problemáticas sin modificar automáticamente las reglas críticas de seguridad.',
    },

    REPEAT: {
      title: '12. Repetición',
      objective:
        'Finaliza el ciclo y deja preparado el siguiente ciclo automático.',
      tools: ['scheduler'],
      logic:
        'El siguiente ciclo puede ejecutarse según el intervalo configurado por el sistema.',
    },
  };

  const currentMode =
    status?.currentMode || 'PREPARE';

  const agentStatus =
    status?.agentStatus || 'STOPPED';

  return (
    <div className="space-y-6">

      {/* PANEL PRINCIPAL */}

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />

              <h2 className="text-lg font-bold text-white tracking-tight">
                Centro de Mando del Agente
              </h2>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Control del agente, ciclos automáticos y supervisión de operaciones.
            </p>
          </div>

          {/* CONTROLES */}

          <div className="flex items-center gap-2 flex-wrap">

            {agentStatus === 'RUNNING' ? (
              <button
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pausar
              </button>
            ) : (
              <button
                onClick={onStart}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Agente
              </button>
            )}

            {agentStatus !== 'STOPPED' && (
              <button
                onClick={onStop}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Detener
              </button>
            )}

            <button
              onClick={onRunCycle}
              disabled={isCycling}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              <RotateCw
                className={`w-4 h-4 ${
                  isCycling ? 'animate-spin' : ''
                }`}
              />

              Ejecutar 1 ciclo
            </button>

          </div>
        </div>

        {/* MODOS */}

        <div className="mt-6 pt-5 border-t border-slate-800">

          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Modo de operación
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <button
              onClick={() =>
                onChangeMode('OBSERVE')
              }
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'OBSERVE'
                  ? 'bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">

                <span className="font-bold text-sm text-blue-300">
                  OBSERVE
                </span>

                {currentMode === 'OBSERVE' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                )}

              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Descubre y analiza oportunidades sin preparar ejecución automática.
              </p>
            </button>

            <button
              onClick={() =>
                onChangeMode('PREPARE')
              }
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'PREPARE'
                  ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">

                <span className="font-bold text-sm text-purple-300">
                  PREPARE
                </span>

                {currentMode === 'PREPARE' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                )}

              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Descubre, analiza y prepara tareas para su posterior ejecución.
              </p>
            </button>

            <button
              onClick={() =>
                onChangeMode('AUTHORIZED')
              }
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'AUTHORIZED'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">

                <span className="font-bold text-sm text-emerald-300">
                  AUTHORIZED
                </span>

                {currentMode === 'AUTHORIZED' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}

              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Permite ejecutar tareas compatibles con las reglas y herramientas disponibles.
              </p>
            </button>

          </div>
        </div>
      </div>

      {/* CICLO */}

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            12 fases del ciclo
          </h3>

          <span className="text-xs text-slate-400 font-mono">
            Paso actual:{' '}
            <span className="text-cyan-400 font-bold">
              {status?.currentCycleStep || 'IDLE'}
            </span>
          </span>

        </div>

        {/* SELECTOR */}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">

          {(Object.keys(stepsInfo) as CycleStep[])
            .filter(
              (step) => step !== 'IDLE'
            )
            .map((stepKey, index) => {

              const isSelected =
                selectedStep === stepKey;

              const isLive =
                status?.currentCycleStep ===
                stepKey;

              return (
                <button
                  key={stepKey}
                  onClick={() =>
                    setSelectedStep(stepKey)
                  }
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : isLive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400">
                    {index + 1}
                  </div>

                  <div className="text-xs font-bold truncate">
                    {stepKey}
                  </div>
                </button>
              );
            })}

        </div>

        {/* DETALLE */}

        {stepsInfo[selectedStep] && (
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">

            <div className="flex items-center justify-between gap-3">

              <h4 className="text-base font-bold text-white flex items-center gap-2">

                <span className="text-indigo-400 font-mono">
                  [{selectedStep}]
                </span>

                {stepsInfo[selectedStep].title}

              </h4>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {stepsInfo[
                  selectedStep
                ].tools.join(', ')}
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">

                <div className="font-bold text-slate-300 mb-1">
                  Propósito
                </div>

                <p className="text-slate-400 leading-relaxed">
                  {
                    stepsInfo[
                      selectedStep
                    ].objective
                  }
                </p>

              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">

                <div className="font-bold text-slate-300 mb-1">
                  Lógica
                </div>

                <p className="text-slate-400 leading-relaxed">
                  {
                    stepsInfo[
                      selectedStep
                    ].logic
                  }
                </p>

              </div>

            </div>
          </div>
        )}

        {/* RESULTADO */}

        {cycleResult && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 text-xs text-indigo-200 flex items-start gap-3">

            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />

            <div>

              <div className="font-bold">
                Resultado del último ciclo:
              </div>

              <p className="mt-0.5">
                {cycleResult.details ||
                  cycleResult.message ||
                  'Ciclo ejecutado.'}
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
