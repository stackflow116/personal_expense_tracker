import { pgTable, text, numeric, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  currency: text("currency").default("USD").notNull(),
  monthlyBudgetLimit: numeric("monthly_budget_limit", { precision: 12, scale: 2 }).default("5000.00"),
  dailyBudgetLimit: numeric("daily_budget_limit", { precision: 12, scale: 2 }).default("150.00"),
  savingsTargetRate: integer("savings_target_rate").default(25),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit, cash, investment
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  currency: text("currency").default("USD").notNull(),
  color: text("color").default("#3B82F6").notNull(),
  icon: text("icon").default("Landmark").notNull(),
  accountNumberLast4: text("account_number_last_4"),
  institution: text("institution"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // expense, income, both
  icon: text("icon").default("Tag").notNull(),
  color: text("color").default("#64748B").notNull(),
  budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // expense, income, transfer
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  description: text("description").notNull(),
  merchant: text("merchant"),
  notes: text("notes"),
  status: text("status").default("cleared").notNull(), // cleared, pending, reconciled
  paymentMethod: text("payment_method").default("card").notNull(), // card, bank_transfer, cash, crypto, apple_pay, paypal
  tags: text("tags").default("[]").notNull(), // JSON string array
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringRuleId: text("recurring_rule_id"),
  transferToAccountId: text("transfer_to_account_id"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  period: text("period").default("monthly").notNull(), // monthly, weekly, yearly
  monthYear: text("month_year").notNull(), // e.g. "2026-03"
  allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 }).notNull(),
  alertThreshold: integer("alert_threshold").default(80).notNull(), // percentage
  rollover: boolean("rollover").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  targetDate: text("target_date"),
  category: text("category").default("General").notNull(),
  color: text("color").default("#10B981").notNull(),
  icon: text("icon").default("PiggyBank").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recurringRules = pgTable("recurring_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(), // expense, income
  frequency: text("frequency").default("monthly").notNull(), // daily, weekly, monthly, yearly
  nextDueDate: text("next_due_date").notNull(), // YYYY-MM-DD
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  autoProcess: boolean("auto_process").default(true).notNull(),
  status: text("status").default("active").notNull(), // active, paused
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const debtSplits = pgTable("debt_splits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  personName: text("person_name").notNull(),
  type: text("type").notNull(), // owed_to_me (asset), i_owe (liability)
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  settledAmount: numeric("settled_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  description: text("description").notNull(),
  dueDate: text("due_date"),
  status: text("status").default("unpaid").notNull(), // unpaid, partially_paid, settled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type RecurringRule = typeof recurringRules.$inferSelect;
export type NewRecurringRule = typeof recurringRules.$inferInsert;
export type DebtSplit = typeof debtSplits.$inferSelect;
export type NewDebtSplit = typeof debtSplits.$inferInsert;
