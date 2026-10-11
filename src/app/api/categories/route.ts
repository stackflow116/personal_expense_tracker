import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userCats = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(categories.type, categories.name);

    return NextResponse.json({ categories: userCats });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { name, type = "expense", icon = "Tag", color = "#64748B", budgetAmount = "0.00" } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCat = {
      id: catId,
      userId: user.id,
      name,
      type,
      icon,
      color,
      budgetAmount: parseFloat(budgetAmount || "0").toFixed(2),
      isSystem: false,
      createdAt: new Date(),
    };

    await db.insert(categories).values(newCat);
    return NextResponse.json({ success: true, category: newCat });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
