import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals, accounts, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();
    const { amount, sourceAccountId } = body;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid contribution amount" }, { status: 400 });
    }

    const existingGoal = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = existingGoal[0];
    const newCurrent = parseFloat(goal.currentAmount) + numericAmount;
    const target = parseFloat(goal.targetAmount);
    const isCompleted = newCurrent >= target;

    await db
      .update(savingsGoals)
      .set({
        currentAmount: newCurrent.toFixed(2),
        isCompleted,
      })
      .where(eq(savingsGoals.id, id));

    // If source account selected, deduct balance & create transaction record
    if (sourceAccountId) {
      const sourceAcc = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, sourceAccountId), eq(accounts.userId, user.id)))
        .limit(1);

      if (sourceAcc.length > 0) {
        const newBal = parseFloat(sourceAcc[0].balance) - numericAmount;
        await db.update(accounts).set({ balance: newBal.toFixed(2) }).where(eq(accounts.id, sourceAccountId));

        // Create transaction log
        const txId = `tx_goal_${Date.now()}`;
        await db.insert(transactions).values({
          id: txId,
          userId: user.id,
          accountId: sourceAccountId,
          categoryId: "cat_misc",
          type: "expense",
          amount: numericAmount.toFixed(2),
          date: format(new Date(), "yyyy-MM-dd"),
          description: `Savings Contribution: ${goal.title}`,
          merchant: "Savings Goal",
          notes: `Allocated to ${goal.title}`,
          status: "cleared",
          paymentMethod: "bank_transfer",
          tags: JSON.stringify(["savings-contribution", "goal"]),
          isRecurring: false,
          recurringRuleId: null,
          transferToAccountId: null,
          receiptUrl: null,
          createdAt: new Date(),
        });
      }
    }

    const updated = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1);
    return NextResponse.json({ success: true, goal: updated[0] });
  } catch (error) {
    console.error("POST contribute error:", error);
    return NextResponse.json({ error: "Failed to contribute to goal" }, { status: 500 });
  }
}
