import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, unit: string) {
  if (unit === "CRORE") return `${price} Crore PKR`;
  if (unit === "LAKH") return `${price} Lakh PKR`;
  return `PKR ${price.toLocaleString()}`;
}

export function formatArea(size: number, unit: string) {
  return `${size} ${unit.charAt(0) + unit.slice(1).toLowerCase()}`;
}

export function getPropertyTypeLabel(type: string) {
  const types: Record<string, string> = {
    HOUSE: "House",
    FLAT: "Flat",
    APARTMENT: "Apartment",
    PLOT: "Residential Plot",
    COMMERCIAL_PLOT: "Commercial Plot",
    OFFICE: "Office",
    SHOP: "Shop",
    WAREHOUSE: "Warehouse",
    FARM_HOUSE: "Farm House",
    PENTHOUSE: "Penthouse",
    UPPER_PORTION: "Upper Portion",
    LOWER_PORTION: "Lower Portion",
    ROOM: "Room",
    STUDIO: "Studio Apartment",
  };
  return types[type] || type;
}

export function timeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
