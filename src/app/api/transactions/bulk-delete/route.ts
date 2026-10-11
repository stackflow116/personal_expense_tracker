import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { inArray, and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No transaction IDs provided" }, { status: 400 });
    }

    const txsToDelete = await db
      .select()
      .from(transactions)
      .where(and(inArray(transactions.id, ids), eq(transactions.userId, user.id)));

    for (const tx of txsToDelete) {
      const amount = parseFloat(tx.amount);
      const acc = await db.select().from(accounts).where(eq(accounts.id, tx.accountId)).limit(1);
      if (acc.length > 0) {
        let rev = parseFloat(acc[0].balance);
        if (tx.type === "expense" || tx.type === "transfer") rev += amount;
        else if (tx.type === "income") rev -= amount;
        await db.update(accounts).set({ balance: rev.toFixed(2) }).where(eq(accounts.id, tx.accountId));
      }
      if (tx.type === "transfer" && tx.transferToAccountId) {
        const tgt = await db.select().from(accounts).where(eq(accounts.id, tx.transferToAccountId)).limit(1);
        if (tgt.length > 0) {
          const rev = parseFloat(tgt[0].balance) - amount;
          await db.update(accounts).set({ balance: rev.toFixed(2) }).where(eq(accounts.id, tx.transferToAccountId));
        }
      }
    }

    await db.delete(transactions).where(and(inArray(transactions.id, ids), eq(transactions.userId, user.id)));

    return NextResponse.json({ success: true, count: txsToDelete.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 });
  }
}
