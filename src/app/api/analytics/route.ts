import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts, recurringRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { subDays, format, parseISO, eachDayOfInterval } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "90"; // 30, 60, 90, 180, 365
    const numDays = parseInt(range, 10) || 90;

    const today = new Date();
    const cutoffDate = format(subDays(today, numDays), "yyyy-MM-dd");

    const [userTxs, userCats, userAccs, userRecurring] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date)),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(recurringRules).where(eq(recurringRules.userId, userId)),
    ]);

    const catMap = new Map(userCats.map((c) => [c.id, c]));

    const filteredTxs = userTxs.filter((t) => t.date >= cutoffDate);

    // 1. Daily Heatmap / Spending Calendar
    const daysInterval = eachDayOfInterval({
      start: subDays(today, Math.min(numDays, 90)),
      end: today,
    });

    const daySpendingMap: Record<string, { date: string; amount: number; count: number; dayOfWeek: string; shortDate: string }> = {};
    daysInterval.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      daySpendingMap[key] = {
        date: key,
        amount: 0,
        count: 0,
        dayOfWeek: format(d, "EEE"),
        shortDate: format(d, "MMM d"),
      };
    });

    let totalExpense = 0;
    let totalIncome = 0;
    let maxDaySpend = 0;
    let maxDaySpendObj = { date: "", amount: 0 };

    const merchantMap: Record<string, { name: string; total: number; count: number; category: string }> = {};
    const paymentMethodMap: Record<string, number> = {};
    const tagMap: Record<string, { tag: string; total: number; count: number }> = {};
    const categoryTotals: Record<string, number> = {};

    filteredTxs.forEach((t) => {
      const amt = parseFloat(t.amount);

      if (t.type === "expense") {
        totalExpense += amt;

        if (daySpendingMap[t.date]) {
          daySpendingMap[t.date].amount += amt;
          daySpendingMap[t.date].count += 1;
        }

        // Category Totals
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + amt;

        // Merchant Leaderboard
        const merch = t.merchant || t.description;
        if (merch) {
          const mKey = merch.trim();
          if (!merchantMap[mKey]) {
            const cat = catMap.get(t.categoryId);
            merchantMap[mKey] = { name: mKey, total: 0, count: 0, category: cat?.name || "General" };
          }
          merchantMap[mKey].total += amt;
          merchantMap[mKey].count += 1;
        }

        // Payment Methods
        const method = t.paymentMethod || "card";
        paymentMethodMap[method] = (paymentMethodMap[method] || 0) + amt;

        // Tags
        try {
          const tags: string[] = JSON.parse(t.tags || "[]");
          tags.forEach((tag) => {
            if (!tagMap[tag]) {
              tagMap[tag] = { tag, total: 0, count: 0 };
            }
            tagMap[tag].total += amt;
            tagMap[tag].count += 1;
          });
        } catch {
          // ignore tag json errors
        }
      } else if (t.type === "income") {
        totalIncome += amt;
      }
    });

    // Compute max spending day
    Object.values(daySpendingMap).forEach((d) => {
      if (d.amount > maxDaySpend) {
        maxDaySpend = d.amount;
        maxDaySpendObj = { date: d.shortDate, amount: Math.round(d.amount) };
      }
    });

    const activeDaysCount = Object.values(daySpendingMap).length || 1;
    const dailyAverage = totalExpense / activeDaysCount;

    // Top Merchants
    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((m) => ({
        ...m,
        total: Math.round(m.total * 100) / 100,
        percent: totalExpense > 0 ? Math.round((m.total / totalExpense) * 100) : 0,
      }));

    // Category Distribution
    const categoryDistribution = Object.entries(categoryTotals)
      .map(([catId, spent]) => {
        const cat = catMap.get(catId);
        return {
          id: catId,
          name: cat?.name || "Other",
          color: cat?.color || "#64748B",
          icon: cat?.icon || "Tag",
          spent: Math.round(spent * 100) / 100,
          percent: totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    // Payment Methods Breakdown
    const paymentMethods = Object.entries(paymentMethodMap).map(([method, amount]) => ({
      method,
      amount: Math.round(amount * 100) / 100,
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }));

    // Top Tags
    const topTags = Object.values(tagMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Cashflow Projection for next 30 days
    let projectedBalance = 0;
    userAccs.forEach((a) => {
      const b = parseFloat(a.balance);
      if (a.type !== "credit") projectedBalance += b;
      else projectedBalance -= Math.abs(b);
    });

    const dailyNetRecurring = userRecurring.reduce((acc, r) => {
      const amt = parseFloat(r.amount);
      const mult = r.frequency === "daily" ? 1 : r.frequency === "weekly" ? 1 / 7 : 1 / 30;
      return r.type === "income" ? acc + amt * mult : acc - amt * mult;
    }, 0);

    const projectionDays = [];
    let curProjected = projectedBalance;
    for (let i = 1; i <= 30; i++) {
      const pDate = new Date();
      pDate.setDate(today.getDate() + i);
      curProjected += dailyNetRecurring - (dailyAverage * 0.7); // realistic blend
      projectionDays.push({
        day: format(pDate, "MMM dd"),
        projectedBalance: Math.round(curProjected),
      });
    }

    return NextResponse.json({
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netCashflow: Math.round((totalIncome - totalExpense) * 100) / 100,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        maxSpendingDay: maxDaySpendObj,
        rangeDays: numDays,
      },
      heatmap: Object.values(daySpendingMap),
      topMerchants,
      categoryDistribution,
      paymentMethods,
      topTags,
      projection: projectionDays,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
