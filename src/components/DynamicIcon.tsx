"use client";

import React from "react";
import {
  Landmark,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Film,
  ShoppingBag,
  HeartPulse,
  Plane,
  BookOpen,
  Briefcase,
  Laptop,
  Gift,
  ShieldCheck,
  Tag,
  HelpCircle,
  Coffee,
  DollarSign,
  Smartphone,
  Wifi,
  Fuel,
  Users,
  Repeat,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  landmark: Landmark,
  wallet: Wallet,
  creditcard: CreditCard,
  piggybank: PiggyBank,
  trendingup: TrendingUp,
  home: Home,
  shoppingcart: ShoppingCart,
  utensils: Utensils,
  car: Car,
  zap: Zap,
  film: Film,
  shoppingbag: ShoppingBag,
  heartpulse: HeartPulse,
  plane: Plane,
  bookopen: BookOpen,
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
  shieldcheck: ShieldCheck,
  tag: Tag,
  helpcircle: HelpCircle,
  coffee: Coffee,
  dollarsign: DollarSign,
  smartphone: Smartphone,
  wifi: Wifi,
  fuel: Fuel,
  users: Users,
  repeat: Repeat,
  arrowrightleft: ArrowRightLeft,
  calendar: Calendar,
  alertcircle: AlertCircle,
  checkcircle2: CheckCircle2,
  receipt: Receipt,
};

interface DynamicIconProps {
  name?: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name = "tag", className = "w-4 h-4", size = 18 }: DynamicIconProps) {
  const normalizedKey = (name || "tag").toLowerCase().replace(/[^a-z0-9]/g, "");
  const IconComponent = iconMap[normalizedKey] || Tag;

  return <IconComponent className={className} size={size} />;
}
