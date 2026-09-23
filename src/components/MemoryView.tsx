import React from 'react';
import {
  Database,
  HardDrive,
  Cpu,
  ShieldCheck,
  FileJson,
  RefreshCw,
} from 'lucide-react';

interface MemoryViewProps {
  memoryData: any;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ memoryData }) => {
  const totalOpportunities = memoryData?.totalOpportunities ?? 0;
  const totalTasks = memoryData?.totalTasks ?? 0;
  const totalEvidence = memoryData?.totalEvidence ?? 0;
  const totalTransactions = memoryData?.totalTransactions ?? 0;
  const version = memoryData?.version ?? 1;

  const lastUpdate = memoryData?.lastUpdate
    ? new Date(memoryData.lastUpdate)
    : null;

  const formattedLastUpdate =
    lastUpdate && !Number.isNaN(lastUpdate.getTime())
      ? lastUpdate.toLocaleString()
      : 'No disponible';

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
          Estado persistente almacenado localmente para conservar información
          entre reinicios del servidor.
        </p>
      </div>

      {/* Storage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">
            Oportunidades
          </div>

          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalOpportunities}
          </div>

          <div className="text-[10px] text-slate-500 mt-0.5">
            Registradas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">
            Tareas
          </div>

          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalTasks}
          </div>

          <div className="text-[10px] text-slate-500 mt-0.5">
            Planes y ejecuciones
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">
            Evidencias
          </div>

          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {totalEvidence}
          </div>

          <div className="text-[10px] text-slate-500 mt-0.5">
            Archivos registrados
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">
            Transacciones
          </div>

          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {totalTransactions}
          </div>

          <div className="text-[10px] text-slate-500 mt-0.5">
            Registros financieros
          </div>
        </div>
      </div>

      {/* Persistence */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-400" />

          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Persistencia de Datos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Disk storage */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <FileJson className="w-4 h-4" />

              Estado persistente
            </div>

            <p className="text-slate-400 leading-relaxed">
              El estado del sistema se guarda en un archivo local para que
              oportunidades, tareas, configuración, eventos y registros
              financieros puedan recuperarse después de un reinicio.
            </p>

            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Archivo:{' '}
              <code className="text-slate-300">
                data/state.json
              </code>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Versión del esquema:{' '}
              <span className="text-slate-300">
                {version}
              </span>
            </div>
          </div>

          {/* Operational state */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Cpu className="w-4 h-4" />

              Estado operacional
            </div>

            <p className="text-slate-400 leading-relaxed">
              Durante los ciclos se utilizan estructuras temporales para
              procesar oportunidades, tareas y resultados. Los datos
              persistentes se guardan en el estado del sistema.
            </p>

            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Última actualización:{' '}
              <span className="text-slate-300">
                {formattedLastUpdate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrity */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />

          <div>
            <h3 className="text-sm font-bold text-white">
              Integridad y control
            </h3>

            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Las evidencias pueden incluir una huella SHA-256 para comprobar
              si el contenido de un archivo cambió. Esto sirve como mecanismo
              de verificación de integridad y no implica que los archivos sean
              inmutables.
            </p>
          </div>
        </div>
      </div>

      {/* Synchronization */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-cyan-400" />

        <div>
          <div className="text-xs font-bold text-slate-200">
            Persistencia activa
          </div>

          <div className="text-[11px] text-slate-500 mt-0.5">
            Los datos mostrados corresponden al estado disponible del sistema.
          </div>
        </div>
      </div>
    </div>
  );
};
