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
      AgentScheduler.instance = new AgentScheduler();
    }
    return AgentScheduler.instance;
  }

  public start() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const state = this.db.getState();
    state.agent.schedulerActive = true;
    const intervalSeconds = Math.max(30, state.settings.searchInterval || 120);

    this.timer = setInterval(() => {
      this.tick();
    }, intervalSeconds * 1000);

    this.db.save();
    console.log(`[Scheduler] Iniciado con intervalo de ${intervalSeconds}s`);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const state = this.db.getState();
    state.agent.schedulerActive = false;
    this.db.save();
    console.log('[Scheduler] Detenido');
  }

  private async tick() {
    const state = this.db.getState();
    if (state.agent.status !== 'RUNNING') {
      return;
    }
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      await this.agent.runOneCycle();
    } catch (err) {
      console.error('[Scheduler] Error en ciclo programado:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}
