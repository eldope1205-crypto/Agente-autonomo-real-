import crypto from 'crypto';

import {
  Opportunity,
  Source,
} from '../../../src/types/index.js';

import {
  Database,
} from '../../db/database.js';

import {
  ToolRegistry,
} from '../tools/index.js';

import {
  SourceManager,
} from '../sources/index.js';

import {
  SecurityManager,
} from '../security/index.js';

export class SearchEngine {
  private static instance: SearchEngine;

  private db: Database;
  private tools: ToolRegistry;
  private sourceManager: SourceManager;
  private security: SecurityManager;

  private constructor() {
    this.db =
      Database.getInstance();

    this.tools =
      ToolRegistry.getInstance();

    this.sourceManager =
      SourceManager.getInstance();

    this.security =
      SecurityManager.getInstance();
  }

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance =
        new SearchEngine();
    }

    return SearchEngine.instance;
  }

  /**
   * Busca oportunidades reales en fuentes públicas habilitadas.
   */
  public async discoverOpportunities(): Promise<{
    scannedSources: number;
    newOpportunities: Opportunity[];
    errors: Array<{
      sourceName: string;
      error: string;
    }>;
  }> {
    const state =
      this.db.getState();

    const sources =
      this.sourceManager
        .getSources()
        .filter(
          (source) =>
            source.enabled
        );

    const existingUrls =
      new Set(
        state.opportunities
          .map(
            (opportunity) =>
              this.normalizeUrl(
                opportunity.url
              )
          )
          .filter(Boolean)
      );

    const discovered:
      Opportunity[] = [];

    const errors: Array<{
      sourceName: string;
      error: string;
    }> = [];

    const maxResults =
      Math.max(
        1,
        Number(
          state.settings
            .maxResultsPerSource ||
            10
        )
      );

    for (
      const source of sources
    ) {
      try {
        const items =
          await this.fetchAndExtractFromSource(
            source,
            maxResults
          );

        let newFromSource = 0;

        for (
          const item of items
        ) {
          if (
            newFromSource >=
            maxResults
          ) {
            break;
          }

          const cleanTitle =
            this.cleanExternalText(
              item.title
            );

          const cleanDescription =
            this.cleanExternalText(
              item.description
            );

          const normalizedUrl =
            this.normalizeUrl(
              item.url
            );

          if (
            !cleanTitle ||
            !normalizedUrl
          ) {
            continue;
          }

          if (
            existingUrls.has(
              normalizedUrl
            )
          ) {
            continue;
          }

          const urlValidation =
            this.security.validateUrl(
              normalizedUrl
            );

          if (
            !urlValidation.valid
          ) {
            continue;
          }

          existingUrls.add(
            normalizedUrl
          );

          const opportunityId =
            `opp-${Date.now()}-${crypto
              .randomBytes(3)
              .toString('hex')}`;

          const opportunity:
            Opportunity = {
            id:
              opportunityId,

            title:
              cleanTitle,

            url:
              normalizedUrl,

            source:
              source.name,

            sourceId:
              source.id,

            description:
              cleanDescription,

            category:
              this.cleanExternalText(
                item.category ||
                  source.category ||
                  'tecnología'
              ),

            requirements:
              Array.isArray(
                item.requirements
              )
                ? item.requirements
                    .slice(0, 10)
                    .map(
                      (requirement) =>
                        this.cleanExternalText(
                          requirement
                        )
                    )
                    .filter(Boolean)
                : [],

            paymentText:
              this.cleanExternalText(
                item.paymentText ||
                  'Por cotizar / No especificado'
              ),

            estimatedAmount:
              this.normalizeAmount(
                item.estimatedAmount
              ),

            currency:
              item.currency ||
              'EUR',

            score:
              0,

            riskScore:
              0,

            automationScore:
              0,

            difficulty:
              'MEDIA',

            estimatedTime:
              'Por evaluar',

            detectedAt:
              new Date()
                .toISOString(),

            status:
              'NEW',

            rawData:
              this.sanitizeRawData(
                item.rawData
              ),

            evidence:
              [normalizedUrl],
          };

          state.opportunities.unshift(
            opportunity
          );

          discovered.push(
            opportunity
          );

          newFromSource++;

          this.db.addEvent({
            type:
              'OPPORTUNITY_DISCOVERED',

            severity:
              'INFO',

            title:
              'Oportunidad detectada',

            message:
              `[${source.name}] ${cleanTitle.substring(
                0,
                100
              )}`,

            metadata: {
              opportunityId:
                opportunity.id,

              url:
                opportunity.url,

              sourceId:
                source.id,
            },
          });
        }

        source.opportunitiesFound +=
          newFromSource;

        source.status =
          'ACTIVE';

        source.lastChecked =
          new Date()
            .toISOString();

      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Fallo desconocido al procesar fuente';

        errors.push({
          sourceName:
            source.name,

          error:
            errorMsg,
        });

        source.status =
          'ERROR';

        source.lastChecked =
          new Date()
            .toISOString();

        source.errors.unshift(
          `[${new Date().toISOString()}] ${errorMsg}`
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
            `Error procesando ${source.name}`,

          message:
            errorMsg,

          metadata: {
            sourceId:
              source.id,
          },
        });
      }
    }

    this.db.save();

    return {
      scannedSources:
        sources.length,

      newOpportunities:
        discovered,

      errors,
    };
  }

  private async fetchAndExtractFromSource(
    source: Source,
    limit: number
  ): Promise<
    Array<{
      title: string;
      url: string;
      description: string;
      category?: string;
      requirements?: string[];
      paymentText?: string;
      estimatedAmount?: number;
      currency?: string;
      rawData?: Record<
        string,
        any
      >;
    }>
  > {
    const response =
      await this.tools.httpFetch(
        source.url,
        {
          timeoutMs:
            12000,
        }
      );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw new Error(
        `Servidor remoto respondió con HTTP ${response.status}`
      );
    }

    /*
     * Todo contenido externo se considera
     * información no confiable.
     */
    const safeBody =
      this.security.sanitizeExternalContent(
        response.body
      );

    if (
      source.type === 'RSS' ||
      source.type === 'ATOM' ||
      source.type === 'XML'
    ) {
      return this.extractFromRss(
        safeBody,
        source,
        limit
      );
    }

    if (
      source.type === 'JSON'
    ) {
      return this.extractFromJson(
        safeBody,
        source,
        limit
      );
    }

    if (
      source.type === 'HTML'
    ) {
      return this.extractFromHtml(
        safeBody,
        source,
        limit
      );
    }

    return [];
  }

  private extractFromRss(
    xmlBody: string,
    source: Source,
    limit: number
  ): Array<{
    title: string;
    url: string;
    description: string;
    category?: string;
    requirements?: string[];
    paymentText?: string;
    estimatedAmount?: number;
    currency?: string;
    rawData?: Record<
      string,
      any
    >;
  }> {
    const parsed =
      this.tools.parseFeedXml(
        xmlBody
      );

    return parsed
      .slice(0, limit)
      .map(
        (item) => {
          const title =
            this.cleanExternalText(
              item.title
            );

          const description =
            this.cleanExternalText(
              item.description
            );

          const remuneration =
            this.detectRemuneration(
              `${title} ${description}`
            );

          const requirements =
            this.extractKeywordsAsRequirements(
              description
            );

          return {
            title,

            url:
              item.link,

            description,

            category:
              this.cleanExternalText(
                item.category ||
                  source.category ||
                  'general'
              ),

            requirements,

            paymentText:
              remuneration.text,

            estimatedAmount:
              remuneration.amount,

            currency:
              remuneration.currency,

            rawData: {
              guid:
                item.guid,

              pubDate:
                item.pubDate,
            },
          };
        }
      );
  }

  private extractFromJson(
    jsonBody: string,
    source: Source,
    limit: number
  ): Array<{
    title: string;
    url: string;
    description: string;
    category?: string;
    requirements?: string[];
    paymentText?: string;
    estimatedAmount?: number;
    currency?: string;
    rawData?: Record<
      string,
      any
    >;
  }> {
    let parsed: any;

    try {
      parsed =
        JSON.parse(
          jsonBody
        );
    } catch {
      throw new Error(
        'Respuesta JSON no válida o malformada.'
      );
    }

    const items: any[] =
      Array.isArray(parsed)
        ? parsed
        : parsed?.jobs ||
          parsed?.items ||
          parsed?.data ||
          parsed?.results ||
          [];

    if (
      !Array.isArray(items)
    ) {
      return [];
    }

    return items
      .slice(0, limit)
      .map(
        (item: any) => {
          const title =
            this.cleanExternalText(
              item?.jobTitle ||
                item?.title ||
                item?.name ||
                'Oportunidad sin título'
            );

          const rawUrl =
            item?.url ||
            item?.link ||
            '';

          const description =
            this.cleanExternalText(
              item?.jobDescription ||
                item?.description ||
                item?.snippet ||
                ''
            );

          const remunerationText =
            [
              title,
              description,
              item?.annualSalaryMin,
              item?.annualSalaryMax,
              item?.salary,
              item?.salaryMin,
              item?.salaryMax,
            ]
              .filter(
                (value) =>
                  value !== undefined &&
                  value !== null
              )
              .join(' ');

          const remuneration =
            this.detectRemuneration(
              remunerationText
            );

          let requirements:
            string[] = [];

          if (
            Array.isArray(
              item?.jobGeo
            )
          ) {
            requirements =
              item.jobGeo
                .slice(0, 6)
                .map(
                  (value: unknown) =>
                    this.cleanExternalText(
                      String(value)
                    )
                )
                .filter(Boolean);
          }

          if (
            requirements.length ===
            0
          ) {
            requirements =
              this.extractKeywordsAsRequirements(
                description
              );
          }

          return {
            title,

            url:
              rawUrl,

            description,

            category:
              this.cleanExternalText(
                item?.jobCategory ||
                  source.category ||
                  'general'
              ),

            requirements,

            paymentText:
              remuneration.text,

            estimatedAmount:
              remuneration.amount,

            currency:
              remuneration.currency,

            rawData:
              this.sanitizeRawData({
                originalId:
                  item?.id,

                company:
                  item?.companyName,
              }),
          };
        }
      );
  }

  private extractFromHtml(
    htmlBody: string,
    source: Source,
    limit: number
  ): Array<{
    title: string;
    url: string;
    description: string;
    category?: string;
    requirements?: string[];
    paymentText?: string;
    estimatedAmount?: number;
    currency?: string;
  }> {
    const links: Array<{
      title: string;
      url: string;
      description: string;
    }> = [];

    const linkRegex =
      /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;

    let match:
      RegExpExecArray | null;

    while (
      (
        match =
          linkRegex.exec(
            htmlBody
          )
      ) !== null &&
      links.length < limit
    ) {
      const href =
        match[2];

      const linkText =
        this.cleanExternalText(
          this.tools.cleanHtml(
            match[3]
          )
        );

      if (
        linkText.length <=
        15
      ) {
        continue;
      }

      if (
        !href.startsWith(
          'http'
        ) &&
        !href.startsWith('/')
      ) {
        continue;
      }

      let fullUrl: string;

      try {
        fullUrl =
          href.startsWith(
            'http'
          )
            ? href
            : new URL(
                href,
                source.url
              ).toString();
      } catch {
        continue;
      }

      const validation =
        this.security.validateUrl(
          fullUrl
        );

      if (
        !validation.valid
      ) {
        continue;
      }

      links.push({
        title:
          linkText,

        url:
          fullUrl,

        description:
          `Oportunidad extraída de una página pública: ${linkText}`,
      });
    }

    return links.map(
      (link) => ({
        ...link,

        category:
          source.category,

        paymentText:
          'Por cotizar',

        estimatedAmount:
          0,

        currency:
          'EUR',

        requirements:
          this.extractKeywordsAsRequirements(
            link.description
          ),
      })
    );
  }

  private detectRemuneration(
    text: string
  ): {
    text: string;
    amount: number;
    currency: string;
  } {
    const eurRegex =
      /(\d+(?:[.,]\d+)?)\s*(?:€|EUR)\b|€\s*(\d+(?:[.,]\d+)?)/i;

    const usdRegex =
      /\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*USD\b/i;

    const eurMatch =
      text.match(
        eurRegex
      );

    if (eurMatch) {
      const raw =
        eurMatch[1] ||
        eurMatch[2];

      const value =
        this.parseMoney(
          raw
        );

      if (
        value > 0 &&
        value < 1000000
      ) {
        return {
          text:
            `${value} €`,

          amount:
            value,

          currency:
            'EUR',
        };
      }
    }

    const usdMatch =
      text.match(
        usdRegex
      );

    if (usdMatch) {
      const raw =
        usdMatch[1] ||
        usdMatch[2];

      const value =
        this.parseMoney(
          raw
        );

      if (
        value > 0 &&
        value < 1000000
      ) {
        return {
          text:
            `$${value} USD`,

          amount:
            value,

          currency:
            'USD',
        };
      }
    }

    return {
      text:
        'A convenir / Por cotizar',

      amount:
        0,

      currency:
        'EUR',
    };
  }

  private parseMoney(
    value: string
  ): number {
    let normalized =
      value.trim();

    /*
     * Manejo básico de formatos:
     * 1,500
     * 1.500
     * 1500,50
     * 1500.50
     */
    if (
      normalized.includes(',') &&
      normalized.includes('.')
    ) {
      normalized =
        normalized.replace(
          /\./g,
          ''
        );

      normalized =
        normalized.replace(
          ',',
          '.'
        );
    } else if (
      normalized.includes(',')
    ) {
      const parts =
        normalized.split(',');

      if (
        parts[1]?.length ===
        2
      ) {
        normalized =
          normalized.replace(
            ',',
            '.'
          );
      } else {
        normalized =
          normalized.replace(
            /,/g,
            ''
          );
      }
    } else if (
      normalized.includes('.')
    ) {
      const parts =
        normalized.split('.');

      if (
        parts[1]?.length !==
        2
      ) {
        normalized =
          normalized.replace(
            /\./g,
            ''
          );
      }
    }

    const parsed =
      Number(normalized);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  private extractKeywordsAsRequirements(
    description: string
  ): string[] {
    const technicalWords = [
      'TypeScript',
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'SQL',
      'PostgreSQL',
      'API',
      'GraphQL',
      'Docker',
      'Redacción',
      'Traducción',
      'SEO',
      'Inglés',
      'Español',
      'Análisis de datos',
      'Automatización',
      'Documentación',
    ];

    const found:
      string[] = [];

    const lower =
      description.toLowerCase();

    for (
      const word of
        technicalWords
    ) {
      if (
        lower.includes(
          word.toLowerCase()
        )
      ) {
        found.push(
          word
        );
      }
    }

    return found.slice(
      0,
      6
    );
  }

  private cleanExternalText(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value)
      .replace(
        /\u0000/g,
        ''
      )
      .replace(
        /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
      .slice(
        0,
        10000
      );
  }

  private normalizeUrl(
    value: unknown
  ): string {
    if (
      typeof value !==
      'string'
    ) {
      return '';
    }

    const url =
      value.trim();

    if (!url) {
      return '';
    }

    try {
      return new URL(
        url
      ).toString();
    } catch {
      return '';
    }
  }

  private normalizeAmount(
    value: unknown
  ): number {
    if (
      typeof value !==
      'number'
    ) {
      return 0;
    }

    if (
      !Number.isFinite(
        value
      ) ||
      value < 0 ||
      value > 1000000
    ) {
      return 0;
    }

    return Number(
      value.toFixed(2)
    );
  }

  private sanitizeRawData(
    value:
      | Record<string, any>
      | undefined
  ):
    | Record<string, any>
    | undefined {
    if (!value) {
      return undefined;
    }

    try {
      const serialized =
        JSON.stringify(
          value
        );

      if (
        serialized.length >
        5000
      ) {
        return {
          truncated:
            true,
        };
      }

      return JSON.parse(
        serialized
      );
    } catch {
      return undefined;
    }
  }
}
