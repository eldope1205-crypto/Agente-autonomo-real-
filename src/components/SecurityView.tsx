import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Server,
} from 'lucide-react';
import { SecurityRule, AgentEvent } from '../types/index.js';

interface SecurityViewProps {
  rules: SecurityRule[];
  blockedEvents: AgentEvent[];
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  rules,
  blockedEvents,
}) => {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{
    allowed: boolean;
    reason?: string;
  } | null>(null);

  const handleTestUrl = (event: React.FormEvent) => {
    event.preventDefault();

    const value = testUrl.trim();

    if (!value) {
      setTestResult({
        allowed: false,
        reason: 'Introduce una URL para evaluarla.',
      });
      return;
    }

    try {
      const parsed = new URL(value);
      const protocol = parsed.protocol.toLowerCase();
      const host = parsed.hostname.toLowerCase();

      if (protocol !== 'http:' && protocol !== 'https:') {
        setTestResult({
          allowed: false,
          reason: 'Solo se permiten protocolos HTTP y HTTPS.',
        });
        return;
      }

      if (parsed.username || parsed.password) {
        setTestResult({
          allowed: false,
          reason:
            'Las URL con credenciales incrustadas no están permitidas.',
        });
        return;
      }

      if (!host) {
        setTestResult({
          allowed: false,
          reason: 'La URL no contiene un host válido.',
        });
        return;
      }

      if (
        host === 'localhost' ||
        host === 'localhost.localdomain' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host === '[::1]' ||
        host === '169.254.169.254' ||
        host === 'metadata.google.internal' ||
        host === 'metadata.google.com' ||
        host.endsWith('.internal')
      ) {
        setTestResult({
          allowed: false,
          reason:
            'El host coincide con una dirección local, interna o de metadatos.',
        });
        return;
      }

      if (
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        setTestResult({
          allowed: false,
          reason: 'Las redes privadas IPv4 están bloqueadas.',
        });
        return;
      }

      setTestResult({
        allowed: true,
      });
    } catch {
      setTestResult({
        allowed: false,
        reason: 'La URL está malformada o no es válida.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />

          <h2 className="text-base font-bold text-white tracking-tight">
            Seguridad y Protección SSRF
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Controles para reducir accesos a redes internas, credenciales
          incrustadas, contenido malicioso e intentos de inyección.
        </p>
      </div>

      {/* Security architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Server className="w-4 h-4" />
            Validación del servidor
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Las llamadas HTTP del agente pasan por los controles de seguridad
            del backend antes de acceder a fuentes externas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Globe className="w-4 h-4" />
            Contenido externo no confiable
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            El contenido procedente de Internet se trata como datos externos y
            no como instrucciones autorizadas para el agente.
          </p>
        </div>
      </div>

      {/* URL checker */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Verificador local de URL
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          Esta prueba realiza una comprobación básica en el navegador. La
          validación definitiva se realiza en el servidor antes de una
          solicitud HTTP.
        </p>

        <form
          onSubmit={handleTestUrl}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            placeholder="https://ejemplo.com"
            value={testUrl}
            onChange={(event) => {
              setTestUrl(event.target.value);
              setTestResult(null);
            }}
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
            className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
              testResult.allowed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.allowed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />

                <span>
                  La URL supera las comprobaciones básicas del navegador.
                  Todavía debe superar la validación del servidor.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />

                <span>
                  BLOQUEADA EN LA PRUEBA LOCAL:{' '}
                  {testResult.reason}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Reglas de Seguridad ({rules.length})
        </h3>

        {rules.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
            No hay reglas de seguridad registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    {rule.name}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    {rule.severity}
                  </span>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  {rule.description}
                </p>

                <div className="text-[10px] text-slate-500 font-mono">
                  Regla:{' '}
                  <code className="text-slate-400">
                    {rule.rule}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked events */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Eventos Bloqueados ({blockedEvents.length})
        </h3>

        {blockedEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No hay eventos bloqueados registrados actualmente.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {blockedEvents.map((event) => {
              const date = new Date(event.timestamp);

              return (
                <div
                  key={event.id}
                  className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 font-mono"
                >
                  [
                  {Number.isNaN(date.getTime())
                    ? 'sin fecha'
                    : date.toLocaleTimeString()}
                  ]{' '}
                  {event.message}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
