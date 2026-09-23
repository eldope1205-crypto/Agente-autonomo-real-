export type AgentStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSED'
  | 'WAITING_AUTHORIZATION'
  | 'WAITING_HUMAN'
  | 'ERROR'
  | 'STOPPING';

export type AgentMode =
  | 'OBSERVE'
  | 'PREPARE'
  | 'AUTHORIZED';

export type CycleStep =
  | 'IDLE'
  | 'DISCOVER'
  | 'ANALYZE'
  | 'DECIDE'
  | 'PLAN'
  | 'EXECUTE'
  | 'VERIFY'
  | 'SUBMIT'
  | 'WAIT_PAYMENT'
  | 'CONFIRM_PAYMENT'
  | 'ACCOUNT'
  | 'LEARN'
  | 'REPEAT';

export type OpportunityStatus =
  | 'NEW'
  | 'ANALYZED'
  | 'REJECTED'
  | 'READY'
  | 'PLANNED'
  | 'BLOCKED'
  | 'COMPLETED';

export type TaskStatus =
  | 'DISCOVERED'
  | 'ANALYZED'
  | 'READY'
  | 'AUTHORIZED'
  | 'RUNNING'
  | 'SUBMITTED'
  | 'WAITING_VERIFICATION'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'NEEDS_HUMAN';

export type SourceType =
  | 'RSS'
  | 'ATOM'
  | 'XML'
  | 'JSON'
  | 'HTML'
  | 'SITEMAP';

export type SourceStatus =
  | 'ACTIVE'
  | 'ERROR'
  | 'DISABLED'
  | 'UNCHECKED';

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  enabled: boolean;
  lastChecked: string | null;
  status: SourceStatus;
  errors: string[];
  responseTime: number | null;
  opportunitiesFound: number;
  category: string;
  description?: string;
}

export interface OpportunityScoreBreakdown {
  remunerationScore: number;
  difficultyScore: number;
  timeFeasibilityScore: number;
  riskPenalty: number;
  automationFeasibilityScore: number;
  sourceReliabilityScore: number;
  capabilityMatchScore: number;
  humanInterventionPenalty: number;
  rejectionReason?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceId: string;
  description: string;
  category: string;
  requirements: string[];
  paymentText: string;
  estimatedAmount: number;
  currency: string;
  score: number;
  riskScore: number;
  automationScore: number;
  difficulty:
    | 'BAJA'
    | 'MEDIA'
    | 'ALTA'
    | 'EXTREMA';
  estimatedTime: string;
  detectedAt: string;
  status: OpportunityStatus;
  rawData?: Record<string, any>;
  scoreBreakdown?: OpportunityScoreBreakdown;
  evidence?: string[];
  rejectionReason?: string;
}

export interface PlanStep {
  stepNumber: number;
  title: string;
  description: string;
  requiredTool: string;
  capability: string;
  status:
    | 'PENDING'
    | 'RUNNING'
    | 'COMPLETED'
    | 'FAILED'
    | 'SKIPPED';
  output?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TaskHumanRequirement {
  needed: boolean;
  reason?: string;
  whatUserMustDo?: string;
  whatHappensNext?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  notes?: string;
}

export interface Task {
  id: string;
  opportunityId: string;
  opportunityUrl?: string;
  title: string;
  description: string;
  plan: PlanStep[];
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  error?: string;
  evidence: string[];

  paymentStatus:
    | 'NONE'
    | 'PENDING'
    | 'CONFIRMED'
    | 'REJECTED';

  estimatedAmount: number;
  confirmedAmount: number;
  currency: string;

  humanRequirement?: TaskHumanRequirement;

  deliverableFile?: string;
  deliverablePreview?: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;

  status:
    | 'AVAILABLE'
    | 'NEEDS_CONFIG'
    | 'UNAVAILABLE';

  level:
    | 'BASIC'
    | 'INTERMEDIATE'
    | 'ADVANCED'
    | 'PRODUCTION';

  requiredTools: string[];
  cost: string;
  requirements: string[];
  limits: string;
  requiresAuthorization: boolean;
  enabled: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  permissions: string[];
  cost: number;

  risk:
    | 'BAJO'
    | 'MEDIO'
    | 'ALTO';

  requiresAuthorization: boolean;
  enabled: boolean;
  limits?: string;
}

export interface Transaction {
  id: string;

  type:
    | 'INCOME'
    | 'EXPENSE';

  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED';

  amount: number;
  currency: string;
  category: string;
  description: string;
  taskId?: string;
  date: string;
  evidenceReference?: string;
  confirmedAt?: string;
  notes?: string;
}

export interface FinancialSummary {
  confirmedIncome: number;
  pendingIncome: number;
  confirmedExpense: number;
  pendingExpense: number;
  availableCapital: number;
  reserve: number;
  confirmedProfit: number;
  currency: string;
  lastUpdated: string;
  currentBalance?: number;
}

export interface FinancialLimits {
  maxSpendPerTask: number;
  maxDailySpend: number;
  minReserve: number;
  requireSpendAuthorization: boolean;
}

export interface EvidenceItem {
  id: string;
  taskId?: string;
  opportunityId?: string;
  title: string;
  url?: string;
  timestamp: string;
  contentSnapshot?: string;
  fileHash: string;
  filePath?: string;
  fileType: string;
  fileSize: number;

  verificationStatus:
    | 'VERIFIED'
    | 'UNVERIFIED'
    | 'REJECTED';

  notes?: string;
}

export interface AgentEvent {
  id: string;
  timestamp: string;

  type:
    | 'AGENT_STARTED'
    | 'AGENT_STOPPED'
    | 'AGENT_PAUSED'
    | 'AGENT_RESUMED'
    | 'SOURCE_CHECKED'
    | 'SOURCE_ERROR'
    | 'OPPORTUNITY_DISCOVERED'
    | 'OPPORTUNITY_ANALYZED'
    | 'TASK_CREATED'
    | 'TASK_AUTHORIZED'
    | 'TASK_STARTED'
    | 'TASK_COMPLETED'
    | 'TASK_FAILED'
    | 'PAYMENT_PENDING'
    | 'PAYMENT_CONFIRMED'
    | 'CAPITAL_UPDATED'
    | 'SECURITY_BLOCK'
    | 'HUMAN_ACTION_REQUIRED'
    | 'HUMAN_ACTION_RESOLVED'
    | 'LEARNING_UPDATE';

  severity:
    | 'INFO'
    | 'SUCCESS'
    | 'WARNING'
    | 'ERROR';

  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SubAgent {
  id: string;
  name: string;

  specialty:
    | 'RESEARCH'
    | 'CONTENT'
    | 'DATA_ANALYSIS'
    | 'AUTOMATION'
    | 'SUPERVISOR';

  description: string;

  status:
    | 'UNPROVISIONED'
    | 'IDLE'
    | 'ACTIVE'
    | 'DISABLED';

  capitalRequired: number;
  currency: string;
  tasksCompleted: number;
  costPerHour: number;
  infrastructureReady: boolean;
  authorizationGranted: boolean;
  role?: string;
  purpose?: string;
  capabilities?: string[];
}

export interface LearningInsight {
  id: string;
  createdAt: string;

  category:
    | 'SOURCES'
    | 'OPPORTUNITIES'
    | 'TASKS'
    | 'FINANCE'
    | 'SECURITY';

  observation: string;

  metrics: {
    totalOpportunitiesEvaluated: number;
    acceptanceRate: number;
    tasksSuccessRate: number;
    avgExecutionSeconds: number;
  };

  proposals: string[];

  appliedStatus:
    | 'PROPOSED'
    | 'APPLIED'
    | 'REJECTED';
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;

  category:
    | 'SSRF'
    | 'INPUT_VALIDATION'
    | 'PROMPT_INJECTION'
    | 'OUTPUT_INTEGRITY'
    | 'FINANCIAL_GATE';

  enforced: boolean;
  blocksCount: number;
  lastBlocked?: string;
  severity?: string;
  rule?: string;
}

export interface AppSettings {
  agentName: string;
  agentMode: AgentMode;

  searchInterval: number;

  maxResultsPerSource: number;
  maxTasksPerCycle: number;
  maxConcurrentTasks: number;
  maxDailyTasks: number;

  financialLimits: FinancialLimits;

  securityLevel:
    | 'STANDARD'
    | 'HIGH'
    | 'MAXIMUM';

  autoPlanTasks: boolean;
  notifyOnCriticalOpportunity: boolean;
  notifyOnHumanRequired: boolean;

  requireExecutionAuthorization?: boolean;
}

export interface SystemStatus {
  agentStatus: AgentStatus;
  currentMode: AgentMode;
  currentCycleStep: CycleStep;

  cycleCount: number;
  lastActivity: string;
  schedulerActive: boolean;

  opportunitiesCount: {
    total: number;
    new: number;
    ready: number;
    completed: number;
    rejected: number;
    blocked: number;
  };

  tasksCount: {
    total: number;
    ready: number;
    running: number;
    completed: number;
    needsHuman: number;
    blocked: number;
    failed: number;
  };

  activeSourcesCount: number;
  totalSourcesCount: number;

  finances: FinancialSummary;

  recentErrorsCount: number;

  localEngineAvailable: boolean;
}
