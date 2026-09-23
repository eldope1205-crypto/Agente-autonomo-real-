import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AgentStatus,
  AgentMode,
  CycleStep,
  Source,
  Opportunity,
  Task,
  Capability,
  Tool,
  Transaction,
  FinancialSummary,
  AppSettings,
  EvidenceItem,
  AgentEvent,
  SubAgent,
  LearningInsight,
  SecurityRule,
} from '../../src/types/index.js';

export interface DatabaseState {
  version: number;
  agent: {
    status: AgentStatus;
    mode: AgentMode;
    cycleStep: CycleStep;
    cycleCount: number;
    lastActivity: string;
    schedulerActive: boolean;
    lastCycleCompletedAt?: string;
  };
  sources: Source[];
  opportunities: Opportunity[];
  tasks: Task[];
  capabilities: Capability[];
  tools: Tool[];
  transactions: Transaction[];
  finances: FinancialSummary;
  settings: AppSettings;
  evidence: EvidenceItem[];
  events: AgentEvent[];
  subAgents: SubAgent[];
  learning: LearningInsight[];
  securityRules: SecurityRule[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agent_database.json');
const EVIDENCE_DIR = path.join(DATA_DIR, 'evidence');

const INITIAL_CAPABILITIES: Capability[] = [
  {
    id: 'WEB_RESEARCH',
    name: 'Investigación Web Pública',
    description: 'Búsqueda, extracción y síntesis de información de fuentes públicas accesibles sin evasión de controles.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: ['http_fetcher', 'text_processor', 'llm_worker'],
    cost: '0.00 €/consulta',
    requirements: ['Conectividad HTTP saliente', 'SSRF Validation'],
    limits: 'Solo sitios públicos sin CAPTCHA ni autenticación requerida.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'TEXT_WRITING',
    name: 'Redacción y Redacción Técnica',
    description: 'Generación de informes, artículos técnicos, síntesis analíticas y redacción profesional estructurada.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: ['llm_worker', 'file_generator'],
    cost: '0.00 €',
    requirements: ['Modelo LLM Server-side'],
    limits: 'Generación digital verificable con evidencia registrada.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'TRANSLATION',
    name: 'Traducción Técnica Multilingüe',
    description: 'Traducción precisa entre Español, Inglés, Francés, Alemán, Portugués y otros con fidelidad terminológica.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: ['llm_worker'],
    cost: '0.00 €',
    requirements: ['Modelo LLM'],
    limits: 'Documentos digitales procesables.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'TRANSCRIPTION',
    name: 'Transcripción de Texto y Normalización',
    description: 'Limpieza, normalización fonética y estructuración de transcripciones de audio/texto existentes.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['text_processor', 'llm_worker'],
    cost: '0.00 €',
    requirements: ['Datos textuales crudos o formato accesible'],
    limits: 'Procesamiento de texto/STT estructurado.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'DATA_ANALYSIS',
    name: 'Análisis de Datos y Estadísticas',
    description: 'Interpretación matemática, detección de correlaciones, síntesis de tendencias y resúmenes estructurados.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: ['llm_worker', 'file_generator'],
    cost: '0.00 €',
    requirements: ['JSON/CSV de entrada estructurado'],
    limits: 'Conjuntos de datos accesibles en memoria.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'DATA_CLASSIFICATION',
    name: 'Clasificación y Etiquetado de Datos',
    description: 'Taxonomías categóricas, análisis de sentimiento, etiquetado temático y normalización de registros.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: ['llm_worker', 'text_processor'],
    cost: '0.00 €',
    requirements: ['Esquema taxonómico de entrada'],
    limits: 'Validación por lotes auditables.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'CONTENT_GENERATION',
    name: 'Creación de Contenido Digital',
    description: 'Guías de usuario, manuales de API, material educativo, documentación de producto.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: ['llm_worker', 'file_generator'],
    cost: '0.00 €',
    requirements: ['Briefing inicial o requisitos de oportunidad'],
    limits: 'Formatos Markdown, HTML, JSON, TXT.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'DOCUMENT_PROCESSING',
    name: 'Procesamiento y Conversión Documental',
    description: 'Parseo de Markdown, extracción de tablas, conversión JSON-CSV y reestructuración de documentación.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['text_processor', 'file_generator'],
    cost: '0.00 €',
    requirements: ['Archivos de texto planos'],
    limits: 'Formatos estándares sin OCR físico.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'CODE_GENERATION',
    name: 'Desarrollo y Revisión de Código',
    description: 'Generación de scripts TypeScript/Python/Bash, refactorización, depuración y creación de tests unitarios.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: ['llm_worker', 'file_generator'],
    cost: '0.00 €',
    requirements: ['Especificación técnica del proyecto'],
    limits: 'Ejecución en sandbox estricto; no acceso a red no autorizada.',
    requiresAuthorization: true,
    enabled: true,
  },
  {
    id: 'SEO_RESEARCH',
    name: 'Auditoría e Investigación SEO',
    description: 'Análisis de metadatos, intención de búsqueda, densidad de palabras clave y arquitectura semántica.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: ['http_fetcher', 'llm_worker'],
    cost: '0.00 €',
    requirements: ['URL pública o términos semilla'],
    limits: 'Páginas que permitan indexación.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'PRODUCT_RESEARCH',
    name: 'Benchmarking e Investigación de Mercado',
    description: 'Comparativas técnicas de productos de software, análisis de especificaciones y matrices de funcionalidad.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['http_fetcher', 'llm_worker'],
    cost: '0.00 €',
    requirements: ['Parámetros de comparación'],
    limits: 'Información pública verificable.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'ECOMMERCE_RESEARCH',
    name: 'Análisis de Catálogo y Precios',
    description: 'Extracción de metadatos de precios públicos, análisis de fichas de producto y detección de márgenes.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['http_fetcher', 'text_processor'],
    cost: '0.00 €',
    requirements: ['Endpoints o feeds públicos JSON/RSS'],
    limits: 'No interactúa con pasarelas de pago ni cuentas privadas.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'CUSTOMER_SUPPORT_DRAFTING',
    name: 'Borradores de Respuestas de Asistencia',
    description: 'Redacción de respuestas de nivel 1 y 2 a consultas técnicas basadas en bases de conocimiento.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: ['llm_worker'],
    cost: '0.00 €',
    requirements: ['Base de conocimiento o contexto del problema'],
    limits: 'Solo genera borradores; el envío directo requiere intervención o autorización explícita.',
    requiresAuthorization: true,
    enabled: true,
  },
  {
    id: 'SOCIAL_CONTENT',
    name: 'Creación de Publicaciones y Divulgación',
    description: 'Generación de hilos técnicos, resúmenes divulgativos de changelogs y posts informativos.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['llm_worker'],
    cost: '0.00 €',
    requirements: ['Tema o material de referencia'],
    limits: 'No publicación automática sin credenciales configuradas.',
    requiresAuthorization: true,
    enabled: true,
  },
  {
    id: 'VIDEO_SCRIPTING',
    name: 'Guionización de Vídeos Formativos',
    description: 'Estructuración de guiones técnicos con marcas de tiempo, llamadas a la acción y descripciones visuales.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: ['llm_worker', 'file_generator'],
    cost: '0.00 €',
    requirements: ['Objetivo pedagógico del vídeo'],
    limits: 'Solo guion textual estructurado; no renderizado de vídeo local.',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'WEB_AUTOMATION',
    name: 'Automatización Web Controlada',
    description: 'Interacción autónoma con páginas públicas permitidas respetando robots.txt y sin evasión de controles.',
    status: 'NEEDS_CONFIG',
    level: 'INTERMEDIATE',
    requiredTools: ['http_fetcher'],
    cost: '0.00 €',
    requirements: ['Entorno con navegador headless o APIs autorizadas'],
    limits: 'Estricto: No CAPTCHAs, no sesiones robadas, no anti-bot bypass. Si se requiere login -> NEEDS_HUMAN.',
    requiresAuthorization: true,
    enabled: false,
  },
];

const INITIAL_TOOLS: Tool[] = [
  {
    id: 'http_fetcher',
    name: 'HTTP Safe Fetcher',
    description: 'Cliente HTTP seguro con filtrado estricto contra SSRF, bloqueo de IPs privadas/localhost y límite de 2MB.',
    inputSchema: { url: 'string', method: 'string', headers: 'object?' },
    outputSchema: { status: 'number', body: 'string', headers: 'object', durationMs: 'number' },
    permissions: ['NET_CONNECT_PUBLIC'],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'rss_parser',
    name: 'RSS / Atom / XML Feed Parser',
    description: 'Extractor y normalizador de fuentes RSS 2.0, Atom y canales XML públicos estructurados.',
    inputSchema: { xmlContent: 'string' },
    outputSchema: { items: 'array', feedTitle: 'string' },
    permissions: ['LOCAL_COMPUTE'],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'llm_worker',
    name: 'Motor Cognitivo LLM (Gemini 2.5/Flash)',
    description: 'Procesamiento de lenguaje natural server-side para análisis, redacción técnica, traducción y desarrollo.',
    inputSchema: { prompt: 'string', systemInstruction: 'string?', responseFormat: 'string?' },
    outputSchema: { text: 'string', tokensUsed: 'number?' },
    permissions: ['AI_INFERENCE_SERVER'],
    cost: 0,
    risk: 'MEDIO',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'file_generator',
    name: 'Generador de Entregables en Disco',
    description: 'Escritura segura de resultados y entregables auditables en el directorio de evidencia.',
    inputSchema: { filename: 'string', content: 'string', mimeType: 'string' },
    outputSchema: { filePath: 'string', fileHash: 'string', sizeBytes: 'number' },
    permissions: ['FS_WRITE_EVIDENCE'],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'text_processor',
    name: 'Sanitizador y Procesador Textual',
    description: 'Limpieza HTML, decodificación de entidades, eliminación de scripts y normalización de textos.',
    inputSchema: { rawText: 'string' },
    outputSchema: { cleanText: 'string', wordCount: 'number' },
    permissions: ['LOCAL_COMPUTE'],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
  {
    id: 'evidence_recorder',
    name: 'Registrador Criptográfico de Evidencias',
    description: 'Cálculo de huella SHA-256, estampado de fecha atómica y preservación del snapshot de trabajo.',
    inputSchema: { taskId: 'string', content: 'string', meta: 'object' },
    outputSchema: { evidenceId: 'string', sha256: 'string', storedAt: 'string' },
    permissions: ['FS_WRITE_EVIDENCE'],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
];

const INITIAL_SOURCES: Source[] = [
  {
    id: 'weworkremotely-programming',
    name: 'WeWorkRemotely — Programación y Automatización',
    url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'programación',
    description: 'Feed público RSS de oportunidades de desarrollo de software, APIs y automatización remota.',
  },
  {
    id: 'weworkremotely-support',
    name: 'WeWorkRemotely — Soporte y Asistencia Digital',
    url: 'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'asistencia digital',
    description: 'Feed RSS público de asistencia digital, redacción técnica y soporte remoto.',
  },
  {
    id: 'remoteok-rss',
    name: 'RemoteOK — Feed Público RSS',
    url: 'https://remoteok.com/remote-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'desarrollo e investigación',
    description: 'Canal RSS público con oportunidades técnicas globales.',
  },
  {
    id: 'hn-jobs-rss',
    name: 'Hacker News Jobs Feed',
    url: 'https://hnrss.org/jobs',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'tecnología e investigación',
    description: 'Canal público en tiempo real con publicaciones técnicas de Hacker News.',
  },
  {
    id: 'jobicy-remote-json',
    name: 'Jobicy Public API — Trabajos Remotos Globales',
    url: 'https://jobicy.com/api/v2/remote-jobs?count=20',
    type: 'JSON',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'análisis y desarrollo',
    description: 'Endpoint JSON público gratuito para análisis de oportunidades digitales remotas.',
  },
];

const INITIAL_SUBAGENTS: SubAgent[] = [
  {
    id: 'subagent-research',
    name: 'Investigador Digital Especializado',
    specialty: 'RESEARCH',
    description: 'Agente secundario autónomo para síntesis profunda de literatura técnica, patentes y benchmarks.',
    status: 'UNPROVISIONED',
    capitalRequired: 50.0,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.15,
    infrastructureReady: false,
    authorizationGranted: false,
  },
  {
    id: 'subagent-content',
    name: 'Redactor y Documentador Técnico',
    specialty: 'CONTENT',
    description: 'Agente secundario dedicado a la creación masiva de manuales, artículos SEO y tutoriales verificados.',
    status: 'UNPROVISIONED',
    capitalRequired: 75.0,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.2,
    infrastructureReady: false,
    authorizationGranted: false,
  },
  {
    id: 'subagent-code',
    name: 'Ingeniero de Automatización & Scripts',
    specialty: 'AUTOMATION',
    description: 'Agente secundario para desarrollo de micro-servicios, pipelines de datos y comprobación de código.',
    status: 'UNPROVISIONED',
    capitalRequired: 120.0,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.35,
    infrastructureReady: false,
    authorizationGranted: false,
  },
  {
    id: 'subagent-supervisor',
    name: 'Supervisor de Calidad y Auditoría',
    specialty: 'SUPERVISOR',
    description: 'Auditor independiente para comprobar entregables de otros agentes antes del envío al cliente.',
    status: 'UNPROVISIONED',
    capitalRequired: 150.0,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.25,
    infrastructureReady: false,
    authorizationGranted: false,
  },
];

const INITIAL_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'ssrf-protection',
    name: 'Filtro Anti-SSRF y Aislamiento de Red Privada',
    description: 'Bloquea estrictamente peticiones hacia localhost (127.0.0.1, ::1), rangos privados RFC1918 (10.x, 192.168.x, 172.16-31.x) y metadatos de nube.',
    category: 'SSRF',
    enforced: true,
    blocksCount: 0,
  },
  {
    id: 'zero-fake-accounting',
    name: 'Principio de Realidad Financiera Invariable',
    description: 'El capital disponible solo aumenta mediante pagos en estado CONFIRMED con evidencia probatoria verificada.',
    category: 'FINANCIAL_GATE',
    enforced: true,
    blocksCount: 0,
  },
  {
    id: 'prompt-injection-shield',
    name: 'Escudo contra Prompt Injection en Fuentes Externas',
    description: 'Todo contenido externo se encapsula como datos no confiables y no puede sobreescribir instrucciones operativas del agente.',
    category: 'PROMPT_INJECTION',
    enforced: true,
    blocksCount: 0,
  },
  {
    id: 'no-illegal-bypass',
    name: 'Prohibición de Evasión Ilegal de Controles',
    description: 'El agente jamás intentará evadir CAPTCHAs, romper anti-bots ni suplantar identidades. Requiere intervención humana.',
    category: 'INPUT_VALIDATION',
    enforced: true,
    blocksCount: 0,
  },
];

export class Database {
  private static instance: Database;
  private state: DatabaseState;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureDirectories();
    this.state = this.loadOrCreate();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }
  }

  private getInitialState(): DatabaseState {
    return {
      version: 1,
      agent: {
        status: 'STOPPED',
        mode: 'PREPARE',
        cycleStep: 'IDLE',
        cycleCount: 0,
        lastActivity: new Date().toISOString(),
        schedulerActive: false,
      },
      sources: INITIAL_SOURCES,
      opportunities: [],
      tasks: [],
      capabilities: INITIAL_CAPABILITIES,
      tools: INITIAL_TOOLS,
      transactions: [],
      finances: {
        confirmedIncome: 0,
        pendingIncome: 0,
        confirmedExpense: 0,
        pendingExpense: 0,
        availableCapital: 0,
        reserve: 0,
        confirmedProfit: 0,
        currency: 'EUR',
        lastUpdated: new Date().toISOString(),
      },
      settings: {
        agentName: 'Agente Autónomo Alfa-1',
        agentMode: 'PREPARE',
        searchInterval: 120, // 2 minutes
        maxResultsPerSource: 10,
        maxTasksPerCycle: 2,
        maxConcurrentTasks: 1,
        maxDailyTasks: 10,
        financialLimits: {
          maxSpendPerTask: 0.0,
          maxDailySpend: 0.0,
          minReserve: 0.0,
          requireSpendAuthorization: true,
        },
        securityLevel: 'HIGH',
        autoPlanTasks: true,
        notifyOnCriticalOpportunity: true,
        notifyOnHumanRequired: true,
      },
      evidence: [],
      events: [
        {
          id: 'evt-init',
          timestamp: new Date().toISOString(),
          type: 'AGENT_STOPPED',
          severity: 'INFO',
          title: 'Sistema Inicializado',
          message: 'Base de datos y estado persistente montados correctamente. Principio de realidad activo: Capital 0.00 €.',
        },
      ],
      subAgents: INITIAL_SUBAGENTS,
      learning: [],
      securityRules: INITIAL_SECURITY_RULES,
    };
  }

  private loadOrCreate(): DatabaseState {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseState;
        return this.migrate(parsed);
      } catch (err) {
        console.error('[DB] Error loading database file. Initializing backup and fresh state.', err);
        const backupFile = `${DB_FILE}.corrupt.${Date.now()}.bak`;
        try {
          fs.copyFileSync(DB_FILE, backupFile);
        } catch (_) {}
      }
    }
    const fresh = this.getInitialState();
    this.saveImmediate(fresh);
    return fresh;
  }

  private migrate(state: DatabaseState): DatabaseState {
    let migrated = { ...state };
    if (!migrated.version) {
      migrated.version = 1;
    }
    // Ensure all required fields exist
    const initial = this.getInitialState();
    if (!migrated.sources || migrated.sources.length === 0) migrated.sources = initial.sources;
    if (!migrated.capabilities || migrated.capabilities.length === 0) migrated.capabilities = initial.capabilities;
    if (!migrated.tools || migrated.tools.length === 0) migrated.tools = initial.tools;
    if (!migrated.subAgents || migrated.subAgents.length === 0) migrated.subAgents = initial.subAgents;
    if (!migrated.securityRules || migrated.securityRules.length === 0) migrated.securityRules = initial.securityRules;
    if (!migrated.settings) migrated.settings = initial.settings;
    if (!migrated.events) migrated.events = [];
    if (!migrated.evidence) migrated.evidence = [];
    if (!migrated.tasks) migrated.tasks = [];
    if (!migrated.opportunities) migrated.opportunities = [];
    if (!migrated.learning) migrated.learning = [];

    // Principle of reality check: Re-calculate finances strictly from transactions
    this.recalculateFinances(migrated);
    return migrated;
  }

  private recalculateFinances(state: DatabaseState) {
    let confirmedIncome = 0;
    let pendingIncome = 0;
    let confirmedExpense = 0;
    let pendingExpense = 0;

    for (const tx of state.transactions || []) {
      if (tx.type === 'INCOME') {
        if (tx.status === 'CONFIRMED') confirmedIncome += tx.amount;
        else if (tx.status === 'PENDING') pendingIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        if (tx.status === 'CONFIRMED') confirmedExpense += tx.amount;
        else if (tx.status === 'PENDING') pendingExpense += tx.amount;
      }
    }

    const availableCapital = Math.max(0, confirmedIncome - confirmedExpense);
    const confirmedProfit = confirmedIncome - confirmedExpense;

    state.finances = {
      confirmedIncome: Number(confirmedIncome.toFixed(2)),
      pendingIncome: Number(pendingIncome.toFixed(2)),
      confirmedExpense: Number(confirmedExpense.toFixed(2)),
      pendingExpense: Number(pendingExpense.toFixed(2)),
      availableCapital: Number(availableCapital.toFixed(2)),
      reserve: Number(Math.min(availableCapital, state.settings?.financialLimits?.minReserve || 0).toFixed(2)),
      confirmedProfit: Number(confirmedProfit.toFixed(2)),
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.state);
    }, 150);
  }

  public saveImmediate(stateToSave: DatabaseState = this.state) {
    try {
      this.recalculateFinances(stateToSave);
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(stateToSave, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Critical error saving database:', err);
    }
  }

  public addEvent(event: Omit<AgentEvent, 'id' | 'timestamp'>): AgentEvent {
    const fullEvent: AgentEvent = {
      id: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.state.events.unshift(fullEvent);
    if (this.state.events.length > 500) {
      this.state.events = this.state.events.slice(0, 500);
    }
    this.state.agent.lastActivity = fullEvent.timestamp;
    this.save();
    return fullEvent;
  }

  public getEvidenceDir(): string {
    return EVIDENCE_DIR;
  }
}
