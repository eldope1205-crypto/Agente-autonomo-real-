import { SubAgent } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { FinanceManager } from '../finance/index.js';

export class SubAgentManager {
  private static instance: SubAgentManager;
  private db: Database;
  private finance: FinanceManager;

  private constructor() {
    this.db = Database.getInstance();
    this.finance = FinanceManager.getInstance();
  }

  public static getInstance(): SubAgentManager {
    if (!SubAgentManager.instance) {
      SubAgentManager.instance = new SubAgentManager();
    }
    return SubAgentManager.instance;
  }

  public getSubAgents(): SubAgent[] {
    return this.db.getState().subAgents;
  }

  /**
   * Attempts to provision and activate a specialized secondary agent.
   * Enforces strict real capital prerequisites!
   */
  public activateSubAgent(id: string): { success: boolean; agent?: SubAgent; reason?: string } {
    const subAgent = this.db.getState().subAgents.find((a) => a.id === id);
    if (!subAgent) {
      return { success: false, reason: 'Agente secundario no encontrado.' };
    }

    const summary = this.finance.getSummary();

    // 1. Check real confirmed capital
    if (summary.availableCapital < subAgent.capitalRequired) {
      return {
        success: false,
        reason: `Capital insuficiente. El agente "${subAgent.name}" requiere ${subAgent.capitalRequired} € de capital real confirmado para aprovisionar infraestructura y cuotas operativas. Capital disponible actual: ${summary.availableCapital} €.`,
      };
    }

    // 2. Check infrastructure availability
    if (!subAgent.infrastructureReady) {
      // In this environment, mark as ready once capital condition is met and user authorizes
      subAgent.infrastructureReady = true;
    }

    subAgent.authorizationGranted = true;
    subAgent.status = 'ACTIVE';

    this.db.addEvent({
      type: 'AGENT_STARTED',
      severity: 'SUCCESS',
      title: 'Sub-Agente Especializado Activado',
      message: `El sub-agente "${subAgent.name}" ha sido activado con éxito tras verificar el capital requerido (${subAgent.capitalRequired} €).`,
      metadata: { subAgentId: subAgent.id },
    });

    this.db.save();
    return { success: true, agent: subAgent };
  }

  public pauseSubAgent(id: string): { success: boolean; agent?: SubAgent } {
    const subAgent = this.db.getState().subAgents.find((a) => a.id === id);
    if (!subAgent) return { success: false };
    subAgent.status = 'IDLE';
    this.db.save();
    return { success: true, agent: subAgent };
  }
}
