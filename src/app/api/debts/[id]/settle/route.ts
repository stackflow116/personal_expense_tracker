import { NextResponse } from "next/server";
import { db } from "@/db";
import { debtSplits, accounts, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();
    const { settleAmount, accountId } = body;

    const existing = await db
      .select()
      .from(debtSplits)
      .where(and(eq(debtSplits.id, id), eq(debtSplits.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    const debt = existing[0];
    const totalAmt = parseFloat(debt.amount);
    const curSettled = parseFloat(debt.settledAmount);
    const addSettled = parseFloat(settleAmount || String(totalAmt - curSettled));

    const newSettled = Math.min(totalAmt, curSettled + addSettled);
    const status = newSettled >= totalAmt ? "settled" : "partially_paid";

    await db
      .update(debtSplits)
      .set({
        settledAmount: newSettled.toFixed(2),
        status,
      })
      .where(eq(debtSplits.id, id));

    // If account was chosen, log transaction
    if (accountId) {
      const isOwedToMe = debt.type === "owed_to_me";
      const txType = isOwedToMe ? "income" : "expense";

      await db.insert(transactions).values({
        id: `tx_settle_${Date.now()}`,
        userId: user.id,
        accountId,
        categoryId: "cat_misc",
        type: txType,
        amount: addSettled.toFixed(2),
        date: format(new Date(), "yyyy-MM-dd"),
        description: `Debt settlement: ${debt.personName} (${debt.description})`,
        merchant: debt.personName,
        notes: `Debt settlement for: ${debt.description}`,
        status: "cleared",
        paymentMethod: "bank_transfer",
        tags: JSON.stringify(["debt-settlement", debt.personName.toLowerCase().replace(/\s+/g, "-")]),
        isRecurring: false,
        recurringRuleId: null,
        transferToAccountId: null,
        receiptUrl: null,
        createdAt: new Date(),
      });

      // Update account balance
      const acc = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (acc.length > 0) {
        const curBal = parseFloat(acc[0].balance);
        const newBal = isOwedToMe ? curBal + addSettled : curBal - addSettled;
        await db.update(accounts).set({ balance: newBal.toFixed(2) }).where(eq(accounts.id, accountId));
      }
    }

    const updated = await db.select().from(debtSplits).where(eq(debtSplits.id, id)).limit(1);
    return NextResponse.json({ success: true, debt: updated[0] });
  } catch (error) {
    console.error("POST /api/debts/[id]/settle error:", error);
    return NextResponse.json({ error: "Failed to settle debt" }, { status: 500 });
  }
}
