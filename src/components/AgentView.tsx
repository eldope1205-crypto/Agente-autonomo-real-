import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Pause,
  Square,
  RotateCw,
  Sliders,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { SystemStatus, AgentMode, CycleStep } from '../types/index.js';

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
  const [selectedStep, setSelectedStep] = useState<CycleStep>('DISCOVER');

  const stepsInfo: Record<
    CycleStep,
    { title: string; objective: string; tools: string[]; logic: string }
  > = {
    IDLE: {
      title: 'En Espera / Listo',
      objective: 'El agente aguarda el siguiente intervalo del programador o activación manual.',
      tools: ['scheduler'],
      logic: 'Verifica estado del agente, colas pendientes y cron.',
    },
    DISCOVER: {
      title: '1. Descubrimiento de Oportunidades',
      objective: 'Consulta canales públicos reales de Internet (RSS, JSON, XML, HTML).',
      tools: ['http_fetcher', 'rss_parser'],
      logic: 'Descarga feeds públicos, normaliza textos y filtra duplicados por URL.',
    },
    ANALYZE: {
      title: '2. Análisis Objetivo y Sintáctico',
      objective: 'Extrae especificaciones, requisitos técnicos, remuneración y restricciones.',
      tools: ['text_processor', 'llm_worker'],
      logic: 'Inspecciona lenguaje del briefing, descarta requisitos físicos y detecta condiciones clave.',
    },
    DECIDE: {
      title: '3. Motor de Decisión & Puntuación',
      objective: 'Calcula puntuación multidimensional (capacidades, riesgo, automatización).',
      tools: ['decision_engine'],
      logic: 'Formula transparente: capacidad (0-30) + automatización (0-25) + remuneración (0-15) + fiabilidad (0-15) - penalizaciones.',
    },
    PLAN: {
      title: '4. Planificación de Tareas',
      objective: 'Estructura un plan de acción concreto con pasos, herramientas y validaciones.',
      tools: ['task_manager'],
      logic: 'Crea 5 pasos: análisis, ejecución con LLM/herramienta, verificación, firma SHA-256 y empaquetado.',
    },
    EXECUTE: {
      title: '5. Ejecución Técnica Digital',
      objective: 'Genera el trabajo comprometido (código, documento, traducción, análisis).',
      tools: ['llm_worker', 'file_generator'],
      logic: 'Solo se ejecuta en modo AUTHORIZED sobre tareas aprobadas expresamente.',
    },
    VERIFY: {
      title: '6. Verificación de Integridad',
      objective: 'Comprueba que el entregable cumple con los estándares exigidos sin alucinaciones.',
      tools: ['text_processor', 'file_generator'],
      logic: 'Audita longitud, sintaxis, ausencia de inyecciones y coherencia con el briefing.',
    },
    SUBMIT: {
      title: '7. Entrega y Registro de Evidencia',
      objective: 'Guarda archivo en disco, calcula hash SHA-256 inmutable y solicita intervención humana si la plataforma requiere cuenta.',
      tools: ['evidence_recorder'],
      logic: 'No se evaden CAPTCHAs ni se suplantan credenciales de plataformas.',
    },
    WAIT_PAYMENT: {
      title: '8. Espera de Liquidación Externa',
      objective: 'Mantiene seguimiento de pagos pendientes asociados al trabajo remitido.',
      tools: ['finance_manager'],
      logic: 'El estado se marca como PENDING sin sumar un solo céntimo al capital disponible.',
    },
    CONFIRM_PAYMENT: {
      title: '9. Confirmación de Pago Real',
      objective: 'Verifica comprobante real o identificador de transferencia.',
      tools: ['finance_manager'],
      logic: 'Solo el pago CONFIRMADO incrementa el saldo real disponible del agente.',
    },
    ACCOUNT: {
      title: '10. Asentamiento Contable & Ganancia',
      objective: 'Recalcula ingresos, gastos, margen neto y reserva de seguridad.',
      tools: ['ledger'],
      logic: 'Beneficio = Ingresos Confirmados - Gastos Confirmados.',
    },
    LEARN: {
      title: '11. Motor de Aprendizaje',
      objective: 'Analiza tasas de éxito, tiempos de respuesta de fuentes y razones de rechazo.',
      tools: ['learning_engine'],
      logic: 'Genera propuestas de ajuste sin alterar directivas críticas de seguridad.',
    },
    REPEAT: {
      title: '12. Cierre de Ciclo & Reenganche',
      objective: 'Incrementa contador persistente de ciclos y se prepara para el siguiente intervalo.',
      tools: ['scheduler'],
      logic: 'Ciclo completo completado de forma no bloqueante.',
    },
  };

  const currentMode = status?.currentMode || 'PREPARE';
  const agentStatus = status?.agentStatus || 'STOPPED';

  return (
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Centro de Mando del Agente Core
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control del ciclo autónomo perpetuo, supervisión de estados y directivas operativas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {agentStatus === 'RUNNING' ? (
              <button
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pausar Operación
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
              <RotateCw className={`w-4 h-4 ${isCycling ? 'animate-spin' : ''}`} />
              Ejecutar 1 Ciclo Ahora
            </button>
          </div>
        </div>

        {/* Mode Switcher Detailed */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Modos de Operación Autónomo
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => onChangeMode('OBSERVE')}
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'OBSERVE'
                  ? 'bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-blue-300">OBSERVE</span>
                {currentMode === 'OBSERVE' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descubre y analiza fuentes públicas. No planifica tareas ni gasta recursos.
              </p>
            </button>

            <button
              onClick={() => onChangeMode('PREPARE')}
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'PREPARE'
                  ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-purple-300">PREPARE (Por Defecto)</span>
                {currentMode === 'PREPARE' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Busca, analiza oportunidades y estructura planes de trabajo esperando su autorización.
              </p>
            </button>

            <button
              onClick={() => onChangeMode('AUTHORIZED')}
              className={`p-4 rounded-xl text-left border transition ${
                currentMode === 'AUTHORIZED'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-emerald-300">AUTHORIZED</span>
                {currentMode === 'AUTHORIZED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ejecuta automáticamente las tareas técnicas autorizadas, guarda evidencias y registra entregables.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 12-Step Lifecycle Explorer */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Inspección de las 12 Fases del Ciclo
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Paso activo en tiempo real: <span className="text-cyan-400 font-bold">{status?.currentCycleStep}</span>
          </span>
        </div>

        {/* Step Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {(Object.keys(stepsInfo) as CycleStep[])
            .filter((s) => s !== 'IDLE')
            .map((stepKey, i) => {
              const isSelected = selectedStep === stepKey;
              const isLive = status?.currentCycleStep === stepKey;
              return (
                <button
                  key={stepKey}
                  onClick={() => setSelectedStep(stepKey)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : isLive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400">{i + 1}</div>
                  <div className="text-xs font-bold truncate">{stepKey}</div>
                </button>
              );
            })}
        </div>

        {/* Selected Step Deep Dive Card */}
        {selectedStep && stepsInfo[selectedStep] && (
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-indigo-400 font-mono">[{selectedStep}]</span>
                {stepsInfo[selectedStep].title}
              </h4>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Herramientas: {stepsInfo[selectedStep].tools.join(', ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="font-bold text-slate-300 mb-1">Propósito en el ciclo:</div>
                <p className="text-slate-400 leading-relaxed">
                  {stepsInfo[selectedStep].objective}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="font-bold text-slate-300 mb-1">Regla y Lógica Implementada:</div>
                <p className="text-slate-400 leading-relaxed">
                  {stepsInfo[selectedStep].logic}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Cycle Result Banner if executed */}
        {cycleResult && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 text-xs text-indigo-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Resultado de la última ejecución manual:</div>
              <p className="mt-0.5">{cycleResult.details}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
