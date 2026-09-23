import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Database } from '../../db/database.js';
import { SecurityManager } from '../security/index.js';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private db: Database;
  private security: SecurityManager;

  private constructor() {
    this.db = Database.getInstance();
    this.security = SecurityManager.getInstance();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }

    return ToolRegistry.instance;
  }

  /**
   * El sistema ya no depende de Gemini ni de una API externa.
   * El motor local siempre está disponible.
   */
  public isLocalEngineAvailable(): boolean {
    return true;
  }

  /**
   * Compatibilidad con el resto del proyecto.
   * No utiliza ninguna API externa.
   */
  public isGeminiAvailable(): boolean {
    return false;
  }

  /**
   * Fetch HTTP seguro.
   */
  public async httpFetch(
    url: string,
    options: {
      timeoutMs?: number;
      maxBytes?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<{
    status: number;
    body: string;
    headers: Record<string, string>;
    durationMs: number;
  }> {
    const timeoutMs = options.timeoutMs || 12000;
    const maxBytes = options.maxBytes || 2 * 1024 * 1024;

    const validation = this.security.validateUrl(url);

    if (!validation.allowed) {
      throw new Error(
        `[Seguridad] Acceso bloqueado: ${validation.reason}`
      );
    }

    const start = Date.now();

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(validation.sanitizedUrl!, {
        method: 'GET',
        headers: {
          'User-Agent': 'AutonomousAgent/1.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml,application/json,*/*',
          ...options.headers,
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      const responseHeaders: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const reader = response.body?.getReader();

      if (!reader) {
        return {
          status: response.status,
          body: '',
          headers: responseHeaders,
          durationMs: Date.now() - start,
        };
      }

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          receivedBytes += value.length;

          if (receivedBytes > maxBytes) {
            await reader.cancel();

            throw new Error(
              `[Seguridad] Respuesta demasiado grande. Límite: ${
                maxBytes / 1024
              } KB`
            );
          }

          chunks.push(value);
        }
      }

      const buffer = Buffer.concat(chunks);

      return {
        status: response.status,
        body: buffer.toString('utf-8'),
        headers: responseHeaders,
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(
          `[Timeout] La petición superó ${timeoutMs} ms`
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parser RSS / Atom.
   */
  public parseFeedXml(
    xml: string
  ): Array<{
    title: string;
    link: string;
    description: string;
    pubDate?: string;
    guid?: string;
    category?: string;
  }> {
    const items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate?: string;
      guid?: string;
      category?: string;
    }> = [];

    const extractTag = (
      chunk: string,
      tag: string
    ): string => {
      const escapedTag = tag.replace(':', '\\:');

      const cdata = new RegExp(
        `<${escapedTag}[^>]*>\\s*<!\$begin:math:display$CDATA\\\\\[\(\[\\\\s\\\\S\]\*\?\)\\$end:math:display$\\]>\\s*<\\/${escapedTag}>`,
        'i'
      );

      const cdataMatch = chunk.match(cdata);

      if (cdataMatch) {
        return cdataMatch[1].trim();
      }

      const normal = new RegExp(
        `<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`,
        'i'
      );

      const normalMatch = chunk.match(normal);

      return normalMatch ? normalMatch[1].trim() : '';
    };

    const rssItems = /<item[\s\S]*?<\/item>/gi;

    let match: RegExpExecArray | null;

    while ((match = rssItems.exec(xml)) !== null) {
      const chunk = match[0];

      const title = this.cleanHtml(
        extractTag(chunk, 'title')
      );

      const link = extractTag(chunk, 'link');

      const description = this.cleanHtml(
        extractTag(chunk, 'description') ||
          extractTag(chunk, 'content:encoded')
      );

      const pubDate = extractTag(chunk, 'pubDate');

      const guid =
        extractTag(chunk, 'guid') || link;

      const category = extractTag(
        chunk,
        'category'
      );

      if (title && (link || guid)) {
        items.push({
          title,
          link: link || guid,
          description,
          pubDate,
          guid,
          category,
        });
      }
    }

    if (items.length === 0) {
      const entries = /<entry[\s\S]*?<\/entry>/gi;

      while ((match = entries.exec(xml)) !== null) {
        const chunk = match[0];

        const title = this.cleanHtml(
          extractTag(chunk, 'title')
        );

        const hrefMatch = chunk.match(
          /<link[^>]*href=["']([^"']+)["']/i
        );

        const link = hrefMatch
          ? hrefMatch[1]
          : extractTag(chunk, 'link');

        const description = this.cleanHtml(
          extractTag(chunk, 'summary') ||
            extractTag(chunk, 'content')
        );

        const pubDate =
          extractTag(chunk, 'updated') ||
          extractTag(chunk, 'published');

        const guid =
          extractTag(chunk, 'id') || link;

        if (title && link) {
          items.push({
            title,
            link,
            description,
            pubDate,
            guid,
          });
        }
      }
    }

    return items;
  }

  /**
   * Limpia HTML y texto externo.
   */
  public cleanHtml(input: string): string {
    if (!input) return '';

    return input
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ''
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ''
      )
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Motor de trabajo local.
   *
   * No necesita Gemini, OpenAI ni ninguna API.
   * Procesa la tarea utilizando reglas locales.
   */
  public async executeLlmPrompt(
    prompt: string,
    systemInstruction?: string
  ): Promise<{
    text: string;
    modelUsed: string;
    isRealAi: boolean;
  }> {
    const text = this.localWorkEngine(
      prompt,
      systemInstruction
    );

    return {
      text,
      modelUsed: 'local-autonomous-engine-v1',
      isRealAi: false,
    };
  }

  /**
   * Motor local para análisis, planificación,
   * redacción y estructuración.
   */
  private localWorkEngine(
    prompt: string,
    systemInstruction?: string
  ): string {
    const cleanPrompt = this.cleanHtml(prompt);

    const lower = cleanPrompt.toLowerCase();

    const sections: string[] = [];

    sections.push(
      '# Resultado del motor autónomo local'
    );

    sections.push(
      `Fecha de ejecución: ${new Date().toISOString()}`
    );

    sections.push(
      'Estado: PROCESADO LOCALMENTE'
    );

    sections.push(
      'Dependencias externas de IA: ninguna'
    );

    sections.push('');

    sections.push('## Análisis');

    if (
      lower.includes('código') ||
      lower.includes('typescript') ||
      lower.includes('javascript') ||
      lower.includes('python') ||
      lower.includes('program')
    ) {
      sections.push(
        'La tarea ha sido identificada como una tarea de desarrollo o programación.'
      );

      sections.push(
        'Se recomienda dividirla en especificación, implementación, validación y entrega.'
      );
    } else if (
      lower.includes('traducción') ||
      lower.includes('traduc')
    ) {
      sections.push(
        'La tarea ha sido identificada como una tarea lingüística.'
      );

      sections.push(
        'Se debe conservar el significado, estructura y requisitos del texto original.'
      );
    } else if (
      lower.includes('seo') ||
      lower.includes('posicionamiento')
    ) {
      sections.push(
        'La tarea ha sido identificada como una tarea de optimización y análisis SEO.'
      );

      sections.push(
        'Se deben analizar intención de búsqueda, contenido, estructura y términos relevantes.'
      );
    } else if (
      lower.includes('datos') ||
      lower.includes('data') ||
      lower.includes('estadística')
    ) {
      sections.push(
        'La tarea ha sido identificada como análisis de datos.'
      );

      sections.push(
        'Se deben comprobar estructura, consistencia, valores y conclusiones antes de entregar resultados.'
      );
    } else {
      sections.push(
        'La tarea ha sido identificada como trabajo digital general.'
      );

      sections.push(
        'El motor ha separado el problema en análisis, ejecución, verificación y entrega.'
      );
    }

    sections.push('');

    sections.push('## Requisitos detectados');

    sections.push(
      '1. Analizar la especificación recibida.'
    );

    sections.push(
      '2. Identificar restricciones y datos necesarios.'
    );

    sections.push(
      '3. Ejecutar el trabajo permitido.'
    );

    sections.push(
      '4. Verificar la consistencia del resultado.'
    );

    sections.push(
      '5. Generar un entregable reproducible.'
    );

    sections.push('');

    sections.push('## Resultado');

    sections.push(
      'El trabajo ha sido procesado por el motor local. '
    );

    sections.push(
      'El sistema no declara como realizado ningún trabajo que no pueda verificar.'
    );

    sections.push('');

    sections.push('## Entrada procesada');

    sections.push(
      cleanPrompt.substring(0, 6000)
    );

    if (systemInstruction) {
      sections.push('');

      sections.push(
        '## Directiva del sistema'
      );

      sections.push(
        this.cleanHtml(systemInstruction).substring(
          0,
          2000
        )
      );
    }

    return sections.join('\n');
  }

  /**
   * Guarda un entregable y calcula SHA-256.
   */
  public saveDeliverableFile(
    filename: string,
    content: string
  ): {
    filePath: string;
    relativePath: string;
    fileHash: string;
    sizeBytes: number;
  } {
    const evidenceDir =
      this.db.getEvidenceDir();

    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, {
        recursive: true,
      });
    }

    const safeFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 180);

    const timestamp = Date.now();

    const finalFilename =
      `${timestamp}-${safeFilename}`;

    const absolutePath = path.join(
      evidenceDir,
      finalFilename
    );

    fs.writeFileSync(
      absolutePath,
      content,
      'utf-8'
    );

    const sizeBytes =
      Buffer.byteLength(content, 'utf-8');

    const fileHash =
      crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

    return {
      filePath: absolutePath,
      relativePath:
        `/data/evidence/${finalFilename}`,
      fileHash,
      sizeBytes,
    };
  }
}
