
import { clsx, type ClassValue } from "clsx"
import * as tailwindMerge from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return tailwindMerge.twMerge(clsx(inputs))
}
