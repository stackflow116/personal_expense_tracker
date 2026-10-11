import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const [userTxs, userCats, userAccs] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.date)),
      db.select().from(categories).where(eq(categories.userId, user.id)),
      db.select().from(accounts).where(eq(accounts.userId, user.id)),
    ]);

    const catMap = new Map(userCats.map((c) => [c.id, c.name]));
    const accMap = new Map(userAccs.map((a) => [a.id, a.name]));

    const enriched = userTxs.map((t) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      description: t.description,
      merchant: t.merchant || "",
      category: catMap.get(t.categoryId) || "Uncategorized",
      account: accMap.get(t.accountId) || "Default Account",
      paymentMethod: t.paymentMethod,
      status: t.status,
      notes: t.notes || "",
    }));

    if (format === "json") {
      return NextResponse.json({ transactions: enriched });
    }

    // CSV format
    const headers = ["Date", "Type", "Amount", "Description", "Merchant", "Category", "Account", "Payment Method", "Status", "Notes"];
    const csvRows = [headers.join(",")];

    enriched.forEach((row) => {
      const values = [
        `"${row.date}"`,
        `"${row.type}"`,
        `"${row.amount}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        `"${row.merchant.replace(/"/g, '""')}"`,
        `"${row.category.replace(/"/g, '""')}"`,
        `"${row.account.replace(/"/g, '""')}"`,
        `"${row.paymentMethod}"`,
        `"${row.status}"`,
        `"${row.notes.replace(/"/g, '""')}"`,
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions_${user.name.toLowerCase().replace(/\s+/g, "_")}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/import-export error:", error);
    return NextResponse.json({ error: "Failed to export transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { csvData, defaultAccountId } = await req.json();

    if (!csvData) {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 });
    }

    const lines = csvData.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or missing headers" }, { status: 400 });
    }

    // Fetch accounts and categories
    const [userCats, userAccs] = await Promise.all([
      db.select().from(categories).where(eq(categories.userId, user.id)),
      db.select().from(accounts).where(eq(accounts.userId, user.id)),
    ]);

    const targetAccount = defaultAccountId
      ? userAccs.find((a) => a.id === defaultAccountId) || userAccs[0]
      : userAccs[0];

    if (!targetAccount) {
      return NextResponse.json({ error: "No account found to import into" }, { status: 400 });
    }

    const fallbackCat = userCats[0]?.id || "cat_misc";

    let importedCount = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV splitter handling quotes
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null && match.index !== line.length) {
        let val = match[1] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        matches.push(val.trim());
      }

      if (matches.length >= 4) {
        const date = matches[0] || new Date().toISOString().substring(0, 10);
        const type = matches[1]?.toLowerCase().includes("inc") ? "income" : "expense";
        const rawAmount = matches[2]?.replace(/[^0-9.]/g, "") || "0";
        const amount = parseFloat(rawAmount) || 0;
        const description = matches[3] || "Imported Transaction";
        const merchant = matches[4] || description;

        if (amount > 0) {
          const txId = `tx_imp_${Date.now()}_${i}`;
          await db.insert(transactions).values({
            id: txId,
            userId: user.id,
            accountId: targetAccount.id,
            categoryId: fallbackCat,
            type,
            amount: amount.toFixed(2),
            date,
            description,
            merchant,
            notes: "Imported via CSV",
            status: "cleared",
            paymentMethod: "card",
            tags: JSON.stringify(["imported"]),
            isRecurring: false,
            recurringRuleId: null,
            transferToAccountId: null,
            receiptUrl: null,
            createdAt: new Date(),
          });

          // adjust account balance
          const curBal = parseFloat(targetAccount.balance);
          const newBal = type === "income" ? curBal + amount : curBal - amount;
          await db.update(accounts).set({ balance: newBal.toFixed(2) }).where(eq(accounts.id, targetAccount.id));

          importedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error("POST /api/import-export error:", error);
    return NextResponse.json({ error: "Failed to import transactions" }, { status: 500 });
  }
}
