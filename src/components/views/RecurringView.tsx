"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import { useToast } from "@/components/ToastProvider";
import { RecurringModal, RecurringModalItem } from "@/components/modals/RecurringModal";
import {
  Repeat,
  Plus,
  Play,
  Calendar,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface EnrichedRule {
  id: string;
  title: string;
  amount: string;
  type: string;
  frequency: string;
  nextDueDate: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  autoProcess: boolean;
  status: string;
}

export function RecurringView() {
  const { formatCurrency, refreshAll } = useFinance();
  const { success, error } = useToast();

  const [rules, setRules] = useState<EnrichedRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringModalItem | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/recurring");
      if (res.ok) {
        const data = await res.json();
        setRules(data.recurringRules || []);
      }
    } catch {
      console.error("Failed to load recurring rules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenCreate = () => {
    setRuleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: EnrichedRule) => {
    setRuleToEdit({
      id: r.id,
      title: r.title,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      nextDueDate: r.nextDueDate,
      accountId: r.accountId,
      categoryId: r.categoryId,
      autoProcess: r.autoProcess,
      status: r.status,
    });
    setIsModalOpen(true);
  };

  const handleProcessNow = async (rule: EnrichedRule) => {
    try {
      setIsProcessingId(rule.id);
      const res = await fetch(`/api/recurring/${rule.id}/process`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        success(
          "Transaction Logged",
          `Processed "${rule.title}" and advanced next due date to ${data.nextDueDate}`
        );
        await fetchRules();
        await refreshAll();
      } else {
        error("Failed to process transaction");
      }
    } catch {
      error("Error executing recurring transaction");
    } finally {
      setIsProcessingId(null);
    }
  };

  const monthlyExpenseTotal = rules
    .filter((r) => r.type === "expense" && r.status === "active")
    .reduce((sum, r) => {
      const amt = parseFloat(r.amount);
      const mult = r.frequency === "daily" ? 30 : r.frequency === "weekly" ? 4.33 : r.frequency === "yearly" ? 1 / 12 : 1;
      return sum + amt * mult;
    }, 0);

  const monthlyIncomeTotal = rules
    .filter((r) => r.type === "income" && r.status === "active")
    .reduce((sum, r) => {
      const amt = parseFloat(r.amount);
      const mult = r.frequency === "daily" ? 30 : r.frequency === "weekly" ? 4.33 : r.frequency === "yearly" ? 1 / 12 : 1;
      return sum + amt * mult;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recurring Bills & Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Automate monthly subscriptions, fixed bills, rent, and paycheck schedules
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Rule
        </button>
      </div>

      {/* Aggregate Commitment Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Monthly Fixed Expenses</span>
          <h3 className="text-2xl font-black text-rose-400 mt-2">
            -{formatCurrency(monthlyExpenseTotal)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Rent, utilities & subscriptions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Monthly Expected Income</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            +{formatCurrency(monthlyIncomeTotal)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Salary & recurring retainers</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Net Monthly Commitment</span>
          <h3
            className={`text-2xl font-black mt-2 ${
              monthlyIncomeTotal - monthlyExpenseTotal >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {monthlyIncomeTotal - monthlyExpenseTotal >= 0 ? "+" : ""}
            {formatCurrency(monthlyIncomeTotal - monthlyExpenseTotal)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">{rules.length} active schedules</p>
        </div>
      </div>

      {/* Rules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <Repeat className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Recurring Rules</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set up automatic reminders for Netflix, Gym, Internet, Rent, and Salary.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
          >
            Add Recurring Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r) => {
            const isExpense = r.type === "expense";

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: `${r.categoryColor}25`, color: r.categoryColor }}
                    >
                      <DynamicIcon name={r.categoryIcon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{r.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="capitalize">{r.frequency}</span>
                        <span>•</span>
                        <span>{r.accountName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        isExpense ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(r.amount)}
                    </span>
                    <span
                      className={`block text-[10px] font-semibold uppercase mt-0.5 ${
                        r.status === "active" ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next Due: <strong className="text-white">{r.nextDueDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcessNow(r)}
                      disabled={isProcessingId === r.id}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {isProcessingId === r.id ? "Logging..." : "Post Now"}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchRules();
        }}
        ruleToEdit={ruleToEdit}
      />
    </div>
  );
}
