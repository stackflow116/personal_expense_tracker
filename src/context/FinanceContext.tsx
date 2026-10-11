"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { formatCurrency as formatCurr, formatCompactCurrency as formatCompact } from "@/lib/formatters";
import { useToast } from "@/components/ToastProvider";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  monthlyBudgetLimit?: string;
  dailyBudgetLimit?: string;
  savingsTargetRate?: number;
}

export interface AccountItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: string;
  currency: string;
  color: string;
  icon: string;
  accountNumberLast4?: string | null;
  institution?: string | null;
  creditLimit?: string | null;
  isDefault: boolean;
}

export interface CategoryItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  budgetAmount: string;
  isSystem: boolean;
}

export interface TransactionItem {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: "expense" | "income" | "transfer";
  amount: string;
  date: string;
  description: string;
  merchant?: string | null;
  notes?: string | null;
  status: string;
  paymentMethod: string;
  tags: string;
  isRecurring: boolean;
  recurringRuleId?: string | null;
  transferToAccountId?: string | null;
  receiptUrl?: string | null;
  accountName?: string;
  accountColor?: string;
  accountIcon?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  transferToAccountName?: string | null;
}

export interface DashboardData {
  user: UserProfile;
  balances: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    liquidCash: number;
    currency: string;
  };
  cashflow: {
    thisMonthIncome: number;
    thisMonthExpense: number;
    netCashflow: number;
    savingsRate: number;
    todayExpense: number;
    monthlyBudgetLimit: number;
    dailyBudgetLimit: number;
    monthlyBudgetPercent: number;
    dailyBudgetPercent: number;
  };
  accounts: AccountItem[];
  categorySpending: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    spent: number;
    budget: number;
    percent: number;
    isOver: boolean;
  }>;
  dailyTrend: Array<{
    date: string;
    label: string;
    shortDay: string;
    expense: number;
    income: number;
    net: number;
  }>;
  monthlyHistory: Array<{
    month: string;
    income: number;
    expense: number;
    savings: number;
  }>;
  recentTransactions: TransactionItem[];
  goals: Array<{
    id: string;
    title: string;
    targetAmount: string;
    currentAmount: string;
    targetNum: number;
    currentNum: number;
    percent: number;
    targetDate?: string | null;
    category: string;
    color: string;
    icon: string;
    isCompleted: boolean;
  }>;
  recurringRules: Array<{
    id: string;
    title: string;
    amount: string;
    type: string;
    frequency: string;
    nextDueDate: string;
    status: string;
  }>;
  debts: Array<{
    id: string;
    personName: string;
    type: string;
    amount: string;
    settledAmount: string;
    description: string;
    status: string;
  }>;
  totalTransactionsCount: number;
}

interface FinanceContextType {
  user: UserProfile | null;
  availableUsers: UserProfile[];
  dashboardData: DashboardData | null;
  accounts: AccountItem[];
  categories: CategoryItem[];
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  formatCurrency: (val: number | string | null | undefined) => string;
  formatCompact: (val: number | string | null | undefined) => string;
  refreshAll: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  // Modal states
  isTransactionModalOpen: boolean;
  openTransactionModal: (initialData?: Partial<TransactionItem> | null) => void;
  closeTransactionModal: () => void;
  transactionModalInitialData: Partial<TransactionItem> | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { success, error, info } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialData, setTransactionModalInitialData] = useState<Partial<TransactionItem> | null>(null);

  const currency = user?.currency || "USD";

  const formatCurrency = useCallback(
    (val: number | string | null | undefined) => formatCurr(val, currency),
    [currency]
  );

  const formatCompactVal = useCallback(
    (val: number | string | null | undefined) => formatCompact(val, currency),
    [currency]
  );

  const openTransactionModal = useCallback((initialData?: Partial<TransactionItem> | null) => {
    setTransactionModalInitialData(initialData || null);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setTransactionModalInitialData(null);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [userRes, dashRes, accRes, catRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/dashboard"),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (userRes.ok) {
        const uData = await userRes.json();
        setUser(uData.user);
        setAvailableUsers(uData.availableUsers || []);
      }

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setDashboardData(dData);
      }

      if (accRes.ok) {
        const aData = await accRes.json();
        setAccounts(aData.accounts || []);
      }

      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error("Error refreshing finance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", userId }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await refreshAll();
        success("Profile Switched", `Now viewing data for ${data.user.name}`);
      } else {
        error("Failed to switch profile");
      }
    } catch {
      error("An error occurred while switching profile");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemoData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (res.ok) {
        await refreshAll();
        success("Demo Data Reset", "Restored realistic transactions, budgets, accounts and goals.");
      } else {
        error("Failed to reset demo data");
      }
    } catch {
      error("Network error while resetting demo data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        availableUsers,
        dashboardData,
        accounts,
        categories,
        isLoading,
        activeTab,
        setActiveTab,
        currency,
        formatCurrency,
        formatCompact: formatCompactVal,
        refreshAll,
        switchUser,
        resetDemoData,
        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        transactionModalInitialData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return context;
}
