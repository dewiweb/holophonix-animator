/**
 * Class name utility function
 * Combines and deduplicates class names with Tailwind support
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging class names
 * Uses clsx for combining conditional classes
 * Uses tailwind-merge for proper Tailwind deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
