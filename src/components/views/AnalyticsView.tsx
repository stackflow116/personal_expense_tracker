"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  ArrowUpRight,
  Flame,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashflow: number;
    dailyAverage: number;
    maxSpendingDay: { date: string; amount: number };
    rangeDays: number;
  };
  heatmap: Array<{
    date: string;
    amount: number;
    count: number;
    dayOfWeek: string;
    shortDate: string;
  }>;
  topMerchants: Array<{
    name: string;
    total: number;
    count: number;
    category: string;
    percent: number;
  }>;
  categoryDistribution: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    spent: number;
    percent: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percent: number;
  }>;
  topTags: Array<{
    tag: string;
    total: number;
    count: number;
  }>;
  projection: Array<{
    day: string;
    projectedBalance: number;
  }>;
}

export function AnalyticsView() {
  const { formatCurrency, formatCompact } = useFinance();

  const [range, setRange] = useState("60");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      console.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="h-72 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  const { summary, heatmap, topMerchants, categoryDistribution, paymentMethods, projection } = data;

  return (
    <div className="space-y-6">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Financial Analytics & Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Deep dive into spending cadence, merchant patterns, and liquidity forecasts
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {[
            { label: "30 Days", val: "30" },
            { label: "60 Days", val: "60" },
            { label: "90 Days", val: "90" },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => setRange(r.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r.val
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Period Spend</span>
          <h3 className="text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(summary.totalExpense)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across past {range} days</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Daily Average Spend</span>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatCurrency(summary.dailyAverage)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Burn rate per calendar day</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Peak Spending Day</span>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            {formatCurrency(summary.maxSpendingDay.amount)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">{summary.maxSpendingDay.date || "Highest day"}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 uppercase font-semibold">Net Savings Flow</span>
          <h3
            className={`text-2xl font-black mt-2 ${
              summary.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {summary.netCashflow >= 0 ? "+" : ""}
            {formatCurrency(summary.netCashflow)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Income minus expenses</p>
        </div>
      </div>

      {/* Daily Spending Calendar Heatmap */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white">Daily Spending Heatmap</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Low</span>
            <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-rose-950 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-rose-700 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span>High</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1.5 pt-2">
          {heatmap.map((cell) => {
            let bgClass = "bg-slate-950 border-slate-800 text-slate-500";
            if (cell.amount > 200) bgClass = "bg-rose-500 text-white font-bold border-rose-400 shadow-sm";
            else if (cell.amount > 100) bgClass = "bg-rose-700/80 text-rose-100 border-rose-600";
            else if (cell.amount > 40) bgClass = "bg-rose-900/60 text-rose-200 border-rose-800";
            else if (cell.amount > 0) bgClass = "bg-rose-950/40 text-rose-300 border-rose-900/50";

            return (
              <div
                key={cell.date}
                className={`p-2 rounded-xl border flex flex-col justify-between items-center text-center transition-transform hover:scale-110 cursor-pointer min-h-[58px] ${bgClass}`}
                title={`${cell.shortDate}: ${formatCurrency(cell.amount)} (${cell.count} transactions)`}
              >
                <span className="text-[10px] opacity-80">{cell.shortDate}</span>
                <span className="text-[11px] font-bold">
                  {cell.amount > 0 ? formatCompact(cell.amount) : "$0"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Merchants Leaderboard & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Top Spending Merchants</h3>
          </div>

          <div className="space-y-3 flex-1">
            {topMerchants.map((m, idx) => (
              <div key={m.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white truncate max-w-[180px]">{m.name}</span>
                    <span className="text-[10px] text-slate-400">({m.category})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">{formatCurrency(m.total)}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5 font-normal">
                      ({m.percent}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, m.percent * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 30-Day Liquidity & Cashflow Forecast */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">30-Day Cashflow Projection</h3>
              <p className="text-xs text-slate-400">Forecasted liquidity based on recurring commitments</p>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0), "Projected Balance"]}
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "0.75rem", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#projGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
