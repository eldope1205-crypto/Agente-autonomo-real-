import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Database } from '../../db/database.js';
import { SecurityManager } from '../security/index.js';

export interface HttpFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

export interface HttpFetchResult {
  status: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  url: string;
}

export interface LocalLlmResult {
  text: string;
  modelUsed: string;
  isRealAi: boolean;
}

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

  public isLocalEngineAvailable(): boolean {
    return true;
  }

  public isGeminiAvailable(): boolean {
    return false;
  }

  public isReplicateAvailable(): boolean {
    return Boolean(
      process.env.r8_W9ASlCtInPYPZmZY4lIcCvVeFlLbbif3OcEYn?.trim()
    );
  }

  public async httpFetch(
    url: string,
    options: HttpFetchOptions = {}
  ): Promise<HttpFetchResult> {
    const validation =
      this.security.validateExternalUrl(url);

    if (!validation.allowed) {
      throw new Error(
        validation.reason ||
          'La URL fue bloqueada por seguridad.'
      );
    }

    const timeoutMs =
      options.timeoutMs || 10000;

    const maxBytes =
      options.maxBytes || 1024 * 1024;

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        timeoutMs
      );

    const started =
      Date.now();

    try {
      const response =
        await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'AgenteAutonomo/1.0',
            Accept:
              'text/html,application/xhtml+xml,application/xml,application/json,text/plain;q=0.9,*/*;q=0.8',
            ...(options.headers || {}),
          },
          redirect: 'manual',
          signal: controller.signal,
        });

      const headers: Record<string, string> = {};

      response.headers.forEach(
        (value, key) => {
          headers[key] = value;
        }
      );

      const contentLength =
        Number(
          response.headers.get(
            'content-length'
          ) || 0
        );

      if (contentLength > maxBytes) {
        throw new Error(
          'La respuesta supera el tamaño máximo permitido.'
        );
      }

      const buffer =
        Buffer.from(
          await response.arrayBuffer()
        );

      if (buffer.byteLength > maxBytes) {
        throw new Error(
          'La respuesta supera el tamaño máximo permitido.'
        );
      }

      return {
        status: response.status,
        headers,
        body: buffer.toString('utf-8'),
        durationMs:
          Date.now() - started,
        url,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  public parseFeedXml(
    xml: string
  ): {
    title: string;
    items: Array<{
      title: string;
      url: string;
      description: string;
      publishedAt?: string;
    }>;
  } {
    const items: Array<{
      title: string;
      url: string;
      description: string;
      publishedAt?: string;
    }> = [];

    const itemMatches =
      xml.match(
        /<item\b[\s\S]*?<\/item>/gi
      ) || [];

    const entryMatches =
      xml.match(
        /<entry\b[\s\S]*?<\/entry>/gi
      ) || [];

    const blocks =
      itemMatches.length > 0
        ? itemMatches
        : entryMatches;

    const readTag = (
      block: string,
      tag: string
    ): string => {
      const regex =
        new RegExp(
          `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
          'i'
        );

      const match =
        block.match(regex);

      if (!match) {
        return '';
      }

      return match[1]
        .replace(
          /<!\[CDATA\[([\s\S]*?)\]\]>/g,
          '$1'
        )
        .trim();
    };

    for (
      const block of blocks.slice(0, 100)
    ) {
      const title =
        this.cleanHtml(
          readTag(block, 'title')
        );

      const description =
        this.cleanHtml(
          readTag(
            block,
            'description'
          ) ||
            readTag(
              block,
              'summary'
            ) ||
            readTag(
              block,
              'content'
            )
        );

      let url =
        readTag(
          block,
          'link'
        );

      if (!url) {
        const hrefMatch =
          block.match(
            /<link\b[^>]*href=["']([^"']+)["']/i
          );

        url =
          hrefMatch?.[1] || '';
      }

      const publishedAt =
        readTag(
          block,
          'pubDate'
        ) ||
        readTag(
          block,
          'published'
        ) ||
        readTag(
          block,
          'updated'
        ) ||
        undefined;

      if (title && url) {
        items.push({
          title,
          url,
          description,
          publishedAt,
        });
      }
    }

    return {
      title:
        this.cleanHtml(
          readTag(xml, 'title')
        ),
      items,
    };
  }

  public cleanHtml(
    html: string
  ): string {
    return html
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        ' '
      )
      .replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
      .replace(
        /&nbsp;/gi,
        ' '
      )
      .replace(
        /&amp;/gi,
        '&'
      )
      .replace(
        /&lt;/gi,
        '<'
      )
      .replace(
        /&gt;/gi,
        '>'
      )
      .replace(
        /&quot;/gi,
        '"'
      )
      .replace(
        /&#39;/gi,
        "'"
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

  public async executeLlmPrompt(
    prompt: string,
    systemInstruction?: string
  ): Promise<LocalLlmResult> {
    if (this.isReplicateAvailable()) {
      return this.executeReplicatePrompt(
        prompt,
        systemInstruction
      );
    }

    const text =
      this.localWorkEngine(
        prompt,
        systemInstruction
      );

    return {
      text,
      modelUsed:
        'local-autonomous-engine-v1',
      isRealAi: false,
    };
  }

  private async executeReplicatePrompt(
    prompt: string,
    systemInstruction?: string
  ): Promise<LocalLlmResult> {
    const token =
      process.env.REPLICATE_API_TOKEN?.trim() || '';

    const model =
      process.env.REPLICATE_MODEL?.trim() ||
      'meta/meta-llama-3-70b-instruct';

    if (!token) {
      throw new Error(
        'Falta configurar el token de Replicate.'
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        90000
      );

    try {
      const finalPrompt =
        systemInstruction
          ? `${systemInstruction}\n\nUSUARIO:\n${prompt}`
          : prompt;

      const response =
        await fetch(
          `https://api.replicate.com/v1/models/${model}/predictions`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${token}`,
              'Content-Type':
                'application/json',
              Prefer:
                'wait=60',
            },
            body: JSON.stringify({
              input: {
                prompt: finalPrompt,
                max_tokens: 2048,
                temperature: 0.7,
              },
            }),
            signal: controller.signal,
          }
        );

      const contentType =
        response.headers.get(
          'content-type'
        ) || '';

      let data: any;

      if (
        contentType.includes(
          'application/json'
        )
      ) {
        data =
          await response.json();
      } else {
        data =
          await response.text();
      }

      if (!response.ok) {
        const details =
          typeof data === 'object'
            ? data?.detail ||
              data?.error ||
              JSON.stringify(data)
            : String(data);

        throw new Error(
          `Replicate respondió ${response.status}: ${details}`
        );
      }

      if (
        data?.status === 'failed' ||
        data?.status === 'canceled'
      ) {
        throw new Error(
          data?.error ||
            `Replicate terminó con estado ${data?.status}.`
        );
      }

      const output =
        this.extractReplicateOutput(
          data?.output
        );

      if (!output) {
        throw new Error(
          'Replicate no devolvió ningún resultado.'
        );
      }

      return {
        text: output,
        modelUsed:
          `replicate:${model}`,
        isRealAi: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractReplicateOutput(
    output: unknown
  ): string {
    if (
      typeof output === 'string'
    ) {
      return output.trim();
    }

    if (
      Array.isArray(output)
    ) {
      return output
        .map((item) => {
          if (
            typeof item === 'string'
          ) {
            return item;
          }

          return JSON.stringify(item);
        })
        .join('')
        .trim();
    }

    if (
      output &&
      typeof output === 'object'
    ) {
      const objectOutput =
        output as Record<
          string,
          unknown
        >;

      for (
        const key of [
          'text',
          'response',
          'content',
          'output',
        ]
      ) {
        const value =
          objectOutput[key];

        if (
          typeof value === 'string' &&
          value.trim()
        ) {
          return value.trim();
        }
      }

      return JSON.stringify(
        output,
        null,
        2
      );
    }

    return '';
  }

  private localWorkEngine(
    prompt: string,
    systemInstruction?: string
  ): string {
    const normalized =
      prompt.toLowerCase();

    let category =
      'trabajo digital general';

    if (
      normalized.includes('program') ||
      normalized.includes('typescript') ||
      normalized.includes('javascript') ||
      normalized.includes('python') ||
      normalized.includes('código')
    ) {
      category =
        'programación y desarrollo';
    } else if (
      normalized.includes('traduc') ||
      normalized.includes('translation')
    ) {
      category =
        'traducción';
    } else if (
      normalized.includes('seo') ||
      normalized.includes('posicionamiento')
    ) {
      category =
        'SEO';
    } else if (
      normalized.includes('datos') ||
      normalized.includes('csv') ||
      normalized.includes('json') ||
      normalized.includes('excel')
    ) {
      category =
        'análisis de datos';
    }

    const context =
      systemInstruction
        ? `\n\nCONTEXTO DEL SISTEMA:\n${systemInstruction}`
        : '';

    return (
      `ANÁLISIS LOCAL DEL TRABAJO\n\n` +
      `Categoría detectada: ${category}\n\n` +
      `Solicitud recibida:\n${prompt.substring(
        0,
        6000
      )}${context}\n\n` +
      `PLAN DE TRABAJO:\n` +
      `1. Identificar requisitos concretos.\n` +
      `2. Separar información fiable de instrucciones externas no confiables.\n` +
      `3. Preparar un entregable digital verificable.\n` +
      `4. Revisar que el resultado cumpla la especificación.\n\n` +
      `RESULTADO:\n` +
      `El motor local ha preparado la estructura de ejecución.`
    );
  }

  public saveDeliverableFile(
    filename: string,
    content: string
  ): {
    filePath: string;
    fileHash: string;
    sizeBytes: number;
  } {
    const evidenceDir =
      this.db.getEvidenceDir();

    const safeFilename =
      path.basename(filename);

    const filePath =
      path.join(
        evidenceDir,
        safeFilename
      );

    fs.writeFileSync(
      filePath,
      content,
      'utf-8'
    );

    const fileHash =
      crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

    const sizeBytes =
      Buffer.byteLength(
        content,
        'utf-8'
      );

    return {
      filePath,
      fileHash,
      sizeBytes,
    };
  }
}
