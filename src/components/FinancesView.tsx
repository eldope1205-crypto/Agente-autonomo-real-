import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  FinancialSummary,
  Transaction,
  FinancialLimits,
} from '../types/index.js';

interface FinancesViewProps {
  finances: {
    summary: FinancialSummary;
    transactions: Transaction[];
    limits: FinancialLimits;
  } | null;
  onRegisterIncome: (data: any) => Promise<void>;
  onConfirmIncome: (txId: string, proof: string) => Promise<void>;
  onRegisterExpense: (data: any) => Promise<void>;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  finances,
  onRegisterIncome,
  onConfirmIncome,
  onRegisterExpense,
}) => {
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [confirmTx, setConfirmTx] = useState<Transaction | null>(null);

  const [proofInput, setProofInput] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [filterType, setFilterType] = useState<string>('ALL');

  // Income form
  const [incAmount, setIncAmount] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incStatus, setIncStatus] =
    useState<'PENDING' | 'CONFIRMED'>('PENDING');
  const [incProof, setIncProof] = useState('');
  const [incomeError, setIncomeError] = useState('');

  // Expense form
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] =
    useState('Infraestructura');
  const [expenseError, setExpenseError] = useState('');

  const summary = finances?.summary;

  const transactions = finances?.transactions || [];

  const filteredTx = transactions.filter((tx) => {
    switch (filterType) {
      case 'INCOME':
        return tx.type === 'INCOME';

      case 'EXPENSE':
        return tx.type === 'EXPENSE';

      case 'CONFIRMED':
        return tx.status === 'CONFIRMED';

      case 'PENDING':
        return tx.status === 'PENDING';

      default:
        return true;
    }
  });

  const formatAmount = (value?: number) => {
    if (!Number.isFinite(value)) {
      return '0.00';
    }

    return value!.toFixed(2);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return date.toLocaleDateString();
  };

  const handleIncomeSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    setIncomeError('');

    const amount = Number(incAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setIncomeError('El importe debe ser mayor que 0.');
      return;
    }

    if (!incDesc.trim()) {
      setIncomeError('Introduce una descripción del ingreso.');
      return;
    }

    if (incStatus === 'CONFIRMED' && !incProof.trim()) {
      setIncomeError(
        'Un ingreso confirmado necesita una referencia o comprobante.',
      );
      return;
    }

    try {
      await onRegisterIncome({
        amount,
        description: incDesc.trim(),
        status: incStatus,
        evidenceReference:
          incProof.trim() || undefined,
      });

      setShowIncomeModal(false);
      setIncAmount('');
      setIncDesc('');
      setIncStatus('PENDING');
      setIncProof('');
    } catch (error: any) {
      setIncomeError(
        error?.message || 'Error al registrar el ingreso.',
      );
    }
  };

  const handleExpenseSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    setExpenseError('');

    const amount = Number(expAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError('El importe debe ser mayor que 0.');
      return;
    }

    if (!expDesc.trim()) {
      setExpenseError('Introduce una descripción del gasto.');
      return;
    }

    if (!expCategory.trim()) {
      setExpenseError('Selecciona una categoría.');
      return;
    }

    try {
      await onRegisterExpense({
        amount,
        description: expDesc.trim(),
        category: expCategory,
      });

      setShowExpenseModal(false);
      setExpAmount('');
      setExpDesc('');
      setExpCategory('Infraestructura');
    } catch (error: any) {
      setExpenseError(
        error?.message || 'Error al registrar el gasto.',
      );
    }
  };

  const handleConfirmSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!confirmTx) {
      return;
    }

    const proof = proofInput.trim();

    if (!proof) {
      setConfirmError(
        'Introduce una referencia o comprobante real.',
      );
      return;
    }

    try {
      setConfirmError('');

      await onConfirmIncome(confirmTx.id, proof);

      setConfirmTx(null);
      setProofInput('');
    } catch (error: any) {
      setConfirmError(
        error?.message || 'Error al confirmar el pago.',
      );
    }
  };

  const openIncomeModal = () => {
    setIncomeError('');
    setShowIncomeModal(true);
  };

  const openExpenseModal = () => {
    setExpenseError('');
    setShowExpenseModal(true);
  };

  const closeIncomeModal = () => {
    setShowIncomeModal(false);
    setIncomeError('');
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setExpenseError('');
  };

  const closeConfirmModal = () => {
    setConfirmTx(null);
    setProofInput('');
    setConfirmError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />

            <h2 className="text-base font-bold text-white tracking-tight">
              Libro Mayor de Contabilidad Real
            </h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Solo los ingresos realmente confirmados forman parte
            del capital disponible del agente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openIncomeModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            Registrar Ingreso
          </button>

          <button
            onClick={openExpenseModal}
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confirmed Income */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ingresos Confirmados</span>

            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatAmount(summary?.confirmedIncome)} €
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Pendiente de cobro:{' '}
            <span className="text-amber-400 font-mono font-medium">
              {formatAmount(summary?.pendingIncome)} €
            </span>
          </div>
        </div>

        {/* Confirmed Expenses */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Gastos Confirmados</span>

            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>

          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatAmount(summary?.confirmedExpense)} €
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Gastos pendientes:{' '}
            <span className="font-mono">
              {formatAmount(summary?.pendingExpense)} €
            </span>
          </div>
        </div>

        {/* Available Capital */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Capital Real Disponible</span>

            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="text-2xl font-black text-white font-mono">
            {formatAmount(summary?.availableCapital)} €
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Reserva obligatoria:{' '}
            <span className="font-mono">
              {formatAmount(summary?.reserve)} €
            </span>
          </div>
        </div>

        {/* Profit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Beneficio Neto Real</span>

            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="text-2xl font-black text-indigo-400 font-mono">
            {formatAmount(summary?.confirmedProfit)} €
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Ingresos confirmados − gastos confirmados
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Registro de Transacciones ({transactions.length})
          </h3>

          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs overflow-x-auto">
            {[
              'ALL',
              'CONFIRMED',
              'PENDING',
              'INCOME',
              'EXPENSE',
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-semibold whitespace-nowrap ${
                  filterType === filter
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'ALL'
                  ? 'Todas'
                  : filter === 'CONFIRMED'
                    ? 'Confirmadas'
                    : filter === 'PENDING'
                      ? 'Pendientes'
                      : filter === 'INCOME'
                        ? 'Ingresos'
                        : 'Gastos'}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No hay transacciones registradas en este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 pl-2">Fecha</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Descripción</th>
                  <th className="pb-3">Importe</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">
                    Evidencia / Comprobante
                  </th>
                  <th className="pb-3 text-right pr-2">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredTx.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3 pl-2 font-mono text-slate-400 text-[11px]">
                      {formatDate(tx.date)}
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME'
                          ? 'INGRESO'
                          : 'GASTO'}
                      </span>
                    </td>

                    <td className="py-3 font-medium text-white max-w-xs">
                      <span className="block truncate">
                        {tx.description}
                      </span>
                    </td>

                    <td className="py-3 font-mono font-bold text-sm">
                      <span
                        className={
                          tx.type === 'INCOME'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatAmount(tx.amount)} €
                      </span>
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {tx.status === 'CONFIRMED'
                          ? 'CONFIRMADO'
                          : 'PENDIENTE'}
                      </span>
                    </td>

                    <td className="py-3 font-mono text-slate-400 text-[11px] max-w-[180px]">
                      <span className="block truncate">
                        {tx.evidenceReference || '—'}
                      </span>
                    </td>

                    <td className="py-3 text-right pr-2">
                      {tx.type === 'INCOME' &&
                        tx.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setConfirmError('');
                              setProofInput('');
                              setConfirmTx(tx);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                          >
                            Confirmar Pago
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Income Modal */}
      {confirmTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeConfirmModal}
        >
          <form
            onSubmit={handleConfirmSubmit}
            onClick={(event) => event.stopPropagation()}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Confirmar Pago Real
              </h3>

              <button
                type="button"
                onClick={closeConfirmModal}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              El importe de{' '}
              <strong className="text-emerald-400 font-mono">
                {formatAmount(confirmTx.amount)} €
              </strong>{' '}
              solo pasará a capital confirmado después de aportar
              una referencia o comprobante real.
            </p>

            {confirmError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {confirmError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Referencia / ID del comprobante
              </label>

              <input
                type="text"
                required
                placeholder="Referencia bancaria, TXID, ID de pago..."
                value={proofInput}
                onChange={(event) =>
                  setProofInput(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirmar Pago
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Income Modal */}
      {showIncomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeIncomeModal}
        >
          <form
            onSubmit={handleIncomeSubmit}
            onClick={(event) => event.stopPropagation()}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Registrar Ingreso
              </h3>

              <button
                type="button"
                onClick={closeIncomeModal}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {incomeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {incomeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Importe (€)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="150.00"
                value={incAmount}
                onChange={(event) =>
                  setIncAmount(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto / Descripción
              </label>

              <input
                type="text"
                required
                placeholder="Pago recibido por una tarea..."
                value={incDesc}
                onChange={(event) =>
                  setIncDesc(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado del ingreso
              </label>

              <select
                value={incStatus}
                onChange={(event) =>
                  setIncStatus(
                    event.target.value as
                      | 'PENDING'
                      | 'CONFIRMED',
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="PENDING">
                  PENDIENTE — todavía no acreditado
                </option>

                <option value="CONFIRMED">
                  CONFIRMADO — acreditado realmente
                </option>
              </select>
            </div>

            {incStatus === 'CONFIRMED' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Referencia del comprobante
                </label>

                <input
                  type="text"
                  required
                  placeholder="ID de pago, referencia bancaria..."
                  value={incProof}
                  onChange={(event) =>
                    setIncProof(event.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-slate-400">
              Un ingreso pendiente se registra para seguimiento,
              pero no aumenta el capital disponible hasta que se
              confirme realmente.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={closeIncomeModal}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Guardar Ingreso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Expense Modal */}
      {showExpenseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeExpenseModal}
        >
          <form
            onSubmit={handleExpenseSubmit}
            onClick={(event) => event.stopPropagation()}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Registrar Gasto Real
              </h3>

              <button
                type="button"
                onClick={closeExpenseModal}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {expenseError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {expenseError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              Capital confirmado disponible:{' '}
              <strong className="text-white font-mono">
                {formatAmount(summary?.availableCapital)} €
              </strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Importe del gasto (€)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="20.00"
                value={expAmount}
                onChange={(event) =>
                  setExpAmount(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto
              </label>

              <input
                type="text"
                required
                placeholder="Servidor, herramienta, infraestructura..."
                value={expDesc}
                onChange={(event) =>
                  setExpDesc(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría
              </label>

              <select
                value={expCategory}
                onChange={(event) =>
                  setExpCategory(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Infraestructura">
                  Infraestructura
                </option>

                <option value="Herramientas">
                  Herramientas y licencias
                </option>

                <option value="Almacenamiento">
                  Almacenamiento
                </option>

                <option value="Operaciones">
                  Operaciones
                </option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-slate-400">
              Los gastos están sujetos a los límites de capital,
              reserva y autorización configurados por el sistema.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={closeExpenseModal}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirmar Gasto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
