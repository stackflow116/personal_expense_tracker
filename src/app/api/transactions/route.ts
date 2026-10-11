import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // expense, income, transfer
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Fetch user categories and accounts for mapping
    const [userCategories, userAccounts, userTransactions] = await Promise.all([
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date), desc(transactions.createdAt)),
    ]);

    const catMap = new Map(userCategories.map((c) => [c.id, c]));
    const accMap = new Map(userAccounts.map((a) => [a.id, a]));

    let filtered = userTransactions;

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.tags && t.tags.toLowerCase().includes(q))
      );
    }

    if (type && type !== "all") {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (categoryId && categoryId !== "all") {
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    }

    if (accountId && accountId !== "all") {
      filtered = filtered.filter((t) => t.accountId === accountId || t.transferToAccountId === accountId);
    }

    if (startDate) {
      filtered = filtered.filter((t) => t.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((t) => t.date <= endDate);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    const enriched = filtered.map((t) => {
      const acc = accMap.get(t.accountId);
      const cat = catMap.get(t.categoryId);
      const targetAcc = t.transferToAccountId ? accMap.get(t.transferToAccountId) : null;
      return {
        ...t,
        accountName: acc?.name || "Unknown Account",
        accountColor: acc?.color || "#3B82F6",
        accountIcon: acc?.icon || "Landmark",
        categoryName: cat?.name || "Uncategorized",
        categoryColor: cat?.color || "#64748B",
        categoryIcon: cat?.icon || "Tag",
        transferToAccountName: targetAcc?.name || null,
      };
    });

    // Summary calculations on filtered data
    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "income") totalIncome += amt;
      if (t.type === "expense") totalExpense += amt;
    });

    return NextResponse.json({
      transactions: enriched,
      totalCount: enriched.length,
      summary: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
      },
      categories: userCategories,
      accounts: userAccounts,
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user.id;

    const body = await req.json();
    const {
      accountId,
      categoryId,
      type, // 'expense', 'income', 'transfer'
      amount,
      date,
      description,
      merchant,
      notes,
      status = "cleared",
      paymentMethod = "card",
      tags = [],
      isRecurring = false,
      transferToAccountId,
    } = body;

    if (!accountId || !type || !amount || !description || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericAmount = Math.abs(parseFloat(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : typeof tags === "string" ? JSON.stringify(tags.split(",").map((t: string) => t.trim()).filter(Boolean)) : "[]";

    const newTx = {
      id: txId,
      userId,
      accountId,
      categoryId: categoryId || "cat_misc",
      type,
      amount: numericAmount.toFixed(2),
      date,
      description,
      merchant: merchant || null,
      notes: notes || null,
      status,
      paymentMethod,
      tags: tagsJson,
      isRecurring: Boolean(isRecurring),
      recurringRuleId: null,
      transferToAccountId: transferToAccountId || null,
      receiptUrl: null,
      createdAt: new Date(),
    };

    await db.insert(transactions).values(newTx);

    // Update account balances
    const sourceAcc = await db.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, userId))).limit(1);
    if (sourceAcc.length > 0) {
      const currentBal = parseFloat(sourceAcc[0].balance);
      let newBal = currentBal;

      if (type === "expense" || type === "transfer") {
        newBal = currentBal - numericAmount;
      } else if (type === "income") {
        newBal = currentBal + numericAmount;
      }

      await db.update(accounts).set({ balance: newBal.toFixed(2) }).where(eq(accounts.id, accountId));
    }

    // If transfer, update target account balance as well
    if (type === "transfer" && transferToAccountId) {
      const targetAcc = await db.select().from(accounts).where(and(eq(accounts.id, transferToAccountId), eq(accounts.userId, userId))).limit(1);
      if (targetAcc.length > 0) {
        const targetBal = parseFloat(targetAcc[0].balance);
        const newTargetBal = targetBal + numericAmount;
        await db.update(accounts).set({ balance: newTargetBal.toFixed(2) }).where(eq(accounts.id, transferToAccountId));
      }
    }

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
