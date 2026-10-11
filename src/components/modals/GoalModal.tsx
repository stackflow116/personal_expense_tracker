"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Trash2, Plus } from "lucide-react";

export interface GoalItem {
  id?: string;
  title: string;
  targetAmount: string;
  currentAmount?: string;
  targetDate?: string | null;
  category: string;
  color: string;
  icon: string;
  isCompleted?: boolean;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: GoalItem | null;
}

const goalIcons = [
  { name: "PiggyBank", label: "Piggy Bank" },
  { name: "ShieldCheck", label: "Emergency" },
  { name: "Plane", label: "Vacation" },
  { name: "Laptop", label: "Tech" },
  { name: "Car", label: "Vehicle" },
  { name: "Home", label: "House" },
  { name: "Gift", label: "Gift" },
];

const goalColors = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4"];

export function GoalModal({ isOpen, onClose, goalToEdit }: GoalModalProps) {
  const { refreshAll, currency } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(goalToEdit?.id);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("#10B981");
  const [icon, setIcon] = useState("PiggyBank");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setTargetAmount(goalToEdit.targetAmount);
      setCurrentAmount(goalToEdit.currentAmount || "0.00");
      setTargetDate(goalToEdit.targetDate || "");
      setCategory(goalToEdit.category || "General");
      setColor(goalToEdit.color || "#10B981");
      setIcon(goalToEdit.icon || "PiggyBank");
    } else {
      setTitle("");
      setTargetAmount("");
      setCurrentAmount("0.00");
      setTargetDate("");
      setCategory("General");
      setColor("#10B981");
      setIcon("PiggyBank");
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      error("Please enter a valid title and target amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        targetAmount: parseFloat(targetAmount).toFixed(2),
        currentAmount: parseFloat(currentAmount || "0").toFixed(2),
        targetDate: targetDate || null,
        category,
        color,
        icon,
      };

      const url = isEditing ? `/api/goals/${goalToEdit?.id}` : "/api/goals";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Goal Updated" : "Savings Goal Created", `${title} target is ${currency} ${parseFloat(targetAmount).toFixed(2)}`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save goal");
      }
    } catch {
      error("Error saving savings goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToEdit?.id) return;
    if (!confirm(`Delete savings goal "${goalToEdit.title}"?`)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/goals/${goalToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Goal Deleted", `${goalToEdit.title} was removed.`);
        await refreshAll();
        onClose();
      } else {
        error("Failed to delete goal");
      }
    } catch {
      error("Error deleting goal");
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
              {isEditing ? "Edit Savings Goal" : "Create Savings Goal"}
            </h3>
            <p className="text-xs text-slate-400">Set targets for vacation, emergency, or major purchases</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Goal Title</label>
            <input
              type="text"
              placeholder="e.g. 6-Month Emergency Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Amount ({currency})</label>
              <input
                type="number"
                step="50"
                placeholder="5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Already Saved ({currency})</label>
              <input
                type="number"
                step="50"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target Completion Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Goal Icon</label>
            <div className="flex flex-wrap gap-2">
              {goalIcons.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                    icon === item.name
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title={item.label}
                >
                  <DynamicIcon name={item.name} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Color Tag</label>
            <div className="flex items-center gap-2">
              {goalColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update Goal" : "Create Goal"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
