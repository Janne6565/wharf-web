import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn merges conditional Tailwind class names, resolving conflicts (last wins).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
