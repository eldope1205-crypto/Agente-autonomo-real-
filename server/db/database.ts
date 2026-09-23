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

const DATA_DIR =
  path.resolve(
    process.cwd(),
    'data'
  );

const DB_FILE =
  path.join(
    DATA_DIR,
    'agent_database.json'
  );

const EVIDENCE_DIR =
  path.join(
    DATA_DIR,
    'evidence'
  );

const INITIAL_CAPABILITIES:
  Capability[] = [
  {
    id: 'WEB_RESEARCH',
    name: 'Investigación Web Pública',
    description:
      'Búsqueda, extracción y síntesis de información de fuentes públicas accesibles sin evasión de controles.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: [
      'http_fetcher',
      'text_processor',
      'llm_worker',
    ],
    cost: '0.00 €/consulta',
    requirements: [
      'Conectividad HTTP saliente',
      'Validación SSRF',
    ],
    limits:
      'Solo sitios públicos sin CAPTCHA ni autenticación requerida.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'TEXT_WRITING',
    name: 'Redacción y Redacción Técnica',
    description:
      'Generación de informes, artículos técnicos, síntesis analíticas y redacción profesional estructurada.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: [
      'llm_worker',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'Motor de procesamiento local',
    ],
    limits:
      'Generación digital verificable con evidencia registrada.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'TRANSLATION',
    name: 'Traducción Técnica Multilingüe',
    description:
      'Traducción y estructuración de textos entre distintos idiomas.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: [
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'Motor de procesamiento local',
    ],
    limits:
      'Documentos digitales procesables.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'TRANSCRIPTION',
    name: 'Transcripción de Texto y Normalización',
    description:
      'Limpieza, normalización y estructuración de transcripciones de texto existentes.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'text_processor',
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'Datos textuales accesibles',
    ],
    limits:
      'Procesamiento de texto estructurado.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'DATA_ANALYSIS',
    name: 'Análisis de Datos y Estadísticas',
    description:
      'Interpretación, clasificación y síntesis de datos estructurados.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: [
      'llm_worker',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'JSON o CSV estructurado',
    ],
    limits:
      'Conjuntos de datos accesibles.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'DATA_CLASSIFICATION',
    name: 'Clasificación y Etiquetado de Datos',
    description:
      'Clasificación temática, etiquetado y normalización de registros.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: [
      'llm_worker',
      'text_processor',
    ],
    cost: '0.00 €',
    requirements: [
      'Esquema de clasificación',
    ],
    limits:
      'Procesamiento por lotes auditables.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'CONTENT_GENERATION',
    name: 'Creación de Contenido Digital',
    description:
      'Creación de guías, documentación, artículos y contenido digital estructurado.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: [
      'llm_worker',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'Briefing o requisitos',
    ],
    limits:
      'Formatos Markdown, HTML, JSON y TXT.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'DOCUMENT_PROCESSING',
    name: 'Procesamiento y Conversión Documental',
    description:
      'Procesamiento, extracción y reestructuración de documentos digitales.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'text_processor',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'Archivos de texto',
    ],
    limits:
      'Formatos estándar sin OCR.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'CODE_GENERATION',
    name: 'Desarrollo y Revisión de Código',
    description:
      'Generación, revisión y estructuración de código TypeScript, JavaScript y Python.',
    status: 'AVAILABLE',
    level: 'PRODUCTION',
    requiredTools: [
      'llm_worker',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'Especificación técnica',
    ],
    limits:
      'Sin ejecución de código externo no autorizado.',
    requiresAuthorization: true,
    enabled: true,
  },

  {
    id: 'SEO_RESEARCH',
    name: 'Auditoría e Investigación SEO',
    description:
      'Análisis de contenido, estructura, metadatos e intención de búsqueda.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: [
      'http_fetcher',
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'URL pública o términos de búsqueda',
    ],
    limits:
      'Páginas públicas accesibles.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'PRODUCT_RESEARCH',
    name: 'Investigación de Productos y Mercado',
    description:
      'Comparación de productos, características y datos públicos.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'http_fetcher',
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'Parámetros de comparación',
    ],
    limits:
      'Información pública verificable.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'ECOMMERCE_RESEARCH',
    name: 'Análisis de Catálogo y Precios',
    description:
      'Análisis de catálogos públicos, precios y características de productos.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'http_fetcher',
      'text_processor',
    ],
    cost: '0.00 €',
    requirements: [
      'Feeds o páginas públicas',
    ],
    limits:
      'No interactúa con cuentas privadas ni pagos.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'CUSTOMER_SUPPORT_DRAFTING',
    name: 'Borradores de Respuestas de Asistencia',
    description:
      'Preparación de respuestas para consultas de clientes.',
    status: 'AVAILABLE',
    level: 'ADVANCED',
    requiredTools: [
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'Contexto del problema',
    ],
    limits:
      'Genera borradores; el envío externo requiere autorización.',
    requiresAuthorization: true,
    enabled: true,
  },

  {
    id: 'SOCIAL_CONTENT',
    name: 'Creación de Contenido Social',
    description:
      'Generación de publicaciones y contenido informativo para redes sociales.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'llm_worker',
    ],
    cost: '0.00 €',
    requirements: [
      'Tema o material de referencia',
    ],
    limits:
      'No publica automáticamente sin autorización.',
    requiresAuthorization: true,
    enabled: true,
  },

  {
    id: 'VIDEO_SCRIPTING',
    name: 'Guionización de Vídeos',
    description:
      'Creación de guiones estructurados para vídeos.',
    status: 'AVAILABLE',
    level: 'INTERMEDIATE',
    requiredTools: [
      'llm_worker',
      'file_generator',
    ],
    cost: '0.00 €',
    requirements: [
      'Objetivo y tema',
    ],
    limits:
      'Generación textual; no renderizado de vídeo.',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'WEB_AUTOMATION',
    name: 'Automatización Web Controlada',
    description:
      'Automatización de páginas públicas permitidas.',
    status: 'NEEDS_CONFIG',
    level: 'INTERMEDIATE',
    requiredTools: [
      'http_fetcher',
    ],
    cost: '0.00 €',
    requirements: [
      'Navegador o API autorizada',
    ],
    limits:
      'Sin CAPTCHA, anti-bot bypass, sesiones robadas ni evasión de controles.',
    requiresAuthorization: true,
    enabled: false,
  },
];

const INITIAL_TOOLS:
  Tool[] = [
  {
    id: 'http_fetcher',
    name: 'HTTP Safe Fetcher',
    description:
      'Cliente HTTP con validaciones de seguridad y límites de respuesta.',
    inputSchema: {
      url: 'string',
      method: 'string',
      headers: 'object?',
    },
    outputSchema: {
      status: 'number',
      body: 'string',
      headers: 'object',
      durationMs: 'number',
    },
    permissions: [
      'NET_CONNECT_PUBLIC',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'rss_parser',
    name: 'RSS / Atom / XML Feed Parser',
    description:
      'Parser de fuentes RSS, Atom y XML públicas.',
    inputSchema: {
      xmlContent: 'string',
    },
    outputSchema: {
      items: 'array',
      feedTitle: 'string',
    },
    permissions: [
      'LOCAL_COMPUTE',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'llm_worker',
    name: 'Motor de Procesamiento Local',
    description:
      'Motor local determinista para análisis, estructuración y preparación de trabajos digitales sin API externa de IA.',
    inputSchema: {
      prompt: 'string',
      systemInstruction: 'string?',
    },
    outputSchema: {
      text: 'string',
      modelUsed: 'string',
      isRealAi: 'boolean',
    },
    permissions: [
      'LOCAL_COMPUTE',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
    limits:
      'No utiliza Gemini ni servicios externos de IA.',
  },

  {
    id: 'file_generator',
    name: 'Generador de Entregables',
    description:
      'Escritura segura de entregables auditables en el directorio de evidencia.',
    inputSchema: {
      filename: 'string',
      content: 'string',
      mimeType: 'string',
    },
    outputSchema: {
      filePath: 'string',
      fileHash: 'string',
      sizeBytes: 'number',
    },
    permissions: [
      'FS_WRITE_EVIDENCE',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'text_processor',
    name: 'Sanitizador y Procesador Textual',
    description:
      'Limpieza HTML y normalización de texto.',
    inputSchema: {
      rawText: 'string',
    },
    outputSchema: {
      cleanText: 'string',
      wordCount: 'number',
    },
    permissions: [
      'LOCAL_COMPUTE',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },

  {
    id: 'evidence_recorder',
    name: 'Registrador Criptográfico de Evidencias',
    description:
      'Generación de hashes SHA-256 y conservación de evidencias.',
    inputSchema: {
      taskId: 'string',
      content: 'string',
      meta: 'object',
    },
    outputSchema: {
      evidenceId: 'string',
      sha256: 'string',
      storedAt: 'string',
    },
    permissions: [
      'FS_WRITE_EVIDENCE',
    ],
    cost: 0,
    risk: 'BAJO',
    requiresAuthorization: false,
    enabled: true,
  },
];

const INITIAL_SOURCES:
  Source[] = [
  {
    id: 'weworkremotely-programming',
    name:
      'WeWorkRemotely — Programación',
    url:
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'programación',
    description:
      'Feed RSS público de oportunidades remotas de programación.',
  },

  {
    id: 'weworkremotely-support',
    name:
      'WeWorkRemotely — Soporte',
    url:
      'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'asistencia digital',
    description:
      'Feed RSS público de oportunidades de soporte remoto.',
  },

  {
    id: 'remoteok-rss',
    name:
      'RemoteOK — Feed Público',
    url:
      'https://remoteok.com/remote-jobs.rss',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'desarrollo',
    description:
      'Feed RSS público de oportunidades remotas.',
  },

  {
    id: 'hn-jobs-rss',
    name:
      'Hacker News Jobs Feed',
    url:
      'https://hnrss.org/jobs',
    type: 'RSS',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'tecnología',
    description:
      'Feed público de oportunidades técnicas.',
  },

  {
    id: 'jobicy-remote-json',
    name:
      'Jobicy — Trabajos Remotos',
    url:
      'https://jobicy.com/api/v2/remote-jobs?count=20',
    type: 'JSON',
    enabled: true,
    lastChecked: null,
    status: 'UNCHECKED',
    errors: [],
    responseTime: null,
    opportunitiesFound: 0,
    category: 'trabajo remoto',
    description:
      'Endpoint JSON público de oportunidades remotas.',
  },
];

const INITIAL_SUBAGENTS:
  SubAgent[] = [
  {
    id: 'subagent-research',
    name:
      'Investigador Digital Especializado',
    specialty: 'RESEARCH',
    description:
      'Agente secundario para investigación y síntesis.',
    status: 'UNPROVISIONED',
    capitalRequired: 50,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.15,
    infrastructureReady: false,
    authorizationGranted: false,
  },

  {
    id: 'subagent-content',
    name:
      'Redactor y Documentador Técnico',
    specialty: 'CONTENT',
    description:
      'Agente secundario para documentación y contenido.',
    status: 'UNPROVISIONED',
    capitalRequired: 75,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.2,
    infrastructureReady: false,
    authorizationGranted: false,
  },

  {
    id: 'subagent-code',
    name:
      'Ingeniero de Automatización',
    specialty: 'AUTOMATION',
    description:
      'Agente secundario para automatización y scripts.',
    status: 'UNPROVISIONED',
    capitalRequired: 120,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.35,
    infrastructureReady: false,
    authorizationGranted: false,
  },

  {
    id: 'subagent-supervisor',
    name:
      'Supervisor de Calidad',
    specialty: 'SUPERVISOR',
    description:
      'Agente secundario para revisión y auditoría.',
    status: 'UNPROVISIONED',
    capitalRequired: 150,
    currency: 'EUR',
    tasksCompleted: 0,
    costPerHour: 0.25,
    infrastructureReady: false,
    authorizationGranted: false,
  },
];

const INITIAL_SECURITY_RULES:
  SecurityRule[] = [
  {
    id: 'ssrf-protection',
    name:
      'Filtro Anti-SSRF',
    description:
      'Bloquea destinos locales, privados o reservados.',
    category: 'SSRF',
    enforced: true,
    blocksCount: 0,
  },

  {
    id: 'zero-fake-accounting',
    name:
      'Principio de Realidad Financiera',
    description:
      'El capital confirmado solo procede de ingresos realmente confirmados.',
    category: 'FINANCIAL_GATE',
    enforced: true,
    blocksCount: 0,
  },

  {
    id: 'prompt-injection-shield',
    name:
      'Escudo contra Prompt Injection',
    description:
      'El contenido externo se considera datos no confiables.',
    category: 'PROMPT_INJECTION',
    enforced: true,
    blocksCount: 0,
  },

  {
    id: 'no-illegal-bypass',
    name:
      'Prohibición de Evasión de Controles',
    description:
      'No se evaden CAPTCHA, anti-bot ni sistemas de autenticación.',
    category: 'INPUT_VALIDATION',
    enforced: true,
    blocksCount: 0,
  },
];

export class Database {
  private static instance: Database;

  private state: DatabaseState;

  private saveTimeout:
    NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureDirectories();
    this.state =
      this.loadOrCreate();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance =
        new Database();
    }

    return Database.instance;
  }

  private ensureDirectories(): void {
    if (
      !fs.existsSync(DATA_DIR)
    ) {
      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true,
        }
      );
    }

    if (
      !fs.existsSync(EVIDENCE_DIR)
    ) {
      fs.mkdirSync(
        EVIDENCE_DIR,
        {
          recursive: true,
        }
      );
    }
  }

  private getInitialState():
    DatabaseState {
    return {
      version: 2,

      agent: {
        status: 'STOPPED',
        mode: 'PREPARE',
        cycleStep: 'IDLE',
        cycleCount: 0,
        lastActivity:
          new Date().toISOString(),
        schedulerActive: false,
      },

      sources:
        INITIAL_SOURCES,

      opportunities: [],

      tasks: [],

      capabilities:
        INITIAL_CAPABILITIES,

      tools:
        INITIAL_TOOLS,

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
        lastUpdated:
          new Date().toISOString(),
      },

      settings: {
        agentName:
          'Agente Autónomo Alfa-1',

        agentMode:
          'PREPARE',

        searchInterval:
          120,

        maxResultsPerSource:
          10,

        maxTasksPerCycle:
          2,

        maxConcurrentTasks:
          1,

        maxDailyTasks:
          10,

        financialLimits: {
          maxSpendPerTask: 0,
          maxDailySpend: 0,
          minReserve: 0,
          requireSpendAuthorization:
            true,
        },

        securityLevel:
          'HIGH',

        autoPlanTasks:
          true,

        notifyOnCriticalOpportunity:
          true,

        notifyOnHumanRequired:
          true,

        requireExecutionAuthorization:
          false,
      },

      evidence: [],

      events: [
        {
          id: 'evt-init',
          timestamp:
            new Date().toISOString(),
          type:
            'AGENT_STOPPED',
          severity:
            'INFO',
          title:
            'Sistema Inicializado',
          message:
            'Base de datos y estado persistente montados correctamente. Motor local activo. Capital confirmado: 0.00 €.',
        },
      ],

      subAgents:
        INITIAL_SUBAGENTS,

      learning: [],

      securityRules:
        INITIAL_SECURITY_RULES,
    };
  }

  private loadOrCreate():
    DatabaseState {
    if (
      fs.existsSync(DB_FILE)
    ) {
      try {
        const raw =
          fs.readFileSync(
            DB_FILE,
            'utf-8'
          );

        const parsed =
          JSON.parse(
            raw
          ) as DatabaseState;

        return this.migrate(
          parsed
        );
      } catch (err) {
        console.error(
          '[DB] Error cargando la base de datos. Se creará una copia de seguridad.'
        );

        const backupFile =
          `${DB_FILE}.corrupt.${Date.now()}.bak`;

        try {
          fs.copyFileSync(
            DB_FILE,
            backupFile
          );
        } catch (_) {}
      }
    }

    const fresh =
      this.getInitialState();

    this.saveImmediate(
      fresh
    );

    return fresh;
  }

  private migrate(
    state: DatabaseState
  ): DatabaseState {
    const initial =
      this.getInitialState();

    const migrated:
      DatabaseState = {
      ...initial,
      ...state,

      agent: {
        ...initial.agent,
        ...(state.agent || {}),
      },

      settings: {
        ...initial.settings,
        ...(state.settings || {}),
      },

      finances: {
        ...initial.finances,
        ...(state.finances || {}),
      },
    };

    if (
      !Array.isArray(
        migrated.sources
      )
    ) {
      migrated.sources =
        initial.sources;
    }

    if (
      !Array.isArray(
        migrated.capabilities
      )
    ) {
      migrated.capabilities =
        initial.capabilities;
    }

    if (
      !Array.isArray(
        migrated.tools
      )
    ) {
      migrated.tools =
        initial.tools;
    }

    if (
      !Array.isArray(
        migrated.subAgents
      )
    ) {
      migrated.subAgents =
        initial.subAgents;
    }

    if (
      !Array.isArray(
        migrated.securityRules
      )
    ) {
      migrated.securityRules =
        initial.securityRules;
    }

    if (
      !Array.isArray(
        migrated.events
      )
    ) {
      migrated.events = [];
    }

    if (
      !Array.isArray(
        migrated.evidence
      )
    ) {
      migrated.evidence = [];
    }

    if (
      !Array.isArray(
        migrated.tasks
      )
    ) {
      migrated.tasks = [];
    }

    if (
      !Array.isArray(
        migrated.opportunities
      )
    ) {
      migrated.opportunities =
        [];
    }

    if (
      !Array.isArray(
        migrated.transactions
      )
    ) {
      migrated.transactions =
        [];
    }

    if (
      !Array.isArray(
        migrated.learning
      )
    ) {
      migrated.learning = [];
    }

    migrated.version = 2;

    this.migrateTools(
      migrated
    );

    this.migrateSettings(
      migrated
    );

    this.recalculateFinances(
      migrated
    );

    return migrated;
  }

  private migrateTools(
    state: DatabaseState
  ): void {
    const localTool =
      state.tools.find(
        (tool) =>
          tool.id ===
          'llm_worker'
      );

    if (localTool) {
      localTool.name =
        'Motor de Procesamiento Local';

      localTool.description =
        'Motor local determinista para procesamiento y estructuración de tareas. No utiliza Gemini ni una API externa de IA.';

      localTool.permissions =
        ['LOCAL_COMPUTE'];

      localTool.cost = 0;

      localTool.risk =
        'BAJO';

      localTool.requiresAuthorization =
        false;

      localTool.enabled =
        true;

      localTool.outputSchema = {
        text: 'string',
        modelUsed: 'string',
        isRealAi: 'boolean',
      };

      localTool.limits =
        'No utiliza servicios externos de IA.';
    }
  }

  private migrateSettings(
    state: DatabaseState
  ): void {
    if (
      typeof state.settings.searchInterval !==
      'number'
    ) {
      state.settings.searchInterval =
        120;
    }

    if (
      typeof state.settings.maxTasksPerCycle !==
      'number'
    ) {
      state.settings.maxTasksPerCycle =
        2;
    }

    if (
      typeof state.settings.maxConcurrentTasks !==
      'number'
    ) {
      state.settings.maxConcurrentTasks =
        1;
    }

    if (
      typeof state.settings.maxDailyTasks !==
      'number'
    ) {
      state.settings.maxDailyTasks =
        10;
    }

    if (
      typeof state.settings.requireExecutionAuthorization !==
      'boolean'
    ) {
      state.settings.requireExecutionAuthorization =
        false;
    }
  }

  private recalculateFinances(
    state: DatabaseState
  ): void {
    let confirmedIncome = 0;
    let pendingIncome = 0;
    let confirmedExpense = 0;
    let pendingExpense = 0;

    for (
      const tx of
      state.transactions || []
    ) {
      if (
        tx.type ===
        'INCOME'
      ) {
        if (
          tx.status ===
          'CONFIRMED'
        ) {
          confirmedIncome +=
            tx.amount;
        } else if (
          tx.status ===
          'PENDING'
        ) {
          pendingIncome +=
            tx.amount;
        }
      }

      if (
        tx.type ===
        'EXPENSE'
      ) {
        if (
          tx.status ===
          'CONFIRMED'
        ) {
          confirmedExpense +=
            tx.amount;
        } else if (
          tx.status ===
          'PENDING'
        ) {
          pendingExpense +=
            tx.amount;
        }
      }
    }

    const availableCapital =
      Math.max(
        0,
        confirmedIncome -
          confirmedExpense
      );

    const confirmedProfit =
      confirmedIncome -
      confirmedExpense;

    const minimumReserve =
      state.settings
        ?.financialLimits
        ?.minReserve || 0;

    state.finances = {
      confirmedIncome:
        Number(
          confirmedIncome.toFixed(
            2
          )
        ),

      pendingIncome:
        Number(
          pendingIncome.toFixed(
            2
          )
        ),

      confirmedExpense:
        Number(
          confirmedExpense.toFixed(
            2
          )
        ),

      pendingExpense:
        Number(
          pendingExpense.toFixed(
            2
          )
        ),

      availableCapital:
        Number(
          availableCapital.toFixed(
            2
          )
        ),

      reserve:
        Number(
          Math.min(
            availableCapital,
            minimumReserve
          ).toFixed(2)
        ),

      confirmedProfit:
        Number(
          confirmedProfit.toFixed(
            2
          )
        ),

      currency:
        'EUR',

      lastUpdated:
        new Date().toISOString(),
    };
  }

  public getState():
    DatabaseState {
    return this.state;
  }

  public save(): void {
    if (
      this.saveTimeout
    ) {
      clearTimeout(
        this.saveTimeout
      );
    }

    this.saveTimeout =
      setTimeout(
        () => {
          this.saveImmediate(
            this.state
          );
        },
        150
      );
  }

  public saveImmediate(
    stateToSave:
      DatabaseState = this.state
  ): void {
    try {
      this.recalculateFinances(
        stateToSave
      );

      const tmpPath =
        `${DB_FILE}.tmp.${Date.now()}`;

      fs.writeFileSync(
        tmpPath,
        JSON.stringify(
          stateToSave,
          null,
          2
        ),
        'utf-8'
      );

      fs.renameSync(
        tmpPath,
        DB_FILE
      );
    } catch (err) {
      console.error(
        '[DB] Error crítico guardando la base de datos:',
        err
      );
    }
  }

  public addEvent(
    event: Omit<
      AgentEvent,
      'id' | 'timestamp'
    >
  ): AgentEvent {
    const fullEvent:
      AgentEvent = {
      id:
        `evt-${Date.now()}-${crypto
          .randomBytes(3)
          .toString('hex')}`,

      timestamp:
        new Date().toISOString(),

      ...event,
    };

    this.state.events.unshift(
      fullEvent
    );

    if (
      this.state.events.length >
      500
    ) {
      this.state.events =
        this.state.events.slice(
          0,
          500
        );
    }

    this.state.agent.lastActivity =
      fullEvent.timestamp;

    this.save();

    return fullEvent;
  }

  public getEvidenceDir():
    string {
    return EVIDENCE_DIR;
  }
}
