// Curated lucide icon set for categories. Keeping a fixed map (instead of the
// full dynamic lucide bundle) keeps the client small and the picker finite.
import {
  Utensils,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  Smartphone,
  Wallet,
  Gift,
  Plane,
  Shirt,
  GraduationCap,
  Dumbbell,
  PawPrint,
  Baby,
  Fuel,
  Wrench,
  Receipt,
  PiggyBank,
  Briefcase,
  TrendingUp,
  Circle,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  home: Home,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  smartphone: Smartphone,
  wallet: Wallet,
  gift: Gift,
  plane: Plane,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  dumbbell: Dumbbell,
  "paw-print": PawPrint,
  baby: Baby,
  fuel: Fuel,
  wrench: Wrench,
  receipt: Receipt,
  "piggy-bank": PiggyBank,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  circle: Circle,
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? Circle;
}

// Palette offered in the category color picker.
export const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate
  "#84cc16", // lime
];
