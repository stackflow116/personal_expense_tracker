import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";
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
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.allocatedAmount !== undefined) updatePayload.allocatedAmount = parseFloat(body.allocatedAmount).toFixed(2);
    if (body.alertThreshold !== undefined) updatePayload.alertThreshold = Number(body.alertThreshold);
    if (body.rollover !== undefined) updatePayload.rollover = Boolean(body.rollover);

    await db.update(budgets).set(updatePayload).where(eq(budgets.id, id));

    const updated = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
    return NextResponse.json({ success: true, budget: updated[0] });
  } catch (error) {
    console.error("PUT /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, user.id)));
    return NextResponse.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
