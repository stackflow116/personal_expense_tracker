import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringRules } from "@/db/schema";
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
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Recurring rule not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.amount !== undefined) updatePayload.amount = parseFloat(body.amount).toFixed(2);
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.frequency !== undefined) updatePayload.frequency = body.frequency;
    if (body.nextDueDate !== undefined) updatePayload.nextDueDate = body.nextDueDate;
    if (body.accountId !== undefined) updatePayload.accountId = body.accountId;
    if (body.categoryId !== undefined) updatePayload.categoryId = body.categoryId;
    if (body.autoProcess !== undefined) updatePayload.autoProcess = Boolean(body.autoProcess);
    if (body.status !== undefined) updatePayload.status = body.status;

    await db.update(recurringRules).set(updatePayload).where(eq(recurringRules.id, id));

    const updated = await db.select().from(recurringRules).where(eq(recurringRules.id, id)).limit(1);
    return NextResponse.json({ success: true, recurringRule: updated[0] });
  } catch (error) {
    console.error("PUT /api/recurring/[id] error:", error);
    return NextResponse.json({ error: "Failed to update recurring rule" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await db.delete(recurringRules).where(and(eq(recurringRules.id, id), eq(recurringRules.userId, user.id)));
    return NextResponse.json({ success: true, message: "Recurring rule deleted" });
  } catch (error) {
    console.error("DELETE /api/recurring/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete recurring rule" }, { status: 500 });
  }
}
