import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.type !== undefined) updatePayload.type = body.type;
    if (body.icon !== undefined) updatePayload.icon = body.icon;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.budgetAmount !== undefined) updatePayload.budgetAmount = parseFloat(body.budgetAmount || "0").toFixed(2);

    await db.update(categories).set(updatePayload).where(eq(categories.id, id));

    const updated = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return NextResponse.json({ success: true, category: updated[0] });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, user.id)));
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
