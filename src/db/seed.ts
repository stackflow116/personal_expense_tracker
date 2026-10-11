import { db } from "./index";
import { users, accounts, categories, transactions, budgets, savingsGoals, recurringRules, debtSplits } from "./schema";
import { format, subDays } from "date-fns";

export async function seedDatabase() {
  // Check if primary demo user exists
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    return { success: true, message: "Database already seeded" };
  }

  const today = new Date();
  const currentMonthYear = format(today, "yyyy-MM");

  // 1. Create Demo Users
  const demoUser = {
    id: "usr_alex",
    name: "Alex Morgan",
    email: "alex.morgan@financeflow.app",
    password: "demo123password",
    avatar: "👨‍💻",
    currency: "USD",
    monthlyBudgetLimit: "4800.00",
    dailyBudgetLimit: "160.00",
    savingsTargetRate: 30,
    createdAt: new Date(),
  };

  const demoUser2 = {
    id: "usr_elena",
    name: "Elena Rostova",
    email: "elena.r@financeflow.app",
    password: "demo123password",
    avatar: "👩‍🎨",
    currency: "EUR",
    monthlyBudgetLimit: "3800.00",
    dailyBudgetLimit: "125.00",
    savingsTargetRate: 25,
    createdAt: new Date(),
  };

  await db.insert(users).values([demoUser, demoUser2]);

  // 2. Create Accounts for Alex
  const alexAccounts = [
    {
      id: "acc_checking",
      userId: demoUser.id,
      name: "Chase Premier Checking",
      type: "checking",
      balance: "5420.50",
      currency: "USD",
      color: "#2563EB", // blue
      icon: "Landmark",
      accountNumberLast4: "4892",
      institution: "JPMorgan Chase",
      isDefault: true,
      createdAt: new Date(),
    },
    {
      id: "acc_savings",
      userId: demoUser.id,
      name: "Marcus High Yield Savings (4.75%)",
      type: "savings",
      balance: "24850.00",
      currency: "USD",
      color: "#10B981", // emerald
      icon: "PiggyBank",
      accountNumberLast4: "9130",
      institution: "Goldman Sachs",
      isDefault: false,
      createdAt: new Date(),
    },
    {
      id: "acc_credit",
      userId: demoUser.id,
      name: "Amex Gold Card",
      type: "credit",
      balance: "-1240.35",
      currency: "USD",
      color: "#F59E0B", // amber
      icon: "CreditCard",
      accountNumberLast4: "1004",
      institution: "American Express",
      creditLimit: "15000.00",
      isDefault: false,
      createdAt: new Date(),
    },
    {
      id: "acc_investments",
      userId: demoUser.id,
      name: "Vanguard Total Market Index",
      type: "investment",
      balance: "48620.00",
      currency: "USD",
      color: "#8B5CF6", // purple
      icon: "TrendingUp",
      accountNumberLast4: "7721",
      institution: "Vanguard",
      isDefault: false,
      createdAt: new Date(),
    },
    {
      id: "acc_cash",
      userId: demoUser.id,
      name: "Cash Wallet",
      type: "cash",
      balance: "380.00",
      currency: "USD",
      color: "#059669", // green
      icon: "Wallet",
      accountNumberLast4: null,
      institution: "Physical Cash",
      isDefault: false,
      createdAt: new Date(),
    },
  ];

  await db.insert(accounts).values(alexAccounts);

  // 3. Create Categories for Alex
  const alexCategories = [
    // Expense Categories
    { id: "cat_housing", userId: demoUser.id, name: "Housing & Rent", type: "expense", icon: "Home", color: "#6366F1", budgetAmount: "1950.00", isSystem: true },
    { id: "cat_groceries", userId: demoUser.id, name: "Groceries & Food", type: "expense", icon: "ShoppingCart", color: "#10B981", budgetAmount: "650.00", isSystem: true },
    { id: "cat_dining", userId: demoUser.id, name: "Dining & Cafes", type: "expense", icon: "Utensils", color: "#F59E0B", budgetAmount: "450.00", isSystem: true },
    { id: "cat_transport", userId: demoUser.id, name: "Transportation & Gas", type: "expense", icon: "Car", color: "#3B82F6", budgetAmount: "280.00", isSystem: true },
    { id: "cat_utilities", userId: demoUser.id, name: "Utilities & Bills", type: "expense", icon: "Zap", color: "#EAB308", budgetAmount: "220.00", isSystem: true },
    { id: "cat_entertainment", userId: demoUser.id, name: "Entertainment & Subs", type: "expense", icon: "Film", color: "#EC4899", budgetAmount: "180.00", isSystem: true },
    { id: "cat_shopping", userId: demoUser.id, name: "Shopping & Tech", type: "expense", icon: "ShoppingBag", color: "#8B5CF6", budgetAmount: "350.00", isSystem: true },
    { id: "cat_health", userId: demoUser.id, name: "Health & Fitness", type: "expense", icon: "HeartPulse", color: "#EF4444", budgetAmount: "150.00", isSystem: true },
    { id: "cat_travel", userId: demoUser.id, name: "Travel & Vacation", type: "expense", icon: "Plane", color: "#14B8A6", budgetAmount: "400.00", isSystem: true },
    { id: "cat_education", userId: demoUser.id, name: "Education & Books", type: "expense", icon: "BookOpen", color: "#06B6D4", budgetAmount: "100.00", isSystem: true },
    { id: "cat_misc", userId: demoUser.id, name: "Miscellaneous", type: "expense", icon: "HelpCircle", color: "#64748B", budgetAmount: "120.00", isSystem: true },

    // Income Categories
    { id: "cat_salary", userId: demoUser.id, name: "Salary & Paycheck", type: "income", icon: "Briefcase", color: "#10B981", budgetAmount: "6500.00", isSystem: true },
    { id: "cat_freelance", userId: demoUser.id, name: "Freelance & Consulting", type: "income", icon: "Laptop", color: "#3B82F6", budgetAmount: "1500.00", isSystem: true },
    { id: "cat_investments_inc", userId: demoUser.id, name: "Investment Dividends", type: "income", icon: "TrendingUp", color: "#8B5CF6", budgetAmount: "350.00", isSystem: true },
    { id: "cat_gifts", userId: demoUser.id, name: "Gifts & Cashbacks", type: "income", icon: "Gift", color: "#F43F5E", budgetAmount: "100.00", isSystem: true },
  ];

  await db.insert(categories).values(alexCategories);

  // 4. Create Budgets for Current Month
  const budgetList = [
    { id: "bud_housing", userId: demoUser.id, categoryId: "cat_housing", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "1950.00", alertThreshold: 90, rollover: false },
    { id: "bud_groceries", userId: demoUser.id, categoryId: "cat_groceries", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "650.00", alertThreshold: 80, rollover: true },
    { id: "bud_dining", userId: demoUser.id, categoryId: "cat_dining", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "450.00", alertThreshold: 80, rollover: false },
    { id: "bud_transport", userId: demoUser.id, categoryId: "cat_transport", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "280.00", alertThreshold: 85, rollover: true },
    { id: "bud_utilities", userId: demoUser.id, categoryId: "cat_utilities", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "220.00", alertThreshold: 90, rollover: false },
    { id: "bud_entertainment", userId: demoUser.id, categoryId: "cat_entertainment", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "180.00", alertThreshold: 75, rollover: false },
    { id: "bud_shopping", userId: demoUser.id, categoryId: "cat_shopping", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "350.00", alertThreshold: 80, rollover: true },
    { id: "bud_health", userId: demoUser.id, categoryId: "cat_health", period: "monthly", monthYear: currentMonthYear, allocatedAmount: "150.00", alertThreshold: 85, rollover: false },
  ];

  await db.insert(budgets).values(budgetList);

  // 5. Create Savings Goals
  const savingsGoalsList = [
    {
      id: "goal_emergency",
      userId: demoUser.id,
      title: "6-Month Emergency Safety Fund",
      targetAmount: "18000.00",
      currentAmount: "14250.00",
      targetDate: "2026-09-30",
      category: "Emergency",
      color: "#10B981",
      icon: "ShieldCheck",
      isCompleted: false,
    },
    {
      id: "goal_japan",
      userId: demoUser.id,
      title: "Tokyo & Kyoto Autumn Trip",
      targetAmount: "4500.00",
      currentAmount: "3600.00",
      targetDate: "2026-10-15",
      category: "Travel",
      color: "#EC4899",
      icon: "Plane",
      isCompleted: false,
    },
    {
      id: "goal_tech",
      userId: demoUser.id,
      title: "Apple Vision Pro / Next Setup",
      targetAmount: "3500.00",
      currentAmount: "2800.00",
      targetDate: "2026-07-01",
      category: "Gadgets",
      color: "#8B5CF6",
      icon: "Laptop",
      isCompleted: false,
    },
    {
      id: "goal_car",
      userId: demoUser.id,
      title: "Electric Vehicle Down Payment",
      targetAmount: "10000.00",
      currentAmount: "6400.00",
      targetDate: "2026-12-31",
      category: "Vehicle",
      color: "#3B82F6",
      icon: "Car",
      isCompleted: false,
    },
  ];

  await db.insert(savingsGoals).values(savingsGoalsList);

  // 6. Create Recurring Rules
  const recurringRulesList = [
    {
      id: "rec_rent",
      userId: demoUser.id,
      title: "Monthly Apartment Rent",
      amount: "1950.00",
      type: "expense",
      frequency: "monthly",
      nextDueDate: "2026-04-01",
      accountId: "acc_checking",
      categoryId: "cat_housing",
      autoProcess: true,
      status: "active",
    },
    {
      id: "rec_salary",
      userId: demoUser.id,
      title: "TechCorp Bi-Weekly Salary",
      amount: "3250.00",
      type: "income",
      frequency: "weekly",
      nextDueDate: "2026-03-28",
      accountId: "acc_checking",
      categoryId: "cat_salary",
      autoProcess: true,
      status: "active",
    },
    {
      id: "rec_gym",
      userId: demoUser.id,
      title: "Equinox Fitness Club",
      amount: "120.00",
      type: "expense",
      frequency: "monthly",
      nextDueDate: "2026-04-05",
      accountId: "acc_credit",
      categoryId: "cat_health",
      autoProcess: true,
      status: "active",
    },
    {
      id: "rec_netflix",
      userId: demoUser.id,
      title: "Netflix 4K Ultra Plan",
      amount: "22.99",
      type: "expense",
      frequency: "monthly",
      nextDueDate: "2026-04-12",
      accountId: "acc_credit",
      categoryId: "cat_entertainment",
      autoProcess: true,
      status: "active",
    },
    {
      id: "rec_spotify",
      userId: demoUser.id,
      title: "Spotify Duo Family",
      amount: "14.99",
      type: "expense",
      frequency: "monthly",
      nextDueDate: "2026-04-18",
      accountId: "acc_credit",
      categoryId: "cat_entertainment",
      autoProcess: true,
      status: "active",
    },
    {
      id: "rec_internet",
      userId: demoUser.id,
      title: "Fiber 1Gbps Internet",
      amount: "70.00",
      type: "expense",
      frequency: "monthly",
      nextDueDate: "2026-04-20",
      accountId: "acc_checking",
      categoryId: "cat_utilities",
      autoProcess: true,
      status: "active",
    },
  ];

  await db.insert(recurringRules).values(recurringRulesList);

  // 7. Create Debt / Split Records
  const debtSplitsList = [
    {
      id: "debt_1",
      userId: demoUser.id,
      personName: "Sarah Jenkins",
      type: "owed_to_me",
      amount: "65.50",
      settledAmount: "0.00",
      description: "Omakase dinner split at Sushi Noz",
      dueDate: "2026-04-01",
      status: "unpaid",
    },
    {
      id: "debt_2",
      userId: demoUser.id,
      personName: "David Kim",
      type: "owed_to_me",
      amount: "140.00",
      settledAmount: "70.00",
      description: "Coachella weekend Airbnb share",
      dueDate: "2026-04-15",
      status: "partially_paid",
    },
    {
      id: "debt_3",
      userId: demoUser.id,
      personName: "Marcus Vance",
      type: "i_owe",
      amount: "42.00",
      settledAmount: "0.00",
      description: "Lyft XL ride from SFO airport",
      dueDate: "2026-03-30",
      status: "unpaid",
    },
  ];

  await db.insert(debtSplits).values(debtSplitsList);

  // 8. Generate 70+ Realistic Daily Transactions over the last 60 days
  const transactionTemplates = [
    // Today & recent days
    { daysAgo: 0, desc: "Whole Foods Organic Market", amount: "84.30", type: "expense", cat: "cat_groceries", acc: "acc_credit", method: "card", tags: ["groceries", "organic"], merchant: "Whole Foods" },
    { daysAgo: 0, desc: "Blue Bottle Pour-over & Croissant", amount: "9.75", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "apple_pay", tags: ["coffee", "daily"], merchant: "Blue Bottle Coffee" },
    { daysAgo: 1, desc: "Freelance UI Design Milestone #2", amount: "1250.00", type: "income", cat: "cat_freelance", acc: "acc_checking", method: "bank_transfer", tags: ["client-work", "design"], merchant: "Stripe Payout" },
    { daysAgo: 1, desc: "Uber to Downtown Meeting", amount: "24.50", type: "expense", cat: "cat_transport", acc: "acc_credit", method: "apple_pay", tags: ["transport", "work"], merchant: "Uber Technologies" },
    { daysAgo: 2, desc: "Sweetgreen Harvest Bowl", amount: "18.25", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "card", tags: ["lunch", "healthy"], merchant: "Sweetgreen" },
    { daysAgo: 2, desc: "Trader Joe's Weekly Staples", amount: "67.40", type: "expense", cat: "cat_groceries", acc: "acc_checking", method: "card", tags: ["groceries"], merchant: "Trader Joe's" },
    { daysAgo: 3, desc: "Gasoline Shell 91 Octane", amount: "52.80", type: "expense", cat: "cat_transport", acc: "acc_credit", method: "card", tags: ["gas", "commute"], merchant: "Shell Oil" },
    { daysAgo: 3, desc: "Apple Developer Annual Renewal", amount: "99.00", type: "expense", cat: "cat_shopping", acc: "acc_credit", method: "card", tags: ["tech", "tax-deductible"], merchant: "Apple Inc" },
    { daysAgo: 4, desc: "Ramen Dinner with Friends", amount: "48.50", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "card", tags: ["dining", "social"], merchant: "Ippudo Ramen" },
    { daysAgo: 5, desc: "Netflix 4K Ultra Subscription", amount: "22.99", type: "expense", cat: "cat_entertainment", acc: "acc_credit", method: "card", tags: ["subscription", "media"], merchant: "Netflix" },
    { daysAgo: 6, desc: "Pharmacy & Vitamins", amount: "35.20", type: "expense", cat: "cat_health", acc: "acc_checking", method: "card", tags: ["health", "wellness"], merchant: "CVS Pharmacy" },
    { daysAgo: 7, desc: "Bi-Weekly TechCorp Salary", amount: "3250.00", type: "income", cat: "cat_salary", acc: "acc_checking", method: "bank_transfer", tags: ["salary", "direct-deposit"], merchant: "TechCorp Inc." },
    { daysAgo: 7, desc: "Transfer to High Yield Savings", amount: "750.00", type: "transfer", cat: "cat_misc", acc: "acc_checking", method: "bank_transfer", tags: ["savings", "auto-save"], merchant: "Marcus Savings", transferTo: "acc_savings" },
    { daysAgo: 8, desc: "Uniqlo Spring Wardrobe Basics", amount: "112.50", type: "expense", cat: "cat_shopping", acc: "acc_credit", method: "card", tags: ["apparel"], merchant: "Uniqlo" },
    { daysAgo: 9, desc: "High-Speed Home Fiber Bill", amount: "70.00", type: "expense", cat: "cat_utilities", acc: "acc_checking", method: "bank_transfer", tags: ["utilities", "internet"], merchant: "Sonic Telecom" },
    { daysAgo: 10, desc: "Target Home Essentials & Cleaning", amount: "63.20", type: "expense", cat: "cat_groceries", acc: "acc_credit", method: "card", tags: ["essentials"], merchant: "Target" },
    { daysAgo: 11, desc: "Blue Bottle Cold Brew & Pastry", amount: "11.50", type: "expense", cat: "cat_dining", acc: "acc_cash", method: "cash", tags: ["coffee"], merchant: "Blue Bottle" },
    { daysAgo: 12, desc: "Kindle eBooks (Designing Systems)", amount: "24.99", type: "expense", cat: "cat_education", acc: "acc_credit", method: "card", tags: ["learning", "books"], merchant: "Amazon" },
    { daysAgo: 13, desc: "Electricity & Gas PG&E", amount: "125.60", type: "expense", cat: "cat_utilities", acc: "acc_checking", method: "bank_transfer", tags: ["utilities", "energy"], merchant: "Pacific Gas & Electric" },
    { daysAgo: 14, desc: "Cocktails & Tapas Evening", amount: "88.00", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "card", tags: ["weekend", "social"], merchant: "Bar Bocce" },
    { daysAgo: 15, desc: "Equinox Monthly Gym Membership", amount: "120.00", type: "expense", cat: "cat_health", acc: "acc_credit", method: "card", tags: ["fitness", "subscription"], merchant: "Equinox" },
    { daysAgo: 16, desc: "Costco Bulk Groceries & Produce", amount: "185.40", type: "expense", cat: "cat_groceries", acc: "acc_checking", method: "card", tags: ["groceries", "bulk"], merchant: "Costco Wholesale" },
    { daysAgo: 17, desc: "Vanguard Quarterly Dividend Payout", amount: "182.45", type: "income", cat: "cat_investments_inc", acc: "acc_investments", method: "bank_transfer", tags: ["dividends", "passive"], merchant: "Vanguard Brokerage" },
    { daysAgo: 18, desc: "Subway Transit Pass Refill", amount: "45.00", type: "expense", cat: "cat_transport", acc: "acc_credit", method: "apple_pay", tags: ["commute", "transit"], merchant: "Clipper Card" },
    { daysAgo: 19, desc: "Spotify Duo Monthly Plan", amount: "14.99", type: "expense", cat: "cat_entertainment", acc: "acc_credit", method: "card", tags: ["subscription", "music"], merchant: "Spotify" },
    { daysAgo: 20, desc: "Italian Bistro Anniversary Dinner", amount: "142.00", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "card", tags: ["dining", "celebration"], merchant: "Locanda Positano" },
    { daysAgo: 21, desc: "Bi-Weekly TechCorp Salary", amount: "3250.00", type: "income", cat: "cat_salary", acc: "acc_checking", method: "bank_transfer", tags: ["salary"], merchant: "TechCorp Inc." },
    { daysAgo: 22, desc: "Apartment Rent Payment", amount: "1950.00", type: "expense", cat: "cat_housing", acc: "acc_checking", method: "bank_transfer", tags: ["rent", "housing"], merchant: "Skyline Properties" },
    { daysAgo: 23, desc: "Amazon Office Ergonomic Keyboard", amount: "139.99", type: "expense", cat: "cat_shopping", acc: "acc_credit", method: "card", tags: ["tech", "workspace"], merchant: "Amazon" },
    { daysAgo: 24, desc: "Farmers Market Fresh Fruits", amount: "34.00", type: "expense", cat: "cat_groceries", acc: "acc_cash", method: "cash", tags: ["groceries", "local"], merchant: "Ferry Building Market" },
    { daysAgo: 25, desc: "Movie Night IMAX Dune 2", amount: "38.50", type: "expense", cat: "cat_entertainment", acc: "acc_credit", method: "card", tags: ["movies", "weekend"], merchant: "AMC Theatres" },
    { daysAgo: 26, desc: "Water & Trash City Utility", amount: "48.20", type: "expense", cat: "cat_utilities", acc: "acc_checking", method: "bank_transfer", tags: ["utilities"], merchant: "City Water Dept" },
    { daysAgo: 27, desc: "Consulting Frontend Audit", amount: "900.00", type: "income", cat: "cat_freelance", acc: "acc_checking", method: "bank_transfer", tags: ["consulting", "side-income"], merchant: "Apex Studio" },
    { daysAgo: 28, desc: "Safeway Grocery Run", amount: "54.10", type: "expense", cat: "cat_groceries", acc: "acc_credit", method: "card", tags: ["groceries"], merchant: "Safeway" },
    { daysAgo: 29, desc: "Chipotle Burrito Bowl", amount: "15.40", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "apple_pay", tags: ["dining", "quick-lunch"], merchant: "Chipotle" },
    { daysAgo: 30, desc: "Interest Marcus High Yield", amount: "98.50", type: "income", cat: "cat_investments_inc", acc: "acc_savings", method: "bank_transfer", tags: ["interest", "passive"], merchant: "Goldman Sachs" },
    { daysAgo: 32, desc: "Southwest Flight to Denver", amount: "264.00", type: "expense", cat: "cat_travel", acc: "acc_credit", method: "card", tags: ["travel", "flights"], merchant: "Southwest Airlines" },
    { daysAgo: 33, desc: "Hotel 2 Nights Denver Downtown", amount: "310.00", type: "expense", cat: "cat_travel", acc: "acc_credit", method: "card", tags: ["travel", "lodging"], merchant: "Hyatt Regency" },
    { daysAgo: 34, desc: "Whole Foods Deli & Groceries", amount: "72.30", type: "expense", cat: "cat_groceries", acc: "acc_credit", method: "card", tags: ["groceries"], merchant: "Whole Foods" },
    { daysAgo: 35, desc: "Bi-Weekly TechCorp Salary", amount: "3250.00", type: "income", cat: "cat_salary", acc: "acc_checking", method: "bank_transfer", tags: ["salary"], merchant: "TechCorp Inc." },
    { daysAgo: 36, desc: "Car Wash & Detailing", amount: "40.00", type: "expense", cat: "cat_transport", acc: "acc_cash", method: "cash", tags: ["transport"], merchant: "Eco Car Wash" },
    { daysAgo: 37, desc: "Boba Guys Milk Tea x2", amount: "14.50", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "apple_pay", tags: ["drinks"], merchant: "Boba Guys" },
    { daysAgo: 38, desc: "Nike Running Shoes Pegasus 41", amount: "135.00", type: "expense", cat: "cat_health", acc: "acc_credit", method: "card", tags: ["fitness", "shoes"], merchant: "Nike Store" },
    { daysAgo: 40, desc: "Apartment Rent Payment", amount: "1950.00", type: "expense", cat: "cat_housing", acc: "acc_checking", method: "bank_transfer", tags: ["rent"], merchant: "Skyline Properties" },
    { daysAgo: 42, desc: "Trader Joe's Dinner & Snacks", amount: "58.90", type: "expense", cat: "cat_groceries", acc: "acc_credit", method: "card", tags: ["groceries"], merchant: "Trader Joe's" },
    { daysAgo: 44, desc: "ChatGPT Plus & GitHub Copilot", amount: "30.00", type: "expense", cat: "cat_shopping", acc: "acc_credit", method: "card", tags: ["ai", "tools"], merchant: "OpenAI / GitHub" },
    { daysAgo: 46, desc: "Dentist Routine Cleaning & X-Ray", amount: "75.00", type: "expense", cat: "cat_health", acc: "acc_checking", method: "card", tags: ["medical", "health"], merchant: "Mission Dental" },
    { daysAgo: 49, desc: "Bi-Weekly TechCorp Salary", amount: "3250.00", type: "income", cat: "cat_salary", acc: "acc_checking", method: "bank_transfer", tags: ["salary"], merchant: "TechCorp Inc." },
    { daysAgo: 50, desc: "Birthday Gift for Mom", amount: "120.00", type: "expense", cat: "cat_shopping", acc: "acc_credit", method: "card", tags: ["gift", "family"], merchant: "Nordstrom" },
    { daysAgo: 52, desc: "Thai Basil & Pad Thai Takeout", amount: "36.80", type: "expense", cat: "cat_dining", acc: "acc_credit", method: "card", tags: ["dining", "takeout"], merchant: "Marry Thai" },
    { daysAgo: 55, desc: "Chevron Gas Tank Full", amount: "49.50", type: "expense", cat: "cat_transport", acc: "acc_credit", method: "card", tags: ["gas"], merchant: "Chevron" },
    { daysAgo: 58, desc: "Coursera Specialized Tech Certificate", amount: "59.00", type: "expense", cat: "cat_education", acc: "acc_credit", method: "card", tags: ["learning"], merchant: "Coursera" },
  ];

  const transactionRows = transactionTemplates.map((t, idx) => {
    const txDate = format(subDays(today, t.daysAgo), "yyyy-MM-dd");
    return {
      id: `tx_alex_${idx + 1}`,
      userId: demoUser.id,
      accountId: t.acc,
      categoryId: t.cat,
      type: t.type,
      amount: t.amount,
      date: txDate,
      description: t.desc,
      merchant: t.merchant || null,
      notes: t.tags ? `Tagged: ${t.tags.join(", ")}` : null,
      status: "cleared",
      paymentMethod: t.method || "card",
      tags: JSON.stringify(t.tags || []),
      isRecurring: t.desc.includes("Salary") || t.desc.includes("Rent") || t.desc.includes("Netflix") || t.desc.includes("Spotify"),
      recurringRuleId: null,
      transferToAccountId: t.transferTo || null,
      receiptUrl: null,
      createdAt: subDays(today, t.daysAgo),
    };
  });

  await db.insert(transactions).values(transactionRows);

  return { success: true, message: "Database successfully seeded with realistic finance data" };
}
