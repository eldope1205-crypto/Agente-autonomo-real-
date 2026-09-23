import {
  Router,
  Request,
  Response,
} from 'express';
import path from 'path';
import fs from 'fs';

import { Database } from '../db/database.js';
import { AgentCore } from '../modules/agent/index.js';
import { AgentScheduler } from '../modules/scheduler/index.js';
import { SourceManager } from '../modules/sources/index.js';
import { TaskManager } from '../modules/tasks/index.js';
import { TaskExecutor } from '../modules/executor/index.js';
import { FinanceManager } from '../modules/finance/index.js';
import { SubAgentManager } from '../modules/agents/index.js';
import { LearningEngine } from '../modules/learning/index.js';
import { ToolRegistry } from '../modules/tools/index.js';
import { SystemStatus } from '../../src/types/index.js';

export const apiRouter = Router();

const db = Database.getInstance();
const agent = AgentCore.getInstance();
const scheduler = AgentScheduler.getInstance();
const sources = SourceManager.getInstance();
const tasks = TaskManager.getInstance();
const executor = TaskExecutor.getInstance();
const finance = FinanceManager.getInstance();
const subAgents = SubAgentManager.getInstance();
const learning = LearningEngine.getInstance();
const tools = ToolRegistry.getInstance();

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function toPositiveInt(
  value: unknown,
  fallback: number,
  maximum: number
): number {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return Math.min(
    Math.floor(parsed),
    maximum
  );
}

function computeSystemStatus(): SystemStatus {
  const state = db.getState();

  const opportunities =
    state.opportunities;

  const tasksList =
    state.tasks;

  const newOpps =
    opportunities.filter(
      (item) =>
        item.status === 'NEW'
    ).length;

  const readyOpps =
    opportunities.filter(
      (item) =>
        item.status === 'READY'
    ).length;

  const completedOpps =
    opportunities.filter(
      (item) =>
        item.status === 'COMPLETED'
    ).length;

  const rejectedOpps =
    opportunities.filter(
      (item) =>
        item.status === 'REJECTED'
    ).length;

  const blockedOpps =
    opportunities.filter(
      (item) =>
        item.status === 'BLOCKED'
    ).length;

  const readyTasks =
    tasksList.filter(
      (item) =>
        item.status === 'READY'
    ).length;

  const runningTasks =
    tasksList.filter(
      (item) =>
        item.status === 'RUNNING'
    ).length;

  const completedTasks =
    tasksList.filter(
      (item) =>
        item.status === 'COMPLETED'
    ).length;

  const needsHuman =
    tasksList.filter(
      (item) =>
        item.status === 'NEEDS_HUMAN'
    ).length;

  const blockedTasks =
    tasksList.filter(
      (item) =>
        item.status === 'BLOCKED'
    ).length;

  const failedTasks =
    tasksList.filter(
      (item) =>
        item.status === 'FAILED'
    ).length;

  const activeSources =
    state.sources.filter(
      (source) =>
        source.enabled &&
        source.status === 'ACTIVE'
    ).length;

  const recentErrors =
    state.events.filter(
      (event) =>
        event.severity === 'ERROR'
    ).length;

  return {
    agentStatus:
      state.agent.status,

    currentMode:
      state.agent.mode,

    currentCycleStep:
      state.agent.cycleStep,

    cycleCount:
      state.agent.cycleCount,

    lastActivity:
      state.agent.lastActivity,

    schedulerActive:
      state.agent.schedulerActive,

    opportunitiesCount: {
      total:
        opportunities.length,
      new:
        newOpps,
      ready:
        readyOpps,
      completed:
        completedOpps,
      rejected:
        rejectedOpps,
      blocked:
        blockedOpps,
    },

    tasksCount: {
      total:
        tasksList.length,
      ready:
        readyTasks,
      running:
        runningTasks,
      completed:
        completedTasks,
      needsHuman,
      blocked:
        blockedTasks,
      failed:
        failedTasks,
    },

    activeSourcesCount:
      activeSources,

    totalSourcesCount:
      state.sources.length,

    finances:
      state.finances,

    recentErrorsCount:
      recentErrors,

    /*
     * Compatibilidad con el frontend antiguo.
     * Gemini ya no se utiliza.
     */
    geminiConfigured:
      tools.isGeminiAvailable(),
  };
}

/*
 * ============================================================
 * 1. SYSTEM STATUS
 * ============================================================
 */

apiRouter.get(
  '/status',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      computeSystemStatus()
    );
  }
);

/*
 * ============================================================
 * 2. OPPORTUNITIES
 * ============================================================
 */

apiRouter.get(
  '/opportunities',
  (
    req: Request,
    res: Response
  ) => {
    const {
      status,
      limit,
    } = req.query;

    let opportunities =
      db.getState()
        .opportunities;

    if (
      typeof status === 'string' &&
      status.length > 0
    ) {
      opportunities =
        opportunities.filter(
          (item) =>
            item.status === status
        );
    }

    const max =
      toPositiveInt(
        limit,
        100,
        500
      );

    res.json(
      opportunities.slice(
        0,
        max
      )
    );
  }
);

/*
 * ============================================================
 * 3. TASKS
 * ============================================================
 */

apiRouter.get(
  '/tasks',
  (
    req: Request,
    res: Response
  ) => {
    const {
      status,
    } = req.query;

    let taskList =
      tasks.getTasks();

    if (
      typeof status === 'string' &&
      status.length > 0
    ) {
      taskList =
        taskList.filter(
          (task) =>
            task.status === status
        );
    }

    res.json(
      taskList
    );
  }
);

/*
 * ============================================================
 * 4. SOURCES
 * ============================================================
 */

apiRouter.get(
  '/sources',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      sources.getSources()
    );
  }
);

/*
 * ============================================================
 * 5. CAPABILITIES
 * ============================================================
 */

apiRouter.get(
  '/capabilities',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      db.getState()
        .capabilities
    );
  }
);

apiRouter.patch(
  '/capabilities/:id/toggle',
  (
    req: Request,
    res: Response
  ) => {
    const {
      id,
    } = req.params;

    const capability =
      db.getState()
        .capabilities
        .find(
          (item) =>
            item.id === id
        );

    if (!capability) {
      return res.status(404).json({
        error:
          'Capacidad no encontrada.',
      });
    }

    capability.enabled =
      !capability.enabled;

    db.save();

    res.json(
      capability
    );
  }
);

/*
 * ============================================================
 * 6. TOOLS
 * ============================================================
 */

apiRouter.get(
  '/tools',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      db.getState().tools
    );
  }
);

/*
 * ============================================================
 * 7. MEMORY
 * ============================================================
 */

apiRouter.get(
  '/memory',
  (
    req: Request,
    res: Response
  ) => {
    const state =
      db.getState();

    res.json({
      version:
        state.version,

      agentStats:
        state.agent,

      totalOpportunities:
        state.opportunities.length,

      totalTasks:
        state.tasks.length,

      totalEvidence:
        state.evidence.length,

      totalTransactions:
        state.transactions.length,

      totalEvents:
        state.events.length,

      lastUpdate:
        state.agent.lastActivity,

      engine:
        'local-autonomous-engine-v1',

      externalAi:
        false,
    });
  }
);

/*
 * ============================================================
 * 8. EVENTS
 * ============================================================
 */

apiRouter.get(
  '/events',
  (
    req: Request,
    res: Response
  ) => {
    const max =
      toPositiveInt(
        req.query.limit,
        50,
        500
      );

    res.json(
      db.getState()
        .events
        .slice(
          0,
          max
        )
    );
  }
);

/*
 * ============================================================
 * 9. FINANCES
 * ============================================================
 */

apiRouter.get(
  '/finances',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      summary:
        finance.getSummary(),

      transactions:
        finance.getTransactions(),

      limits:
        finance.getLimits(),
    });
  }
);

apiRouter.get(
  '/capital',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      summary:
        finance.getSummary(),

      limits:
        finance.getLimits(),
    });
  }
);

/*
 * ============================================================
 * 10. EVIDENCE
 * ============================================================
 */

apiRouter.get(
  '/evidence',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      db.getState()
        .evidence
    );
  }
);

apiRouter.get(
  '/evidence/file/:filename',
  (
    req: Request,
    res: Response
  ) => {
    const filename =
      path.basename(
        req.params.filename
      );

    const evidenceDir =
      db.getEvidenceDir();

    const filePath =
      path.join(
        evidenceDir,
        filename
      );

    /*
     * Evita que una ruta manipulada
     * salga del directorio de evidencias.
     */
    const resolvedDir =
      path.resolve(
        evidenceDir
      );

    const resolvedFile =
      path.resolve(
        filePath
      );

    if (
      !resolvedFile.startsWith(
        resolvedDir + path.sep
      )
    ) {
      return res.status(403).json({
        error:
          'Acceso al archivo bloqueado.',
      });
    }

    if (
      !fs.existsSync(
        resolvedFile
      )
    ) {
      return res.status(404).json({
        error:
          'Archivo de evidencia no encontrado.',
      });
    }

    res.sendFile(
      resolvedFile
    );
  }
);

/*
 * ============================================================
 * 11. SECONDARY AGENTS
 * ============================================================
 */

apiRouter.get(
  '/agents',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      subAgents.getSubAgents()
    );
  }
);

apiRouter.post(
  '/agents/:id/activate',
  (
    req: Request,
    res: Response
  ) => {
    const result =
      subAgents.activateSubAgent(
        req.params.id
      );

    if (!result.success) {
      return res.status(400).json({
        error:
          result.reason,
      });
    }

    res.json(
      result.agent
    );
  }
);

apiRouter.post(
  '/agents/:id/pause',
  (
    req: Request,
    res: Response
  ) => {
    const result =
      subAgents.pauseSubAgent(
        req.params.id
      );

    res.json(
      result
    );
  }
);

/*
 * ============================================================
 * 12. AGENT CONTROLS
 * ============================================================
 */

apiRouter.post(
  '/agent/start',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.start();

      scheduler.start();

      res.json({
        status,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo iniciar el agente.',
      });
    }
  }
);

apiRouter.post(
  '/agent/stop',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.stop();

      scheduler.stop();

      res.json({
        status,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo detener el agente.',
      });
    }
  }
);

apiRouter.post(
  '/agent/pause',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.pause();

      res.json({
        status,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo pausar el agente.',
      });
    }
  }
);

apiRouter.post(
  '/agent/resume',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.resume();

      res.json({
        status,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo reanudar el agente.',
      });
    }
  }
);

apiRouter.post(
  '/agent/mode',
  (
    req: Request,
    res: Response
  ) => {
    const {
      mode,
    } = req.body || {};

    if (
      mode !== 'OBSERVE' &&
      mode !== 'PREPARE' &&
      mode !== 'AUTHORIZED'
    ) {
      return res.status(400).json({
        error:
          'Modo no válido.',
      });
    }

    agent.setMode(
      mode
    );

    res.json({
      mode,
      system:
        computeSystemStatus(),
    });
  }
);

apiRouter.post(
  '/agent/cycle',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await agent.runOneCycle();

      res.json({
        cycleResult:
          result,

        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Error durante el ciclo.',
      });
    }
  }
);

/*
 * ============================================================
 * 13. TASK ACTIONS
 * ============================================================
 */

apiRouter.post(
  '/tasks/:id/authorize',
  (
    req: Request,
    res: Response
  ) => {
    const updated =
      tasks.authorizeTask(
        req.params.id
      );

    if (!updated) {
      return res.status(404).json({
        error:
          'Tarea no encontrada.',
      });
    }

    res.json(
      updated
    );
  }
);

apiRouter.post(
  '/tasks/:id/cancel',
  (
    req: Request,
    res: Response
  ) => {
    const {
      reason,
    } = req.body || {};

    const updated =
      tasks.cancelTask(
        req.params.id,
        typeof reason === 'string'
          ? reason.substring(
              0,
              1000
            )
          : undefined
      );

    if (!updated) {
      return res.status(404).json({
        error:
          'Tarea no encontrada.',
      });
    }

    res.json(
      updated
    );
  }
);

apiRouter.post(
  '/tasks/:id/resolve-human',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        notes,
      } = req.body || {};

      const result =
        await executor
          .continueTaskAfterHuman(
            req.params.id,
            typeof notes === 'string'
              ? notes.substring(
                  0,
                  2000
                )
              : undefined
          );

      if (
        !result.success &&
        result.error ===
          'Tarea no encontrada'
      ) {
        return res.status(404).json({
          error:
            'Tarea no encontrada.',
        });
      }

      res.json(
        result
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo continuar la tarea.',
      });
    }
  }
);

apiRouter.post(
  '/tasks/execute-all',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await executor
          .executeAllTasks();

      res.json(
        result
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Error ejecutando las tareas.',
      });
    }
  }
);

apiRouter.post(
  '/tasks/:id/execute',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const task =
        tasks.getTask(
          req.params.id
        );

      if (!task) {
        return res.status(404).json({
          error:
            'Tarea no encontrada.',
        });
      }

      if (
        task.status !== 'READY' &&
        task.status !== 'AUTHORIZED'
      ) {
        return res.status(400).json({
          error:
            `La tarea no puede ejecutarse en estado ${task.status}.`,
        });
      }

      if (
        task.status === 'READY'
      ) {
        task.status =
          'AUTHORIZED';
      }

      const result =
        await executor
          .executeTask(task);

      res.json(
        result
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Error ejecutando la tarea.',
      });
    }
  }
);

apiRouter.post(
  '/tasks/plan-from-opportunity',
  (
    req: Request,
    res: Response
  ) => {
    const {
      opportunityId,
    } = req.body || {};

    if (
      typeof opportunityId !==
      'string' ||
      !opportunityId
    ) {
      return res.status(400).json({
        error:
          'Se requiere opportunityId.',
      });
    }

    const opportunity =
      db.getState()
        .opportunities
        .find(
          (item) =>
            item.id ===
            opportunityId
        );

    if (!opportunity) {
      return res.status(404).json({
        error:
          'Oportunidad no encontrada.',
      });
    }

    const planned =
      tasks.planTaskFromOpportunity(
        opportunity
      );

    res.json(
      planned
    );
  }
);

/*
 * ============================================================
 * 14. SOURCE ACTIONS
 * ============================================================
 */

apiRouter.post(
  '/sources',
  (
    req: Request,
    res: Response
  ) => {
    const {
      name,
      url,
      type,
      category,
      description,
    } = req.body || {};

    if (
      typeof name !== 'string' ||
      typeof url !== 'string' ||
      typeof type !== 'string'
    ) {
      return res.status(400).json({
        error:
          'Faltan name, url o type.',
      });
    }

    try {
      const created =
        sources.addSource({
          name:
            name.substring(
              0,
              200
            ),

          url:
            url.substring(
              0,
              2000
            ),

          type,

          category:
            typeof category ===
            'string'
              ? category.substring(
                  0,
                  100
                )
              : undefined,

          description:
            typeof description ===
            'string'
              ? description.substring(
                  0,
                  1000
                )
              : undefined,
        });

      res.json(
        created
      );
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo crear la fuente.',
      });
    }
  }
);

apiRouter.delete(
  '/sources/:id',
  (
    req: Request,
    res: Response
  ) => {
    const removed =
      sources.removeSource(
        req.params.id
      );

    if (!removed) {
      return res.status(404).json({
        error:
          'Fuente no encontrada.',
      });
    }

    res.json({
      success: true,
    });
  }
);

apiRouter.patch(
  '/sources/:id/toggle',
  (
    req: Request,
    res: Response
  ) => {
    const {
      enabled,
    } = req.body || {};

    const updated =
      sources.toggleSource(
        req.params.id,
        Boolean(enabled)
      );

    if (!updated) {
      return res.status(404).json({
        error:
          'Fuente no encontrada.',
      });
    }

    res.json(
      updated
    );
  }
);

apiRouter.post(
  '/sources/:id/test',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await sources.testSource(
          req.params.id
        );

      res.json(
        result
      );
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error:
          error?.message ||
          'Error probando la fuente.',
      });
    }
  }
);

/*
 * ============================================================
 * 15. FINANCIAL OPERATIONS
 * ============================================================
 */

apiRouter.post(
  '/finances/income',
  (
    req: Request,
    res: Response
  ) => {
    try {
      const tx =
        finance.registerIncome(
          req.body || {}
        );

      res.json(
        tx
      );
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo registrar el ingreso.',
      });
    }
  }
);

apiRouter.post(
  '/finances/confirm-income',
  (
    req: Request,
    res: Response
  ) => {
    const {
      transactionId,
      proofReference,
    } = req.body || {};

    if (
      typeof transactionId !==
        'string' ||
      typeof proofReference !==
        'string' ||
      !transactionId ||
      !proofReference
    ) {
      return res.status(400).json({
        error:
          'Se requiere transactionId y una referencia de pago real.',
      });
    }

    try {
      const confirmed =
        finance.confirmIncome(
          transactionId,
          proofReference.substring(
            0,
            2000
          )
        );

      res.json(
        confirmed
      );
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo confirmar el ingreso.',
      });
    }
  }
);

apiRouter.post(
  '/finances/expense',
  (
    req: Request,
    res: Response
  ) => {
    try {
      const tx =
        finance.registerExpense({
          ...(req.body || {}),
          authorizedByHuman:
            true,
        });

      res.json(
        tx
      );
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo registrar el gasto.',
      });
    }
  }
);

/*
 * ============================================================
 * 16. LEARNING
 * ============================================================
 */

apiRouter.get(
  '/learning',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      learning.getInsights()
    );
  }
);

apiRouter.post(
  '/learning/evaluate',
  (
    req: Request,
    res: Response
  ) => {
    try {
      const insight =
        learning.evaluatePerformance();

      res.json(
        insight
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo evaluar el aprendizaje.',
      });
    }
  }
);

/*
 * ============================================================
 * 17. SECURITY
 * ============================================================
 */

apiRouter.get(
  '/security',
  (
    req: Request,
    res: Response
  ) => {
    const state =
      db.getState();

    res.json({
      rules:
        state.securityRules,

      events:
        state.events.filter(
          (event) =>
            event.type ===
            'SECURITY_BLOCK'
        ),
    });
  }
);

/*
 * ============================================================
 * 18. SETTINGS
 * ============================================================
 */

apiRouter.get(
  '/settings',
  (
    req: Request,
    res: Response
  ) => {
    res.json(
      db.getState()
        .settings
    );
  }
);

apiRouter.post(
  '/settings',
  (
    req: Request,
    res: Response
  ) => {
    const incoming =
      req.body || {};

    const current =
      db.getState()
        .settings;

    db.getState()
      .settings = {
        ...current,
        ...incoming,
      };

    db.saveImmediate();

    res.json(
      db.getState()
        .settings
    );
  }
);
