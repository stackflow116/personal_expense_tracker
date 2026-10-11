"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  CreditCard,
  Target,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function DashboardView() {
  const {
    dashboardData,
    isLoading,
    formatCurrency,
    formatCompact,
    openTransactionModal,
    setActiveTab,
    accounts,
    currency,
  } = useFinance();

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/80 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900/80 rounded-2xl border border-slate-800" />
          <div className="h-80 bg-slate-900/80 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  const { balances, cashflow, categorySpending, dailyTrend, monthlyHistory, recentTransactions, goals, recurringRules } =
    dashboardData;

  const nextUpcomingBills = recurringRules
    .filter((r) => r.status === "active" && r.type === "expense")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-900/40 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {dashboardData.user.name}</span>
            <span className="text-xl">{dashboardData.user.avatar || "👋"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here is your daily financial snapshot for today,{" "}
            <span className="text-slate-200 font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </p>
        </div>

        {/* Quick Transaction Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openTransactionModal({ type: "expense" })}
            className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => openTransactionModal({ type: "income" })}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Income
          </button>
          <button
            onClick={() => openTransactionModal({ type: "transfer" })}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer
          </button>
        </div>
      </div>

      {/* 4 Primary High-Level Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Worth</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatCurrency(balances.netWorth)}</h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">Assets: {formatCompact(balances.totalAssets)}</span>
              <span>•</span>
              <span className="text-rose-400 font-medium">Debt: {formatCompact(balances.totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Cashflow */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Month Cashflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-black ${
                cashflow.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {cashflow.netCashflow >= 0 ? "+" : ""}
              {formatCurrency(cashflow.netCashflow)}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span>Saved <strong className="text-white">{cashflow.savingsRate}%</strong> of income</span>
            </div>
          </div>
        </div>

        {/* Today's Spending vs Daily Limit */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Spend</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                cashflow.dailyBudgetPercent > 100
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatCurrency(cashflow.todayExpense)}</h3>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400">Daily Target: {formatCurrency(cashflow.dailyBudgetLimit)}</span>
              <span
                className={`font-bold ${
                  cashflow.dailyBudgetPercent > 100 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {cashflow.dailyBudgetPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Budget Consumption */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Spend</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatCurrency(cashflow.thisMonthExpense)}</h3>
            <div className="mt-2.5">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    cashflow.monthlyBudgetPercent > 100
                      ? "bg-rose-500"
                      : cashflow.monthlyBudgetPercent > 80
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, cashflow.monthlyBudgetPercent)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
                <span>Limit: {formatCompact(cashflow.monthlyBudgetLimit)}</span>
                <span className="font-semibold text-white">{cashflow.monthlyBudgetPercent}% used</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">14-Day Spending Velocity</h3>
              <p className="text-xs text-slate-400">Daily expenses and income trends</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Expense</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Income</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="shortDay" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.label} ({data.shortDay})</p>
                          <p className="text-rose-400">Expense: {formatCurrency(data.expense)}</p>
                          {data.income > 0 && <p className="text-emerald-400">Income: {formatCurrency(data.income)}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Category Donut / Breakdown (1 col) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">Spending by Category</h3>
              <p className="text-xs text-slate-400">Where your money went this month</p>
            </div>
            <button
              onClick={() => setActiveTab("budgets")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Budgets →
            </button>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpending.slice(0, 6)}
                  dataKey="spent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {categorySpending.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0), "Spent"]}
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "0.75rem", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 flex-1 overflow-y-auto max-h-36 pr-1">
            {categorySpending.slice(0, 5).map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 font-medium truncate max-w-[130px]">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(cat.spent)}</span>
                  {cat.percent > 0 && (
                    <span className="text-slate-400 text-[11px] ml-1.5 font-normal">
                      ({cat.percent}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Accounts Summary & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts / Wallets Overview */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-white">Accounts & Balances</h3>
            </div>
            <button
              onClick={() => setActiveTab("accounts")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                  >
                    <DynamicIcon name={acc.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{acc.name}</h4>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {acc.type} {acc.accountNumberLast4 ? `(••${acc.accountNumberLast4})` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      acc.type === "credit" && parseFloat(acc.balance) < 0
                        ? "text-amber-400"
                        : "text-white"
                    }`}
                  >
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goals Widgets */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Savings Targets</h3>
            </div>
            <button
              onClick={() => setActiveTab("goals")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {goals.slice(0, 3).map((g) => (
              <div key={g.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${g.color}25`, color: g.color }}
                    >
                      <DynamicIcon name={g.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white truncate max-w-[150px]">{g.title}</span>
                  </div>
                  <span className="font-bold text-emerald-400">{g.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, g.percent)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>{formatCurrency(g.currentNum)} saved</span>
                  <span>Target: {formatCurrency(g.targetNum)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills & Commitments */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Upcoming Bills</h3>
            </div>
            <button
              onClick={() => setActiveTab("recurring")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Subscriptions →
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {nextUpcomingBills.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No scheduled bills this week</div>
            ) : (
              nextUpcomingBills.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      Due: <span className="text-amber-400 font-medium">{r.nextDueDate}</span> ({r.frequency})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400">-{formatCurrency(r.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent 8 Daily Transactions Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Daily Transactions</h3>
            <p className="text-xs text-slate-400">Latest activity across your accounts</p>
          </div>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Full Ledger & Filter <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tx.categoryColor || "#3b82f6"}20`, color: tx.categoryColor || "#3b82f6" }}
                      >
                        <DynamicIcon name={tx.categoryIcon || "Tag"} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{tx.description}</span>
                        {tx.merchant && <span className="text-[11px] text-slate-400">{tx.merchant}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300">
                      {tx.categoryName}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{tx.accountName}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize text-slate-400 text-[11px]">
                      {tx.paymentMethod?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-xs">
                    {tx.type === "expense" ? (
                      <span className="text-rose-400">-{formatCurrency(tx.amount)}</span>
                    ) : tx.type === "income" ? (
                      <span className="text-emerald-400">+{formatCurrency(tx.amount)}</span>
                    ) : (
                      <span className="text-blue-400">⇄ {formatCurrency(tx.amount)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => openTransactionModal(tx)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
