import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Default locale and currency for the application.
 * These can be overridden per-call or via environment variables.
 */
const DEFAULT_LOCALE = 'fr-FR'
const DEFAULT_CURRENCY = 'EUR'

/**
 * Format price from cents to display string.
 * Centralizes currency formatting to avoid duplication.
 *
 * @param cents - Price in cents
 * @param options - Optional locale and currency overrides
 * @returns Formatted price string (e.g., "29,99 €")
 */
export function formatPrice(
  cents: number,
  options?: { locale?: string; currency?: string }
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE
  const currency = options?.currency ?? DEFAULT_CURRENCY

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

/**
 * Format date for display.
 * Centralizes date formatting to avoid duplication.
 *
 * @param date - Date to format
 * @param options - Optional locale override
 * @returns Formatted date string (e.g., "18/01/2026 14:30")
 */
export function formatDate(
  date: Date | string,
  options?: { locale?: string }
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
