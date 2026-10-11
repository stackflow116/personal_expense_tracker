"use client";

import React, { useState, useEffect } from "react";
import { useFinance, TransactionItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Plus, Trash2, ArrowRightLeft, DollarSign, Calendar, Tag, CreditCard, Building } from "lucide-react";
import { format } from "date-fns";

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    transactionModalInitialData,
    accounts,
    categories,
    refreshAll,
    currency,
  } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(transactionModalInitialData?.id);

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [merchant, setMerchant] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [transferToAccountId, setTransferToAccountId] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [status, setStatus] = useState<string>("cleared");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (transactionModalInitialData) {
      setType(transactionModalInitialData.type || "expense");
      setAmount(transactionModalInitialData.amount ? String(Math.abs(parseFloat(transactionModalInitialData.amount))) : "");
      setDescription(transactionModalInitialData.description || "");
      setMerchant(transactionModalInitialData.merchant || "");
      setCategoryId(transactionModalInitialData.categoryId || (categories[0]?.id ?? ""));
      setAccountId(transactionModalInitialData.accountId || (accounts[0]?.id ?? ""));
      setTransferToAccountId(transactionModalInitialData.transferToAccountId || (accounts[1]?.id ?? ""));
      setDate(transactionModalInitialData.date || format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod(transactionModalInitialData.paymentMethod || "card");
      setStatus(transactionModalInitialData.status || "cleared");
      setNotes(transactionModalInitialData.notes || "");

      try {
        if (transactionModalInitialData.tags) {
          const parsed = JSON.parse(transactionModalInitialData.tags);
          setTags(Array.isArray(parsed) ? parsed : []);
        } else {
          setTags([]);
        }
      } catch {
        setTags([]);
      }
    } else {
      // Defaults
      setType("expense");
      setAmount("");
      setDescription("");
      setMerchant("");
      setCategoryId(categories.find((c) => c.type === "expense")?.id || categories[0]?.id || "");
      const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
      setAccountId(defaultAcc?.id || "");
      const secondAcc = accounts.find((a) => a.id !== defaultAcc?.id) || accounts[0];
      setTransferToAccountId(secondAcc?.id || "");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod("card");
      setStatus("cleared");
      setTags([]);
      setNotes("");
    }
  }, [transactionModalInitialData, isTransactionModalOpen, accounts, categories]);

  if (!isTransactionModalOpen) return null;

  const handleAddTag = (t: string) => {
    const cleaned = t.trim().toLowerCase().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const quickTagSuggestions = ["dining", "groceries", "essential", "tax-deductible", "tech", "bills", "subscription", "travel", "coffee"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      error("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      error("Please provide a description");
      return;
    }
    if (!accountId) {
      error("Please select an account");
      return;
    }
    if (type === "transfer" && accountId === transferToAccountId) {
      error("From and To accounts cannot be identical");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type,
        amount: parseFloat(amount).toFixed(2),
        description: description.trim(),
        merchant: merchant.trim() || description.trim(),
        categoryId: type === "transfer" ? (categories[0]?.id || "cat_misc") : categoryId,
        accountId,
        transferToAccountId: type === "transfer" ? transferToAccountId : null,
        date,
        paymentMethod,
        status,
        tags,
        notes: notes.trim(),
      };

      const url = isEditing ? `/api/transactions/${transactionModalInitialData?.id}` : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(
          isEditing ? "Transaction Updated" : "Transaction Logged",
          `${type === "expense" ? "Spent" : type === "income" ? "Earned" : "Transferred"} ${currency} ${parseFloat(amount).toFixed(2)}`
        );
        await refreshAll();
        closeTransactionModal();
      } else {
        const data = await res.json();
        error(data.error || "Failed to save transaction");
      }
    } catch {
      error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionModalInitialData?.id) return;
    if (!confirm("Are you sure you want to delete this transaction? Account balance will be restored.")) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/transactions/${transactionModalInitialData.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        success("Transaction Deleted", "The entry was removed and balances recalculated.");
        await refreshAll();
        closeTransactionModal();
      } else {
        error("Failed to delete transaction");
      }
    } catch {
      error("Error deleting transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === "expense") return c.type === "expense" || c.type === "both";
    if (type === "income") return c.type === "income" || c.type === "both";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? "Edit Transaction" : "Log New Transaction"}
            </h3>
            <p className="text-xs text-slate-400">Track and categorize daily cashflow</p>
          </div>
          <button
            onClick={closeTransactionModal}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                const firstExp = categories.find((c) => c.type === "expense") || categories[0];
                if (firstExp) setCategoryId(firstExp.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === "expense"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                const firstInc = categories.find((c) => c.type === "income") || categories[0];
                if (firstInc) setCategoryId(firstInc.id);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("transfer")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === "transfer"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Amount ({currency})</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {type === "expense" ? "-" : type === "income" ? "+" : "⇄"}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-3 text-2xl font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Description / Item</label>
              <input
                type="text"
                placeholder="e.g. Whole Foods Groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Merchant / Payee (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Whole Foods"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Picker (if not Transfer) */}
          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                      categoryId === c.id
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.color}25`, color: c.color }}
                    >
                      <DynamicIcon name={c.icon} className="w-3 h-3" />
                    </div>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Pickers */}
          {type === "transfer" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">From Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.balance})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">To Account</label>
                <select
                  value={transferToAccountId}
                  onChange={(e) => setTransferToAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.balance})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Account / Wallet</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency} {acc.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date, Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="apple_pay">Apple Pay / Google Pay</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="reconciled">Reconciled</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Tags</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-blue-950/70 border border-blue-800 text-blue-300"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add tag + Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 w-28"
                />
              </div>
            </div>
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[11px] text-slate-500 self-center mr-1">Suggestions:</span>
              {quickTagSuggestions
                .filter((s) => !tags.includes(s))
                .slice(0, 5)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddTag(s)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    +{s}
                  </button>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Add details, receipt memo, invoice numbers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
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
                onClick={closeTransactionModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : isEditing ? (
                  "Update Transaction"
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Log Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
