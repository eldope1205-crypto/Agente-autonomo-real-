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

import {
  SystemStatus,
} from '../../src/types/index.js';

export const apiRouter = Router();

const db = Database.getInstance();
const agent = AgentCore.getInstance();
const scheduler =
  AgentScheduler.getInstance();
const sources =
  SourceManager.getInstance();
const tasks =
  TaskManager.getInstance();
const executor =
  TaskExecutor.getInstance();
const finance =
  FinanceManager.getInstance();
const subAgents =
  SubAgentManager.getInstance();
const learning =
  LearningEngine.getInstance();
const tools =
  ToolRegistry.getInstance();

function computeSystemStatus(): SystemStatus {
  const state = db.getState();

  return {
    agentStatus: state.agent.status,
    agentMode: state.agent.mode,
    cycleStep: state.agent.cycleStep,
    cycleCount: state.agent.cycleCount,
    localEngineAvailable:
      tools.isLocalEngineAvailable(),
    activeSources:
      state.sources.filter(
        (source) =>
          source.enabled &&
          source.status === 'ACTIVE'
      ).length,
    pendingTasks:
      state.tasks.filter(
        (task) =>
          task.status === 'READY' ||
          task.status === 'AUTHORIZED'
      ).length,
    confirmedCapital:
      finance.getAvailableCapital(),
  };
}

/**
 * Estado general
 */
apiRouter.get(
  '/status',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json({
        system:
          computeSystemStatus(),
        state:
          db.getState(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo obtener el estado.',
      });
    }
  }
);

/**
 * Iniciar agente
 *
 * El agente se inicia primero.
 * El scheduler se intenta activar después.
 *
 * Un fallo del scheduler no debe ocultar
 * que el agente sí se pudo iniciar.
 */
apiRouter.post(
  '/agent/start',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.start();

      let schedulerStarted = true;
      let schedulerError:
        | string
        | undefined;

      try {
        scheduler.start();
      } catch (error: any) {
        schedulerStarted = false;
        schedulerError =
          error?.message ||
          'No se pudo iniciar el programador.';
      }

      res.json({
        status,
        schedulerStarted,
        schedulerError,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo iniciar el agente.',
        details:
          error?.stack || undefined,
      });
    }
  }
);

/**
 * Detener agente
 */
apiRouter.post(
  '/agent/stop',
  async (
    _req: Request,
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

/**
 * Pausar agente
 */
apiRouter.post(
  '/agent/pause',
  async (
    _req: Request,
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

/**
 * Reanudar agente
 */
apiRouter.post(
  '/agent/resume',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const status =
        await agent.resume();

      try {
        scheduler.start();
      } catch {
        // El agente puede permanecer RUNNING
        // aunque el scheduler no pueda arrancar.
      }

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

/**
 * Ejecutar un ciclo manual
 */
apiRouter.post(
  '/agent/cycle',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const result =
        await agent.runOneCycle();

      res.json({
        ...result,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo ejecutar el ciclo.',
      });
    }
  }
);

/**
 * Ejecutar todas las tareas
 */
apiRouter.post(
  '/tasks/execute-all',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const result =
        await executor.executeAllTasks();

      res.json({
        ...result,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron ejecutar las tareas.',
      });
    }
  }
);

/**
 * Ejecutar una tarea
 */
apiRouter.post(
  '/tasks/:id/execute',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const task =
        db.getState().tasks.find(
          (item) =>
            item.id === req.params.id
        );

      if (!task) {
        return res.status(404).json({
          error:
            'Tarea no encontrada.',
        });
      }

      const result =
        await executor.executeTask(task);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo ejecutar la tarea.',
      });
    }
  }
);

/**
 * Autorizar tarea
 */
apiRouter.post(
  '/tasks/:id/authorize',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        tasks.authorizeTask(
          req.params.id
        );

      res.json({
        ...result,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo autorizar la tarea.',
      });
    }
  }
);

/**
 * Cancelar tarea
 */
apiRouter.post(
  '/tasks/:id/cancel',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        tasks.cancelTask(
          req.params.id
        );

      res.json({
        ...result,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo cancelar la tarea.',
      });
    }
  }
);

/**
 * Resolver intervención humana
 */
apiRouter.post(
  '/tasks/:id/resolve-human',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await executor.continueTaskAfterHuman(
          req.params.id,
          req.body?.notes
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo continuar la tarea.',
      });
    }
  }
);

/**
 * Fuentes
 */
apiRouter.get(
  '/sources',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().sources
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener las fuentes.',
      });
    }
  }
);

apiRouter.post(
  '/sources',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        sources.addSource(
          req.body
        );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo añadir la fuente.',
      });
    }
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

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo probar la fuente.',
      });
    }
  }
);

/**
 * Finanzas
 */
apiRouter.get(
  '/finance',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        finance.getSummary()
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener las finanzas.',
      });
    }
  }
);

apiRouter.get(
  '/finance/transactions',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().finance
          .transactions
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener las transacciones.',
      });
    }
  }
);

/**
 * Aprendizaje
 */
apiRouter.get(
  '/learning',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json({
        history:
          db.getState().learning,
        proposals:
          learning.getProposals(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo obtener el aprendizaje.',
      });
    }
  }
);

/**
 * Subagentes
 */
apiRouter.get(
  '/agents',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        subAgents.getAgents()
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener los agentes.',
      });
    }
  }
);

/**
 * Herramientas
 */
apiRouter.get(
  '/tools',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().tools
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener las herramientas.',
      });
    }
  }
);

/**
 * Evidencias
 */
apiRouter.get(
  '/evidence',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().evidence
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener las evidencias.',
      });
    }
  }
);

/**
 * Eventos
 */
apiRouter.get(
  '/events',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().events
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudieron obtener los eventos.',
      });
    }
  }
);

/**
 * Estado completo
 */
apiRouter.get(
  '/state',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState()
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo obtener el estado.',
      });
    }
  }
);

/**
 * Configuración
 */
apiRouter.get(
  '/settings',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      res.json(
        db.getState().settings
      );
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'No se pudo obtener la configuración.',
      });
    }
  }
);

apiRouter.post(
  '/settings',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const state =
        db.getState();

      state.settings = {
        ...state.settings,
        ...req.body,
      };

      if (req.body?.agentMode) {
        state.agent.mode =
          req.body.agentMode;
      }

      db.save();

      res.json({
        settings:
          state.settings,
        system:
          computeSystemStatus(),
      });
    } catch (error: any) {
      res.status(400).json({
        error:
          error?.message ||
          'No se pudo guardar la configuración.',
      });
    }
  }
);

/**
 * Diagnóstico local
 */
apiRouter.get(
  '/diagnostics',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const state =
        db.getState();

      res.json({
        server: 'ok',
        database: 'ok',
        localEngine:
          tools.isLocalEngineAvailable(),
        agentStatus:
          state.agent.status,
        scheduler:
          scheduler.isRunning(),
        tasks:
          state.tasks.length,
        opportunities:
          state.opportunities.length,
        sources:
          state.sources.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Error en diagnóstico.',
        details:
          error?.stack || undefined,
      });
    }
  }
);
