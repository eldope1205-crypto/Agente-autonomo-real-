import {
  AgentStatus,
  AgentMode,
  CycleStep,
  DatabaseState,
  SystemStatus,
  Source,
  Opportunity,
  Task,
  Transaction,
  LearningInsight,
  SubAgent,
  Tool,
  EvidenceItem,
  AgentEvent,
  AppSettings,
} from '../types/index.js';

const BASE_URL = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }
  );

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  let data: any;

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let message =
      `HTTP ${response.status}`;

    if (
      data &&
      typeof data === 'object'
    ) {
      message =
        data.error ||
        data.message ||
        message;

      if (
        data.details
      ) {
        message +=
          `\n\nDetalles:\n${data.details}`;
      }
    } else if (
      typeof data === 'string' &&
      data.trim()
    ) {
      message =
        data.trim();
    }

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  getStatus:
    () =>
      request<{
        system: SystemStatus;
        state: DatabaseState;
      }>('/status'),

  getState:
    () =>
      request<DatabaseState>(
        '/state'
      ),

  getDiagnostics:
    () =>
      request<{
        server: string;
        database: string;
        localEngine: boolean;
        agentStatus: AgentStatus;
        scheduler: boolean;
        tasks: number;
        opportunities: number;
        sources: number;
      }>('/diagnostics'),

  startAgent:
    () =>
      request<{
        status: AgentStatus;
        schedulerStarted: boolean;
        schedulerError?: string;
        system: SystemStatus;
      }>(
        '/agent/start',
        {
          method: 'POST',
        }
      ),

  stopAgent:
    () =>
      request<{
        status: AgentStatus;
        system: SystemStatus;
      }>(
        '/agent/stop',
        {
          method: 'POST',
        }
      ),

  pauseAgent:
    () =>
      request<{
        status: AgentStatus;
        system: SystemStatus;
      }>(
        '/agent/pause',
        {
          method: 'POST',
        }
      ),

  resumeAgent:
    () =>
      request<{
        status: AgentStatus;
        system: SystemStatus;
      }>(
        '/agent/resume',
        {
          method: 'POST',
        }
      ),

  runCycle:
    () =>
      request<{
        success: boolean;
        stepReached: CycleStep;
        details: string;
        opportunitiesFound: number;
        tasksPlanned: number;
        tasksExecuted: number;
      }>(
        '/agent/cycle',
        {
          method: 'POST',
        }
      ),

  getSources:
    () =>
      request<Source[]>(
        '/sources'
      ),

  addSource:
    (
      source: Partial<Source>
    ) =>
      request<Source>(
        '/sources',
        {
          method: 'POST',
          body: JSON.stringify(
            source
          ),
        }
      ),

  testSource:
    (id: string) =>
      request<{
        success: boolean;
        message?: string;
        error?: string;
      }>(
        `/sources/${encodeURIComponent(
          id
        )}/test`,
        {
          method: 'POST',
        }
      ),

  getFinance:
    () =>
      request<any>(
        '/finance'
      ),

  getTransactions:
    () =>
      request<Transaction[]>(
        '/finance/transactions'
      ),

  getLearning:
    () =>
      request<{
        history: LearningInsight[];
        proposals: any[];
      }>(
        '/learning'
      ),

  getAgents:
    () =>
      request<SubAgent[]>(
        '/agents'
      ),

  getTools:
    () =>
      request<Tool[]>(
        '/tools'
      ),

  getEvidence:
    () =>
      request<EvidenceItem[]>(
        '/evidence'
      ),

  getEvents:
    () =>
      request<AgentEvent[]>(
        '/events'
      ),

  getSettings:
    () =>
      request<AppSettings>(
        '/settings'
      ),

  saveSettings:
    (
      settings: Partial<AppSettings>
    ) =>
      request<{
        settings: AppSettings;
        system: SystemStatus;
      }>(
        '/settings',
        {
          method: 'POST',
          body: JSON.stringify(
            settings
          ),
        }
      ),

  executeAllTasks:
    () =>
      request<{
        processed: number;
        executed: number;
        blocked: number;
        completed: number;
        failed: number;
      }>(
        '/tasks/execute-all',
        {
          method: 'POST',
        }
      ),

  executeTask:
    (id: string) =>
      request<{
        success: boolean;
        task?: Task;
        error?: string;
      }>(
        `/tasks/${encodeURIComponent(
          id
        )}/execute`,
        {
          method: 'POST',
        }
      ),

  authorizeTask:
    (id: string) =>
      request<any>(
        `/tasks/${encodeURIComponent(
          id
        )}/authorize`,
        {
          method: 'POST',
        }
      ),

  cancelTask:
    (id: string) =>
      request<any>(
        `/tasks/${encodeURIComponent(
          id
        )}/cancel`,
        {
          method: 'POST',
        }
      ),

  resolveHumanTask:
    (
      id: string,
      notes?: string
    ) =>
      request<any>(
        `/tasks/${encodeURIComponent(
          id
        )}/resolve-human`,
        {
          method: 'POST',
          body: JSON.stringify({
            notes,
          }),
        }
      ),
};

export default api;
