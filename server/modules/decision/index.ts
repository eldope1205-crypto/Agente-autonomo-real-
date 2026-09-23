import { Opportunity, OpportunityScoreBreakdown } from '../../../src/types/index.js';
import { Database } from '../../db/database.js';
import { ToolRegistry } from '../tools/index.js';

export class DecisionEngine {
  private static instance: DecisionEngine;
  private db: Database;
  private tools: ToolRegistry;

  private constructor() {
    this.db = Database.getInstance();
    this.tools = ToolRegistry.getInstance();
  }

  public static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  /**
   * Analyzes an opportunity against capabilities, reality constraints,
   * risk factors and execution feasibility.
   */
  public async analyzeOpportunity(opportunity: Opportunity): Promise<Opportunity> {
    const text = `${opportunity.title} ${opportunity.description} ${opportunity.requirements.join(' ')}`.toLowerCase();

    // 1. Check for hard disqualifiers (illegal, physical, unauthorized)
    const physicalDisqualifiers = [
      'físico',
      'presencial',
      'almacén',
      'conducir',
      'chofer',
      'limpieza',
      'repartidor',
      'camionero',
      'oficina física',
      'llamar por teléfono móvil físico',
    ];
    for (const word of physicalDisqualifiers) {
      if (text.includes(word)) {
        opportunity.status = 'REJECTED';
        opportunity.rejectionReason = `Requiere presencia o intervención física imposible para un agente digital: "${word}"`;
        opportunity.score = 0;
        opportunity.riskScore = 95;
        this.db.save();
        return opportunity;
      }
    }

    const illegalDisqualifiers = [
      'bypass captcha',
      'evadir antibot',
      'robar cuentas',
      'hack',
      'phishing',
      'spam masivo',
      'reseñas falsas',
      'fake reviews',
      'crear cuentas falsas',
      'scraping ilegal',
    ];
    for (const phrase of illegalDisqualifiers) {
      if (text.includes(phrase)) {
        opportunity.status = 'BLOCKED';
        opportunity.rejectionReason = `Actividad contraria a las directivas éticas y de seguridad: "${phrase}"`;
        opportunity.score = 0;
        opportunity.riskScore = 100;
        this.db.save();
        return opportunity;
      }
    }

    // 2. Multi-factor transparent scoring
    // Factor A: Capability Match (0 to 30 pts)
    const state = this.db.getState();
    const availableCapabilities = state.capabilities.filter((c) => c.status === 'AVAILABLE' && c.enabled);
    let matchedCapabilities = 0;
    for (const cap of availableCapabilities) {
      const capKeywords = cap.name.toLowerCase().split(/\s+/);
      const matched = capKeywords.some((k) => k.length > 4 && text.includes(k));
      if (matched) matchedCapabilities++;
    }
    const capabilityMatchScore = Math.min(30, Math.max(10, matchedCapabilities * 10));

    // Factor B: Automation Feasibility (0 to 25 pts)
    let automationFeasibilityScore = 18;
    const automationKeywords = ['api', 'script', 'código', 'redacción', 'análisis', 'json', 'documentación', 'traducción'];
    if (automationKeywords.some((w) => text.includes(w))) {
      automationFeasibilityScore = 25;
    }

    // Factor C: Remuneration & Economic Realism (0 to 15 pts)
    // High compensation is good, but absurdly high without verification raises risk
    let remunerationScore = 5;
    if (opportunity.estimatedAmount > 0 && opportunity.estimatedAmount <= 500) {
      remunerationScore = 12;
    } else if (opportunity.estimatedAmount > 500 && opportunity.estimatedAmount <= 3000) {
      remunerationScore = 15;
    } else if (opportunity.estimatedAmount > 3000) {
      // Very high bounty might be a full-time corporate hire
      remunerationScore = 8;
    }

    // Factor D: Source Reliability (0 to 15 pts)
    const source = state.sources.find((s) => s.id === opportunity.sourceId);
    let sourceReliabilityScore = 10;
    if (source && source.status === 'ACTIVE' && source.errors.length === 0) {
      sourceReliabilityScore = 15;
    } else if (source && source.errors.length > 2) {
      sourceReliabilityScore = 5;
    }

    // Factor E: Verification Feasibility (0 to 15 pts)
    // Deliverables like code, reports, markdown files are easily verifiable
    const timeFeasibilityScore = 12;

    // Penalties:
    // Risk penalty: lack of details, ambiguous scope
    let riskPenalty = 5;
    if (opportunity.description.length < 80) riskPenalty += 10;
    if (text.includes('urgent') || text.includes('urgente')) riskPenalty += 5;

    // Human intervention penalty
    let humanInterventionPenalty = 0;
    if (text.includes('entrevista') || text.includes('videollamada') || text.includes('zoom call')) {
      humanInterventionPenalty = 15;
    }

    const rawScore =
      capabilityMatchScore +
      automationFeasibilityScore +
      remunerationScore +
      sourceReliabilityScore +
      timeFeasibilityScore -
      riskPenalty -
      humanInterventionPenalty;

    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const riskScore = Math.min(100, Math.max(5, Math.round(riskPenalty * 3 + humanInterventionPenalty)));
    const automationScore = Math.min(100, Math.round((automationFeasibilityScore / 25) * 100));

    // Difficulty mapping
    let difficulty: 'BAJA' | 'MEDIA' | 'ALTA' | 'EXTREMA' = 'MEDIA';
    if (finalScore >= 75) difficulty = 'BAJA';
    else if (finalScore < 45) difficulty = 'ALTA';

    const breakdown: OpportunityScoreBreakdown = {
      capabilityMatchScore,
      automationFeasibilityScore,
      remunerationScore,
      sourceReliabilityScore,
      timeFeasibilityScore,
      difficultyScore: difficulty === 'BAJA' ? 85 : difficulty === 'MEDIA' ? 65 : 40,
      riskPenalty,
      humanInterventionPenalty,
    };

    opportunity.score = finalScore;
    opportunity.riskScore = riskScore;
    opportunity.automationScore = automationScore;
    opportunity.difficulty = difficulty;
    opportunity.estimatedTime = finalScore > 70 ? '1 - 2 horas' : '2 - 6 horas';
    opportunity.scoreBreakdown = breakdown;

    if (finalScore >= 50 && riskScore < 60) {
      opportunity.status = 'READY';
    } else {
      opportunity.status = 'REJECTED';
      opportunity.rejectionReason = `Puntuación insuficiente (${finalScore}/100) o riesgo elevado (${riskScore}/100)`;
    }

    this.db.save();
    return opportunity;
  }
}
