import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SecurityRule, AgentEvent } from '../types/index.js';

interface SecurityViewProps {
  rules: SecurityRule[];
  blockedEvents: AgentEvent[];
}

export const SecurityView: React.FC<SecurityViewProps> = ({ rules, blockedEvents }) => {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{ allowed: boolean; reason?: string } | null>(null);

  const handleTestUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl) return;

    // Simulate client-side validation logic identical to server SSRF shield
    try {
      const parsed = new URL(testUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setTestResult({ allowed: false, reason: 'Solo se permiten protocolos HTTP y HTTPS.' });
        return;
      }
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host === '169.254.169.254'
      ) {
        setTestResult({ allowed: false, reason: 'Acceso bloqueado a red interna o metadatos cloud (SSRF).' });
        return;
      }
      setTestResult({ allowed: true });
    } catch {
      setTestResult({ allowed: false, reason: 'URL malformada o inválida.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Escudo de Seguridad y Protección SSRF
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Defensas obligatorias contra ataques SSRF, exfiltración de credenciales, inyecciones de prompt y accesos a redes privadas.
        </p>
      </div>

      {/* Live SSRF Shield Simulator */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Verificador en Vivo del Filtro SSRF
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Prueba cualquier URL para comprobar cómo actúa el cortafuegos antes de cualquier llamada HTTP.
        </p>

        <form onSubmit={handleTestUrl} className="flex gap-2">
          <input
            type="text"
            placeholder="Ej. http://127.0.0.1:8080 o http://169.254.169.254"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
          >
            Evaluar URL
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
              testResult.allowed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.allowed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>URL permitida: Se encuentra en espacio público de Internet.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>BLOQUEADO POR POLÍTICA DE SEGURIDAD: {testResult.reason}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Active Rules Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Reglas de Seguridad Activas ({rules.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  {rule.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {rule.severity}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">{rule.description}</p>
              <div className="text-[10px] text-slate-500 font-mono">
                Regla: <code className="text-slate-400">{rule.rule}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Incidents / Blocked Events */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Intentos Bloqueados en Tiempo Real ({blockedEvents.length})
        </h3>

        {blockedEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No se han registrado vulneraciones de seguridad. Sistema íntegro.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {blockedEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 font-mono"
              >
                [{new Date(evt.timestamp).toLocaleTimeString()}] {evt.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
