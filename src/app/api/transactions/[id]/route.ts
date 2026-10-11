import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const tx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1);

    if (tx.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: tx[0] });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();

    const existingTx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1);

    if (existingTx.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const oldTx = existingTx[0];
    const oldAmount = parseFloat(oldTx.amount);
    const newAmount = body.amount !== undefined ? parseFloat(body.amount) : oldAmount;
    const newAccountId = body.accountId || oldTx.accountId;
    const newType = body.type || oldTx.type;

    // 1. Revert old transaction effect on account balance
    const oldAccount = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, oldTx.accountId), eq(accounts.userId, user.id)))
      .limit(1);

    if (oldAccount.length > 0) {
      let revertedBal = parseFloat(oldAccount[0].balance);
      if (oldTx.type === "expense" || oldTx.type === "transfer") {
        revertedBal += oldAmount;
      } else if (oldTx.type === "income") {
        revertedBal -= oldAmount;
      }
      await db.update(accounts).set({ balance: revertedBal.toFixed(2) }).where(eq(accounts.id, oldTx.accountId));
    }

    if (oldTx.type === "transfer" && oldTx.transferToAccountId) {
      const oldTarget = await db.select().from(accounts).where(eq(accounts.id, oldTx.transferToAccountId)).limit(1);
      if (oldTarget.length > 0) {
        const revTarget = parseFloat(oldTarget[0].balance) - oldAmount;
        await db.update(accounts).set({ balance: revTarget.toFixed(2) }).where(eq(accounts.id, oldTx.transferToAccountId));
      }
    }

    // 2. Apply new transaction effect on new account balance
    const targetAccount = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, newAccountId), eq(accounts.userId, user.id)))
      .limit(1);

    if (targetAccount.length > 0) {
      let updatedBal = parseFloat(targetAccount[0].balance);
      if (newType === "expense" || newType === "transfer") {
        updatedBal -= newAmount;
      } else if (newType === "income") {
        updatedBal += newAmount;
      }
      await db.update(accounts).set({ balance: updatedBal.toFixed(2) }).where(eq(accounts.id, newAccountId));
    }

    if (newType === "transfer" && (body.transferToAccountId || oldTx.transferToAccountId)) {
      const targetId = body.transferToAccountId || oldTx.transferToAccountId;
      const targetAcc = await db.select().from(accounts).where(eq(accounts.id, targetId)).limit(1);
      if (targetAcc.length > 0) {
        const updatedTarget = parseFloat(targetAcc[0].balance) + newAmount;
        await db.update(accounts).set({ balance: updatedTarget.toFixed(2) }).where(eq(accounts.id, targetId));
      }
    }

    // 3. Update transaction row
    const updatePayload: Record<string, unknown> = {};
    if (body.accountId !== undefined) updatePayload.accountId = body.accountId;
    if (body.categoryId !== undefined) updatePayload.categoryId = body.categoryId;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.amount !== undefined) updatePayload.amount = newAmount.toFixed(2);
    if (body.date !== undefined) updatePayload.date = body.date;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.merchant !== undefined) updatePayload.merchant = body.merchant;
    if (body.notes !== undefined) updatePayload.notes = body.notes;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.paymentMethod !== undefined) updatePayload.paymentMethod = body.paymentMethod;
    if (body.tags !== undefined) {
      updatePayload.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : JSON.stringify(body.tags.split(",").map((s: string) => s.trim()));
    }
    if (body.transferToAccountId !== undefined) updatePayload.transferToAccountId = body.transferToAccountId;

    await db.update(transactions).set(updatePayload).where(eq(transactions.id, id));

    const updated = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return NextResponse.json({ success: true, transaction: updated[0] });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const existingTx = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1);

    if (existingTx.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const tx = existingTx[0];
    const amount = parseFloat(tx.amount);

    // Revert account balance
    const acc = await db.select().from(accounts).where(eq(accounts.id, tx.accountId)).limit(1);
    if (acc.length > 0) {
      let revertedBal = parseFloat(acc[0].balance);
      if (tx.type === "expense" || tx.type === "transfer") {
        revertedBal += amount;
      } else if (tx.type === "income") {
        revertedBal -= amount;
      }
      await db.update(accounts).set({ balance: revertedBal.toFixed(2) }).where(eq(accounts.id, tx.accountId));
    }

    if (tx.type === "transfer" && tx.transferToAccountId) {
      const target = await db.select().from(accounts).where(eq(accounts.id, tx.transferToAccountId)).limit(1);
      if (target.length > 0) {
        const rev = parseFloat(target[0].balance) - amount;
        await db.update(accounts).set({ balance: rev.toFixed(2) }).where(eq(accounts.id, tx.transferToAccountId));
      }
    }

    await db.delete(transactions).where(eq(transactions.id, id));

    return NextResponse.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
