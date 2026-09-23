import crypto from 'crypto';

import {
  LearningInsight,
} from '../../../src/types/index.js';

import {
  Database,
} from '../../db/database.js';

export class LearningEngine {
  private static instance: LearningEngine;

  private db: Database;

  private constructor() {
    this.db =
      Database.getInstance();
  }

  public static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance =
        new LearningEngine();
    }

    return LearningEngine.instance;
  }

  public getInsights(): LearningInsight[] {
    return this.db
      .getState()
      .learning;
  }

  /**
   * Evalúa el rendimiento histórico
   * utilizando únicamente datos registrados
   * por el propio sistema.
   */
  public evaluatePerformance(): LearningInsight {
    const state =
      this.db.getState();

    const totalOpportunities =
      state.opportunities.length;

    const acceptedOpportunities =
      state.opportunities.filter(
        (opportunity) =>
          opportunity.status === 'READY' ||
          opportunity.status === 'PLANNED' ||
          opportunity.status === 'COMPLETED'
      ).length;

    const rejectedOpportunities =
      state.opportunities.filter(
        (opportunity) =>
          opportunity.status === 'REJECTED'
      ).length;

    const blockedOpportunities =
      state.opportunities.filter(
        (opportunity) =>
          opportunity.status === 'BLOCKED'
      ).length;

    const acceptanceRate =
      totalOpportunities > 0
        ? Number(
            (
              (acceptedOpportunities /
                totalOpportunities) *
              100
            ).toFixed(1)
          )
        : 0;

    const totalTasks =
      state.tasks.length;

    const completedTasks =
      state.tasks.filter(
        (task) =>
          task.status === 'COMPLETED'
      ).length;

    const failedTasks =
      state.tasks.filter(
        (task) =>
          task.status === 'FAILED'
      ).length;

    const blockedTasks =
      state.tasks.filter(
        (task) =>
          task.status === 'BLOCKED'
      ).length;

    const humanTasks =
      state.tasks.filter(
        (task) =>
          task.status === 'NEEDS_HUMAN'
      ).length;

    const tasksSuccessRate =
      totalTasks > 0
        ? Number(
            (
              (completedTasks /
                totalTasks) *
              100
            ).toFixed(1)
          )
        : 0;

    /*
     * Calculamos el tiempo medio real
     * únicamente cuando existen timestamps
     * válidos de creación y finalización.
     */
    const executionTimes: number[] = [];

    for (
      const task of state.tasks
    ) {
      if (
        task.status !== 'COMPLETED' &&
        task.status !== 'FAILED'
      ) {
        continue;
      }

      const createdAt =
        this.parseTimestamp(
          task.createdAt
        );

      const completedAt =
        this.getTaskCompletionTimestamp(
          task
        );

      if (
        createdAt === null ||
        completedAt === null ||
        completedAt < createdAt
      ) {
        continue;
      }

      const seconds =
        (completedAt -
          createdAt) /
        1000;

      if (
        Number.isFinite(seconds) &&
        seconds >= 0
      ) {
        executionTimes.push(
          seconds
        );
      }
    }

    const avgExecutionSeconds =
      executionTimes.length > 0
        ? Number(
            (
              executionTimes.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              executionTimes.length
            ).toFixed(2)
          )
        : 0;

    const proposals: string[] = [];

    /*
     * Análisis de fuentes.
     */
    const slowSources =
      state.sources.filter(
        (source) =>
          typeof source.responseTime ===
            'number' &&
          source.responseTime > 5000
      );

    if (
      slowSources.length > 0
    ) {
      proposals.push(
        `Revisar fuentes lentas con respuestas superiores a 5 segundos: ${slowSources
          .map(
            (source) =>
              source.name
          )
          .join(', ')}.`
      );
    }

    const errorSources =
      state.sources.filter(
        (source) =>
          Array.isArray(
            source.errors
          ) &&
          source.errors.length >= 3
      );

    if (
      errorSources.length > 0
    ) {
      proposals.push(
        `Revisar fuentes con errores recurrentes: ${errorSources
          .map(
            (source) =>
              source.name
          )
          .join(', ')}.`
      );
    }

    /*
     * Análisis de oportunidades.
     */
    if (
      totalOpportunities >= 5 &&
      acceptanceRate < 15
    ) {
      proposals.push(
        'La proporción de oportunidades aceptadas es baja. Conviene revisar las fuentes y los criterios de decisión.'
      );
    }

    if (
      rejectedOpportunities >
      acceptedOpportunities &&
      totalOpportunities >= 5
    ) {
      proposals.push(
        'La mayoría de las oportunidades registradas han sido rechazadas. Revisar si las fuentes están proporcionando trabajos compatibles con las capacidades disponibles.'
      );
    }

    if (
      blockedOpportunities > 0
    ) {
      proposals.push(
        `${blockedOpportunities} oportunidades han sido bloqueadas. Revisar las razones registradas antes de modificar los criterios de seguridad.`
      );
    }

    /*
     * Análisis de tareas.
     */
    if (
      failedTasks > 0
    ) {
      proposals.push(
        `${failedTasks} tarea(s) han fallado. Revisar sus eventos y evidencias antes de volver a ejecutarlas.`
      );
    }

    if (
      blockedTasks > 0
    ) {
      proposals.push(
        `${blockedTasks} tarea(s) están bloqueadas y requieren revisión.`
      );
    }

    if (
      humanTasks > 0
    ) {
      proposals.push(
        `${humanTasks} tarea(s) requieren intervención humana. El agente no debe saltarse ese requisito.`
      );
    }

    if (
      totalTasks > 0 &&
      tasksSuccessRate >= 80
    ) {
      proposals.push(
        'El historial de tareas completadas muestra una tasa de finalización elevada. Mantener las verificaciones actuales.'
      );
    }

    /*
     * Si no hay suficientes datos,
     * lo indicamos explícitamente.
     */
    if (
      totalOpportunities === 0 &&
      totalTasks === 0
    ) {
      proposals.push(
        'Todavía no existen suficientes datos históricos para realizar una evaluación significativa. El sistema continuará recopilando resultados.'
      );
    }

    if (
      proposals.length === 0
    ) {
      proposals.push(
        'No se ha detectado ninguna anomalía significativa en los datos disponibles. Continuar recopilando resultados.'
      );
    }

    const insight:
      LearningInsight = {
      id:
        `learn-${Date.now()}-${crypto
          .randomBytes(2)
          .toString('hex')}`,

      createdAt:
        new Date()
          .toISOString(),

      category:
        'OPPORTUNITIES',

      observation:
        `Evaluación histórica: ${totalOpportunities} oportunidades y ${totalTasks} tareas registradas. Tasa de aceptación: ${acceptanceRate}%. Tasa de éxito de tareas: ${tasksSuccessRate}%.`,

      metrics: {
        totalOpportunitiesEvaluated:
          totalOpportunities,

        acceptanceRate,

        tasksSuccessRate,

        avgExecutionSeconds,
      },

      proposals,

      appliedStatus:
        'PROPOSED',
    };

    state.learning.unshift(
      insight
    );

    if (
      state.learning.length >
      30
    ) {
      state.learning =
        state.learning.slice(
          0,
          30
        );
    }

    this.db.addEvent({
      type:
        'LEARNING_UPDATE',

      severity:
        'INFO',

      title:
        'Actualización del Motor de Aprendizaje',

      message:
        `Evaluación completada. Oportunidades: ${totalOpportunities}. Tareas: ${totalTasks}. Éxito de tareas: ${tasksSuccessRate}%.`,

      metadata: {
        insightId:
          insight.id,

        totalOpportunities,

        acceptedOpportunities,

        rejectedOpportunities,

        blockedOpportunities,

        totalTasks,

        completedTasks,

        failedTasks,

        blockedTasks,

        humanTasks,

        acceptanceRate,

        tasksSuccessRate,

        avgExecutionSeconds,
      },
    });

    this.db.save();

    return insight;
  }

  private parseTimestamp(
    value:
      string | undefined
  ): number | null {
    if (!value) {
      return null;
    }

    const timestamp =
      Date.parse(value);

    if (
      Number.isNaN(timestamp)
    ) {
      return null;
    }

    return timestamp;
  }

  private getTaskCompletionTimestamp(
    task: any
  ): number | null {
    const possibleFields = [
      'completedAt',
      'finishedAt',
      'updatedAt',
      'submittedAt',
    ];

    for (
      const field of
        possibleFields
    ) {
      const value =
        task?.[field];

      const timestamp =
        this.parseTimestamp(
          value
        );

      if (
        timestamp !== null
      ) {
        return timestamp;
      }
    }

    return null;
  }
}
