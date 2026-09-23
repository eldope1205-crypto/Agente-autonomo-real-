import {
  SystemStatus,
  Opportunity,
  Task,
  Source,
  Capability,
  Tool,
  FinancialSummary,
  FinancialLimits,
  Transaction,
  EvidenceItem,
  AgentEvent,
  SubAgent,
  LearningInsight,
  SecurityRule,
  AppSettings,
  AgentMode,
  SourceType,
} from '../types/index.js';

const BASE_URL = '/api';

export const api = {
  // System Status
  getStatus: async (): Promise<SystemStatus> => {
    const res = await fetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error('Error al obtener estado del sistema');
    return res.json();
  },

  // Agent Controls
  startAgent: async (): Promise<{ status: string; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al iniciar el agente');
    return res.json();
  },

  stopAgent: async (): Promise<{ status: string; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al detener el agente');
    return res.json();
  },

  pauseAgent: async (): Promise<{ status: string; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al pausar el agente');
    return res.json();
  },

  resumeAgent: async (): Promise<{ status: string; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al reanudar el agente');
    return res.json();
  },

  setAgentMode: async (mode: AgentMode): Promise<{ mode: AgentMode; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Error al cambiar el modo');
    return res.json();
  },

  runCycle: async (): Promise<{ cycleResult: any; system: SystemStatus }> => {
    const res = await fetch(`${BASE_URL}/agent/cycle`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al ejecutar ciclo');
    return res.json();
  },

  // Opportunities
  getOpportunities: async (status?: string): Promise<Opportunity[]> => {
    const url = status ? `${BASE_URL}/opportunities?status=${status}` : `${BASE_URL}/opportunities`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar oportunidades');
    return res.json();
  },

  // Tasks
  getTasks: async (status?: string): Promise<Task[]> => {
    const url = status ? `${BASE_URL}/tasks?status=${status}` : `${BASE_URL}/tasks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar tareas');
    return res.json();
  },

  authorizeTask: async (id: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}/authorize`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al autorizar tarea');
    return res.json();
  },

  cancelTask: async (id: string, reason?: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Error al cancelar tarea');
    return res.json();
  },

  resolveHumanIntervention: async (id: string, notes?: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}/resolve-human`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Error al resolver intervención');
    return res.json();
  },

  executeTaskNow: async (id: string): Promise<{ success: boolean; task: Task; error?: string }> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}/execute`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al ejecutar tarea');
    }
    return res.json();
  },

  executeAllTasks: async (): Promise<{
    processed: number;
    executed: number;
    blocked: number;
    completed: number;
    failed: number;
  }> => {
    const res = await fetch(`${BASE_URL}/tasks/execute-all`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al ejecutar todas las tareas');
    }
    return res.json();
  },

  planFromOpportunity: async (opportunityId: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/plan-from-opportunity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId }),
    });
    if (!res.ok) throw new Error('Error al planificar tarea');
    return res.json();
  },

  // Sources
  getSources: async (): Promise<Source[]> => {
    const res = await fetch(`${BASE_URL}/sources`);
    if (!res.ok) throw new Error('Error al cargar fuentes');
    return res.json();
  },

  addSource: async (data: {
    name: string;
    url: string;
    type: SourceType;
    category?: string;
    description?: string;
  }): Promise<Source> => {
    const res = await fetch(`${BASE_URL}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al añadir fuente');
    }
    return res.json();
  },

  removeSource: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/sources/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar fuente');
  },

  toggleSource: async (id: string, enabled: boolean): Promise<Source> => {
    const res = await fetch(`${BASE_URL}/sources/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('Error al modificar fuente');
    return res.json();
  },

  testSource: async (id: string): Promise<{ success: boolean; source: Source; rawLength: number; error?: string }> => {
    const res = await fetch(`${BASE_URL}/sources/${id}/test`, { method: 'POST' });
    return res.json();
  },

  // Capabilities
  getCapabilities: async (): Promise<Capability[]> => {
    const res = await fetch(`${BASE_URL}/capabilities`);
    if (!res.ok) throw new Error('Error al cargar capacidades');
    return res.json();
  },

  toggleCapability: async (id: string): Promise<Capability> => {
    const res = await fetch(`${BASE_URL}/capabilities/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Error al conmutar capacidad');
    return res.json();
  },

  // Tools
  getTools: async (): Promise<Tool[]> => {
    const res = await fetch(`${BASE_URL}/tools`);
    if (!res.ok) throw new Error('Error al cargar herramientas');
    return res.json();
  },

  // Finances
  getFinances: async (): Promise<{ summary: FinancialSummary; transactions: Transaction[]; limits: FinancialLimits }> => {
    const res = await fetch(`${BASE_URL}/finances`);
    if (!res.ok) throw new Error('Error al cargar finanzas');
    return res.json();
  },

  registerIncome: async (data: {
    amount: number;
    description: string;
    category?: string;
    taskId?: string;
    status: 'PENDING' | 'CONFIRMED';
    evidenceReference?: string;
    notes?: string;
  }): Promise<Transaction> => {
    const res = await fetch(`${BASE_URL}/finances/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar ingreso');
    }
    return res.json();
  },

  confirmIncome: async (transactionId: string, proofReference: string): Promise<Transaction> => {
    const res = await fetch(`${BASE_URL}/finances/confirm-income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, proofReference }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al confirmar ingreso');
    }
    return res.json();
  },

  registerExpense: async (data: { amount: number; description: string; category: string; notes?: string }): Promise<Transaction> => {
    const res = await fetch(`${BASE_URL}/finances/expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar gasto');
    }
    return res.json();
  },

  // Evidence
  getEvidence: async (): Promise<EvidenceItem[]> => {
    const res = await fetch(`${BASE_URL}/evidence`);
    if (!res.ok) throw new Error('Error al cargar evidencias');
    return res.json();
  },

  // Events
  getEvents: async (limit = 100): Promise<AgentEvent[]> => {
    const res = await fetch(`${BASE_URL}/events?limit=${limit}`);
    if (!res.ok) throw new Error('Error al cargar eventos');
    return res.json();
  },

  // Memory
  getMemory: async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/memory`);
    if (!res.ok) throw new Error('Error al cargar memoria');
    return res.json();
  },

  // Sub-Agents
  getAgents: async (): Promise<SubAgent[]> => {
    const res = await fetch(`${BASE_URL}/agents`);
    if (!res.ok) throw new Error('Error al cargar sub-agentes');
    return res.json();
  },

  activateAgent: async (id: string): Promise<SubAgent> => {
    const res = await fetch(`${BASE_URL}/agents/${id}/activate`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al activar sub-agente');
    }
    return res.json();
  },

  pauseAgentSub: async (id: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/agents/${id}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al pausar sub-agente');
    return res.json();
  },

  // Learning
  getLearning: async (): Promise<LearningInsight[]> => {
    const res = await fetch(`${BASE_URL}/learning`);
    if (!res.ok) throw new Error('Error al cargar aprendizaje');
    return res.json();
  },

  evaluateLearning: async (): Promise<LearningInsight> => {
    const res = await fetch(`${BASE_URL}/learning/evaluate`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al evaluar aprendizaje');
    return res.json();
  },

  // Security
  getSecurity: async (): Promise<{ rules: SecurityRule[]; events: AgentEvent[] }> => {
    const res = await fetch(`${BASE_URL}/security`);
    if (!res.ok) throw new Error('Error al cargar seguridad');
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Error al cargar configuración');
    return res.json();
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Error al actualizar configuración');
    return res.json();
  },
};
