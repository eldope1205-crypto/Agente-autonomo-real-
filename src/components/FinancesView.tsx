import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { FinancialSummary, Transaction, FinancialLimits } from '../types/index.js';

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

  // Income form state
  const [incAmount, setIncAmount] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incStatus, setIncStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING');
  const [incProof, setIncProof] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Expense form state
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Infraestructura');

  const summary = finances?.summary;
  const transactions = finances?.transactions || [];

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'INCOME') return tx.type === 'INCOME';
    if (filterType === 'EXPENSE') return tx.type === 'EXPENSE';
    if (filterType === 'CONFIRMED') return tx.status === 'CONFIRMED';
    if (filterType === 'PENDING') return tx.status === 'PENDING';
    return true;
  });

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(incAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Importe no válido.');
      return;
    }
    try {
      await onRegisterIncome({
        amount: amt,
        description: incDesc,
        status: incStatus,
        evidenceReference: incProof || undefined,
      });
      setShowIncomeModal(false);
      setIncAmount('');
      setIncDesc('');
      setIncProof('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar ingreso.');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Importe no válido.');
      return;
    }
    try {
      await onRegisterExpense({
        amount: amt,
        description: expDesc,
        category: expCategory,
      });
      setShowExpenseModal(false);
      setExpAmount('');
      setExpDesc('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar gasto.');
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTx || !proofInput) return;
    try {
      setConfirmError('');
      await onConfirmIncome(confirmTx.id, proofInput);
      setConfirmTx(null);
      setProofInput('');
    } catch (err: any) {
      setConfirmError(err.message || 'Error al confirmar pago');
    }
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
            Principio de Verificabilidad Estricto: los ingresos pendientes NO computan como capital disponible.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setErrorMsg('');
              setShowIncomeModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            Registrar Ingreso
          </button>
          <button
            onClick={() => {
              setErrorMsg('');
              setShowExpenseModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ingresos Confirmados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary?.confirmedIncome.toFixed(2) || '0.00'} €
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pendiente de cobro:{' '}
            <span className="text-amber-400 font-mono font-medium">
              {summary?.pendingIncome.toFixed(2) || '0.00'} €
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Gastos Confirmados</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {summary?.confirmedExpense.toFixed(2) || '0.00'} €
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gastos pendientes: <span className="font-mono">{summary?.pendingExpense.toFixed(2) || '0.00'} €</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Capital Real Disponible</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary?.availableCapital.toFixed(2) || '0.00'} €
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Reserva obligatoria: <span className="font-mono">{summary?.reserve.toFixed(2) || '0.00'} €</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Beneficio Neto Real</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {summary?.confirmedProfit.toFixed(2) || '0.00'} €
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ingresos Conf. - Gastos Conf.
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Registro Histórico de Transacciones ({transactions.length})
          </h3>

          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
            {['ALL', 'CONFIRMED', 'PENDING', 'INCOME', 'EXPENSE'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterType(st)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-semibold ${
                  filterType === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'Todas'
                  : st === 'CONFIRMED'
                  ? 'Confirmadas'
                  : st === 'PENDING'
                  ? 'Pendientes'
                  : st === 'INCOME'
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
                  <th className="pb-3">Evidencia / Comprobante</th>
                  <th className="pb-3 text-right pr-2">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/40">
                    <td className="py-3 pl-2 font-mono text-slate-400 text-[11px]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? 'INGRESO' : 'GASTO'}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-white max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3 font-mono font-bold text-sm">
                      <span className={tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {tx.amount.toFixed(2)} €
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {tx.status === 'CONFIRMED' ? 'CONFIRMADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-[11px] max-w-[180px] truncate">
                      {tx.evidenceReference || '—'}
                    </td>
                    <td className="py-3 text-right pr-2">
                      {tx.type === 'INCOME' && tx.status === 'PENDING' && (
                        <button
                          onClick={() => setConfirmTx(tx)}
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

      {/* Modal Confirm Pending Income */}
      {confirmTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmSubmit}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Confirmar Pago Real</h3>
              <button
                type="button"
                onClick={() => setConfirmTx(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Para liberar los fondos de{' '}
              <strong className="text-emerald-400 font-mono">{confirmTx.amount} €</strong> al
              capital real disponible del agente, ingresa la referencia o hash del comprobante bancario/plataforma.
            </p>

            {confirmError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {confirmError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Referencia de Pago / ID de Transacción:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. TXID-9848123984 o Ref-Bancaria-771"
                value={proofInput}
                onChange={(e) => setProofInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Liberar a Capital Disponible
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Register Income */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleIncomeSubmit}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Registrar Ingreso</h3>
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Importe (€):
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.00"
                value={incAmount}
                onChange={(e) => setIncAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto / Descripción:
              </label>
              <input
                type="text"
                required
                placeholder="Liquidación de tarea de análisis de datos..."
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado de la Liquidación:
              </label>
              <select
                value={incStatus}
                onChange={(e) => setIncStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <option value="PENDING">PENDIENTE (Aún no acreditado en cuenta)</option>
                <option value="CONFIRMED">CONFIRMADO (Acreditado con comprobante)</option>
              </select>
            </div>

            {incStatus === 'CONFIRMED' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identificador de Comprobante:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ID de factura o referencia bancaria"
                  value={incProof}
                  onChange={(e) => setIncProof(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
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

      {/* Modal Register Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleExpenseSubmit}
            className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Registrar Gasto Real</h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              Capital confirmado disponible:{' '}
              <strong className="text-white font-mono">{summary?.availableCapital.toFixed(2)} €</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Importe del Gasto (€):
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="20.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto:
              </label>
              <input
                type="text"
                required
                placeholder="Servidor cloud, API token, dominio..."
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría:
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <option value="Infraestructura">Infraestructura</option>
                <option value="Herramientas">Herramientas & Licencias</option>
                <option value="Almacenamiento">Almacenamiento</option>
                <option value="Operaciones">Operaciones</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
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
