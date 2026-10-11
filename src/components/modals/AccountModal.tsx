"use client";

import React, { useState, useEffect } from "react";
import { useFinance, AccountItem } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { DynamicIcon } from "@/components/DynamicIcon";
import { X, Landmark, Wallet, CreditCard, PiggyBank, TrendingUp, Plus, Trash2 } from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: AccountItem | null;
}

const accountIcons = [
  { name: "Landmark", label: "Bank" },
  { name: "Wallet", label: "Wallet/Cash" },
  { name: "CreditCard", label: "Credit Card" },
  { name: "PiggyBank", label: "Savings" },
  { name: "TrendingUp", label: "Investments" },
];

const accountColors = [
  "#2563EB", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#64748B", // Slate
];

export function AccountModal({ isOpen, onClose, accountToEdit }: AccountModalProps) {
  const { refreshAll, currency } = useFinance();
  const { success, error } = useToast();

  const isEditing = Boolean(accountToEdit);

  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountNumberLast4, setAccountNumberLast4] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [icon, setIcon] = useState("Landmark");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setBalance(accountToEdit.balance);
      setCreditLimit(accountToEdit.creditLimit || "");
      setInstitution(accountToEdit.institution || "");
      setAccountNumberLast4(accountToEdit.accountNumberLast4 || "");
      setColor(accountToEdit.color);
      setIcon(accountToEdit.icon);
      setIsDefault(accountToEdit.isDefault);
    } else {
      setName("");
      setType("checking");
      setBalance("0.00");
      setCreditLimit("");
      setInstitution("");
      setAccountNumberLast4("");
      setColor("#2563EB");
      setIcon("Landmark");
      setIsDefault(false);
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Account name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        type,
        balance: parseFloat(balance || "0").toFixed(2),
        creditLimit: type === "credit" && creditLimit ? parseFloat(creditLimit).toFixed(2) : null,
        institution: institution.trim() || null,
        accountNumberLast4: accountNumberLast4.trim() || null,
        color,
        icon,
        isDefault,
        currency,
      };

      const url = isEditing ? `/api/accounts/${accountToEdit?.id}` : "/api/accounts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success(isEditing ? "Account Updated" : "Account Created", `${name} is ready.`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to save account");
      }
    } catch {
      error("An error occurred while saving account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToEdit) return;
    if (!confirm(`Are you sure you want to delete ${accountToEdit.name}? Associated transactions may be removed.`)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/accounts/${accountToEdit.id}`, { method: "DELETE" });
      if (res.ok) {
        success("Account Removed", `${accountToEdit.name} was deleted.`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to delete account");
      }
    } catch {
      error("Error deleting account");
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
              {isEditing ? "Edit Account" : "Add Financial Account"}
            </h3>
            <p className="text-xs text-slate-400">Track liquid cash, cards, and investments</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Account Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "checking", label: "Checking", icon: "Landmark" },
                { type: "savings", label: "Savings", icon: "PiggyBank" },
                { type: "credit", label: "Credit Card", icon: "CreditCard" },
                { type: "cash", label: "Cash", icon: "Wallet" },
                { type: "investment", label: "Investment", icon: "TrendingUp" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setType(item.type);
                    setIcon(item.icon);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    type === item.type
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Account Name</label>
            <input
              type="text"
              placeholder="e.g. Chase Sapphire Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Current Balance ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm font-semibold text-white focus:outline-none"
              />
            </div>
            {type === "credit" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Credit Limit ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10000.00"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Institution & Last 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Bank / Institution</label>
              <input
                type="text"
                placeholder="e.g. JPMorgan Chase"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                placeholder="e.g. 4892"
                value={accountNumberLast4}
                onChange={(e) => setAccountNumberLast4(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Color & Icon Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Theme Color</label>
            <div className="flex items-center gap-2">
              {accountColors.map((c) => (
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

          {/* Default Account Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
            />
            <label htmlFor="isDefault" className="text-xs font-medium text-slate-300 cursor-pointer">
              Set as primary/default account for transactions
            </label>
          </div>

          {/* Actions */}
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
                {isSubmitting ? "Saving..." : isEditing ? "Update Account" : "Create Account"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
