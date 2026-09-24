import crypto from 'crypto';

import {
  Opportunity,
  Task,
  PlanStep,
} from '../../../src/types/index.js';

import { Database } from '../../db/database.js';

export class TaskManager {
  private static instance: TaskManager;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance =
        new TaskManager();
    }

    return TaskManager.instance;
  }

  public getTasks(): Task[] {
    return this.db.getState().tasks;
  }

  public getTask(
    id: string
  ): Task | undefined {
    return this.db
      .getState()
      .tasks
      .find(
        (task) =>
          task.id === id
      );
  }

  private taskAlreadyExists(
    opportunityId: string
  ): boolean {
    return this.db
      .getState()
      .tasks
      .some(
        (task) =>
          task.opportunityId ===
            opportunityId &&
          task.status !== 'CANCELLED' &&
          task.status !== 'FAILED'
      );
  }

  private detectTaskType(
    opportunity: Opportunity
  ): {
    capability: string;
    tool: string;
    title: string;
  } {
    const text = [
      opportunity.title,
      opportunity.description,
      ...(opportunity.requirements || []),
      opportunity.category,
    ]
      .join(' ')
      .toLowerCase();

    if (
      text.includes('typescript') ||
      text.includes('javascript') ||
      text.includes('python') ||
      text.includes('programación') ||
      text.includes('programacion') ||
      text.includes('código') ||
      text.includes('codigo') ||
      text.includes('script') ||
      text.includes('software') ||
      text.includes('desarrollo')
    ) {
      return {
        capability: 'CODE_GENERATION',
        tool: 'llm_worker',
        title:
          'Desarrollo de solución técnica',
      };
    }

    if (
      text.includes('traducción') ||
      text.includes('traduccion') ||
      text.includes('translate')
    ) {
      return {
        capability: 'TRANSLATION',
        tool: 'llm_worker',
        title:
          'Preparación de traducción',
      };
    }

    if (
      text.includes('seo') ||
      text.includes('posicionamiento') ||
      text.includes('palabras clave')
    ) {
      return {
        capability: 'SEO_RESEARCH',
        tool: 'http_fetcher',
        title:
          'Investigación y análisis SEO',
      };
    }

    if (
      text.includes('datos') ||
      text.includes('data') ||
      text.includes('estadística') ||
      text.includes('estadistica') ||
      text.includes('csv') ||
      text.includes('excel')
    ) {
      return {
        capability: 'DATA_ANALYSIS',
        tool: 'llm_worker',
        title:
          'Análisis y procesamiento de datos',
      };
    }

    if (
      text.includes('contenido') ||
      text.includes('artículo') ||
      text.includes('articulo') ||
      text.includes('redacción') ||
      text.includes('redaccion') ||
      text.includes('blog') ||
      text.includes('texto')
    ) {
      return {
        capability:
          'CONTENT_GENERATION',
        tool: 'llm_worker',
        title:
          'Creación de contenido',
      };
    }

    return {
      capability: 'TEXT_WRITING',
      tool: 'llm_worker',
      title:
        'Producción de contenido digital',
    };
  }

  private detectHumanRequirement(
    opportunity: Opportunity
  ): {
    needed: boolean;
    reason?: string;
    whatUserMustDo?: string;
    whatHappensNext?: string;
  } {
    const text = [
      opportunity.title,
      opportunity.description,
      ...(opportunity.requirements || []),
    ]
      .join(' ')
      .toLowerCase();

    const patterns = [
      'entrevista',
      'videollamada',
      'video llamada',
      'zoom call',
      'llamada telefónica',
      'llamada telefonica',
      'presencial',
      'reunión presencial',
      'reunion presencial',
      'documento de identidad',
      'identificación personal',
      'identificacion personal',
    ];

    const match =
      patterns.find(
        (pattern) =>
          text.includes(pattern)
      );

    if (!match) {
      return {
        needed: false,
      };
    }

    return {
      needed: true,
      reason:
        `La oportunidad contiene un requisito humano: "${match}".`,
      whatUserMustDo:
        'Realizar la acción humana solicitada por la plataforma o cliente.',
      whatHappensNext:
        'Una vez resuelta la acción, el agente podrá continuar con las partes automatizables.',
    };
  }

  public planTaskFromOpportunity(
    opportunity: Opportunity
  ): Task {
    if (
      this.taskAlreadyExists(
        opportunity.id
      )
    ) {
      const existing =
        this.db
          .getState()
          .tasks
          .find(
            (task) =>
              task.opportunityId ===
                opportunity.id &&
              task.status !==
                'CANCELLED' &&
              task.status !==
                'FAILED'
          );

      if (existing) {
        return existing;
      }
    }

    const taskId =
      `task-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')}`;

    const taskType =
      this.detectTaskType(
        opportunity
      );

    const humanRequirement =
      this.detectHumanRequirement(
        opportunity
      );

    const plan: PlanStep[] = [
      {
        stepNumber: 1,
        title:
          'Analizar requisitos',
        description:
          'Analizar localmente el título, descripción, requisitos y condiciones de la oportunidad.',
        requiredTool:
          'text_processor',
        capability:
          'WEB_RESEARCH',
        status:
          'PENDING',
      },
      {
        stepNumber: 2,
        title:
          taskType.title,
        description:
          `Ejecutar el trabajo mediante la capacidad ${taskType.capability}.`,
        requiredTool:
          taskType.tool,
        capability:
          taskType.capability,
        status:
          'PENDING',
      },
      {
        stepNumber: 3,
        title:
          'Verificar resultado',
        description:
          'Comprobar estructura, coherencia, contenido y cumplimiento de los requisitos conocidos.',
        requiredTool:
          'text_processor',
        capability:
          'DOCUMENT_PROCESSING',
        status:
          'PENDING',
      },
      {
        stepNumber: 4,
        title:
          'Crear evidencia',
        description:
          'Preparar el entregable para generar posteriormente una evidencia verificable mediante hash SHA-256.',
        requiredTool:
          'evidence_recorder',
        capability:
          'DOCUMENT_PROCESSING',
        status:
          'PENDING',
      },
      {
        stepNumber: 5,
        title:
          'Preparar entrega',
        description:
          'Generar el archivo final preparado para su revisión o eventual entrega externa.',
        requiredTool:
          'file_generator',
        capability:
          'CONTENT_GENERATION',
        status:
          'PENDING',
      },
    ];

    const task: Task = {
      id: taskId,

      opportunityId:
        opportunity.id,

      opportunityUrl:
        opportunity.url,

      title:
        `Ejecutar: ${opportunity.title}`,

      description:
        opportunity.description,

      plan,

      status:
        humanRequirement.needed
          ? 'NEEDS_HUMAN'
          : 'READY',

      createdAt:
        new Date().toISOString(),

      /*
       * La URL de la oportunidad se mantiene
       * como referencia de origen, no como
       * supuesto archivo de evidencia.
       */
      evidence: [],

      paymentStatus:
        'NONE',

      estimatedAmount:
        opportunity.estimatedAmount ||
        0,

      confirmedAmount:
        0,

      currency:
        opportunity.currency ||
        'EUR',

      humanRequirement,
    };

    opportunity.status =
      'PLANNED';

    const state =
      this.db.getState();

    state.tasks.unshift(
      task
    );

    this.db.addEvent({
      type:
        'TASK_CREATED',

      severity:
        humanRequirement.needed
          ? 'WARNING'
          : 'INFO',

      title:
        humanRequirement.needed
          ? 'Tarea creada — requiere intervención'
          : 'Tarea creada automáticamente',

      message:
        `Tarea "${task.title.substring(
          0,
          80
        )}" preparada con ${plan.length} pasos.`,

      metadata: {
        taskId,

        opportunityId:
          opportunity.id,

        capability:
          taskType.capability,

        humanRequired:
          humanRequirement.needed,
      },
    });

    this.db.save();

    return task;
  }

  public authorizeTask(
    id: string
  ): Task | null {
    const task =
      this.getTask(id);

    if (!task) {
      return null;
    }

    if (
      task.status ===
        'CANCELLED' ||
      task.status ===
        'COMPLETED'
    ) {
      return task;
    }

    if (
      task.humanRequirement?.needed &&
      !task.humanRequirement
        .isResolved
    ) {
      task.status =
        'NEEDS_HUMAN';

      this.db.save();

      return task;
    }

    task.status =
      'AUTHORIZED';

    this.db.addEvent({
      type:
        'TASK_AUTHORIZED',

      severity:
        'SUCCESS',

      title:
        'Tarea autorizada',

      message:
        `La tarea "${task.title.substring(
          0,
          70
        )}" está autorizada para ejecución.`,

      metadata: {
        taskId:
          task.id,
      },
    });

    this.db.save();

    return task;
  }

  public cancelTask(
    id: string,
    reason?: string
  ): Task | null {
    const task =
      this.getTask(id);

    if (!task) {
      return null;
    }

    task.status =
      'CANCELLED';

    task.error =
      reason ||
      'Tarea cancelada por el administrador.';

    this.db.addEvent({
      type:
        'TASK_FAILED',

      severity:
        'WARNING',

      title:
        'Tarea cancelada',

      message:
        `La tarea "${task.title.substring(
          0,
          70
        )}" fue cancelada.`,

      metadata: {
        taskId:
          task.id,

        reason:
          task.error,
      },
    });

    this.db.save();

    return task;
  }

  public resolveHumanIntervention(
    id: string,
    notes?: string
  ): Task | null {
    const task =
      this.getTask(id);

    if (!task) {
      return null;
    }

    if (
      task.humanRequirement
    ) {
      task.humanRequirement
        .isResolved =
        true;

      task.humanRequirement
        .resolvedAt =
        new Date().toISOString();

      task.humanRequirement
        .notes =
        notes ||
        'Intervención completada.';
    }

    task.status =
      'READY';

    this.db.addEvent({
      type:
        'HUMAN_ACTION_RESOLVED',

      severity:
        'SUCCESS',

      title:
        'Intervención humana resuelta',

      message:
        `La tarea "${task.title.substring(
          0,
          70
        )}" puede continuar.`,

      metadata: {
        taskId:
          id,
      },
    });

    this.db.save();

    return task;
  }
}
