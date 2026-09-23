import React from 'react';
import { Database, HardDrive, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MemoryViewProps {
  memoryData: any;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ memoryData }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Memoria Persistente del Sistema
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Arquitectura de almacenamiento inmutable en disco (`data/state.json`). No depende de la memoria RAM y soporta reinicios sin pérdida de datos.
        </p>
      </div>

      {/* Storage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Oportunidades</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {memoryData?.totalOpportunities || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">En base de datos</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Tareas Estructuradas</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {memoryData?.totalTasks || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Planes persistidos</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Evidencias SHA-256</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {memoryData?.totalEvidence || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Archivos en disco</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Transacciones Ledger</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {memoryData?.totalTransactions || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Asientos contables</div>
        </div>
      </div>

      {/* Technical Memory Details */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Estructura de Persistencia y Gobernanza
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <HardDrive className="w-4 h-4" />
              Memoria a Largo Plazo (Persistente)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Reside en el sistema de archivos del servidor. Gestionada por la clase singleton <code className="text-slate-200">Database</code> con serialización atómica y bloqueo de concurrencia.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Ubicación: <code className="text-slate-300">data/state.json</code> • Versión del esquema: {memoryData?.version || 1}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Cpu className="w-4 h-4" />
              Memoria Operacional de Ciclo
            </div>
            <p className="text-slate-400 leading-relaxed">
              Mantiene las métricas del ciclo en curso (fase activa, colas de análisis, conexiones HTTP temporales y búfer de LLM). Se consolida al culminar la fase LEARN.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Última sincronización: {memoryData?.lastUpdate ? new Date(memoryData.lastUpdate).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
