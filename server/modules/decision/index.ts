import {
  Opportunity,
  OpportunityScoreBreakdown,
} from '../../../src/types/index.js';
import { Database } from '../../db/database.js';

export class DecisionEngine {
  private static instance: DecisionEngine;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }

    return DecisionEngine.instance;
  }

  /**
   * Analiza una oportunidad utilizando únicamente
   * información disponible localmente.
   */
  public async analyzeOpportunity(
    opportunity: Opportunity
  ): Promise<Opportunity> {
    const state = this.db.getState();

    const text = [
      opportunity.title,
      opportunity.description,
      ...(opportunity.requirements || []),
      opportunity.category,
      opportunity.paymentText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    /*
     * 1. SEGURIDAD
     */

    const blockedPatterns = [
      'phishing',
      'robar cuentas',
      'robar cuenta',
      'malware',
      'ransomware',
      'ddos',
      'bypass captcha',
      'evadir captcha',
      'evadir antibot',
      'crear cuentas falsas',
      'cuentas falsas',
      'reseñas falsas',
      'fake reviews',
      'spam masivo',
      'credenciales robadas',
      'hackear',
      'hackeo',
      'robar datos',
      'fraude',
      'estafa',
      'lavado de dinero',
      'blanqueo de dinero',
    ];

    const blockedPattern = blockedPatterns.find(
      (pattern) => text.includes(pattern)
    );

    if (blockedPattern) {
      opportunity.status = 'BLOCKED';
      opportunity.score = 0;
      opportunity.riskScore = 100;
      opportunity.automationScore = 0;

      opportunity.rejectionReason =
        `Actividad no permitida detectada: "${blockedPattern}".`;

      this.db.save();

      return opportunity;
    }

    /*
     * 2. TRABAJO FÍSICO
     */

    const physicalPatterns = [
      'presencial',
      'almacén',
      'almacen',
      'conducir',
      'chofer',
      'repartidor',
      'camionero',
      'limpieza',
      'construcción',
      'construccion',
      'instalación física',
      'instalacion fisica',
      'trabajo físico',
      'trabajo fisico',
      'oficina física',
      'oficina fisica',
      'visita domiciliaria',
      'entrega física',
      'entrega fisica',
    ];

    const physicalPattern = physicalPatterns.find(
      (pattern) => text.includes(pattern)
    );

    if (physicalPattern) {
      opportunity.status = 'REJECTED';
      opportunity.score = 0;
      opportunity.riskScore = 90;
      opportunity.automationScore = 0;

      opportunity.rejectionReason =
        `Requiere presencia o trabajo físico: "${physicalPattern}".`;

      this.db.save();

      return opportunity;
    }

    /*
     * 3. CAPACIDADES DISPONIBLES
     */

    const capabilities =
      state.capabilities.filter(
        (capability) =>
          capability.enabled &&
          capability.status === 'AVAILABLE'
      );

    let capabilityMatches = 0;

    for (const capability of capabilities) {
      const words = capability.name
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 4);

      if (
        words.some((word) =>
          text.includes(word)
        )
      ) {
        capabilityMatches++;
      }
    }

    const capabilityMatchScore = Math.min(
      30,
      Math.max(
        5,
        capabilityMatches * 10
      )
    );

    /*
     * 4. AUTOMATIZACIÓN
     */

    const automationPatterns = [
      'api',
      'script',
      'programación',
      'programacion',
      'código',
      'codigo',
      'typescript',
      'javascript',
      'python',
      'json',
      'automatización',
      'automatizacion',
      'redacción',
      'redaccion',
      'contenido',
      'traducción',
      'traduccion',
      'seo',
      'análisis',
      'analisis',
      'datos',
      'documentación',
      'documentacion',
      'investigación',
      'investigacion',
      'wordpress',
      'excel',
      'csv',
      'markdown',
    ];

    const automationMatches =
      automationPatterns.filter(
        (pattern) => text.includes(pattern)
      ).length;

    const automationFeasibilityScore =
      automationMatches >= 3
        ? 25
        : automationMatches >= 1
          ? 20
          : 12;

    /*
     * 5. REMUNERACIÓN
     */

    let remunerationScore = 5;

    if (
      opportunity.estimatedAmount > 0 &&
      opportunity.estimatedAmount <= 100
    ) {
      remunerationScore = 8;
    } else if (
      opportunity.estimatedAmount > 100 &&
      opportunity.estimatedAmount <= 500
    ) {
      remunerationScore = 12;
    } else if (
      opportunity.estimatedAmount > 500 &&
      opportunity.estimatedAmount <= 3000
    ) {
      remunerationScore = 15;
    } else if (
      opportunity.estimatedAmount > 3000
    ) {
      remunerationScore = 8;
    }

    /*
     * 6. FIABILIDAD DE LA FUENTE
     */

    const source = state.sources.find(
      (item) =>
        item.id === opportunity.sourceId
    );

    let sourceReliabilityScore = 8;

    if (
      source &&
      source.enabled &&
      source.status === 'ACTIVE' &&
      source.errors.length === 0
    ) {
      sourceReliabilityScore = 15;
    } else if (
      source &&
      source.errors.length > 2
    ) {
      sourceReliabilityScore = 4;
    }

    /*
     * 7. CALIDAD DE LA INFORMACIÓN
     */

    let riskPenalty = 0;

    if (
      opportunity.description.length < 50
    ) {
      riskPenalty += 15;
    } else if (
      opportunity.description.length < 100
    ) {
      riskPenalty += 8;
    }

    if (
      opportunity.requirements.length === 0
    ) {
      riskPenalty += 5;
    }

    if (
      !opportunity.url ||
      !/^https?:\/\//i.test(opportunity.url)
    ) {
      riskPenalty += 15;
    }

    if (
      !opportunity.title ||
      opportunity.title.trim().length < 5
    ) {
      riskPenalty += 10;
    }

    /*
     * 8. INTERVENCIÓN HUMANA
     */

    let humanInterventionPenalty = 0;

    const humanPatterns = [
      'entrevista',
      'videollamada',
      'video llamada',
      'zoom call',
      'llamada telefónica',
      'llamada telefonica',
      'reunión presencial',
      'reunion presencial',
      'preséntate',
      'presentate',
    ];

    const requiresHuman = humanPatterns.some(
      (pattern) => text.includes(pattern)
    );

    if (requiresHuman) {
      humanInterventionPenalty = 20;
    }

    /*
     * 9. VERIFICABILIDAD
     */

    const verificationPatterns = [
      'código',
      'codigo',
      'script',
      'documento',
      'informe',
      'contenido',
      'csv',
      'json',
      'excel',
      'traducción',
      'traduccion',
      'texto',
      'seo',
      'análisis',
      'analisis',
    ];

    const verifiable =
      verificationPatterns.some(
        (pattern) => text.includes(pattern)
      );

    const timeFeasibilityScore =
      verifiable ? 15 : 10;

    /*
     * 10. CÁLCULO FINAL
     */

    const rawScore =
      capabilityMatchScore +
      automationFeasibilityScore +
      remunerationScore +
      sourceReliabilityScore +
      timeFeasibilityScore -
      riskPenalty -
      humanInterventionPenalty;

    const finalScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(rawScore)
      )
    );

    const riskScore = Math.max(
      5,
      Math.min(
        100,
        Math.round(
          riskPenalty * 3 +
          humanInterventionPenalty
        )
      )
    );

    const automationScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (automationFeasibilityScore / 25) *
            100
        )
      )
    );

    /*
     * 11. DIFICULTAD
     */

    let difficulty:
      | 'BAJA'
      | 'MEDIA'
      | 'ALTA'
      | 'EXTREMA' = 'MEDIA';

    if (
      finalScore >= 80 &&
      riskScore < 30
    ) {
      difficulty = 'BAJA';
    } else if (
      finalScore < 45 ||
      riskScore >= 70
    ) {
      difficulty = 'ALTA';
    }

    if (
      finalScore < 25 ||
      riskScore >= 90
    ) {
      difficulty = 'EXTREMA';
    }

    /*
     * 12. DESGLOSE
     */

    const breakdown: OpportunityScoreBreakdown = {
      capabilityMatchScore,
      automationFeasibilityScore,
      remunerationScore,
      sourceReliabilityScore,
      timeFeasibilityScore,
      difficultyScore:
        difficulty === 'BAJA'
          ? 85
          : difficulty === 'MEDIA'
            ? 65
            : difficulty === 'ALTA'
              ? 40
              : 20,
      riskPenalty,
      humanInterventionPenalty,
    };

    /*
     * 13. GUARDAR RESULTADO
     */

    opportunity.score = finalScore;
    opportunity.riskScore = riskScore;
    opportunity.automationScore =
      automationScore;

    opportunity.difficulty = difficulty;

    opportunity.estimatedTime =
      finalScore >= 75
        ? '1 - 2 horas'
        : finalScore >= 55
          ? '2 - 4 horas'
          : '4 - 8 horas';

    opportunity.scoreBreakdown =
      breakdown;

    /*
     * 14. DECISIÓN
     *
     * READY significa que el agente considera
     * que merece pasar a planificación.
     *
     * No significa que el trabajo ya esté aceptado
     * por un cliente ni que exista un pago.
     */

    if (
      finalScore >= 55 &&
      riskScore < 60 &&
      automationScore >= 60
    ) {
      opportunity.status = 'READY';
      opportunity.rejectionReason = undefined;
    } else {
      opportunity.status = 'REJECTED';

      opportunity.rejectionReason =
        `No supera los controles automáticos. ` +
        `Puntuación ${finalScore}/100, ` +
        `riesgo ${riskScore}/100, ` +
        `automatización ${automationScore}/100.`;
    }

    /*
     * 15. REGISTRAR EVENTO
     */

    this.db.addEvent({
      type: 'OPPORTUNITY_ANALYZED',
      severity:
        opportunity.status === 'READY'
          ? 'SUCCESS'
          : 'INFO',
      title:
        opportunity.status === 'READY'
          ? 'Oportunidad aceptada para planificación'
          : 'Oportunidad descartada',
      message:
        `"${opportunity.title.substring(
          0,
          80
        )}" → ${opportunity.status}. ` +
        `Puntuación: ${finalScore}/100.`,
      metadata: {
        opportunityId: opportunity.id,
        score: finalScore,
        riskScore,
        automationScore,
        difficulty,
      },
    });

    this.db.save();

    return opportunity;
  }
}
