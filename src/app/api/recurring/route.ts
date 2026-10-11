import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringRules, accounts, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const [rules, userAccounts, userCategories] = await Promise.all([
      db.select().from(recurringRules).where(eq(recurringRules.userId, user.id)),
      db.select().from(accounts).where(eq(accounts.userId, user.id)),
      db.select().from(categories).where(eq(categories.userId, user.id)),
    ]);

    const accMap = new Map(userAccounts.map((a) => [a.id, a]));
    const catMap = new Map(userCategories.map((c) => [c.id, c]));

    const enriched = rules.map((r) => {
      const acc = accMap.get(r.accountId);
      const cat = catMap.get(r.categoryId);
      return {
        ...r,
        accountName: acc?.name || "Unknown Account",
        categoryName: cat?.name || "Uncategorized",
        categoryIcon: cat?.icon || "Tag",
        categoryColor: cat?.color || "#64748B",
      };
    });

    return NextResponse.json({ recurringRules: enriched });
  } catch (error) {
    console.error("GET /api/recurring error:", error);
    return NextResponse.json({ error: "Failed to fetch recurring rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      title,
      amount,
      type = "expense",
      frequency = "monthly",
      nextDueDate,
      accountId,
      categoryId,
      autoProcess = true,
      status = "active",
    } = body;

    if (!title || !amount || !nextDueDate || !accountId || !categoryId) {
      return NextResponse.json({ error: "Missing required recurring rule fields" }, { status: 400 });
    }

    const ruleId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRule = {
      id: ruleId,
      userId: user.id,
      title,
      amount: parseFloat(amount).toFixed(2),
      type,
      frequency,
      nextDueDate,
      accountId,
      categoryId,
      autoProcess: Boolean(autoProcess),
      status,
      createdAt: new Date(),
    };

    await db.insert(recurringRules).values(newRule);
    return NextResponse.json({ success: true, recurringRule: newRule });
  } catch (error) {
    console.error("POST /api/recurring error:", error);
    return NextResponse.json({ error: "Failed to create recurring rule" }, { status: 500 });
  }
}
