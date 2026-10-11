import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const acc = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, user.id)))
      .limit(1);

    if (acc.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const txs = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.accountId, id), eq(transactions.userId, user.id)))
      .limit(20);

    return NextResponse.json({ account: acc[0], recentTransactions: txs });
  } catch (error) {
    console.error("GET /api/accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();

    const existingAcc = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, user.id)))
      .limit(1);

    if (existingAcc.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (body.isDefault) {
      await db.update(accounts).set({ isDefault: false }).where(eq(accounts.userId, user.id));
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.balance !== undefined) updatePayload.balance = parseFloat(body.balance).toFixed(2);
    if (body.currency !== undefined) updatePayload.currency = body.currency;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.icon !== undefined) updatePayload.icon = body.icon;
    if (body.accountNumberLast4 !== undefined) updatePayload.accountNumberLast4 = body.accountNumberLast4;
    if (body.institution !== undefined) updatePayload.institution = body.institution;
    if (body.creditLimit !== undefined) updatePayload.creditLimit = body.creditLimit ? parseFloat(body.creditLimit).toFixed(2) : null;
    if (body.isDefault !== undefined) updatePayload.isDefault = Boolean(body.isDefault);

    await db.update(accounts).set(updatePayload).where(eq(accounts.id, id));

    const updated = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return NextResponse.json({ success: true, account: updated[0] });
  } catch (error) {
    console.error("PUT /api/accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
    if (userAccounts.length <= 1) {
      return NextResponse.json({ error: "Cannot delete the only remaining account." }, { status: 400 });
    }

    await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, user.id)));
    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("DELETE /api/accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
