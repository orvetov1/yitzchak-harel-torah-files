
import { type ClassValue } from "clsx"
import clsx from "clsx"
import tailwindMerge from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return tailwindMerge(clsx(...inputs))
}
