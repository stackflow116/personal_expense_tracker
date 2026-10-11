import { NextResponse } from "next/server";
import { db } from "@/db";
import { debtSplits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const debts = await db
      .select()
      .from(debtSplits)
      .where(eq(debtSplits.userId, user.id));

    let totalOwedToMe = 0;
    let totalIOwe = 0;

    const enriched = debts.map((d) => {
      const amt = parseFloat(d.amount);
      const settled = parseFloat(d.settledAmount);
      const remaining = Math.max(0, amt - settled);

      if (d.type === "owed_to_me") {
        totalOwedToMe += remaining;
      } else {
        totalIOwe += remaining;
      }

      return {
        ...d,
        amountNum: amt,
        settledNum: settled,
        remainingNum: remaining,
      };
    });

    return NextResponse.json({
      debts: enriched,
      summary: {
        totalOwedToMe,
        totalIOwe,
        netDebtPosition: totalOwedToMe - totalIOwe,
      },
    });
  } catch (error) {
    console.error("GET /api/debts error:", error);
    return NextResponse.json({ error: "Failed to fetch debts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { personName, type = "owed_to_me", amount, description, dueDate, settledAmount = "0.00" } = body;

    if (!personName || !amount || !description) {
      return NextResponse.json({ error: "Missing required debt fields" }, { status: 400 });
    }

    const numAmt = parseFloat(amount);
    const numSettled = parseFloat(settledAmount || "0");
    const status = numSettled >= numAmt ? "settled" : numSettled > 0 ? "partially_paid" : "unpaid";

    const debtId = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDebt = {
      id: debtId,
      userId: user.id,
      personName,
      type,
      amount: numAmt.toFixed(2),
      settledAmount: numSettled.toFixed(2),
      description,
      dueDate: dueDate || null,
      status,
      createdAt: new Date(),
    };

    await db.insert(debtSplits).values(newDebt);
    return NextResponse.json({ success: true, debt: newDebt });
  } catch (error) {
    console.error("POST /api/debts error:", error);
    return NextResponse.json({ error: "Failed to create debt" }, { status: 500 });
  }
}
