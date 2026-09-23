import crypto from 'crypto';
import { Opportunity, Source } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { ToolRegistry } from '../tools/index.js';
import { SourceManager } from '../sources/index.js';

export class SearchEngine {
  private static instance: SearchEngine;
  private db: Database;
  private tools: ToolRegistry;
  private sourceManager: SourceManager;

  private constructor() {
    this.db = Database.getInstance();
    this.tools = ToolRegistry.getInstance();
    this.sourceManager = SourceManager.getInstance();
  }

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * Scans all enabled public sources for real opportunities.
   * Tolerates individual source errors without stopping the whole agent.
   */
  public async discoverOpportunities(): Promise<{
    scannedSources: number;
    newOpportunities: Opportunity[];
    errors: Array<{ sourceName: string; error: string }>;
  }> {
    const sources = this.sourceManager.getSources().filter((s) => s.enabled);
    const state = this.db.getState();
    const existingUrls = new Set(state.opportunities.map((o) => o.url.toLowerCase().trim()));
    const discovered: Opportunity[] = [];
    const errors: Array<{ sourceName: string; error: string }> = [];

    for (const source of sources) {
      try {
        const items = await this.fetchAndExtractFromSource(source);
        let newFromSource = 0;

        for (const item of items) {
          const normUrl = (item.url || '').toLowerCase().trim();
          if (!normUrl || existingUrls.has(normUrl)) {
            continue;
          }
          existingUrls.add(normUrl);

          const oppId = `opp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          const opp: Opportunity = {
            id: oppId,
            title: item.title,
            url: item.url,
            source: source.name,
            sourceId: source.id,
            description: item.description,
            category: item.category || source.category || 'tecnología',
            requirements: item.requirements || [],
            paymentText: item.paymentText || 'Por cotizar / No especificado',
            estimatedAmount: item.estimatedAmount || 0,
            currency: item.currency || 'EUR',
            score: 0,
            riskScore: 0,
            automationScore: 0,
            difficulty: 'MEDIA',
            estimatedTime: 'Por evaluar',
            detectedAt: new Date().toISOString(),
            status: 'NEW',
            rawData: item.rawData,
            evidence: [item.url],
          };

          state.opportunities.unshift(opp);
          discovered.push(opp);
          newFromSource++;

          this.db.addEvent({
            type: 'OPPORTUNITY_DISCOVERED',
            severity: 'INFO',
            title: 'Oportunidad Detectada',
            message: `[${source.name}] ${opp.title.substring(0, 70)}`,
            metadata: { opportunityId: opp.id, url: opp.url },
          });
        }

        source.opportunitiesFound += newFromSource;
        source.status = 'ACTIVE';
        source.lastChecked = new Date().toISOString();
      } catch (err: any) {
        const errorMsg = err.message || 'Fallo desconocido al procesar fuente';
        errors.push({ sourceName: source.name, error: errorMsg });
        source.status = 'ERROR';
        source.errors.unshift(`[${new Date().toISOString()}] ${errorMsg}`);
        if (source.errors.length > 10) source.errors = source.errors.slice(0, 10);
      }
    }

    this.db.save();
    return {
      scannedSources: sources.length,
      newOpportunities: discovered,
      errors,
    };
  }

  private async fetchAndExtractFromSource(source: Source): Promise<
    Array<{
      title: string;
      url: string;
      description: string;
      category?: string;
      requirements?: string[];
      paymentText?: string;
      estimatedAmount?: number;
      currency?: string;
      rawData?: Record<string, any>;
    }>
  > {
    const res = await this.tools.httpFetch(source.url, { timeoutMs: 12000 });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Servidor remoto respondió con HTTP ${res.status}`);
    }

    if (source.type === 'RSS' || source.type === 'ATOM' || source.type === 'XML') {
      return this.extractFromRss(res.body, source);
    } else if (source.type === 'JSON') {
      return this.extractFromJson(res.body, source);
    } else if (source.type === 'HTML') {
      return this.extractFromHtml(res.body, source);
    }

    return [];
  }

  private extractFromRss(
    xmlBody: string,
    source: Source
  ): Array<{
    title: string;
    url: string;
    description: string;
    category?: string;
    requirements?: string[];
    paymentText?: string;
    estimatedAmount?: number;
    currency?: string;
    rawData?: Record<string, any>;
  }> {
    const parsed = this.tools.parseFeedXml(xmlBody);
    return parsed.map((item) => {
      const parsedPay = this.detectRemuneration(item.title + ' ' + item.description);
      const reqs = this.extractKeywordsAsRequirements(item.description);

      return {
        title: item.title,
        url: item.link,
        description: item.description,
        category: item.category || source.category,
        requirements: reqs,
        paymentText: parsedPay.text,
        estimatedAmount: parsedPay.amount,
        currency: parsedPay.currency,
        rawData: { guid: item.guid, pubDate: item.pubDate },
      };
    });
  }

  private extractFromJson(
    jsonBody: string,
    source: Source
  ): Array<{
    title: string;
    url: string;
    description: string;
    category?: string;
    requirements?: string[];
    paymentText?: string;
    estimatedAmount?: number;
    currency?: string;
    rawData?: Record<string, any>;
  }> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonBody);
    } catch {
      throw new Error('Respuesta JSON no válida o malformada.');
    }

    const items: any[] = Array.isArray(parsed)
      ? parsed
      : parsed.jobs || parsed.items || parsed.data || parsed.results || [];

    return items.slice(0, 25).map((item: any) => {
      const title = item.jobTitle || item.title || item.name || 'Oportunidad sin título';
      const url = item.url || item.jobSlug || item.link || `${source.url}#${item.id || Math.random()}`;
      const desc = this.tools.cleanHtml(item.jobDescription || item.description || item.snippet || '');
      const parsedPay = this.detectRemuneration(title + ' ' + desc + ' ' + (item.annualSalaryMin || ''));
      const reqs = Array.isArray(item.jobGeo)
        ? item.jobGeo
        : this.extractKeywordsAsRequirements(desc);

      return {
        title,
        url,
        description: desc,
        category: item.jobCategory || source.category,
        requirements: reqs,
        paymentText: parsedPay.text,
        estimatedAmount: parsedPay.amount,
        currency: parsedPay.currency,
        rawData: { originalId: item.id, company: item.companyName },
      };
    });
  }

  private extractFromHtml(
    htmlBody: string,
    source: Source
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
    // Extract anchor tags with titles
    const links: Array<{ title: string; url: string; description: string }> = [];
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(htmlBody)) !== null && links.length < 15) {
      const href = match[2];
      const linkText = this.tools.cleanHtml(match[3]);
      if (linkText.length > 15 && (href.startsWith('http') || href.startsWith('/'))) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, source.url).toString();
        links.push({
          title: linkText,
          url: fullUrl,
          description: `Oportunidad extraída de página pública: ${linkText}`,
        });
      }
    }

    return links.map((l) => ({
      ...l,
      category: source.category,
      paymentText: 'Por cotizar',
      estimatedAmount: 0,
      currency: 'EUR',
      requirements: [],
    }));
  }

  private detectRemuneration(text: string): { text: string; amount: number; currency: string } {
    // Currency patterns: €, $, USD, EUR, etc.
    const eurRegex = /(\d+[\d.,]*)\s*€|€\s*(\d+[\d.,]*)/i;
    const usdRegex = /\$\s*(\d+[\d.,]*)|(\d+[\d.,]*)\s*USD/i;

    const eurMatch = text.match(eurRegex);
    if (eurMatch) {
      const rawNum = (eurMatch[1] || eurMatch[2]).replace(/,/g, '');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val > 0 && val < 1000000) {
        return { text: `${val} €`, amount: val, currency: 'EUR' };
      }
    }

    const usdMatch = text.match(usdRegex);
    if (usdMatch) {
      const rawNum = (usdMatch[1] || usdMatch[2]).replace(/,/g, '');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val > 0 && val < 1000000) {
        return { text: `$${val} USD`, amount: val, currency: 'USD' };
      }
    }

    return { text: 'A convenir / Por cotizar', amount: 0, currency: 'EUR' };
  }

  private extractKeywordsAsRequirements(desc: string): string[] {
    const techWords = [
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
    const found: string[] = [];
    const lower = desc.toLowerCase();
    for (const w of techWords) {
      if (lower.includes(w.toLowerCase())) {
        found.push(w);
      }
    }
    return found.slice(0, 6);
  }
}
