import crypto from 'crypto';
import { Opportunity, Task, PlanStep, TaskStatus } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';

export class TaskManager {
  private static instance: TaskManager;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  public getTasks(): Task[] {
    return this.db.getState().tasks;
  }

  public getTask(id: string): Task | undefined {
    return this.db.getState().tasks.find((t) => t.id === id);
  }

  /**
   * Plans a task from an analyzed opportunity
   */
  public planTaskFromOpportunity(opportunity: Opportunity): Task {
    const taskId = `task-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Determine primary capability
    let primaryCap = 'TEXT_WRITING';
    let primaryTool = 'llm_worker';
    const desc = (opportunity.title + ' ' + opportunity.description).toLowerCase();

    if (desc.includes('código') || desc.includes('python') || desc.includes('typescript') || desc.includes('script') || desc.includes('dev')) {
      primaryCap = 'CODE_GENERATION';
      primaryTool = 'llm_worker';
    } else if (desc.includes('traducción') || desc.includes('translate')) {
      primaryCap = 'TRANSLATION';
      primaryTool = 'llm_worker';
    } else if (desc.includes('seo') || desc.includes('posicionamiento')) {
      primaryCap = 'SEO_RESEARCH';
      primaryTool = 'http_fetcher';
    } else if (desc.includes('datos') || desc.includes('data') || desc.includes('estadística')) {
      primaryCap = 'DATA_ANALYSIS';
      primaryTool = 'llm_worker';
    }

    const plan: PlanStep[] = [
      {
        stepNumber: 1,
        title: 'Análisis de Especificación y Requisitos',
        description: 'Descomposición analítica del problema, extracción de restricciones técnicas y preparación del entorno de trabajo.',
        requiredTool: 'text_processor',
        capability: 'WEB_RESEARCH',
        status: 'PENDING',
      },
      {
        stepNumber: 2,
        title: `Ejecución Central: ${primaryCap}`,
        description: `Generación del trabajo técnico mediante ${primaryTool} respetando parámetros de calidad.`,
        requiredTool: primaryTool,
        capability: primaryCap,
        status: 'PENDING',
      },
      {
        stepNumber: 3,
        title: 'Verificación de Integridad y Validación de Formato',
        description: 'Auditoría automática de consistencia sintáctica, ausencia de datos espurios y comprobación contra briefing.',
        requiredTool: 'text_processor',
        capability: 'DOCUMENT_PROCESSING',
        status: 'PENDING',
      },
      {
        stepNumber: 4,
        title: 'Firma Criptográfica y Preservación de Evidencia',
        description: 'Cálculo de hash SHA-256, guardado en almacenamiento inmutable y vinculación al historial auditado.',
        requiredTool: 'evidence_recorder',
        capability: 'DOCUMENT_PROCESSING',
        status: 'PENDING',
      },
      {
        stepNumber: 5,
        title: 'Empaquetado de Entregable y Registro Financiero',
        description: 'Generación del expediente final para el usuario/cliente y emisión de estado de pago PENDIENTE.',
        requiredTool: 'file_generator',
        capability: 'CONTENT_GENERATION',
        status: 'PENDING',
      },
    ];

    const task: Task = {
      id: taskId,
      opportunityId: opportunity.id,
      opportunityUrl: opportunity.url,
      title: `Ejecutar: ${opportunity.title}`,
      description: opportunity.description,
      plan,
      status: 'READY',
      createdAt: new Date().toISOString(),
      evidence: [opportunity.url],
      paymentStatus: 'NONE',
      estimatedAmount: opportunity.estimatedAmount,
      confirmedAmount: 0,
      currency: opportunity.currency,
      humanRequirement: {
        needed: false,
      },
    };

    opportunity.status = 'PLANNED';
    const state = this.db.getState();
    state.tasks.unshift(task);

    this.db.addEvent({
      type: 'TASK_CREATED',
      severity: 'INFO',
      title: 'Tarea Planificada',
      message: `Plan de trabajo estructurado para la tarea "${task.title.substring(0, 60)}" (${plan.length} pasos).`,
      metadata: { taskId: task.id, opportunityId: opportunity.id },
    });

    this.db.save();
    return task;
  }

  public authorizeTask(id: string): Task | null {
    const task = this.getTask(id);
    if (!task) return null;
    task.status = 'AUTHORIZED';
    this.db.addEvent({
      type: 'TASK_AUTHORIZED',
      severity: 'SUCCESS',
      title: 'Tarea Autorizada por Supervisor',
      message: `La tarea "${task.title.substring(0, 50)}" ha recibido autorización explícita para su ejecución autónoma.`,
      metadata: { taskId: task.id },
    });
    this.db.save();
    return task;
  }

  public cancelTask(id: string, reason?: string): Task | null {
    const task = this.getTask(id);
    if (!task) return null;
    task.status = 'CANCELLED';
    task.error = reason || 'Cancelada por el administrador';
    this.db.save();
    return task;
  }

  public resolveHumanIntervention(id: string, notes?: string): Task | null {
    const task = this.getTask(id);
    if (!task) return null;
    if (task.humanRequirement) {
      task.humanRequirement.isResolved = true;
      task.humanRequirement.resolvedAt = new Date().toISOString();
      task.humanRequirement.notes = notes || 'Intervención completada por supervisor';
    }
    task.status = 'READY';
    this.db.addEvent({
      type: 'HUMAN_ACTION_RESOLVED',
      severity: 'SUCCESS',
      title: 'Intervención Humana Resuelta',
      message: `El supervisor completó la acción requerida para la tarea "${task.title.substring(0, 50)}".`,
      metadata: { taskId: task.id },
    });
    this.db.save();
    return task;
  }
}
