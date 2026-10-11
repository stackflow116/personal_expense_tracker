"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance, TransactionItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { ImportExportModal } from "@/components/modals/ImportExportModal";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
  Calendar,
  ArrowUpDown,
  CheckSquare,
  Square,
  ArrowRightLeft,
  X,
  RefreshCw,
} from "lucide-react";

export function TransactionsView() {
  const {
    formatCurrency,
    openTransactionModal,
    categories,
    accounts,
    refreshAll,
    currency,
  } = useFinance();
  const { success, error } = useToast();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netAmount: 0 });
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoadingTxs(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      if (accountFilter !== "all") params.append("accountId", accountFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalCount(data.totalCount || 0);
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, netAmount: 0 });
      }
    } catch {
      console.error("Failed to fetch transactions");
    } finally {
      setIsLoadingTxs(false);
    }
  }, [query, typeFilter, categoryFilter, accountFilter, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected transactions? Balances will be restored.`)) return;

    try {
      setIsBulkDeleting(true);
      const res = await fetch("/api/transactions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        success("Bulk Delete Complete", `Deleted ${selectedIds.length} transactions`);
        setSelectedIds([]);
        await fetchTransactions();
        await refreshAll();
      } else {
        error("Failed to delete selected transactions");
      }
    } catch {
      error("Error deleting items");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(query) ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    accountFilter !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    statusFilter !== "all";

  // Pagination slicing
  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Top Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Transactions & Ledger</h2>
          <p className="text-xs sm:text-sm text-slate-400">Search, filter, and inspect daily financial records</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImportExportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Import / Export
          </button>
          <button
            onClick={() => openTransactionModal()}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* Summary KPI Bar for Selected Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Income (Filtered)</span>
            <span className="text-lg font-bold text-emerald-400">+{formatCurrency(summary.totalIncome)}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
            Income
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Expense (Filtered)</span>
            <span className="text-lg font-bold text-rose-400">-{formatCurrency(summary.totalExpense)}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold">
            Expenses
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Net Flow (Filtered)</span>
            <span
              className={`text-lg font-bold ${
                summary.netAmount >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {summary.netAmount >= 0 ? "+" : ""}
              {formatCurrency(summary.netAmount)}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{totalCount} items</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, merchant, tags, or notes..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Type Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            {["all", "expense", "income", "transfer"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  typeFilter === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Dropdown */}
          <select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="From Date"
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="To Date"
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          />
        </div>

        {/* Active Filter Clear Tag */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">
              Showing filtered results ({transactions.length} found)
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (if selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/60 border border-blue-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">{selectedIds.length} transactions selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 text-slate-300 hover:text-white"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-white transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoadingTxs ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400" />
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No transactions found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing date filters, or log a new transaction.
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-400 bg-blue-950 border border-blue-800 rounded-xl"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => openTransactionModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
              >
                Add Your First Transaction
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3 w-8">
                      <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                        {selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description & Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Tags</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.map((tx) => {
                    let parsedTags: string[] = [];
                    try {
                      parsedTags = JSON.parse(tx.tags || "[]");
                    } catch {
                      parsedTags = [];
                    }

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          selectedIds.includes(tx.id) ? "bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleSelect(tx.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {selectedIds.includes(tx.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${tx.categoryColor || "#3b82f6"}20`,
                                color: tx.categoryColor || "#3b82f6",
                              }}
                            >
                              <DynamicIcon name={tx.categoryIcon || "Tag"} className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-white block">{tx.description}</span>
                              {tx.merchant && (
                                <span className="text-[11px] text-slate-400">{tx.merchant}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300">
                            {tx.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {tx.type === "transfer" && tx.transferToAccountName ? (
                            <span className="text-blue-300 text-[11px] flex items-center gap-1">
                              {tx.accountName} <ArrowRightLeft className="w-3 h-3" /> {tx.transferToAccountName}
                            </span>
                          ) : (
                            tx.accountName
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize text-slate-400 text-[11px]">
                            {tx.paymentMethod?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {parsedTags.slice(0, 2).map((tg) => (
                              <span
                                key={tg}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono"
                              >
                                #{tg}
                              </span>
                            ))}
                            {parsedTags.length > 2 && (
                              <span className="text-[10px] text-slate-500">+{parsedTags.length - 2}</span>
                            )}
                          </div>
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
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openTransactionModal(tx)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs">
                <span className="text-slate-400">
                  Page <strong className="text-white">{currentPage}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong> ({transactions.length} items)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
      />
    </div>
  );
}
