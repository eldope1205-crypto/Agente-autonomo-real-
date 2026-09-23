import { Source, SourceType } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { ToolRegistry } from '../tools/index.js';

export class SourceManager {
  private static instance: SourceManager;
  private db: Database;
  private tools: ToolRegistry;

  private constructor() {
    this.db = Database.getInstance();
    this.tools = ToolRegistry.getInstance();
  }

  public static getInstance(): SourceManager {
    if (!SourceManager.instance) {
      SourceManager.instance = new SourceManager();
    }
    return SourceManager.instance;
  }

  public getSources(): Source[] {
    return this.db.getState().sources;
  }

  public getSource(id: string): Source | undefined {
    return this.db.getState().sources.find((s) => s.id === id);
  }

  public addSource(data: {
    name: string;
    url: string;
    type: SourceType;
    category?: string;
    description?: string;
  }): Source {
    const id = `source-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSource: Source = {
      id,
      name: data.name.trim(),
      url: data.url.trim(),
      type: data.type,
      enabled: true,
      lastChecked: null,
      status: 'UNCHECKED',
      errors: [],
      responseTime: null,
      opportunitiesFound: 0,
      category: data.category || 'general',
      description: data.description || '',
    };

    const state = this.db.getState();
    state.sources.push(newSource);
    this.db.addEvent({
      type: 'SOURCE_CHECKED',
      severity: 'INFO',
      title: 'Fuente Añadida',
      message: `Nueva fuente registrada: ${newSource.name} (${newSource.type})`,
      metadata: { sourceId: id, url: newSource.url },
    });
    this.db.save();
    return newSource;
  }

  public removeSource(id: string): boolean {
    const state = this.db.getState();
    const index = state.sources.findIndex((s) => s.id === id);
    if (index === -1) return false;
    const [removed] = state.sources.splice(index, 1);
    this.db.addEvent({
      type: 'SOURCE_CHECKED',
      severity: 'WARNING',
      title: 'Fuente Eliminada',
      message: `Se ha eliminado la fuente: ${removed.name}`,
      metadata: { sourceId: id },
    });
    this.db.save();
    return true;
  }

  public toggleSource(id: string, enabled: boolean): Source | null {
    const source = this.getSource(id);
    if (!source) return null;
    source.enabled = enabled;
    this.db.save();
    return source;
  }

  /**
   * Tests or polls a single source directly and records its health and errors
   */
  public async testSource(id: string): Promise<{ success: boolean; source: Source; rawLength: number; error?: string }> {
    const source = this.getSource(id);
    if (!source) throw new Error(`Fuente no encontrada con id: ${id}`);

    const startTime = Date.now();
    try {
      const res = await this.tools.httpFetch(source.url, { timeoutMs: 12000 });
      const duration = Date.now() - startTime;

      source.lastChecked = new Date().toISOString();
      source.responseTime = duration;

      if (res.status >= 200 && res.status < 300) {
        source.status = 'ACTIVE';
        // Clear old transient errors if successful
        source.errors = [];
        this.db.save();
        return { success: true, source, rawLength: res.body.length };
      } else {
        const errorMsg = `Código de estado HTTP no exitoso: ${res.status}`;
        source.status = 'ERROR';
        source.errors.unshift(`[${new Date().toISOString()}] ${errorMsg}`);
        if (source.errors.length > 10) source.errors = source.errors.slice(0, 10);
        this.db.addEvent({
          type: 'SOURCE_ERROR',
          severity: 'ERROR',
          title: `Fallo al verificar fuente ${source.name}`,
          message: errorMsg,
          metadata: { sourceId: source.id, status: res.status },
        });
        this.db.save();
        return { success: false, source, rawLength: 0, error: errorMsg };
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const errorMsg = err.message || 'Error de red desconocido';
      source.lastChecked = new Date().toISOString();
      source.responseTime = duration;
      source.status = 'ERROR';
      source.errors.unshift(`[${new Date().toISOString()}] ${errorMsg}`);
      if (source.errors.length > 10) source.errors = source.errors.slice(0, 10);

      this.db.addEvent({
        type: 'SOURCE_ERROR',
        severity: 'ERROR',
        title: `Excepción al consultar fuente ${source.name}`,
        message: errorMsg,
        metadata: { sourceId: source.id },
      });
      this.db.save();
      return { success: false, source, rawLength: 0, error: errorMsg };
    }
  }
}
