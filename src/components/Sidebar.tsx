"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  LayoutDashboard,
  Receipt,
  Target,
  Wallet,
  PiggyBank,
  Repeat,
  BarChart3,
  Users,
  Settings,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { activeTab, setActiveTab, openTransactionModal, formatCurrency, dashboardData, user } = useFinance();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "budgets", label: "Budgets & Burn Rate", icon: Target },
    { id: "accounts", label: "Accounts & Wallets", icon: Wallet },
    { id: "goals", label: "Savings Goals", icon: PiggyBank },
    { id: "recurring", label: "Recurring & Bills", icon: Repeat },
    { id: "analytics", label: "Analytics & Heatmap", icon: BarChart3 },
    { id: "debts", label: "Splits & IOUs", icon: Users },
    { id: "settings", label: "Preferences", icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none">
                FinanceFlow
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Daily Tracker
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              openTransactionModal();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Quick Log</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Net Worth Widget */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Net Worth</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="text-sm font-black text-white">
              {formatCurrency(dashboardData?.balances.netWorth || 0)}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>{user?.avatar || "👤"}</span>
              <span className="truncate">{user?.name}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
