import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

export async function getCurrentUserId(): Promise<string> {
  // 1. Check header
  const headerList = await headers();
  const headerUserId = headerList.get("x-user-id");
  if (headerUserId) return headerUserId;

  // 2. Check cookie
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("finance_user_id")?.value;
  if (cookieUserId) return cookieUserId;

  // 3. Fallback to default user, and seed if no users exist
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    await seedDatabase();
    return "usr_alex";
  }

  return existingUsers[0].id;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (userList.length === 0) {
    // Return primary user or first available
    const fallbackList = await db.select().from(users).limit(1);
    if (fallbackList.length > 0) return fallbackList[0];
    await seedDatabase();
    const seeded = await db.select().from(users).where(eq(users.id, "usr_alex")).limit(1);
    return seeded[0];
  }

  return userList[0];
}
