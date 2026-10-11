import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, categories, transactions, budgets, savingsGoals, recurringRules, debtSplits } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const monthStartStr = format(startOfMonth(today), "yyyy-MM-dd");
    const monthEndStr = format(endOfMonth(today), "yyyy-MM-dd");
    const currentMonthYear = format(today, "yyyy-MM");

    // 1. Fetch user accounts
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    // 2. Fetch categories
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    const categoryMap = new Map(userCategories.map((c) => [c.id, c]));

    // 3. Fetch all user transactions
    const allUserTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    // 4. Fetch budgets for current month
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.monthYear, currentMonthYear)));

    // 5. Fetch savings goals
    const userGoals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId));

    // 6. Fetch recurring rules
    const userRecurring = await db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.userId, userId));

    // 7. Fetch debts
    const userDebts = await db
      .select()
      .from(debtSplits)
      .where(eq(debtSplits.userId, userId));

    // Calculate balances
    let totalAssets = 0;
    let totalLiabilities = 0;
    let liquidCash = 0;

    userAccounts.forEach((acc) => {
      const balance = parseFloat(acc.balance);
      if (acc.type === "credit") {
        // Credit card debt is liability
        if (balance < 0) {
          totalLiabilities += Math.abs(balance);
        } else {
          totalAssets += balance;
        }
      } else {
        if (balance >= 0) {
          totalAssets += balance;
        } else {
          totalLiabilities += Math.abs(balance);
        }

        if (acc.type === "checking" || acc.type === "cash" || acc.type === "savings") {
          liquidCash += balance;
        }
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    // Filter transactions for this month
    const thisMonthTransactions = allUserTransactions.filter(
      (t) => t.date >= monthStartStr && t.date <= monthEndStr
    );

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let todayExpense = 0;

    const categoryExpenseMap: Record<string, number> = {};

    thisMonthTransactions.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "income") {
        thisMonthIncome += amt;
      } else if (t.type === "expense") {
        thisMonthExpense += amt;
        categoryExpenseMap[t.categoryId] = (categoryExpenseMap[t.categoryId] || 0) + amt;

        if (t.date === todayStr) {
          todayExpense += amt;
        }
      }
    });

    const netCashflow = thisMonthIncome - thisMonthExpense;
    const savingsRate = thisMonthIncome > 0 ? Math.max(0, (netCashflow / thisMonthIncome) * 100) : 0;

    // Monthly category breakdown
    const categorySpending = userCategories
      .filter((c) => c.type === "expense" || c.type === "both")
      .map((c) => {
        const spent = categoryExpenseMap[c.id] || 0;
        const budgetItem = userBudgets.find((b) => b.categoryId === c.id);
        const budgetAmount = budgetItem ? parseFloat(budgetItem.allocatedAmount) : parseFloat(c.budgetAmount || "0");
        const percent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          spent,
          budget: budgetAmount,
          percent: Math.round(percent),
          isOver: spent > budgetAmount && budgetAmount > 0,
        };
      })
      .filter((c) => c.spent > 0 || c.budget > 0)
      .sort((a, b) => b.spent - a.spent);

    // Daily spending for the last 14 days chart
    const past14Days = eachDayOfInterval({
      start: subDays(today, 13),
      end: today,
    });

    const dailyTrend = past14Days.map((d) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const label = format(d, "MMM dd");
      const shortDay = format(d, "EEE");

      let exp = 0;
      let inc = 0;

      allUserTransactions.forEach((t) => {
        if (t.date === dateKey) {
          if (t.type === "expense") exp += parseFloat(t.amount);
          if (t.type === "income") inc += parseFloat(t.amount);
        }
      });

      return {
        date: dateKey,
        label,
        shortDay,
        expense: Math.round(exp * 100) / 100,
        income: Math.round(inc * 100) / 100,
        net: Math.round((inc - exp) * 100) / 100,
      };
    });

    // 6-Month Income vs Expense history
    const monthlyHistoryMap: Record<string, { month: string; income: number; expense: number; savings: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const mDate = subDays(today, i * 30);
      const mKey = format(mDate, "yyyy-MM");
      const mLabel = format(mDate, "MMM yyyy");
      monthlyHistoryMap[mKey] = {
        month: mLabel,
        income: 0,
        expense: 0,
        savings: 0,
      };
    }

    allUserTransactions.forEach((t) => {
      const mKey = t.date.substring(0, 7);
      if (monthlyHistoryMap[mKey]) {
        const amt = parseFloat(t.amount);
        if (t.type === "income") {
          monthlyHistoryMap[mKey].income += amt;
        } else if (t.type === "expense") {
          monthlyHistoryMap[mKey].expense += amt;
        }
      }
    });

    const monthlyHistory = Object.values(monthlyHistoryMap).map((m) => ({
      ...m,
      income: Math.round(m.income),
      expense: Math.round(m.expense),
      savings: Math.round(m.income - m.expense),
    }));

    // Enriched recent transactions (with account and category names)
    const recentTransactions = allUserTransactions.slice(0, 10).map((t) => {
      const acc = userAccounts.find((a) => a.id === t.accountId);
      const cat = categoryMap.get(t.categoryId);
      const targetAcc = t.transferToAccountId ? userAccounts.find((a) => a.id === t.transferToAccountId) : null;
      return {
        ...t,
        accountName: acc ? acc.name : "Unknown Account",
        accountColor: acc?.color || "#3B82F6",
        accountIcon: acc?.icon || "Landmark",
        categoryName: cat ? cat.name : "Uncategorized",
        categoryColor: cat?.color || "#64748B",
        categoryIcon: cat?.icon || "Tag",
        transferToAccountName: targetAcc?.name || null,
      };
    });

    // Savings goals summary
    const goalsSummary = userGoals.map((g) => {
      const current = parseFloat(g.currentAmount);
      const target = parseFloat(g.targetAmount);
      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return {
        ...g,
        currentNum: current,
        targetNum: target,
        percent,
      };
    });

    // Monthly budget limit progress
    const userMonthlyLimit = parseFloat(user.monthlyBudgetLimit || "5000.00");
    const userDailyLimit = parseFloat(user.dailyBudgetLimit || "150.00");
    const monthlyBudgetPercent = userMonthlyLimit > 0 ? Math.round((thisMonthExpense / userMonthlyLimit) * 100) : 0;
    const dailyBudgetPercent = userDailyLimit > 0 ? Math.round((todayExpense / userDailyLimit) * 100) : 0;

    return NextResponse.json({
      user,
      balances: {
        netWorth,
        totalAssets,
        totalLiabilities,
        liquidCash,
        currency: user.currency || "USD",
      },
      cashflow: {
        thisMonthIncome,
        thisMonthExpense,
        netCashflow,
        savingsRate: Math.round(savingsRate),
        todayExpense,
        monthlyBudgetLimit: userMonthlyLimit,
        dailyBudgetLimit: userDailyLimit,
        monthlyBudgetPercent,
        dailyBudgetPercent,
      },
      accounts: userAccounts,
      categorySpending,
      dailyTrend,
      monthlyHistory,
      recentTransactions,
      goals: goalsSummary,
      recurringRules: userRecurring,
      debts: userDebts,
      totalTransactionsCount: allUserTransactions.length,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to compute dashboard metrics" }, { status: 500 });
  }
}
