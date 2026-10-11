import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, accounts, categories, transactions, budgets, savingsGoals, recurringRules, debtSplits } from "@/db/schema";
import { seedDatabase } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { action } = await req.json().catch(() => ({ action: "seed" }));

    if (action === "reset") {
      // Clear tables in cascade order
      await db.delete(transactions);
      await db.delete(budgets);
      await db.delete(savingsGoals);
      await db.delete(recurringRules);
      await db.delete(debtSplits);
      await db.delete(categories);
      await db.delete(accounts);
      await db.delete(users);

      await seedDatabase();
      return NextResponse.json({ success: true, message: "Database reset to rich demo state" });
    }

    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
