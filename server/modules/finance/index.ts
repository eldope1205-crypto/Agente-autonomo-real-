import crypto from 'crypto';
import { Transaction, FinancialSummary, FinancialLimits } from '../../../src/types/index.js';
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

  public getSummary(): FinancialSummary {
    return this.db.getState().finances;
  }

  public getLimits(): FinancialLimits {
    return this.db.getState().settings.financialLimits;
  }

  public getTransactions(): Transaction[] {
    return this.db.getState().transactions;
  }

  /**
   * Registers a payment or pending income associated with a task or direct invoice
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
    if (params.amount < 0) {
      throw new Error('El importe de un ingreso no puede ser negativo.');
    }

    const tx: Transaction = {
      id: `tx-inc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'INCOME',
      status: params.status,
      amount: Number(params.amount.toFixed(2)),
      currency: 'EUR',
      category: params.category || 'Servicios Digitales Realizados',
      description: params.description,
      taskId: params.taskId,
      date: new Date().toISOString(),
      evidenceReference: params.evidenceReference,
      confirmedAt: params.status === 'CONFIRMED' ? new Date().toISOString() : undefined,
      notes: params.notes,
    };

    const state = this.db.getState();
    state.transactions.unshift(tx);

    if (params.taskId) {
      const task = state.tasks.find((t) => t.id === params.taskId);
      if (task) {
        task.paymentStatus = params.status;
        if (params.status === 'CONFIRMED') {
          task.confirmedAmount = tx.amount;
        }
      }
    }

    this.db.addEvent({
      type: params.status === 'CONFIRMED' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING',
      severity: params.status === 'CONFIRMED' ? 'SUCCESS' : 'INFO',
      title: params.status === 'CONFIRMED' ? 'Pago Real Confirmado' : 'Pago Registrado como Pendiente',
      message: `${params.description}: ${tx.amount} € (${params.status}).`,
      metadata: { transactionId: tx.id, amount: tx.amount },
    });

    this.db.saveImmediate();
    return tx;
  }

  /**
   * Confirms a previously pending income transaction with real proof of payment
   */
  public confirmIncome(txId: string, proofReference: string): Transaction {
    const state = this.db.getState();
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx) throw new Error('Transacción no encontrada.');
    if (tx.type !== 'INCOME') throw new Error('Solo se pueden confirmar ingresos.');

    tx.status = 'CONFIRMED';
    tx.confirmedAt = new Date().toISOString();
    tx.evidenceReference = proofReference;

    if (tx.taskId) {
      const task = state.tasks.find((t) => t.id === tx.taskId);
      if (task) {
        task.paymentStatus = 'CONFIRMED';
        task.confirmedAmount = tx.amount;
        task.status = 'COMPLETED';
      }
    }

    this.db.addEvent({
      type: 'PAYMENT_CONFIRMED',
      severity: 'SUCCESS',
      title: 'Ingreso Verificado y Confirmado',
      message: `Fondos liberados para capital disponible: +${tx.amount} €. Evidencia: ${proofReference}`,
      metadata: { transactionId: tx.id, amount: tx.amount },
    });

    this.db.saveImmediate();
    return tx;
  }

  /**
   * Requests or registers an expense with capital gatekeeper validation
   */
  public registerExpense(params: {
    amount: number;
    description: string;
    category: string;
    authorizedByHuman?: boolean;
    notes?: string;
  }): Transaction {
    const summary = this.getSummary();
    const limits = this.getLimits();

    if (params.amount <= 0) {
      throw new Error('El importe del gasto debe ser superior a 0 €.');
    }

    // Strict Capital Reality Rule: Cannot spend money that doesn't exist
    if (params.amount > summary.availableCapital) {
      throw new Error(
        `[Control Financiero] Capital insuficiente. Se intentó gastar ${params.amount} € pero el capital confirmado disponible es ${summary.availableCapital} €.`
      );
    }

    // Check reserve limit
    if (summary.availableCapital - params.amount < limits.minReserve) {
      throw new Error(
        `[Control Financiero] La operación vulnera el límite de reserva mínima de ${limits.minReserve} €.`
      );
    }

    // Check human authorization rule
    if (limits.requireSpendAuthorization && !params.authorizedByHuman) {
      throw new Error(
        '[Control Financiero] Política de seguridad activa: todo gasto requiere autorización humana previa.'
      );
    }

    const tx: Transaction = {
      id: `tx-exp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'EXPENSE',
      status: 'CONFIRMED',
      amount: Number(params.amount.toFixed(2)),
      currency: 'EUR',
      category: params.category,
      description: params.description,
      date: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      notes: params.notes,
    };

    this.db.getState().transactions.unshift(tx);
    this.db.addEvent({
      type: 'CAPITAL_UPDATED',
      severity: 'WARNING',
      title: 'Gasto Real Confirmado',
      message: `Egreso de capital confirmado: -${tx.amount} € (${params.description}).`,
      metadata: { transactionId: tx.id, amount: tx.amount },
    });

    this.db.saveImmediate();
    return tx;
  }
}
