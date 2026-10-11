"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { X, Trash2, Users } from "lucide-react";

export interface DebtItem {
  id?: string;
  personName: string;
  type: string; // 'owed_to_me', 'i_owe'
  amount: string;
  settledAmount?: string;
  description: string;
  dueDate?: string | null;
  status?: string;
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: DebtItem | null;
}

export function DebtModal({ isOpen, onClose, debtToEdit }: DebtModalProps) {
  const { refreshAll, currency } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(debtToEdit?.id);

  const [personName, setPersonName] = useState("");
  const [type, setType] = useState("owed_to_me");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (debtToEdit) {
      setPersonName(debtToEdit.personName);
      setType(debtToEdit.type || "owed_to_me");
      setAmount(debtToEdit.amount);
      setDescription(debtToEdit.description);
      setDueDate(debtToEdit.dueDate || "");
    } else {
      setPersonName("");
      setType("owed_to_me");
      setAmount("");
      setDescription("");
      setDueDate("");
    }
  }, [debtToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount || parseFloat(amount) <= 0 || !description.trim()) {
      error("Please fill in person name, amount, and description");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        personName: personName.trim(),
        type,
        amount: parseFloat(amount).toFixed(2),
        description: description.trim(),
        dueDate: dueDate || null,
      };

      const url = isEditing ? `/api/debts/${debtToEdit?.id}` : "/api/debts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Record Updated" : "Split / Debt Logged", `${personName} (${currency} ${parseFloat(amount).toFixed(2)})`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save debt record");
      }
    } catch {
      error("Error saving debt record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!debtToEdit?.id) return;
    if (!confirm(`Delete split record for ${debtToEdit.personName}?`)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/debts/${debtToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Record Deleted", "Debt entry removed.");
        await refreshAll();
        onClose();
      } else {
        error("Failed to delete record");
      }
    } catch {
      error("Error deleting record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? "Edit Split / IOU" : "Track Split Bill or IOU"}
            </h3>
            <p className="text-xs text-slate-400">Keep track of money lent to or borrowed from friends</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType("owed_to_me")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "owed_to_me"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              They Owe Me
            </button>
            <button
              type="button"
              onClick={() => setType("i_owe")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "i_owe"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              I Owe Them
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Person Name</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Amount ({currency})</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Reason / Description</label>
            <input
              type="text"
              placeholder="e.g. Omakase dinner split, concert tickets, Uber ride..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update Split" : "Track Split"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettleModal({
  isOpen,
  onClose,
  debt,
}: {
  isOpen: boolean;
  onClose: () => void;
  debt: {
    id: string;
    personName: string;
    type: string;
    amount: string;
    settledAmount: string;
    remainingNum?: number;
    description: string;
  } | null;
}) {
  const { accounts, refreshAll, formatCurrency } = useFinance();
  const { success, error } = useToast();

  const [settleAmount, setSettleAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (debt) {
      const remaining = parseFloat(debt.amount) - parseFloat(debt.settledAmount || "0");
      setSettleAmount(remaining.toFixed(2));
      setAccountId(accounts[0]?.id || "");
    }
  }, [debt, accounts]);

  if (!isOpen || !debt) return null;

  const totalNum = parseFloat(debt.amount);
  const settledNum = parseFloat(debt.settledAmount || "0");
  const remainingNum = Math.max(0, totalNum - settledNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(settleAmount);
    if (!numAmt || numAmt <= 0) {
      error("Please enter a valid settlement amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/debts/${debt.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settleAmount: numAmt, accountId }),
      });

      if (res.ok) {
        success("Settlement Recorded", `Logged payment of ${formatCurrency(numAmt)} with ${debt.personName}`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to settle debt");
      }
    } catch {
      error("Error settling debt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white">Settle Balance</h3>
            <p className="text-xs text-slate-400">Record repayment from or to {debt.personName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Item:</span>
              <span className="text-white font-medium">{debt.description}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Balance:</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(remainingNum)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Amount Being Paid</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xl font-bold text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Sync with Account Balance</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Don&apos;t create a bank transaction</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} {acc.balance})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              {isSubmitting ? "Settling..." : "Confirm Settlement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
