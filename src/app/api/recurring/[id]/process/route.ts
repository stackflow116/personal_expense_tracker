import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringRules, transactions, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const ruleRes = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, user.id)))
      .limit(1);

    if (ruleRes.length === 0) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    const rule = ruleRes[0];
    const amount = parseFloat(rule.amount);
    const executionDate = rule.nextDueDate || format(new Date(), "yyyy-MM-dd");

    // 1. Create Transaction
    const txId = `tx_rec_${Date.now()}`;
    await db.insert(transactions).values({
      id: txId,
      userId: user.id,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      type: rule.type,
      amount: rule.amount,
      date: executionDate,
      description: rule.title,
      merchant: rule.title,
      notes: `Recurring ${rule.frequency} bill auto-posted`,
      status: "cleared",
      paymentMethod: "bank_transfer",
      tags: JSON.stringify(["recurring", "auto-billed"]),
      isRecurring: true,
      recurringRuleId: rule.id,
      transferToAccountId: null,
      receiptUrl: null,
      createdAt: new Date(),
    });

    // 2. Adjust account balance
    const acc = await db.select().from(accounts).where(eq(accounts.id, rule.accountId)).limit(1);
    if (acc.length > 0) {
      const curBal = parseFloat(acc[0].balance);
      const newBal = rule.type === "expense" ? curBal - amount : curBal + amount;
      await db.update(accounts).set({ balance: newBal.toFixed(2) }).where(eq(accounts.id, rule.accountId));
    }

    // 3. Compute next due date
    let parsed = parseISO(executionDate);
    if (isNaN(parsed.getTime())) parsed = new Date();

    let nextDate = parsed;
    if (rule.frequency === "daily") nextDate = addDays(parsed, 1);
    else if (rule.frequency === "weekly") nextDate = addWeeks(parsed, 1);
    else if (rule.frequency === "monthly") nextDate = addMonths(parsed, 1);
    else if (rule.frequency === "yearly") nextDate = addYears(parsed, 1);

    const nextDueDateStr = format(nextDate, "yyyy-MM-dd");
    await db.update(recurringRules).set({ nextDueDate: nextDueDateStr }).where(eq(recurringRules.id, rule.id));

    return NextResponse.json({ success: true, nextDueDate: nextDueDateStr });
  } catch (error) {
    console.error("POST process recurring error:", error);
    return NextResponse.json({ error: "Failed to process recurring rule" }, { status: 500 });
  }
}
