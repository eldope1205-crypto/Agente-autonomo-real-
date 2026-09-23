import { Database } from '../../db/database.js';
import { AgentCore } from '../agent/index.js';

export class AgentScheduler {
  private static instance: AgentScheduler;

  private db: Database;
  private agent: AgentCore;

  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    this.db = Database.getInstance();
    this.agent = AgentCore.getInstance();
  }

  public static getInstance(): AgentScheduler {
    if (!AgentScheduler.instance) {
      AgentScheduler.instance =
        new AgentScheduler();
    }

    return AgentScheduler.instance;
  }

  public start(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const state =
      this.db.getState();

    const intervalSeconds =
      Math.max(
        30,
        Number(
          state.settings.searchInterval || 120
        )
      );

    state.agent.schedulerActive =
      true;

    this.timer =
      setInterval(
        () => {
          void this.tick();
        },
        intervalSeconds * 1000
      );

    this.db.addEvent({
      type: 'AGENT_STARTED',
      severity: 'INFO',
      title: 'Scheduler iniciado',
      message:
        `El agente ejecutará ciclos automáticamente cada ${intervalSeconds} segundos.`,
    });

    this.db.save();

    console.log(
      `[Scheduler] Iniciado con intervalo de ${intervalSeconds}s`
    );
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(
        this.timer
      );

      this.timer = null;
    }

    const state =
      this.db.getState();

    state.agent.schedulerActive =
      false;

    this.db.addEvent({
      type: 'AGENT_STOPPED',
      severity: 'INFO',
      title: 'Scheduler detenido',
      message:
        'La ejecución automática de ciclos ha sido detenida.',
    });

    this.db.save();

    console.log(
      '[Scheduler] Detenido'
    );
  }

  public isActive(): boolean {
    return this.timer !== null;
  }

  public isBusy(): boolean {
    return this.isProcessing;
  }

  private async tick(): Promise<void> {
    const state =
      this.db.getState();

    if (
      state.agent.status !==
      'RUNNING'
    ) {
      return;
    }

    if (
      this.isProcessing
    ) {
      return;
    }

    this.isProcessing =
      true;

    try {
      state.agent.cycleStep =
        'DISCOVER';

      this.db.save();

      await this.agent.runOneCycle();

    } catch (err) {
      console.error(
        '[Scheduler] Error en ciclo programado:',
        err
      );

      const currentState =
        this.db.getState();

      currentState.agent.cycleStep =
        'IDLE';

      this.db.addEvent({
        type: 'AGENT_ERROR',
        severity: 'ERROR',
        title:
          'Error en ciclo automático',
        message:
          err instanceof Error
            ? err.message
            : String(err),
      });

      this.db.save();

    } finally {
      this.isProcessing =
        false;
    }
  }
}
