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
 * Format currency from cents with explicit currency code.
 * Convenience wrapper around formatPrice for cases where currency varies.
 *
 * @param cents - Amount in cents
 * @param currencyCode - ISO 4217 currency code (e.g., 'EUR', 'USD')
 * @param locale - Optional locale override
 * @returns Formatted currency string (e.g., "29,99 €")
 */
export function formatCurrency(
  cents: number,
  currencyCode: string,
  locale?: string
): string {
  return formatPrice(cents, { currency: currencyCode, locale })
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

/**
 * Parse a euro string value to cents using string manipulation.
 * Avoids floating point precision issues (e.g., 19.99 * 100 = 1998.9999999999998).
 *
 * @param euroString - String value in euros (e.g., "19.99", "100", "5.5")
 * @returns Amount in cents as integer
 *
 * @example
 * parseEuroToCents("19.99") // 1999
 * parseEuroToCents("100")   // 10000
 * parseEuroToCents("5.5")   // 550
 * parseEuroToCents("")      // 0
 */
export function parseEuroToCents(euroString: string): number {
  const value = euroString || '0'
  const parts = value.split('.')
  const euros = parseInt(parts[0] || '0', 10)
  const centsPart = (parts[1] || '0').padEnd(2, '0').slice(0, 2)
  const cents = Math.abs(euros) * 100 + parseInt(centsPart, 10)
  return euros < 0 ? -cents : cents
}

/**
 * Format cents to a euro string for input fields.
 *
 * @param cents - Amount in cents
 * @returns String value in euros with 2 decimal places (e.g., "19.99")
 *
 * @example
 * formatCentsToEuroInput(1999)  // "19.99"
 * formatCentsToEuroInput(10000) // "100.00"
 * formatCentsToEuroInput(550)   // "5.50"
 */
export function formatCentsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2)
}
