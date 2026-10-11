"use client";

import React, { useState } from "react";
import { useFinance, CategoryItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { CategoryModal } from "@/components/modals/CategoryModal";
import {
  User,
  Settings,
  DollarSign,
  Tag,
  RotateCcw,
  Plus,
  Users,
  Shield,
  CheckCircle2,
} from "lucide-react";

export function SettingsView() {
  const {
    user,
    availableUsers,
    switchUser,
    resetDemoData,
    categories,
    refreshAll,
    currency,
  } = useFinance();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || "USD");
  const [monthlyLimit, setMonthlyLimit] = useState(user?.monthlyBudgetLimit || "5000.00");
  const [dailyLimit, setDailyLimit] = useState(user?.dailyBudgetLimit || "150.00");
  const [savingsRate, setSavingsRate] = useState(user?.savingsTargetRate || 25);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          name,
          currency: selectedCurrency,
          monthlyBudgetLimit: monthlyLimit,
          dailyBudgetLimit: dailyLimit,
          savingsTargetRate: savingsRate,
        }),
      });

      if (res.ok) {
        success("Preferences Updated", "Your currency, budget targets, and profile settings were saved.");
        await refreshAll();
      } else {
        error("Failed to update preferences");
      }
    } catch {
      error("Error saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Application Preferences & Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure active currency, spending limits, user profile, and custom categories
        </p>
      </div>

      {/* Switch Demo Profiles Widget */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Active Profile & Demo Accounts</h3>
        </div>
        <p className="text-xs text-slate-400">
          Instantly switch between demo profiles to test multi-currency & isolated ledgers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableUsers.map((u) => {
            const isActive = u.id === user?.id;

            return (
              <button
                key={u.id}
                onClick={() => !isActive && switchUser(u.id)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isActive
                    ? "bg-blue-950/60 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{u.avatar || "👤"}</span>
                  <div>
                    <h4 className="text-sm font-bold">{u.name}</h4>
                    <p className="text-xs text-slate-400">
                      {u.email} • {u.currency}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile & Financial Targets Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Financial Targets & Currency</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Base Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            >
              <option value="USD">$ USD - United States Dollar</option>
              <option value="EUR">€ EUR - Euro</option>
              <option value="GBP">£ GBP - British Pound</option>
              <option value="CAD">CA$ CAD - Canadian Dollar</option>
              <option value="AUD">A$ AUD - Australian Dollar</option>
              <option value="JPY">¥ JPY - Japanese Yen</option>
              <option value="INR">₹ INR - Indian Rupee</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Monthly Budget Ceiling ({selectedCurrency})
            </label>
            <input
              type="number"
              step="50"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Daily Spending Benchmark ({selectedCurrency})
            </label>
            <input
              type="number"
              step="5"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Monthly Savings Rate Target</span>
            <span className="font-bold text-emerald-400">{savingsRate}% of income</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={savingsRate}
            onChange={(e) => setSavingsRate(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
        >
          {isSavingSettings ? "Saving Settings..." : "Save Preferences"}
        </button>
      </form>

      {/* Category Management */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Categories ({categories.length})</h3>
          </div>
          <button
            onClick={handleOpenCreateCategory}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {categories.map((c) => (
            <div
              key={c.id}
              onClick={() => handleOpenEditCategory(c)}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}25`, color: c.color }}
                >
                  <DynamicIcon name={c.icon} className="w-3.5 h-3.5" />
                </div>
                <span className="text-white font-medium truncate">{c.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-blue-400">Edit</span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Reset & Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-rose-200">Reset Demo Data</h3>
        </div>
        <p className="text-xs text-rose-300/80 leading-relaxed">
          Need a fresh start? Resetting the database will re-populate realistic daily transactions, accounts, budgets, and goals for demo exploration.
        </p>
        <button
          onClick={() => {
            if (confirm("Reset database to clean initial demo state?")) {
              resetDemoData();
            }
          }}
          className="px-4 py-2 text-xs font-bold text-rose-200 bg-rose-900/60 hover:bg-rose-800 border border-rose-700/60 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
}
