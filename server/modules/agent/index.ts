import { AgentStatus, AgentMode, CycleStep } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { SearchEngine } from '../search/index.js';
import { DecisionEngine } from '../decision/index.js';
import { TaskManager } from '../tasks/index.js';
import { TaskExecutor } from '../executor/index.js';
import { LearningEngine } from '../learning/index.js';

export class AgentCore {
  private static instance: AgentCore;
  private db: Database;
  private searchEngine: SearchEngine;
  private decisionEngine: DecisionEngine;
  private taskManager: TaskManager;
  private taskExecutor: TaskExecutor;
  private learningEngine: LearningEngine;

  private isRunningCycle = false;

  private constructor() {
    this.db = Database.getInstance();
    this.searchEngine = SearchEngine.getInstance();
    this.decisionEngine = DecisionEngine.getInstance();
    this.taskManager = TaskManager.getInstance();
    this.taskExecutor = TaskExecutor.getInstance();
    this.learningEngine = LearningEngine.getInstance();
  }

  public static getInstance(): AgentCore {
    if (!AgentCore.instance) {
      AgentCore.instance = new AgentCore();
    }
    return AgentCore.instance;
  }

  public getStatus(): AgentStatus {
    return this.db.getState().agent.status;
  }

  public getMode(): AgentMode {
    return this.db.getState().agent.mode;
  }

  public getCycleStep(): CycleStep {
    return this.db.getState().agent.cycleStep;
  }

  public setMode(mode: AgentMode) {
    const state = this.db.getState();
    state.agent.mode = mode;
    state.settings.agentMode = mode;
    this.db.addEvent({
      type: 'AGENT_RESUMED',
      severity: 'INFO',
      title: 'Modo de Operación Modificado',
      message: `El modo del agente se cambió a: ${mode}.`,
    });
    this.db.save();
  }

  public async start(): Promise<AgentStatus> {
    const state = this.db.getState();
    state.agent.status = 'RUNNING';
    state.agent.lastActivity = new Date().toISOString();
    this.db.addEvent({
      type: 'AGENT_STARTED',
      severity: 'SUCCESS',
      title: 'Agente Autónomo Iniciado',
      message: `El agente inició operaciones en modo ${state.agent.mode}.`,
    });
    this.db.save();
    return 'RUNNING';
  }

  public async stop(): Promise<AgentStatus> {
    const state = this.db.getState();
    state.agent.status = 'STOPPED';
    state.agent.cycleStep = 'IDLE';
    state.agent.lastActivity = new Date().toISOString();
    this.db.addEvent({
      type: 'AGENT_STOPPED',
      severity: 'WARNING',
      title: 'Agente Autónomo Detenido',
      message: 'Operaciones detenidas por comando de supervisión.',
    });
    this.db.save();
    return 'STOPPED';
  }

  public async pause(): Promise<AgentStatus> {
    const state = this.db.getState();
    state.agent.status = 'PAUSED';
    state.agent.lastActivity = new Date().toISOString();
    this.db.addEvent({
      type: 'AGENT_PAUSED',
      severity: 'INFO',
      title: 'Agente Pausado',
      message: 'El ciclo de trabajo ha sido pausado.',
    });
    this.db.save();
    return 'PAUSED';
  }

  public async resume(): Promise<AgentStatus> {
    const state = this.db.getState();
    state.agent.status = 'RUNNING';
    state.agent.lastActivity = new Date().toISOString();
    this.db.addEvent({
      type: 'AGENT_RESUMED',
      severity: 'INFO',
      title: 'Agente Reanudado',
      message: `El agente continúa en modo ${state.agent.mode}.`,
    });
    this.db.save();
    return 'RUNNING';
  }

  /**
   * Executes one full autonomous cycle following the 12-step lifecycle:
   * DISCOVER -> ANALYZE -> DECIDE -> PLAN -> EXECUTE -> VERIFY -> SUBMIT ->
   * WAIT_PAYMENT -> CONFIRM_PAYMENT -> ACCOUNT -> LEARN -> REPEAT
   */
  public async runOneCycle(): Promise<{
    success: boolean;
    stepReached: CycleStep;
    details: string;
    opportunitiesFound: number;
    tasksPlanned: number;
    tasksExecuted: number;
  }> {
    if (this.isRunningCycle) {
      return {
        success: false,
        stepReached: this.db.getState().agent.cycleStep,
        details: 'El ciclo previo todavía se encuentra en ejecución.',
        opportunitiesFound: 0,
        tasksPlanned: 0,
        tasksExecuted: 0,
      };
    }

    this.isRunningCycle = true;
    const state = this.db.getState();
    const mode = state.agent.mode;

    let oppsFoundCount = 0;
    let tasksPlannedCount = 0;
    let tasksExecutedCount = 0;

    try {
      // Step 1: DISCOVER
      state.agent.cycleStep = 'DISCOVER';
      this.db.save();
      const discovery = await this.searchEngine.discoverOpportunities();
      oppsFoundCount = discovery.newOpportunities.length;

      // Step 2 & 3: ANALYZE & DECIDE
      state.agent.cycleStep = 'ANALYZE';
      this.db.save();

      const newOpps = state.opportunities.filter((o) => o.status === 'NEW').slice(0, 10);
      for (const opp of newOpps) {
        await this.decisionEngine.analyzeOpportunity(opp);
      }

      state.agent.cycleStep = 'DECIDE';
      this.db.save();

      // Step 4: PLAN (Only in PREPARE or AUTHORIZED modes)
      state.agent.cycleStep = 'PLAN';
      this.db.save();

      if (mode === 'PREPARE' || mode === 'AUTHORIZED') {
        const readyOpps = state.opportunities.filter((o) => o.status === 'READY').slice(0, 2);
        for (const opp of readyOpps) {
          this.taskManager.planTaskFromOpportunity(opp);
          tasksPlannedCount++;
        }
      }

      // Step 5, 6 & 7: EXECUTE, VERIFY, SUBMIT
      state.agent.cycleStep = 'EXECUTE';
      this.db.save();

      // Find tasks ready for execution
      // The agent executes tasks autonomously when in AUTHORIZED mode or when requireExecutionAuthorization is disabled
      const candidateTasks = state.tasks
        .filter((t) => {
          if (t.status === 'AUTHORIZED') return true;
          if (t.status === 'READY') {
            if (mode === 'AUTHORIZED' || !state.settings.requireExecutionAuthorization) {
              return true;
            }
          }
          return false;
        })
        .slice(0, state.settings.maxTasksPerCycle || 2);

      for (const task of candidateTasks) {
        state.agent.cycleStep = 'EXECUTE';
        const execRes = await this.taskExecutor.executeTask(task);
        if (execRes.success) {
          tasksExecutedCount++;
        }
      }

      // Step 6: VERIFY
      state.agent.cycleStep = 'VERIFY';
      this.db.save();

      // Step 7: SUBMIT
      state.agent.cycleStep = 'SUBMIT';
      this.db.save();

      // Step 8 & 9: WAIT_PAYMENT & CONFIRM_PAYMENT
      state.agent.cycleStep = 'WAIT_PAYMENT';
      this.db.save();

      // Check tasks awaiting payment confirmation
      const pendingPaymentTasks = state.tasks.filter((t) => t.paymentStatus === 'PENDING');
      if (pendingPaymentTasks.length > 0) {
        state.agent.cycleStep = 'WAIT_PAYMENT';
      }

      state.agent.cycleStep = 'CONFIRM_PAYMENT';
      this.db.save();

      // Step 10: ACCOUNT
      state.agent.cycleStep = 'ACCOUNT';
      // Re-audit ledger and recalculate financial balance
      this.db.saveImmediate();

      // Step 11: LEARN
      state.agent.cycleStep = 'LEARN';
      this.learningEngine.evaluatePerformance();

      // Step 12: REPEAT / Finish
      state.agent.cycleCount += 1;
      state.agent.lastCycleCompletedAt = new Date().toISOString();
      state.agent.cycleStep = 'REPEAT';
      this.db.save();

      setTimeout(() => {
        if (state.agent.status === 'RUNNING') {
          state.agent.cycleStep = 'IDLE';
          this.db.save();
        }
      }, 1000);

      return {
        success: true,
        stepReached: 'REPEAT',
        details: `Ciclo #${state.agent.cycleCount} completado con éxito. Oportunidades: ${oppsFoundCount}, Planificadas: ${tasksPlannedCount}, Ejecutadas: ${tasksExecutedCount}.`,
        opportunitiesFound: oppsFoundCount,
        tasksPlanned: tasksPlannedCount,
        tasksExecuted: tasksExecutedCount,
      };
    } catch (err: any) {
      console.error('[AgentCore] Error during cycle execution:', err);
      state.agent.status = 'ERROR';
      this.db.addEvent({
        type: 'AGENT_STOPPED',
        severity: 'ERROR',
        title: 'Error Crítico en Ciclo Autónomo',
        message: err.message || 'Fallo desconocido en el ciclo del agente.',
      });
      this.db.save();
      return {
        success: false,
        stepReached: state.agent.cycleStep,
        details: `Fallo en el ciclo: ${err.message}`,
        opportunitiesFound: oppsFoundCount,
        tasksPlanned: tasksPlannedCount,
        tasksExecuted: tasksExecutedCount,
      };
    } finally {
      this.isRunningCycle = false;
    }
  }
}
