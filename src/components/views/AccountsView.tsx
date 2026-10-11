"use client";

import React, { useState } from "react";
import { useFinance, AccountItem } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import { AccountModal } from "@/components/modals/AccountModal";
import {
  Landmark,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  DollarSign,
  Building,
  CreditCard as CardIcon,
} from "lucide-react";

export function AccountsView() {
  const { accounts, formatCurrency, formatCompact, openTransactionModal, currency } = useFinance();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountItem | null>(null);

  const handleOpenCreate = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountItem) => {
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  // Group accounts by type
  const checkingAccounts = accounts.filter((a) => a.type === "checking");
  const savingsAccounts = accounts.filter((a) => a.type === "savings");
  const creditAccounts = accounts.filter((a) => a.type === "credit");
  const investmentAccounts = accounts.filter((a) => a.type === "investment");
  const cashAccounts = accounts.filter((a) => a.type === "cash");

  const totalLiquid = accounts
    .filter((a) => a.type === "checking" || a.type === "savings" || a.type === "cash")
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const totalCreditDebt = creditAccounts.reduce(
    (sum, a) => (parseFloat(a.balance) < 0 ? sum + Math.abs(parseFloat(a.balance)) : sum),
    0
  );

  const totalInvestments = investmentAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Accounts & Wallets</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Track bank accounts, credit limits, liquidity, and portfolios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTransactionModal({ type: "transfer" })}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer Funds
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Aggregate Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Liquid Cash & Checking</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">{formatCurrency(totalLiquid)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Available across checking & cash</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Credit Card Balance / Debt</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-400 mt-2">-{formatCurrency(totalCreditDebt)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Owed on credit accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Investment Portfolios</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-400 mt-2">{formatCurrency(totalInvestments)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Stocks, index funds & ETFs</p>
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          All Active Accounts ({accounts.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const numBal = parseFloat(acc.balance);
            const isNegative = numBal < 0;

            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Accent Color Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: acc.color }}
                />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: `${acc.color}25`, color: acc.color }}
                    >
                      <DynamicIcon name={acc.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                        {acc.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-semibold">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 capitalize">
                        {acc.institution || acc.type}
                        {acc.accountNumberLast4 ? ` ••${acc.accountNumberLast4}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balance Section */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    {acc.type === "credit" ? "Current Balance" : "Available Funds"}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-2xl font-black ${
                        isNegative ? "text-amber-400" : "text-white"
                      }`}
                    >
                      {formatCurrency(acc.balance)}
                    </span>
                    {acc.type === "credit" && acc.creditLimit && (
                      <span className="text-xs text-slate-400">
                        Limit: {formatCurrency(acc.creditLimit)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => openTransactionModal({ accountId: acc.id })}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    + Log Transaction
                  </button>
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={accountToEdit}
      />
    </div>
  );
}
