import { NextResponse } from "next/server";
import { db } from "@/db";
import { debtSplits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();

    const existing = await db
      .select()
      .from(debtSplits)
      .where(and(eq(debtSplits.id, id), eq(debtSplits.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    const amt = body.amount !== undefined ? parseFloat(body.amount) : parseFloat(existing[0].amount);
    const settled = body.settledAmount !== undefined ? parseFloat(body.settledAmount) : parseFloat(existing[0].settledAmount);
    const status = settled >= amt ? "settled" : settled > 0 ? "partially_paid" : "unpaid";

    const updatePayload: Record<string, unknown> = { status };
    if (body.personName !== undefined) updatePayload.personName = body.personName;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.amount !== undefined) updatePayload.amount = amt.toFixed(2);
    if (body.settledAmount !== undefined) updatePayload.settledAmount = settled.toFixed(2);
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.dueDate !== undefined) updatePayload.dueDate = body.dueDate;

    await db.update(debtSplits).set(updatePayload).where(eq(debtSplits.id, id));

    const updated = await db.select().from(debtSplits).where(eq(debtSplits.id, id)).limit(1);
    return NextResponse.json({ success: true, debt: updated[0] });
  } catch (error) {
    console.error("PUT /api/debts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update debt" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await db.delete(debtSplits).where(and(eq(debtSplits.id, id), eq(debtSplits.userId, user.id)));
    return NextResponse.json({ success: true, message: "Debt deleted" });
  } catch (error) {
    console.error("DELETE /api/debts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete debt" }, { status: 500 });
  }
}
