"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import { BudgetModal, BudgetModalItem } from "@/components/modals/BudgetModal";
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
} from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";

interface EnrichedBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  monthYear: string;
  allocatedAmountNum: number;
  spentAmountNum: number;
  remainingAmountNum: number;
  percent: number;
  dailyRemainingNum: number;
  isOver: boolean;
  isWarning: boolean;
  alertThreshold: number;
  rollover: boolean;
}

export function BudgetsView() {
  const { formatCurrency, formatCompact, categories } = useFinance();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const monthYear = format(currentDate, "yyyy-MM");
  const monthDisplay = format(currentDate, "MMMM yyyy");

  const [budgets, setBudgets] = useState<EnrichedBudget[]>([]);
  const [summary, setSummary] = useState({
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercent: 0,
    remainingDays: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetModalItem | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/budgets?monthYear=${monthYear}`);
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
        setSummary(data.summary || { totalAllocated: 0, totalSpent: 0, totalRemaining: 0, overallPercent: 0, remainingDays: 1 });
      }
    } catch {
      console.error("Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  }, [monthYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));

  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: EnrichedBudget) => {
    setBudgetToEdit({
      id: b.id,
      categoryId: b.categoryId,
      monthYear: b.monthYear,
      allocatedAmount: b.allocatedAmountNum.toFixed(2),
      alertThreshold: b.alertThreshold,
      rollover: b.rollover,
    });
    setIsModalOpen(true);
  };

  const dailyRemainingOverall = summary.totalRemaining > 0 ? summary.totalRemaining / summary.remainingDays : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Budgets & Burn Rates</h2>
          <p className="text-xs sm:text-sm text-slate-400">Keep spending controlled across every category</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white min-w-[110px] text-center">
              {monthDisplay}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Monthly Overall Summary Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Monthly Budget Performance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {formatCurrency(summary.totalSpent)}
              </h3>
              <span className="text-sm text-slate-400">
                / {formatCurrency(summary.totalAllocated)} allocated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-xs text-slate-400 block">Remaining Allowance</span>
              <span
                className={`text-lg font-black ${
                  summary.totalRemaining < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {formatCurrency(summary.totalRemaining)}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-xs text-slate-400 block">Safe Daily Pace</span>
              <span className="text-lg font-black text-blue-400">
                {formatCurrency(dailyRemainingOverall)} / day
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Meter */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                summary.overallPercent > 100
                  ? "bg-rose-500"
                  : summary.overallPercent > 80
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-blue-500 to-emerald-500"
              }`}
              style={{ width: `${Math.min(100, summary.overallPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{summary.overallPercent}% consumed</span>
            <span>{summary.remainingDays} days remaining in month</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No budgets set for {monthDisplay}</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set category limits to track expenses like Groceries, Rent, Dining, and Subscriptions.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 ${
                b.isOver
                  ? "border-rose-900/60 bg-rose-950/10"
                  : b.isWarning
                  ? "border-amber-900/60 bg-amber-950/10"
                  : "border-slate-800"
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${b.categoryColor}25`, color: b.categoryColor }}
                  >
                    <DynamicIcon name={b.categoryIcon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.categoryName}</h4>
                    <p className="text-[11px] text-slate-400">
                      Limit: {formatCurrency(b.allocatedAmountNum)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                {b.isOver ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    Over by {formatCurrency(Math.abs(b.remainingAmountNum))}
                  </span>
                ) : b.isWarning ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    {b.percent}% Spent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    On Track
                  </span>
                )}
              </div>

              {/* Progress Bar & Amounts */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-300 font-semibold">
                    Spent: <strong className="text-white">{formatCurrency(b.spentAmountNum)}</strong>
                  </span>
                  <span
                    className={`font-bold ${
                      b.isOver ? "text-rose-400" : "text-slate-300"
                    }`}
                  >
                    {b.percent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isOver
                        ? "bg-rose-500"
                        : b.isWarning
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
              </div>

              {/* Footer: Daily Remaining & Edit */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Remaining / Day</span>
                  <span className={`font-bold ${b.isOver ? "text-rose-400" : "text-emerald-400"}`}>
                    {b.isOver ? "$0.00" : `${formatCurrency(b.dailyRemainingNum)}/day`}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                >
                  Adjust
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        budgetToEdit={budgetToEdit}
        currentMonthYear={monthYear}
      />
    </div>
  );
}
