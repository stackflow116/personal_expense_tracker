"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Sparkles, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    title: string;
    targetAmount: string;
    currentAmount: string;
    remainingNum?: number;
    color: string;
    icon: string;
  } | null;
}

export function ContributeModal({ isOpen, onClose, goal }: ContributeModalProps) {
  const { accounts, refreshAll, currency, formatCurrency } = useFinance();
  const { success, error } = useToast();

  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !goal) return null;

  const currentNum = parseFloat(goal.currentAmount || "0");
  const targetNum = parseFloat(goal.targetAmount || "0");
  const remaining = Math.max(0, targetNum - currentNum);

  const quickAmounts = [25, 50, 100, 250, 500, Math.round(remaining)].filter(
    (a, idx, arr) => a > 0 && arr.indexOf(a) === idx
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      error("Please enter a valid contribution amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/goals/${goal.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmt, sourceAccountId }),
      });

      if (res.ok) {
        const data = await res.json();
        const willBeCompleted = currentNum + numAmt >= targetNum;

        if (willBeCompleted) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
          success("🎉 Goal Achieved!", `Congratulations! You reached your savings target for "${goal.title}"!`);
        } else {
          success("Deposit Added", `Added ${formatCurrency(numAmt)} towards ${goal.title}`);
        }

        await refreshAll();
        onClose();
        setAmount("");
      } else {
        const d = await res.json();
        error(d.error || "Failed to contribute to goal");
      }
    } catch {
      error("An error occurred during contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${goal.color}25`, color: goal.color }}
            >
              <DynamicIcon name={goal.icon} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Deposit to Goal</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 block">Current Progress</span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(currentNum)} / {formatCurrency(targetNum)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Remaining</span>
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Amount to Deposit ({currency})</label>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xl font-bold text-white focus:outline-none"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Quick Amounts</label>
            <div className="flex flex-wrap gap-1.5">
              {quickAmounts.slice(0, 5).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 transition-colors"
                >
                  +{formatCurrency(q)}
                </button>
              ))}
            </div>
          </div>

          {/* Source Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Deduct From Account</label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Don&apos;t deduct from account balance</option>
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? "Contributing..." : "Deposit Funds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
