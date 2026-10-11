"use client";

import React, { useState, useEffect } from "react";
import { useFinance, CategoryItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Trash2, Plus } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: CategoryItem | null;
}

const availableIcons = [
  "Tag", "ShoppingCart", "Utensils", "Home", "Car", "Zap", "Film", "ShoppingBag",
  "HeartPulse", "Plane", "BookOpen", "Briefcase", "Laptop", "TrendingUp", "Gift",
  "ShieldCheck", "Coffee", "Wifi", "Fuel", "Users"
];

const availableColors = [
  "#6366F1", "#10B981", "#F59E0B", "#3B82F6", "#EAB308", "#EC4899",
  "#8B5CF6", "#EF4444", "#14B8A6", "#06B6D4", "#F43F5E", "#64748B"
];

export function CategoryModal({ isOpen, onClose, categoryToEdit }: CategoryModalProps) {
  const { refreshAll } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState("#3B82F6");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setIcon(categoryToEdit.icon);
      setColor(categoryToEdit.color);
      setBudgetAmount(categoryToEdit.budgetAmount || "0.00");
    } else {
      setName("");
      setType("expense");
      setIcon("Tag");
      setColor("#3B82F6");
      setBudgetAmount("0.00");
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        type,
        icon,
        color,
        budgetAmount: parseFloat(budgetAmount || "0").toFixed(2),
      };

      const url = isEditing ? `/api/categories/${categoryToEdit?.id}` : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Category Updated" : "Category Created", `${name} is available for transactions`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save category");
      }
    } catch {
      error("Error saving category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;
    if (!confirm(`Delete category "${categoryToEdit.name}"?`)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/categories/${categoryToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Category Deleted", `${categoryToEdit.name} removed.`);
        await refreshAll();
        onClose();
      } else {
        error("Failed to delete category");
      }
    } catch {
      error("Error deleting category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? "Edit Category" : "New Category"}
            </h3>
            <p className="text-xs text-slate-400">Classify daily expenses and income streams</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
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
              Expense Category
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
              Income Category
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Coffee & Snacks or Consulting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Icon</label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              {availableIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    icon === ic
                      ? "bg-blue-600 text-white border-blue-500 shadow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <DynamicIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Color Tag</label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
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
                {isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
