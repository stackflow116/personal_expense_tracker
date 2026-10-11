"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  Menu,
  Plus,
  DollarSign,
  Search,
  Bell,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    user,
    availableUsers,
    switchUser,
    resetDemoData,
    openTransactionModal,
    currency,
    formatCurrency,
    dashboardData,
  } = useFinance();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Mobile menu trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-300">Personal Finance</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">Expense & Cashflow Ledger</span>
        </div>
      </div>

      {/* Right Section: Currency pill, Profile switch dropdown, Quick Log */}
      <div className="flex items-center gap-3">
        {/* Currency Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currency}</span>
        </div>

        {/* Quick Log CTA Button */}
        <button
          onClick={() => openTransactionModal()}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Log</span>
        </button>

        {/* Profile Switch Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <span className="text-lg">{user?.avatar || "👨‍💻"}</span>
            <span className="text-xs font-bold text-white hidden md:inline truncate max-w-[100px]">
              {user?.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu Popup */}
          {isUserMenuOpen && (
            <>
              <div
                onClick={() => setIsUserMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-800/80 mb-1">
                  <h4 className="font-bold text-white text-sm">{user?.name}</h4>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block pt-1">
                    Switch Demo Account
                  </span>
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors ${
                        u.id === user?.id
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{u.avatar}</span>
                        <span>{u.name}</span>
                      </div>
                      <span className="text-[10px] opacity-80">{u.currency}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      resetDemoData();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
