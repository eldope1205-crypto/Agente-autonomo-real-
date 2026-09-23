import React from 'react';
import { PiggyBank, ShieldCheck, TrendingUp, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { FinancialSummary, FinancialLimits, SubAgent } from '../types/index.js';

interface CapitalViewProps {
  summary?: FinancialSummary;
  limits?: FinancialLimits;
  subAgents: SubAgent[];
  onNavigateTab: (tab: string) => void;
}

export const CapitalView: React.FC<CapitalViewProps> = ({
  summary,
  limits,
  subAgents,
  onNavigateTab,
}) => {
  const availableCapital = summary?.availableCapital || 0;
  const reserve = summary?.reserve || 0;
  const totalBalance = summary?.currentBalance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Gestión de Capital Real, Reservas y Reinversión
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Reglas de autofinanciación. El agente no puede contraer deudas, solicitar préstamos ficticios ni gastar fondos no confirmados.
        </p>
      </div>

      {/* Capital Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Capital Confirmado Disponible</div>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {availableCapital.toFixed(2)} €
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Fondos líquidos y reales utilizables para operaciones, cuotas de API o infraestructura.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Reserva Mínima Obligatoria</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">
            {reserve.toFixed(2)} €
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Margen de seguridad intocable para garantizar la permanencia del sistema.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Límite Máximo de Gasto Diario</div>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
            {limits?.maxDailySpend.toFixed(2) || '10.00'} €
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Tope estricto de gasto operativo autorizado en 24 horas.
          </p>
        </div>
      </div>

      {/* Reinvestment Readiness for Sub-Agents */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Umbrales de Reinversión: Agentes Especializados
          </h3>
          <button
            onClick={() => onNavigateTab('agents')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Ver catálogo completo ({subAgents.length})
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          El agente solo puede aprovisionar agentes secundarios si existe capital real suficiente para cubrir su coste operativo mensual y reserva.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subAgents.map((agent) => {
            const hasEnoughCapital = availableCapital >= agent.capitalRequired;
            const progress = Math.min(100, Math.round((availableCapital / agent.capitalRequired) * 100));

            return (
              <div
                key={agent.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white">{agent.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{agent.purpose}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      agent.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : hasEnoughCapital
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {agent.status === 'ACTIVE' ? 'ACTIVO' : hasEnoughCapital ? 'LISTO PARA FINANCIAR' : 'CAPITAL INSUFICIENTE'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Capital requerido:</span>
                    <span className="font-mono font-bold text-white">
                      {agent.capitalRequired} € / {availableCapital} € actual
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasEnoughCapital ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
