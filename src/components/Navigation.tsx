import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Compass,
  CheckSquare,
  Globe,
  Zap,
  Wrench,
  DollarSign,
  PiggyBank,
  FileCheck2,
  Database,
  Shield,
  Bot,
  BrainCircuit,
  History,
  Settings,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  counts?: {
    opportunities?: number;
    tasksReady?: number;
    needsHuman?: number;
    evidence?: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  counts,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'agent',
      label: 'Núcleo del Agente',
      icon: Cpu,
    },
    {
      id: 'opportunities',
      label: 'Oportunidades',
      icon: Compass,
      badge:
        counts?.opportunities && counts.opportunities > 0
          ? counts.opportunities
          : undefined,
    },
    {
      id: 'tasks',
      label: 'Tareas y Ejecución',
      icon: CheckSquare,
      badge:
        counts?.needsHuman && counts.needsHuman > 0
          ? `${counts.needsHuman} H`
          : counts?.tasksReady && counts.tasksReady > 0
            ? counts.tasksReady
            : undefined,
    },
    {
      id: 'sources',
      label: 'Fuentes Públicas',
      icon: Globe,
    },
    {
      id: 'capabilities',
      label: 'Capacidades',
      icon: Zap,
    },
    {
      id: 'tools',
      label: 'Herramientas',
      icon: Wrench,
    },
    {
      id: 'finances',
      label: 'Finanzas Reales',
      icon: DollarSign,
    },
    {
      id: 'capital',
      label: 'Capital y Reservas',
      icon: PiggyBank,
    },
    {
      id: 'evidence',
      label: 'Evidencia de Trabajo',
      icon: FileCheck2,
      badge:
        counts?.evidence && counts.evidence > 0
          ? counts.evidence
          : undefined,
    },
    {
      id: 'memory',
      label: 'Memoria Persistente',
      icon: Database,
    },
    {
      id: 'security',
      label: 'Seguridad y SSRF',
      icon: Shield,
    },
    {
      id: 'agents',
      label: 'Sub-Agentes',
      icon: Bot,
    },
    {
      id: 'learning',
      label: 'Aprendizaje',
      icon: BrainCircuit,
    },
    {
      id: 'events',
      label: 'Bitácora de Eventos',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
    },
  ];

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full py-4">
      {/* Navigation title */}
      <div className="px-4 mb-3">
        <p className="text-[11px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
          Navegación del Sistema
        </p>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />

                <span className="truncate">
                  {item.label}
                </span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-2 shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Reality principle */}
      <div className="p-3 mx-2 mt-3 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
          <Shield className="w-3.5 h-3.5" />

          Principio de Realidad
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          No se inventan ingresos ni resultados. El capital solo aumenta con
          ingresos confirmados mediante evidencia.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-[#0a0f19] border-r border-slate-800/80 shrink-0 min-h-[calc(100vh-57px)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <div
            className="relative w-72 max-w-[80vw] bg-[#0a0f19] h-full shadow-2xl border-r border-slate-800 z-10 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación del sistema"
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
