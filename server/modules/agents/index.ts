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
      SubAgentManager.instance =
        new SubAgentManager();
    }

    return SubAgentManager.instance;
  }

  /**
   * Devuelve todos los sub-agentes registrados.
   */
  public getSubAgents(): SubAgent[] {
    return this.db.getState().subAgents;
  }

  /**
   * Busca un sub-agente concreto.
   */
  public getSubAgent(
    id: string
  ): SubAgent | undefined {
    return this.db
      .getState()
      .subAgents
      .find((agent) => agent.id === id);
  }

  /**
   * Activa un sub-agente únicamente cuando
   * se cumplen las condiciones financieras y
   * de autorización.
   *
   * No inventa capital ni realiza pagos.
   */
  public activateSubAgent(
    id: string
  ): {
    success: boolean;
    agent?: SubAgent;
    reason?: string;
  } {
    const state = this.db.getState();

    const subAgent = state.subAgents.find(
      (agent) => agent.id === id
    );

    if (!subAgent) {
      return {
        success: false,
        reason:
          'Agente secundario no encontrado.',
      };
    }

    /**
     * Si ya está activo, no hacemos otra activación.
     */
    if (subAgent.status === 'ACTIVE') {
      return {
        success: true,
        agent: subAgent,
        reason:
          'El sub-agente ya estaba activo.',
      };
    }

    const summary =
      this.finance.getSummary();

    const requiredCapital = Number(
      subAgent.capitalRequired || 0
    );

    /**
     * El capital requerido nunca puede ser negativo.
     */
    if (requiredCapital < 0) {
      return {
        success: false,
        reason:
          'Configuración financiera inválida: el capital requerido no puede ser negativo.',
      };
    }

    /**
     * El sub-agente solamente puede activarse
     * utilizando capital realmente confirmado.
     */
    if (
      summary.availableCapital <
      requiredCapital
    ) {
      return {
        success: false,
        reason:
          `Capital insuficiente. El agente "${subAgent.name}" ` +
          `requiere ${requiredCapital.toFixed(2)} € de capital ` +
          `confirmado. Capital disponible: ` +
          `${summary.availableCapital.toFixed(2)} €.`,
      };
    }

    /**
     * No se realiza ningún pago automáticamente.
     *
     * infrastructureReady representa que la infraestructura
     * necesaria está disponible; no significa que se haya
     * realizado un gasto.
     */
    if (!subAgent.infrastructureReady) {
      return {
        success: false,
        reason:
          `La infraestructura del sub-agente "${subAgent.name}" ` +
          `todavía no está preparada. No se realizará ningún ` +
          `gasto ni activación automática.`,
      };
    }

    /**
     * La activación queda registrada como autorizada.
     */
    subAgent.authorizationGranted =
      true;

    subAgent.status = 'ACTIVE';

    this.db.addEvent({
      type: 'AGENT_STARTED',
      severity: 'SUCCESS',
      title:
        'Sub-agente especializado activado',
      message:
        `El sub-agente "${subAgent.name}" ` +
        `ha sido activado. Capital confirmado ` +
        `comprobado: ${requiredCapital.toFixed(2)} €.`,
      metadata: {
        subAgentId: subAgent.id,
        capitalRequired:
          requiredCapital,
        availableCapital:
          summary.availableCapital,
      },
    });

    this.db.save();

    return {
      success: true,
      agent: subAgent,
    };
  }

  /**
   * Pausa un sub-agente sin eliminar su configuración.
   */
  public pauseSubAgent(
    id: string
  ): {
    success: boolean;
    agent?: SubAgent;
    reason?: string;
  } {
    const subAgent =
      this.db
        .getState()
        .subAgents
        .find(
          (agent) => agent.id === id
        );

    if (!subAgent) {
      return {
        success: false,
        reason:
          'Agente secundario no encontrado.',
      };
    }

    subAgent.status = 'IDLE';

    this.db.addEvent({
      type: 'AGENT_STOPPED',
      severity: 'INFO',
      title:
        'Sub-agente pausado',
      message:
        `El sub-agente "${subAgent.name}" ` +
        'ha sido pausado.',
      metadata: {
        subAgentId: subAgent.id,
      },
    });

    this.db.save();

    return {
      success: true,
      agent: subAgent,
    };
  }

  /**
   * Reactiva un sub-agente que estaba pausado,
   * respetando las mismas comprobaciones.
   */
  public resumeSubAgent(
    id: string
  ): {
    success: boolean;
    agent?: SubAgent;
    reason?: string;
  } {
    return this.activateSubAgent(id);
  }
}
