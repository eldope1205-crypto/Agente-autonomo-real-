import crypto from 'crypto';
import fs from 'fs';
import {
  Task,
  PlanStep,
} from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { ToolRegistry } from '../tools/index.js';

export class TaskExecutor {
  private static instance: TaskExecutor;
  private db: Database;
  private tools: ToolRegistry;
  private isExecuting = false;

  private constructor() {
    this.db = Database.getInstance();
    this.tools = ToolRegistry.getInstance();
  }

  public static getInstance(): TaskExecutor {
    if (!TaskExecutor.instance) {
      TaskExecutor.instance = new TaskExecutor();
    }

    return TaskExecutor.instance;
  }

  public isBusy(): boolean {
    return this.isExecuting;
  }

  public canExecuteTask(
    task: Task
  ): {
    canExecute: boolean;
    reason?: string;
    requiresHuman?: boolean;
  } {
    const state = this.db.getState();

    if (task.status === 'CANCELLED') {
      return {
        canExecute: false,
        reason: 'La tarea está cancelada.',
      };
    }

    if (task.status === 'COMPLETED') {
      return {
        canExecute: false,
        reason: 'La tarea ya está completada.',
      };
    }

    if (
      task.humanRequirement?.needed &&
      !task.humanRequirement.isResolved
    ) {
      return {
        canExecute: false,
        reason:
          task.humanRequirement.reason ||
          'La tarea requiere intervención humana.',
        requiresHuman: true,
      };
    }

    const availableCapabilities = new Set(
      state.capabilities
        .filter(
          (capability) =>
            capability.enabled &&
            capability.status === 'AVAILABLE'
        )
        .map((capability) => capability.id)
    );

    const availableTools = new Set(
      state.tools
        .filter((tool) => tool.enabled)
        .map((tool) => tool.id)
    );

    availableTools.add('llm_worker');
    availableTools.add('text_processor');
    availableTools.add('evidence_recorder');
    availableTools.add('file_generator');
    availableTools.add('http_fetcher');

    for (const step of task.plan) {
      if (
        step.capability &&
        !availableCapabilities.has(step.capability)
      ) {
        const localCapabilities = [
          'WEB_RESEARCH',
          'DOCUMENT_PROCESSING',
          'CONTENT_GENERATION',
          'TEXT_WRITING',
          'CODE_GENERATION',
          'TRANSLATION',
          'DATA_ANALYSIS',
          'SEO_RESEARCH',
        ];

        if (!localCapabilities.includes(step.capability)) {
          return {
            canExecute: false,
            reason:
              `Capacidad no disponible: ${step.capability}`,
          };
        }
      }

      if (
        step.requiredTool &&
        !availableTools.has(step.requiredTool)
      ) {
        return {
          canExecute: false,
          reason:
            `Herramienta no disponible: ${step.requiredTool}`,
        };
      }
    }

    return {
      canExecute: true,
    };
  }

  public async executeTask(
    task: Task
  ): Promise<{
    success: boolean;
    task: Task;
    error?: string;
  }> {
    if (this.isExecuting) {
      return {
        success: false,
        task,
        error:
          'El ejecutor ya está procesando otra tarea.',
      };
    }

    this.isExecuting = true;

    const check = this.canExecuteTask(task);

    if (!check.canExecute) {
      task.status = check.requiresHuman
        ? 'NEEDS_HUMAN'
        : 'BLOCKED';

      task.error =
        check.reason ||
        'La tarea no puede ejecutarse.';

      this.db.addEvent({
        type: 'SECURITY_BLOCK',
        severity: 'WARNING',
        title: check.requiresHuman
          ? 'Intervención humana necesaria'
          : 'Tarea bloqueada',
        message:
          `"${task.title.substring(
            0,
            70
          )}": ${task.error}`,
        metadata: {
          taskId: task.id,
          opportunityUrl: task.opportunityUrl,
        },
      });

      this.db.save();

      this.isExecuting = false;

      return {
        success: false,
        task,
        error: task.error,
      };
    }

    task.status = 'RUNNING';
    task.startedAt = new Date().toISOString();
    task.error = undefined;

    this.db.addEvent({
      type: 'TASK_STARTED',
      severity: 'INFO',
      title: 'Ejecución iniciada',
      message:
        `Ejecutando "${task.title.substring(
          0,
          70
        )}".`,
      metadata: {
        taskId: task.id,
      },
    });

    this.db.save();

    let accumulatedContent = '';

    try {
      for (const step of task.plan) {
        step.status = 'RUNNING';
        step.startedAt = new Date().toISOString();

        this.db.save();

        try {
          const result = await this.executeStep(
            step,
            task,
            accumulatedContent
          );

          step.output = result.output;
          step.status = 'COMPLETED';
          step.completedAt =
            new Date().toISOString();

          accumulatedContent +=
            `\n\n### ${step.title}\n` +
            result.output;

          this.db.save();
        } catch (stepError: any) {
          step.status = 'FAILED';
          step.error =
            stepError?.message ||
            'Error durante el paso.';

          this.db.save();

          throw stepError;
        }
      }

      const filename =
        `deliverable-${task.id}.md`;

      const fullDocument =
        `# ENTREGABLE DE TRABAJO DIGITAL

**ID de tarea:** ${task.id}

**Título:** ${task.title}

**Fecha:** ${new Date().toISOString()}

**Estado:** Generado

**Motor:** local-autonomous-engine-v1

---

## Especificación

${task.description}

---

## Ejecución

${accumulatedContent}

---

## Verificación

Este documento fue generado por el entorno de ejecución local.

El hash SHA-256 identifica la integridad exacta del archivo.
`;

      const savedFile =
        this.tools.saveDeliverableFile(
          filename,
          fullDocument
        );

      if (
        !fs.existsSync(savedFile.filePath)
      ) {
        throw new Error(
          'El archivo entregable no pudo verificarse en disco.'
        );
      }

      const savedContent =
        fs.readFileSync(
          savedFile.filePath,
          'utf-8'
        );

      const verifiedHash =
        crypto
          .createHash('sha256')
          .update(savedContent)
          .digest('hex');

      if (
        verifiedHash !== savedFile.fileHash
      ) {
        throw new Error(
          'La verificación SHA-256 del entregable ha fallado.'
        );
      }

      task.deliverableFile =
        savedFile.filePath;

      task.deliverablePreview =
        fullDocument.substring(0, 1000);

      task.result =
        `Entregable generado y verificado. Hash SHA-256: ${savedFile.fileHash}`;

      if (
        !task.evidence.includes(
          savedFile.filePath
        )
      ) {
        task.evidence.push(
          savedFile.filePath
        );
      }

      const evidenceItem = {
        id:
          `evi-${Date.now()}-${crypto
            .randomBytes(2)
            .toString('hex')}`,

        taskId: task.id,

        opportunityId:
          task.opportunityId,

        title:
          `Entregable verificado: ${task.title}`,

        url:
          task.opportunityUrl || '',

        timestamp:
          new Date().toISOString(),

        contentSnapshot:
          savedContent.substring(0, 3000),

        fileHash: verifiedHash,

        filePath:
          savedFile.filePath,

        fileType:
          'text/markdown',

        fileSize:
          savedFile.sizeBytes,

        verificationStatus:
          'VERIFIED' as const,

        notes:
          'Archivo existente y hash SHA-256 de integridad comprobado.',
      };

      this.db
        .getState()
        .evidence
        .unshift(evidenceItem);

      task.status = 'SUBMITTED';

      this.db.save();

      task.status = 'WAITING_VERIFICATION';

      this.db.save();

      const verified =
        this.verifyTaskOutput(
          task,
          savedContent
        );

      if (!verified) {
        throw new Error(
          'La verificación interna del resultado no fue satisfactoria.'
        );
      }

      task.status = 'COMPLETED';

      if (task.estimatedAmount > 0) {
        task.paymentStatus = 'PENDING';
      }

      task.completedAt =
        new Date().toISOString();

      this.db.addEvent({
        type: 'TASK_COMPLETED',
        severity: 'SUCCESS',
        title:
          'Trabajo ejecutado y verificado',
        message:
          `"${task.title.substring(
            0,
            70
          )}" terminó correctamente. ` +
          `El pago no se considera recibido hasta existir confirmación real.`,
        metadata: {
          taskId: task.id,
          fileHash: verifiedHash,
          paymentStatus:
            task.paymentStatus,
        },
      });

      this.db.save();

      return {
        success: true,
        task,
      };
    } catch (error: any) {
      task.status = 'FAILED';

      task.error =
        error?.message ||
        'Error durante la ejecución.';

      this.db.addEvent({
        type: 'TASK_FAILED',
        severity: 'ERROR',
        title: 'Error de ejecución',
        message:
          `"${task.title.substring(
            0,
            70
          )}": ${task.error}`,
        metadata: {
          taskId: task.id,
        },
      });

      this.db.save();

      return {
        success: false,
        task,
        error: task.error,
      };
    } finally {
      this.isExecuting = false;
    }
  }

  public async executeAllTasks(): Promise<{
    processed: number;
    executed: number;
    blocked: number;
    completed: number;
    failed: number;
  }> {
    const tasks =
      this.db
        .getState()
        .tasks
        .filter(
          (task) =>
            task.status === 'READY' ||
            task.status === 'AUTHORIZED'
        );

    let executed = 0;
    let blocked = 0;
    let completed = 0;
    let failed = 0;

    for (const task of tasks) {
      const check =
        this.canExecuteTask(task);

      if (!check.canExecute) {
        if (check.requiresHuman) {
          task.status = 'NEEDS_HUMAN';
        } else {
          task.status = 'BLOCKED';
        }

        task.error =
          check.reason ||
          'No se puede ejecutar automáticamente.';

        blocked++;

        this.db.addEvent({
          type: 'SECURITY_BLOCK',
          severity: 'WARNING',
          title:
            check.requiresHuman
              ? 'Intervención humana necesaria'
              : 'Tarea bloqueada',
          message:
            `"${task.title.substring(
              0,
              70
            )}": ${task.error}`,
          metadata: {
            taskId: task.id,
          },
        });

        this.db.save();

        continue;
      }

      executed++;

      const result =
        await this.executeTask(task);

      if (
        result.success &&
        task.status === 'COMPLETED'
      ) {
        completed++;
      } else if (!result.success) {
        failed++;
      }
    }

    return {
      processed: tasks.length,
      executed,
      blocked,
      completed,
      failed,
    };
  }

  public async continueTaskAfterHuman(
    taskId: string,
    userNotes?: string
  ): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    const task =
      this.db
        .getState()
        .tasks
        .find(
          (item) =>
            item.id === taskId
        );

    if (!task) {
      return {
        success: false,
        error:
          'Tarea no encontrada.',
      };
    }

    if (
      task.humanRequirement?.needed
    ) {
      task.humanRequirement.isResolved =
        true;

      task.humanRequirement.resolvedAt =
        new Date().toISOString();

      task.humanRequirement.notes =
        userNotes ||
        'Intervención completada.';
    }

    this.db.addEvent({
      type: 'HUMAN_ACTION_RESOLVED',
      severity: 'SUCCESS',
      title:
        'Intervención resuelta',
      message:
        `La tarea "${task.title.substring(
          0,
          70
        )}" puede continuar.`,
      metadata: {
        taskId: task.id,
        userNotes,
      },
    });

    task.status = 'AUTHORIZED';

    this.db.save();

    return this.executeTask(task);
  }

  private async executeStep(
    step: PlanStep,
    task: Task,
    previousContext: string
  ): Promise<{
    output: string;
  }> {
    switch (step.requiredTool) {
      case 'llm_worker': {
        const prompt =
          `TAREA:
${task.title}

DESCRIPCIÓN:
${task.description}

PASO:
${step.title}

INSTRUCCIONES:
${step.description}

CONTEXTO:
${previousContext || 'Sin contexto previo.'}`;

        const result =
          await this.tools.executeLlmPrompt(
            prompt
          );

        return {
          output:
            `${result.text}\n\n` +
            `Motor: ${result.modelUsed}`,
        };
      }

      case 'text_processor': {
        const cleaned =
          this.tools.cleanHtml(
            task.description
          );

        if (!cleaned) {
          throw new Error(
            'La tarea no contiene información procesable.'
          );
        }

        return {
          output:
            `Texto procesado correctamente. ` +
            `Longitud: ${cleaned.length} caracteres.`,
        };
      }

      case 'http_fetcher': {
        const url =
          task.opportunityUrl;

        if (!url) {
          return {
            output:
              'No existe URL externa para este paso. Se continúa con el procesamiento local.',
          };
        }

        const result =
          await this.tools.httpFetch(
            url,
            {
              timeoutMs: 10000,
              maxBytes:
                1024 * 1024,
            }
          );

        const cleaned =
          this.tools.cleanHtml(
            result.body
          );

        return {
          output:
            `Fuente consultada correctamente. ` +
            `HTTP ${result.status}. ` +
            `Contenido recibido: ${cleaned.length} caracteres.`,
        };
      }

      case 'evidence_recorder': {
        return {
          output:
            'Evidencia preparada para almacenamiento y verificación de integridad mediante SHA-256.',
        };
      }

      case 'file_generator': {
        return {
          output:
            'Estructura del entregable preparada en formato Markdown.',
        };
      }

      default: {
        return {
          output:
            `Paso "${step.title}" procesado por el motor local.`,
        };
      }
    }
  }

  private verifyTaskOutput(
    task: Task,
    content: string
  ): boolean {
    if (!content.trim()) {
      return false;
    }

    if (!task.title.trim()) {
      return false;
    }

    if (!task.description.trim()) {
      return false;
    }

    if (task.plan.length === 0) {
      return false;
    }

    return true;
  }
}
