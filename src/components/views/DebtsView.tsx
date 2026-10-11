"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DebtModal, SettleModal, DebtItem } from "@/components/modals/DebtModal";
import {
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CreditCard,
} from "lucide-react";

interface EnrichedDebt {
  id: string;
  personName: string;
  type: string;
  amount: string;
  settledAmount: string;
  amountNum: number;
  settledNum: number;
  remainingNum: number;
  description: string;
  dueDate?: string | null;
  status: string;
}

export function DebtsView() {
  const { formatCurrency, refreshAll } = useFinance();

  const [debts, setDebts] = useState<EnrichedDebt[]>([]);
  const [summary, setSummary] = useState({ totalOwedToMe: 0, totalIOwe: 0, netDebtPosition: 0 });
  const [filter, setFilter] = useState("all"); // 'all', 'owed_to_me', 'i_owe', 'unsettled'
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtItem | null>(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<EnrichedDebt | null>(null);

  const fetchDebts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/debts");
      if (res.ok) {
        const data = await res.json();
        setDebts(data.debts || []);
        setSummary(data.summary || { totalOwedToMe: 0, totalIOwe: 0, netDebtPosition: 0 });
      }
    } catch {
      console.error("Failed to load debts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleOpenCreate = () => {
    setDebtToEdit(null);
    setIsDebtModalOpen(true);
  };

  const handleOpenEdit = (d: EnrichedDebt) => {
    setDebtToEdit(d);
    setIsDebtModalOpen(true);
  };

  const handleOpenSettle = (d: EnrichedDebt) => {
    setSelectedDebtForSettle(d);
    setIsSettleModalOpen(true);
  };

  const filteredDebts = debts.filter((d) => {
    if (filter === "owed_to_me") return d.type === "owed_to_me";
    if (filter === "i_owe") return d.type === "i_owe";
    if (filter === "unsettled") return d.status !== "settled";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Splits, IOUs & Money Lent
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Track group dinner tabs, trip splits, and money owed with automatic settlements
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Track Split / IOU
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Money Owed To You</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            +{formatCurrency(summary.totalOwedToMe)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Friends & colleagues owe you</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Money You Owe</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            -{formatCurrency(summary.totalIOwe)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Pending reimbursement</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Split Position</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={`text-2xl font-black mt-2 ${
              summary.netDebtPosition >= 0 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {summary.netDebtPosition >= 0 ? "+" : ""}
            {formatCurrency(summary.netDebtPosition)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">{debts.length} total split records</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
        {[
          { label: "All Records", val: "all" },
          { label: "Owed To Me", val: "owed_to_me" },
          { label: "I Owe", val: "i_owe" },
          { label: "Unsettled", val: "unsettled" },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === f.val ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Debts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Debt or Split Records</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Easily keep track when you pay for group dinners, tickets, or travel.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
          >
            Log a Split Expense
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDebts.map((d) => {
            const isOwedToMe = d.type === "owed_to_me";
            const isSettled = d.status === "settled" || d.remainingNum <= 0;

            return (
              <div
                key={d.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 ${
                  isSettled ? "border-slate-800/60 opacity-80" : "border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{d.personName}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{d.description}</p>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isSettled
                          ? "bg-slate-800 text-slate-400"
                          : isOwedToMe
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isSettled
                        ? "Settled"
                        : isOwedToMe
                        ? "Owed To Me"
                        : "I Owe"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Remaining</span>
                      <span
                        className={`text-xl font-black ${
                          isSettled
                            ? "text-slate-400 line-through"
                            : isOwedToMe
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {formatCurrency(d.remainingNum)}
                      </span>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <span>Total: {formatCurrency(d.amountNum)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  {d.dueDate ? (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" /> Due {d.dueDate}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    {!isSettled && (
                      <button
                        onClick={() => handleOpenSettle(d)}
                        className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                      >
                        Settle
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
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

      {/* Modals */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          fetchDebts();
        }}
        debtToEdit={debtToEdit}
      />

      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          fetchDebts();
        }}
        debt={selectedDebtForSettle}
      />
    </div>
  );
}
