export function formatCurrency(amount: number | string | null | undefined, currency: string = "USD"): string {
  const numericVal = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numericVal)) return "$0.00";

  const currencyMap: Record<string, { locale: string; code: string; symbol: string }> = {
    USD: { locale: "en-US", code: "USD", symbol: "$" },
    EUR: { locale: "de-DE", code: "EUR", symbol: "€" },
    GBP: { locale: "en-GB", code: "GBP", symbol: "£" },
    JPY: { locale: "ja-JP", code: "JPY", symbol: "¥" },
    CAD: { locale: "en-CA", code: "CAD", symbol: "CA$" },
    AUD: { locale: "en-AU", code: "AUD", symbol: "A$" },
    INR: { locale: "en-IN", code: "INR", symbol: "₹" },
  };

  const curr = currencyMap[currency] || currencyMap["USD"];

  try {
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      maximumFractionDigits: curr.code === "JPY" ? 0 : 2,
      minimumFractionDigits: curr.code === "JPY" ? 0 : 2,
    }).format(numericVal);
  } catch {
    return `${curr.symbol}${numericVal.toFixed(2)}`;
  }
}

export function formatCompactCurrency(amount: number | string | null | undefined, currency: string = "USD"): string {
  const numericVal = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numericVal)) return "$0";

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "CA$",
    AUD: "A$",
    INR: "₹",
  };
  const sym = currencySymbols[currency] || "$";

  if (Math.abs(numericVal) >= 1_000_000) {
    return `${sym}${(numericVal / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(numericVal) >= 1_000) {
    return `${sym}${(numericVal / 1_000).toFixed(1)}k`;
  }
  return `${sym}${numericVal.toFixed(0)}`;
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return "0%";
  return `${Math.round(val)}%`;
}

export function getCategoryIconName(name?: string): string {
  if (!name) return "Tag";
  const lower = name.toLowerCase();
  if (lower.includes("house") || lower.includes("rent")) return "Home";
  if (lower.includes("groc") || lower.includes("food") || lower.includes("supermarket")) return "ShoppingCart";
  if (lower.includes("dine") || lower.includes("cafe") || lower.includes("restaurant") || lower.includes("coffee")) return "Utensils";
  if (lower.includes("trans") || lower.includes("gas") || lower.includes("car") || lower.includes("uber")) return "Car";
  if (lower.includes("util") || lower.includes("bill") || lower.includes("power") || lower.includes("elec")) return "Zap";
  if (lower.includes("entertain") || lower.includes("movie") || lower.includes("stream") || lower.includes("music")) return "Film";
  if (lower.includes("shop") || lower.includes("tech") || lower.includes("gadget") || lower.includes("amazon")) return "ShoppingBag";
  if (lower.includes("health") || lower.includes("fit") || lower.includes("gym") || lower.includes("med")) return "HeartPulse";
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("hotel") || lower.includes("vacation")) return "Plane";
  if (lower.includes("edu") || lower.includes("book") || lower.includes("course") || lower.includes("school")) return "BookOpen";
  if (lower.includes("salary") || lower.includes("paycheck") || lower.includes("wage")) return "Briefcase";
  if (lower.includes("free") || lower.includes("consult") || lower.includes("side")) return "Laptop";
  if (lower.includes("invest") || lower.includes("stock") || lower.includes("div")) return "TrendingUp";
  if (lower.includes("gift") || lower.includes("reward") || lower.includes("cashback")) return "Gift";
  return "Tag";
}
