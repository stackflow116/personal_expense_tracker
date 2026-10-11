"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { X, Trash2, Plus, Calendar, Repeat } from "lucide-react";
import { format } from "date-fns";

export interface RecurringModalItem {
  id?: string;
  title: string;
  amount: string;
  type: string;
  frequency: string;
  nextDueDate: string;
  accountId: string;
  categoryId: string;
  autoProcess?: boolean;
  status?: string;
}

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: RecurringModalItem | null;
}

export function RecurringModal({ isOpen, onClose, ruleToEdit }: RecurringModalProps) {
  const { accounts, categories, refreshAll, currency } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(ruleToEdit?.id);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [autoProcess, setAutoProcess] = useState(true);
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ruleToEdit) {
      setTitle(ruleToEdit.title);
      setAmount(ruleToEdit.amount);
      setType(ruleToEdit.type || "expense");
      setFrequency(ruleToEdit.frequency || "monthly");
      setNextDueDate(ruleToEdit.nextDueDate || format(new Date(), "yyyy-MM-dd"));
      setAccountId(ruleToEdit.accountId || (accounts[0]?.id ?? ""));
      setCategoryId(ruleToEdit.categoryId || (categories[0]?.id ?? ""));
      setAutoProcess(ruleToEdit.autoProcess ?? true);
      setStatus(ruleToEdit.status || "active");
    } else {
      setTitle("");
      setAmount("");
      setType("expense");
      setFrequency("monthly");
      setNextDueDate(format(new Date(), "yyyy-MM-dd"));
      setAccountId(accounts[0]?.id || "");
      setCategoryId(categories.find((c) => c.type === "expense")?.id || categories[0]?.id || "");
      setAutoProcess(true);
      setStatus("active");
    }
  }, [ruleToEdit, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0 || !accountId || !categoryId) {
      error("Please complete all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        amount: parseFloat(amount).toFixed(2),
        type,
        frequency,
        nextDueDate,
        accountId,
        categoryId,
        autoProcess,
        status,
      };

      const url = isEditing ? `/api/recurring/${ruleToEdit?.id}` : "/api/recurring";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Recurring Rule Updated" : "Recurring Rule Created", `${title} set to ${frequency}`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save rule");
      }
    } catch {
      error("Error saving recurring rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ruleToEdit?.id) return;
    if (!confirm(`Delete recurring rule "${ruleToEdit.title}"?`)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/recurring/${ruleToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Rule Deleted", `${ruleToEdit.title} removed.`);
        await refreshAll();
        onClose();
      } else {
        error("Failed to delete rule");
      }
    } catch {
      error("Error deleting rule");
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
              {isEditing ? "Edit Recurring Rule" : "Schedule Recurring Transaction"}
            </h3>
            <p className="text-xs text-slate-400">Automate rent, subscriptions, or paycheck logs</p>
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
              onClick={() => setType("expense")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "expense"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Expense / Bill
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Income / Salary
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Title / Service</label>
            <input
              type="text"
              placeholder="e.g. Netflix Ultra HD or Monthly Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              <label className="text-xs font-medium text-slate-300">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Next Due Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoProcess"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
            />
            <label htmlFor="autoProcess" className="text-xs font-medium text-slate-300 cursor-pointer">
              Auto-generate transaction log on due date
            </label>
          </div>

          {/* Actions */}
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
                {isSubmitting ? "Saving..." : isEditing ? "Update Schedule" : "Create Schedule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
