import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
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
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const current = body.currentAmount !== undefined ? parseFloat(body.currentAmount) : parseFloat(existing[0].currentAmount);
    const target = body.targetAmount !== undefined ? parseFloat(body.targetAmount) : parseFloat(existing[0].targetAmount);

    const updatePayload: Record<string, unknown> = {};
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.targetAmount !== undefined) updatePayload.targetAmount = target.toFixed(2);
    if (body.currentAmount !== undefined) updatePayload.currentAmount = current.toFixed(2);
    if (body.targetDate !== undefined) updatePayload.targetDate = body.targetDate;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.icon !== undefined) updatePayload.icon = body.icon;
    if (body.isCompleted !== undefined) {
      updatePayload.isCompleted = Boolean(body.isCompleted);
    } else {
      updatePayload.isCompleted = current >= target;
    }

    await db.update(savingsGoals).set(updatePayload).where(eq(savingsGoals.id, id));

    const updated = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1);
    return NextResponse.json({ success: true, goal: updated[0] });
  } catch (error) {
    console.error("PUT /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to update savings goal" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)));
    return NextResponse.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete savings goal" }, { status: 500 });
  }
}
