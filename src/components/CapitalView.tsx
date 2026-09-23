import React from 'react';
import {
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Layers,
  Server,
} from 'lucide-react';
import {
  FinancialSummary,
  FinancialLimits,
  SubAgent,
} from '../types/index.js';

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
  const availableCapital = summary?.availableCapital ?? 0;
  const reserve = summary?.reserve ?? 0;
  const totalBalance = summary?.currentBalance ?? 0;

  const dailySpendLimit = limits?.maxDailySpend ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-indigo-400" />

          <h2 className="text-base font-bold text-white tracking-tight">
            Gestión de Capital Real
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          El sistema solo considera ingresos confirmados. No puede inventar
          dinero, crear crédito ficticio ni gastar fondos que no estén
          realmente disponibles.
        </p>
      </div>

      {/* Capital status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />

            <div className="text-xs text-slate-400">
              Capital confirmado disponible
            </div>
          </div>

          <div className="text-3xl font-black text-white font-mono mt-2">
            {availableCapital.toFixed(2)} €
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Fondos confirmados que pueden estar disponibles para operaciones
            permitidas.
          </p>
        </div>

        {/* Reserve */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />

            <div className="text-xs text-slate-400">
              Reserva mínima
            </div>
          </div>

          <div className="text-3xl font-black text-amber-400 font-mono mt-2">
            {reserve.toFixed(2)} €
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Límite de seguridad configurado para proteger el capital
            disponible.
          </p>
        </div>

        {/* Daily limit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />

            <div className="text-xs text-slate-400">
              Límite de gasto diario
            </div>
          </div>

          <div className="text-3xl font-black text-cyan-400 font-mono mt-2">
            {dailySpendLimit.toFixed(2)} €
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Máximo configurado para gastos operativos durante un día.
          </p>
        </div>
      </div>

      {/* Balance information */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-indigo-400" />
              Estado financiero
            </h3>

            <p className="text-[11px] text-slate-500 mt-1">
              Valores calculados a partir de transacciones registradas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-500">
              Saldo registrado
            </span>

            <div className="text-xl font-bold font-mono text-white mt-1">
              {totalBalance.toFixed(2)} €
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-500">
              Capital disponible
            </span>

            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {availableCapital.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>

      {/* Sub-agent reinvestment */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Expansión de sub-agentes
          </h3>

          <button
            onClick={() => onNavigateTab('agents')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Ver agentes ({subAgents.length})
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Disponer del capital necesario no activa automáticamente un
          sub-agente. También debe existir infraestructura preparada y
          autorización válida.
        </p>

        {subAgents.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <Cpu className="w-7 h-7 text-slate-600 mx-auto mb-2" />

            <p className="text-xs font-bold text-slate-300">
              No hay sub-agentes registrados
            </p>

            <p className="text-[11px] text-slate-500 mt-1">
              Todavía no existen agentes secundarios configurados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subAgents.map((agent) => {
              const hasEnoughCapital =
                availableCapital >= agent.capitalRequired;

              const infrastructureReady =
                agent.infrastructureReady === true;

              const authorizationGranted =
                agent.authorizationGranted === true;

              const isActive =
                agent.status === 'ACTIVE';

              const progress =
                agent.capitalRequired > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (availableCapital /
                          agent.capitalRequired) *
                          100
                      )
                    )
                  : 100;

              let statusLabel = 'BLOQUEADO';

              if (isActive) {
                statusLabel = 'ACTIVO';
              } else if (!hasEnoughCapital) {
                statusLabel = 'CAPITAL INSUFICIENTE';
              } else if (!infrastructureReady) {
                statusLabel = 'INFRAESTRUCTURA PENDIENTE';
              } else if (!authorizationGranted) {
                statusLabel = 'SIN AUTORIZACIÓN';
              } else {
                statusLabel = 'LISTO PARA ACTIVAR';
              }

              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs"
                >
                  {/* Agent header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white">
                        {agent.name}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {agent.purpose}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : hasEnoughCapital &&
                            infrastructureReady &&
                            authorizationGranted
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Capital progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Capital requerido
                      </span>

                      <span className="font-mono font-bold text-white">
                        {agent.capitalRequired.toFixed(2)} €
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          hasEnoughCapital
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 text-right">
                      {availableCapital.toFixed(2)} € disponibles
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">
                        Capital
                      </div>

                      <div
                        className={`text-[11px] font-bold mt-1 ${
                          hasEnoughCapital
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {hasEnoughCapital
                          ? 'Cumplido'
                          : 'Pendiente'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">
                        Infraestructura
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${
                          infrastructureReady
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        <Server className="w-3 h-3" />

                        {infrastructureReady
                          ? 'Preparada'
                          : 'Pendiente'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">
                        Autorización
                      </div>

                      <div
                        className={`text-[11px] font-bold mt-1 ${
                          authorizationGranted
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {authorizationGranted
                          ? 'Concedida'
                          : 'Pendiente'}
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  {!isActive &&
                    hasEnoughCapital &&
                    !infrastructureReady && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />

                        <span className="text-[10px] text-amber-300 leading-relaxed">
                          Hay capital suficiente, pero el backend no
                          considera preparada la infraestructura.
                        </span>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security footer */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-bold text-slate-300">
              Regla financiera
            </p>

            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              El agente no puede crear ingresos ficticios, gastar dinero no
              confirmado ni marcar una infraestructura como preparada sin
              que exista realmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
