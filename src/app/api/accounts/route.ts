import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id))
      .orderBy(accounts.type, accounts.name);

    return NextResponse.json({ accounts: userAccounts });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      name,
      type = "checking",
      balance = "0.00",
      currency = user.currency || "USD",
      color = "#3B82F6",
      icon = "Landmark",
      accountNumberLast4,
      institution,
      creditLimit,
      isDefault = false,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Account name is required" }, { status: 400 });
    }

    const newAccId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If marked default, unset default on other accounts
    if (isDefault) {
      await db.update(accounts).set({ isDefault: false }).where(eq(accounts.userId, user.id));
    }

    const newAccount = {
      id: newAccId,
      userId: user.id,
      name,
      type,
      balance: parseFloat(balance).toFixed(2),
      currency,
      color,
      icon,
      accountNumberLast4: accountNumberLast4 || null,
      institution: institution || null,
      creditLimit: creditLimit ? parseFloat(creditLimit).toFixed(2) : null,
      isDefault: Boolean(isDefault),
      createdAt: new Date(),
    };

    await db.insert(accounts).values(newAccount);

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
