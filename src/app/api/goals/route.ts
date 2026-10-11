import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const goals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, user.id));

    const enriched = goals.map((g) => {
      const current = parseFloat(g.currentAmount);
      const target = parseFloat(g.targetAmount);
      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const remaining = Math.max(0, target - current);
      return {
        ...g,
        currentNum: current,
        targetNum: target,
        remainingNum: remaining,
        percent,
      };
    });

    return NextResponse.json({ goals: enriched });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { title, targetAmount, currentAmount = "0.00", targetDate, category = "General", color = "#10B981", icon = "PiggyBank" } = body;

    if (!title || !targetAmount) {
      return NextResponse.json({ error: "Title and target amount are required" }, { status: 400 });
    }

    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newGoal = {
      id: goalId,
      userId: user.id,
      title,
      targetAmount: parseFloat(targetAmount).toFixed(2),
      currentAmount: parseFloat(currentAmount || "0").toFixed(2),
      targetDate: targetDate || null,
      category,
      color,
      icon,
      isCompleted: parseFloat(currentAmount || "0") >= parseFloat(targetAmount),
      createdAt: new Date(),
    };

    await db.insert(savingsGoals).values(newGoal);
    return NextResponse.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Failed to create savings goal" }, { status: 500 });
  }
}
