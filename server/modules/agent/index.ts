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

  public setMode(mode: AgentMode): void {
    const state = this.db.getState();

    state.agent.mode = mode;
    state.settings.agentMode = mode;

    this.db.addEvent({
      type: 'AGENT_RESUMED',
      severity: 'INFO',
      title: 'Modo del agente actualizado',
      message: `Modo cambiado a ${mode}.`,
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
      title: 'Agente iniciado',
      message: 'El agente está preparado para ejecutar ciclos autónomos.',
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
      title: 'Agente detenido',
      message: 'El agente ha detenido sus ciclos.',
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
      title: 'Agente pausado',
      message: 'El ciclo autónomo ha sido pausado.',
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
      title: 'Agente reanudado',
      message: 'El agente continuará sus ciclos automáticamente.',
    });

    this.db.save();

    return 'RUNNING';
  }

  /**
   * Ejecuta un ciclo completo:
   *
   * DESCUBRIR
   * ANALIZAR
   * DECIDIR
   * PLANIFICAR
   * EJECUTAR
   * VERIFICAR
   * APRENDER
   * REPETIR
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
        details: 'Ya existe un ciclo ejecutándose.',
        opportunitiesFound: 0,
        tasksPlanned: 0,
        tasksExecuted: 0,
      };
    }

    this.isRunningCycle = true;

    const state = this.db.getState();

    let opportunitiesFound = 0;
    let tasksPlanned = 0;
    let tasksExecuted = 0;

    try {
      /*
       * 1. DESCUBRIR
       */
      state.agent.cycleStep = 'DISCOVER';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      const discovery =
        await this.searchEngine.discoverOpportunities();

      opportunitiesFound = discovery.newOpportunities.length;

      /*
       * 2. ANALIZAR
       */
      state.agent.cycleStep = 'ANALYZE';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      const newOpportunities = state.opportunities
        .filter((opportunity) => opportunity.status === 'NEW')
        .slice(0, 10);

      for (const opportunity of newOpportunities) {
        await this.decisionEngine.analyzeOpportunity(opportunity);
      }

      /*
       * 3. DECIDIR
       */
      state.agent.cycleStep = 'DECIDE';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      const acceptedOpportunities = state.opportunities
        .filter((opportunity) => opportunity.status === 'READY')
        .slice(0, state.settings.maxTasksPerCycle || 2);

      /*
       * 4. PLANIFICAR
       */
      state.agent.cycleStep = 'PLAN';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      for (const opportunity of acceptedOpportunities) {
        this.taskManager.planTaskFromOpportunity(opportunity);
        tasksPlanned++;
      }

      /*
       * 5. EJECUTAR
       *
       * El agente intenta ejecutar automáticamente las tareas
       * que cumplen las condiciones técnicas y de seguridad.
       */
      state.agent.cycleStep = 'EXECUTE';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      const executableTasks = state.tasks
        .filter(
          (task) =>
            task.status === 'READY' ||
            task.status === 'AUTHORIZED'
        )
        .slice(0, state.settings.maxTasksPerCycle || 2);

      for (const task of executableTasks) {
        /*
         * No falsificamos autorización ni pagos.
         * TaskExecutor decide si técnicamente puede ejecutarse.
         */
        const result = await this.taskExecutor.executeTask(task);

        if (result.success) {
          tasksExecuted++;
        }
      }

      /*
       * 6. VERIFICAR
       */
      state.agent.cycleStep = 'VERIFY';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      /*
       * 7. ENVIAR / REGISTRAR
       */
      state.agent.cycleStep = 'SUBMIT';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      /*
       * 8. ESPERAR PAGO
       *
       * Aquí solamente detectamos pagos pendientes.
       * No se inventa ningún ingreso.
       */
      state.agent.cycleStep = 'WAIT_PAYMENT';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      const pendingPayments = state.tasks.filter(
        (task) => task.paymentStatus === 'PENDING'
      );

      /*
       * 9. CONFIRMAR PAGO
       *
       * La confirmación real debe proceder de una evidencia
       * o mecanismo de pago válido.
       */
      state.agent.cycleStep = 'CONFIRM_PAYMENT';
      state.agent.lastActivity = new Date().toISOString();
      this.db.save();

      if (pendingPayments.length > 0) {
        this.db.addEvent({
          type: 'PAYMENT_PENDING',
          severity: 'INFO',
          title: 'Pagos pendientes detectados',
          message: `Hay ${pendingPayments.length} tarea(s) esperando confirmación de pago real.`,
          metadata: {
            count: pendingPayments.length,
          },
        });
      }

      /*
       * 10. CONTABILIDAD
       */
      state.agent.cycleStep = 'ACCOUNT';
      state.agent.lastActivity = new Date().toISOString();
      this.db.saveImmediate();

      /*
       * 11. APRENDIZAJE
       */
      state.agent.cycleStep = 'LEARN';
      state.agent.lastActivity = new Date().toISOString();

      this.learningEngine.evaluatePerformance();

      this.db.save();

      /*
       * 12. REPETIR
       */
      state.agent.cycleCount += 1;
      state.agent.lastCycleCompletedAt =
        new Date().toISOString();

      state.agent.lastActivity =
        new Date().toISOString();

      state.agent.cycleStep = 'REPEAT';

      this.db.save();

      return {
        success: true,
        stepReached: 'REPEAT',
        details:
          `Ciclo #${state.agent.cycleCount} completado. ` +
          `Oportunidades: ${opportunitiesFound}. ` +
          `Planificadas: ${tasksPlanned}. ` +
          `Ejecutadas: ${tasksExecuted}.`,
        opportunitiesFound,
        tasksPlanned,
        tasksExecuted,
      };
    } catch (error: any) {
      const message =
        error?.message ||
        'Error desconocido durante el ciclo.';

      state.agent.status = 'ERROR';
      state.agent.lastActivity =
        new Date().toISOString();

      this.db.addEvent({
        type: 'AGENT_STOPPED',
        severity: 'ERROR',
        title: 'Error en ciclo autónomo',
        message,
      });

      this.db.save();

      return {
        success: false,
        stepReached: state.agent.cycleStep,
        details: `Fallo en el ciclo: ${message}`,
        opportunitiesFound,
        tasksPlanned,
        tasksExecuted,
      };
    } finally {
      this.isRunningCycle = false;
    }
  }
}
