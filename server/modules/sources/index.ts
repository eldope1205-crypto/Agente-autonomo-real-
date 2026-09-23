import {
  Source,
  SourceType,
} from '../../../src/types/index.js';

import { Database } from '../../db/database.js';

import { ToolRegistry } from '../tools/index.js';

import { SecurityManager } from '../security/index.js';

export class SourceManager {
  private static instance: SourceManager;

  private db: Database;
  private tools: ToolRegistry;
  private security: SecurityManager;

  private constructor() {
    this.db =
      Database.getInstance();

    this.tools =
      ToolRegistry.getInstance();

    this.security =
      SecurityManager.getInstance();
  }

  public static getInstance(): SourceManager {
    if (!SourceManager.instance) {
      SourceManager.instance =
        new SourceManager();
    }

    return SourceManager.instance;
  }

  public getSources(): Source[] {
    return this.db
      .getState()
      .sources;
  }

  public getSource(
    id: string
  ): Source | undefined {
    return this.db
      .getState()
      .sources
      .find(
        (source) =>
          source.id === id
      );
  }

  public addSource(data: {
    name: string;
    url: string;
    type: SourceType;
    category?: string;
    description?: string;
  }): Source {
    const name =
      data.name.trim();

    const url =
      data.url.trim();

    if (!name) {
      throw new Error(
        'El nombre de la fuente es obligatorio.'
      );
    }

    if (!url) {
      throw new Error(
        'La URL de la fuente es obligatoria.'
      );
    }

    const validation =
      this.security.validateUrl(
        url
      );

    if (!validation.valid) {
      throw new Error(
        validation.reason ||
          'La URL de la fuente no es segura.'
      );
    }

    const state =
      this.db.getState();

    const duplicate =
      state.sources.find(
        (source) =>
          source.url.toLowerCase() ===
          url.toLowerCase()
      );

    if (duplicate) {
      throw new Error(
        'Esta URL ya está registrada como fuente.'
      );
    }

    const id =
      `source-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    const newSource:
      Source = {
      id,

      name,

      url,

      type:
        data.type,

      enabled:
        true,

      lastChecked:
        null,

      status:
        'UNCHECKED',

      errors:
        [],

      responseTime:
        null,

      opportunitiesFound:
        0,

      category:
        data.category?.trim() ||
        'general',

      description:
        data.description?.trim() ||
        '',
    };

    state.sources.push(
      newSource
    );

    this.db.addEvent({
      type:
        'SOURCE_CHECKED',

      severity:
        'INFO',

      title:
        'Fuente añadida',

      message:
        `Nueva fuente registrada: ${newSource.name} (${newSource.type})`,

      metadata: {
        sourceId:
          newSource.id,

        url:
          newSource.url,
      },
    });

    this.db.save();

    return newSource;
  }

  public removeSource(
    id: string
  ): boolean {
    const state =
      this.db.getState();

    const index =
      state.sources.findIndex(
        (source) =>
          source.id === id
      );

    if (index === -1) {
      return false;
    }

    const removed =
      state.sources[index];

    state.sources.splice(
      index,
      1
    );

    this.db.addEvent({
      type:
        'SOURCE_CHECKED',

      severity:
        'WARNING',

      title:
        'Fuente eliminada',

      message:
        `Se ha eliminado la fuente: ${removed.name}`,

      metadata: {
        sourceId:
          id,

        url:
          removed.url,
      },
    });

    this.db.save();

    return true;
  }

  public toggleSource(
    id: string,
    enabled: boolean
  ): Source | null {
    const source =
      this.getSource(id);

    if (!source) {
      return null;
    }

    source.enabled =
      Boolean(enabled);

    if (!source.enabled) {
      source.status =
        'DISABLED';
    } else if (
      source.status ===
      'DISABLED'
    ) {
      source.status =
        'UNCHECKED';
    }

    this.db.addEvent({
      type:
        'SOURCE_CHECKED',

      severity:
        'INFO',

      title:
        source.enabled
          ? 'Fuente activada'
          : 'Fuente desactivada',

      message:
        `${source.name} ha sido ${
          source.enabled
            ? 'activada'
            : 'desactivada'
        }.`,

      metadata: {
        sourceId:
          source.id,

        enabled:
          source.enabled,
      },
    });

    this.db.save();

    return source;
  }

  public async testSource(
    id: string
  ): Promise<{
    success: boolean;
    source: Source;
    rawLength: number;
    error?: string;
  }> {
    const source =
      this.getSource(id);

    if (!source) {
      throw new Error(
        `Fuente no encontrada con id: ${id}`
      );
    }

    const startTime =
      Date.now();

    try {
      const validation =
        this.security.validateUrl(
          source.url
        );

      if (!validation.valid) {
        const errorMsg =
          validation.reason ||
          'URL bloqueada por seguridad.';

        this.recordSourceError(
          source,
          errorMsg,
          Date.now() - startTime
        );

        return {
          success:
            false,

          source,

          rawLength:
            0,

          error:
            errorMsg,
        };
      }

      const response =
        await this.tools.httpFetch(
          source.url,
          {
            timeoutMs:
              12000,
          }
        );

      const duration =
        Date.now() -
        startTime;

      source.lastChecked =
        new Date()
          .toISOString();

      source.responseTime =
        duration;

      if (
        response.status >= 200 &&
        response.status < 300
      ) {
        source.status =
          'ACTIVE';

        source.errors =
          [];

        this.db.addEvent({
          type:
            'SOURCE_CHECKED',

          severity:
            'INFO',

          title:
            `Fuente verificada: ${source.name}`,

          message:
            `Respuesta HTTP ${response.status}. Datos recibidos: ${response.body.length} caracteres.`,

          metadata: {
            sourceId:
              source.id,

            status:
              response.status,

            responseTime:
              duration,

            bytes:
              response.body.length,
          },
        });

        this.db.save();

        return {
          success:
            true,

          source,

          rawLength:
            response.body.length,
        };
      }

      const errorMsg =
        `Código HTTP no exitoso: ${response.status}`;

      this.recordSourceError(
        source,
        errorMsg,
        duration
      );

      return {
        success:
          false,

        source,

        rawLength:
          0,

        error:
          errorMsg,
      };

    } catch (err: unknown) {
      const duration =
        Date.now() -
        startTime;

      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Error de red desconocido';

      this.recordSourceError(
        source,
        errorMsg,
        duration
      );

      return {
        success:
          false,

        source,

        rawLength:
          0,

        error:
          errorMsg,
      };
    }
  }

  private recordSourceError(
    source: Source,
    errorMsg: string,
    duration: number
  ): void {
    const timestamp =
      new Date()
        .toISOString();

    source.lastChecked =
      timestamp;

    source.responseTime =
      duration;

    source.status =
      'ERROR';

    source.errors.unshift(
      `[${timestamp}] ${errorMsg}`
    );

    if (
      source.errors.length >
      10
    ) {
      source.errors =
        source.errors.slice(
          0,
          10
        );
    }

    this.db.addEvent({
      type:
        'SOURCE_ERROR',

      severity:
        'ERROR',

      title:
        `Fallo en fuente: ${source.name}`,

      message:
        errorMsg,

      metadata: {
        sourceId:
          source.id,

        url:
          source.url,

        responseTime:
          duration,
      },
    });

    this.db.save();
  }
}
