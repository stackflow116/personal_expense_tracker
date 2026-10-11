import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, accounts, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      currency: users.currency,
    }).from(users);

    return NextResponse.json({
      user: currentUser,
      availableUsers: allUsers,
    });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    const cookieStore = await cookies();

    if (action === "switch") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

      cookieStore.set("finance_user_id", userId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return NextResponse.json({ success: true, user: user[0] });
    }

    if (action === "update_settings") {
      const currentUser = await getCurrentUser();
      const { name, currency, monthlyBudgetLimit, dailyBudgetLimit, savingsTargetRate } = body;

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (currency !== undefined) updateData.currency = currency;
      if (monthlyBudgetLimit !== undefined) updateData.monthlyBudgetLimit = String(monthlyBudgetLimit);
      if (dailyBudgetLimit !== undefined) updateData.dailyBudgetLimit = String(dailyBudgetLimit);
      if (savingsTargetRate !== undefined) updateData.savingsTargetRate = Number(savingsTargetRate);

      await db.update(users).set(updateData).where(eq(users.id, currentUser.id));

      const updated = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
      return NextResponse.json({ success: true, user: updated[0] });
    }

    if (action === "register" || action === "create_user") {
      const { name, email, currency, password } = body;
      if (!name || !email) {
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      const newUserId = `usr_${Date.now()}`;
      const newUserObj = {
        id: newUserId,
        name,
        email,
        password: password || "password123",
        avatar: "👤",
        currency: currency || "USD",
        monthlyBudgetLimit: "4000.00",
        dailyBudgetLimit: "130.00",
        savingsTargetRate: 20,
        createdAt: new Date(),
      };

      await db.insert(users).values(newUserObj);

      // Create default accounts for new user
      await db.insert(accounts).values([
        {
          id: `acc_chk_${Date.now()}`,
          userId: newUserId,
          name: "Main Checking",
          type: "checking",
          balance: "2500.00",
          currency: currency || "USD",
          color: "#2563EB",
          icon: "Landmark",
          isDefault: true,
          createdAt: new Date(),
        },
        {
          id: `acc_sav_${Date.now()}`,
          userId: newUserId,
          name: "Savings Account",
          type: "savings",
          balance: "5000.00",
          currency: currency || "USD",
          color: "#10B981",
          icon: "PiggyBank",
          isDefault: false,
          createdAt: new Date(),
        },
      ]);

      // Create default categories
      const defaultCats = [
        { id: `cat_h_${Date.now()}`, userId: newUserId, name: "Housing & Rent", type: "expense", icon: "Home", color: "#6366F1", budgetAmount: "1500.00", isSystem: true },
        { id: `cat_g_${Date.now()}`, userId: newUserId, name: "Groceries & Food", type: "expense", icon: "ShoppingCart", color: "#10B981", budgetAmount: "500.00", isSystem: true },
        { id: `cat_d_${Date.now()}`, userId: newUserId, name: "Dining Out", type: "expense", icon: "Utensils", color: "#F59E0B", budgetAmount: "300.00", isSystem: true },
        { id: `cat_t_${Date.now()}`, userId: newUserId, name: "Transportation", type: "expense", icon: "Car", color: "#3B82F6", budgetAmount: "200.00", isSystem: true },
        { id: `cat_s_${Date.now()}`, userId: newUserId, name: "Salary", type: "income", icon: "Briefcase", color: "#10B981", budgetAmount: "4000.00", isSystem: true },
      ];
      await db.insert(categories).values(defaultCats);

      cookieStore.set("finance_user_id", newUserId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return NextResponse.json({ success: true, user: newUserObj });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/user error:", error);
    return NextResponse.json({ error: "Failed to process user action" }, { status: 500 });
  }
}
