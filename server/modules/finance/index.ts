import crypto from 'crypto';
import {
  Transaction,
  FinancialSummary,
  FinancialLimits,
} from '../../../src/types/index.js';
import { Database } from '../../db/database.js';

export class FinanceManager {
  private static instance: FinanceManager;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): FinanceManager {
    if (!FinanceManager.instance) {
      FinanceManager.instance = new FinanceManager();
    }

    return FinanceManager.instance;
  }

  /**
   * Devuelve el estado financiero calculado a partir
   * únicamente de transacciones registradas.
   */
  public getSummary(): FinancialSummary {
    return this.db.getState().finances;
  }

  /**
   * Devuelve los límites financieros configurados.
   */
  public getLimits(): FinancialLimits {
    return this.db.getState().settings.financialLimits;
  }

  /**
   * Devuelve el historial de transacciones.
   */
  public getTransactions(): Transaction[] {
    return this.db.getState().transactions;
  }

  /**
   * Registra un ingreso real o pendiente.
   *
   * IMPORTANTE:
   * PENDING no aumenta el capital disponible.
   * Solo CONFIRMED representa dinero realmente recibido.
   */
  public registerIncome(params: {
    amount: number;
    description: string;
    category?: string;
    taskId?: string;
    status: 'PENDING' | 'CONFIRMED';
    evidenceReference?: string;
    notes?: string;
  }): Transaction {
    if (!Number.isFinite(params.amount)) {
      throw new Error('El importe del ingreso no es válido.');
    }

    if (params.amount <= 0) {
      throw new Error(
        'El importe de un ingreso debe ser superior a 0 €.'
      );
    }

    if (!params.description.trim()) {
      throw new Error(
        'La descripción del ingreso es obligatoria.'
      );
    }

    if (
      params.status === 'CONFIRMED' &&
      !params.evidenceReference?.trim()
    ) {
      throw new Error(
        'Un ingreso confirmado necesita una referencia de evidencia.'
      );
    }

    const now = new Date().toISOString();

    const tx: Transaction = {
      id: `tx-inc-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')}`,
      type: 'INCOME',
      status: params.status,
      amount: Number(params.amount.toFixed(2)),
      currency: 'EUR',
      category:
        params.category ||
        'Servicios Digitales Realizados',
      description: params.description.trim(),
      taskId: params.taskId,
      date: now,
      evidenceReference:
        params.evidenceReference,
      confirmedAt:
        params.status === 'CONFIRMED'
          ? now
          : undefined,
      notes: params.notes,
    };

    const state = this.db.getState();

    state.transactions.unshift(tx);

    if (params.taskId) {
      const task = state.tasks.find(
        (item) => item.id === params.taskId
      );

      if (task) {
        task.paymentStatus = params.status;

        if (params.status === 'CONFIRMED') {
          task.confirmedAmount = tx.amount;
        }
      }
    }

    this.db.addEvent({
      type:
        params.status === 'CONFIRMED'
          ? 'PAYMENT_CONFIRMED'
          : 'PAYMENT_PENDING',
      severity:
        params.status === 'CONFIRMED'
          ? 'SUCCESS'
          : 'INFO',
      title:
        params.status === 'CONFIRMED'
          ? 'Pago real confirmado'
          : 'Pago registrado como pendiente',
      message:
        params.status === 'CONFIRMED'
          ? `Ingreso confirmado: ${tx.amount} € — ${tx.description}.`
          : `Ingreso pendiente: ${tx.amount} € — ${tx.description}.`,
      metadata: {
        transactionId: tx.id,
        amount: tx.amount,
        status: tx.status,
      },
    });

    this.db.saveImmediate();

    return tx;
  }

  /**
   * Confirma un ingreso pendiente únicamente cuando
   * existe una referencia real de evidencia.
   */
  public confirmIncome(
    txId: string,
    proofReference: string
  ): Transaction {
    if (!proofReference.trim()) {
      throw new Error(
        'La confirmación necesita una referencia de evidencia real.'
      );
    }

    const state = this.db.getState();

    const tx = state.transactions.find(
      (item) => item.id === txId
    );

    if (!tx) {
      throw new Error(
        'Transacción no encontrada.'
      );
    }

    if (tx.type !== 'INCOME') {
      throw new Error(
        'Solo se pueden confirmar transacciones de ingreso.'
      );
    }

    if (tx.status === 'CONFIRMED') {
      throw new Error(
        'Este ingreso ya está confirmado.'
      );
    }

    const now = new Date().toISOString();

    tx.status = 'CONFIRMED';
    tx.confirmedAt = now;
    tx.evidenceReference =
      proofReference.trim();

    if (tx.taskId) {
      const task = state.tasks.find(
        (item) => item.id === tx.taskId
      );

      if (task) {
        task.paymentStatus = 'CONFIRMED';
        task.confirmedAmount = tx.amount;
        task.status = 'COMPLETED';
      }
    }

    this.db.addEvent({
      type: 'PAYMENT_CONFIRMED',
      severity: 'SUCCESS',
      title: 'Ingreso real confirmado',
      message:
        `Ingreso confirmado: +${tx.amount} € — ${tx.description}.`,
      metadata: {
        transactionId: tx.id,
        amount: tx.amount,
        evidenceReference:
          tx.evidenceReference,
      },
    });

    this.db.saveImmediate();

    return tx;
  }

  /**
   * Registra un gasto real.
   *
   * El agente nunca puede gastar dinero que no exista
   * en el capital confirmado disponible.
   */
  public registerExpense(params: {
    amount: number;
    description: string;
    category: string;
    authorizedByHuman?: boolean;
    notes?: string;
  }): Transaction {
    if (!Number.isFinite(params.amount)) {
      throw new Error(
        'El importe del gasto no es válido.'
      );
    }

    if (params.amount <= 0) {
      throw new Error(
        'El importe del gasto debe ser superior a 0 €.'
      );
    }

    if (!params.description.trim()) {
      throw new Error(
        'La descripción del gasto es obligatoria.'
      );
    }

    if (!params.category.trim()) {
      throw new Error(
        'La categoría del gasto es obligatoria.'
      );
    }

    const summary = this.getSummary();
    const limits = this.getLimits();

    const amount = Number(
      params.amount.toFixed(2)
    );

    /**
     * Regla fundamental:
     * nunca se puede gastar más capital confirmado
     * del que realmente existe.
     */
    if (amount > summary.availableCapital) {
      throw new Error(
        `[Control Financiero] Capital insuficiente. ` +
        `Gasto solicitado: ${amount} €. ` +
        `Capital confirmado disponible: ${summary.availableCapital} €.`
      );
    }

    /**
     * Respeta la reserva mínima configurada.
     */
    const remainingCapital =
      summary.availableCapital - amount;

    if (
      remainingCapital <
      limits.minReserve
    ) {
      throw new Error(
        `[Control Financiero] La operación dejaría ` +
        `${remainingCapital.toFixed(2)} € disponibles, ` +
        `por debajo de la reserva mínima de ` +
        `${limits.minReserve.toFixed(2)} €.`
      );
    }

    /**
     * Si la política exige autorización humana,
     * el agente no puede saltársela.
     */
    if (
      limits.requireSpendAuthorization &&
      !params.authorizedByHuman
    ) {
      throw new Error(
        '[Control Financiero] Este gasto requiere autorización humana previa.'
      );
    }

    const now = new Date().toISOString();

    const tx: Transaction = {
      id: `tx-exp-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')}`,
      type: 'EXPENSE',
      status: 'CONFIRMED',
      amount,
      currency: 'EUR',
      category: params.category.trim(),
      description: params.description.trim(),
      date: now,
      confirmedAt: now,
      notes: params.notes,
    };

    const state = this.db.getState();

    state.transactions.unshift(tx);

    this.db.addEvent({
      type: 'CAPITAL_UPDATED',
      severity: 'WARNING',
      title: 'Gasto real confirmado',
      message:
        `Egreso confirmado: -${tx.amount} € — ${tx.description}.`,
      metadata: {
        transactionId: tx.id,
        amount: tx.amount,
        remainingCapital:
          Number(
            (
              summary.availableCapital -
              tx.amount
            ).toFixed(2)
          ),
      },
    });

    this.db.saveImmediate();

    return tx;
  }
}
