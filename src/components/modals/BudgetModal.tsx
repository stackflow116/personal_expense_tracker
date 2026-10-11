"use client";

import React, { useState, useEffect } from "react";
import { useFinance, CategoryItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Sliders, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

export interface BudgetModalItem {
  id?: string;
  categoryId: string;
  monthYear: string;
  allocatedAmount: string;
  alertThreshold: number;
  rollover: boolean;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: BudgetModalItem | null;
  currentMonthYear?: string;
}

export function BudgetModal({ isOpen, onClose, budgetToEdit, currentMonthYear }: BudgetModalProps) {
  const { categories, refreshAll, currency } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(budgetToEdit?.id);

  const [categoryId, setCategoryId] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [rollover, setRollover] = useState(false);
  const [monthYear, setMonthYear] = useState(currentMonthYear || format(new Date(), "yyyy-MM"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setAllocatedAmount(budgetToEdit.allocatedAmount);
      setAlertThreshold(budgetToEdit.alertThreshold || 80);
      setRollover(budgetToEdit.rollover || false);
      setMonthYear(budgetToEdit.monthYear || format(new Date(), "yyyy-MM"));
    } else {
      setCategoryId(expenseCategories[0]?.id || "");
      setAllocatedAmount("");
      setAlertThreshold(80);
      setRollover(false);
      setMonthYear(currentMonthYear || format(new Date(), "yyyy-MM"));
    }
  }, [budgetToEdit, isOpen, expenseCategories, currentMonthYear]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      error("Please select a category");
      return;
    }
    if (!allocatedAmount || parseFloat(allocatedAmount) <= 0) {
      error("Please enter a valid monthly budget limit");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        categoryId,
        allocatedAmount: parseFloat(allocatedAmount).toFixed(2),
        alertThreshold,
        rollover,
        monthYear,
      };

      const url = isEditing ? `/api/budgets/${budgetToEdit?.id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Budget Updated" : "Budget Created", `Monthly limit set to ${currency} ${parseFloat(allocatedAmount).toFixed(2)}`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save budget");
      }
    } catch {
      error("Error saving budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!budgetToEdit?.id) return;
    if (!confirm("Are you sure you want to remove this budget allocation?")) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/budgets/${budgetToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Budget Removed", "The category budget limit was deleted.");
        await refreshAll();
        onClose();
      } else {
        error("Failed to delete budget");
      }
    } catch {
      error("Error deleting budget");
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
              {isEditing ? "Adjust Category Budget" : "Set Category Budget"}
            </h3>
            <p className="text-xs text-slate-400">Control spending limits & trigger warnings</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              {expenseCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                    categoryId === c.id
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${c.color}25`, color: c.color }}
                  >
                    <DynamicIcon name={c.icon} className="w-3 h-3" />
                  </div>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Monthly Limit ({currency})
            </label>
            <input
              type="number"
              step="10"
              min="1"
              placeholder="e.g. 500.00"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xl font-bold text-white focus:outline-none"
            />
          </div>

          {/* Alert Threshold Slider */}
          <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Overspend Warning Alert</span>
              <span className="font-bold text-amber-400">{alertThreshold}% of budget</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              You will see a warning badge as soon as spending exceeds {alertThreshold}% of this budget.
            </p>
          </div>

          {/* Rollover Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rollover"
              checked={rollover}
              onChange={(e) => setRollover(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
            />
            <label htmlFor="rollover" className="text-xs font-medium text-slate-300 cursor-pointer">
              Rollover unspent balance to next month
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
                {isSubmitting ? "Saving..." : isEditing ? "Update Budget" : "Save Budget"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
