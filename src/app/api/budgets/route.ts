import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDate } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const today = new Date();
    const monthYear = searchParams.get("monthYear") || format(today, "yyyy-MM");

    const [userBudgets, userCategories, userTransactions] = await Promise.all([
      db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.monthYear, monthYear))),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(transactions).where(eq(transactions.userId, userId)),
    ]);

    const catMap = new Map(userCategories.map((c) => [c.id, c]));

    // Filter transactions for this specific month
    const startStr = `${monthYear}-01`;
    const endStr = `${monthYear}-31`;
    const monthlyTxs = userTransactions.filter(
      (t) => t.date >= startStr && t.date <= endStr && t.type === "expense"
    );

    const categorySpentMap: Record<string, number> = {};
    monthlyTxs.forEach((t) => {
      const amt = parseFloat(t.amount);
      categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + amt;
    });

    const daysInMonth = getDaysInMonth(today);
    const currentDay = getDate(today);
    const remainingDays = Math.max(1, daysInMonth - currentDay);

    let totalAllocated = 0;
    let totalSpent = 0;

    const enrichedBudgets = userBudgets.map((b) => {
      const cat = catMap.get(b.categoryId);
      const allocated = parseFloat(b.allocatedAmount);
      const spent = categorySpentMap[b.categoryId] || 0;
      const remaining = allocated - spent;
      const percent = allocated > 0 ? (spent / allocated) * 100 : 0;
      const dailyRemaining = remaining > 0 ? remaining / remainingDays : 0;

      totalAllocated += allocated;
      totalSpent += spent;

      return {
        ...b,
        categoryName: cat?.name || "Uncategorized",
        categoryColor: cat?.color || "#64748B",
        categoryIcon: cat?.icon || "Tag",
        allocatedAmountNum: allocated,
        spentAmountNum: spent,
        remainingAmountNum: remaining,
        percent: Math.round(percent),
        dailyRemainingNum: Math.round(dailyRemaining * 100) / 100,
        isOver: spent > allocated,
        isWarning: percent >= b.alertThreshold && spent <= allocated,
      };
    });

    return NextResponse.json({
      budgets: enrichedBudgets,
      monthYear,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining: totalAllocated - totalSpent,
        overallPercent: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
        remainingDays,
      },
      categories: userCategories.filter((c) => c.type === "expense" || c.type === "both"),
    });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { categoryId, allocatedAmount, monthYear, alertThreshold = 80, rollover = false } = body;

    if (!categoryId || !allocatedAmount || !monthYear) {
      return NextResponse.json({ error: "Missing required budget fields" }, { status: 400 });
    }

    const numericAllocated = parseFloat(allocatedAmount);
    if (isNaN(numericAllocated) || numericAllocated <= 0) {
      return NextResponse.json({ error: "Invalid allocated amount" }, { status: 400 });
    }

    // Check if budget exists for this month and category
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.categoryId, categoryId),
          eq(budgets.monthYear, monthYear)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(budgets)
        .set({
          allocatedAmount: numericAllocated.toFixed(2),
          alertThreshold: Number(alertThreshold),
          rollover: Boolean(rollover),
        })
        .where(eq(budgets.id, existing[0].id));

      const updated = await db.select().from(budgets).where(eq(budgets.id, existing[0].id)).limit(1);
      return NextResponse.json({ success: true, budget: updated[0] });
    }

    const budgetId = `bud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBudget = {
      id: budgetId,
      userId: user.id,
      categoryId,
      period: "monthly",
      monthYear,
      allocatedAmount: numericAllocated.toFixed(2),
      alertThreshold: Number(alertThreshold),
      rollover: Boolean(rollover),
      createdAt: new Date(),
    };

    await db.insert(budgets).values(newBudget);
    return NextResponse.json({ success: true, budget: newBudget });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
