/**
 * ISO 4217 Currencies Seed Data
 *
 * Populates the currencies table with ISO 4217 standard currency codes.
 * This is global reference data shared across all stores.
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC3)
 * @see Principle #1 Exception - Global reference tables
 */

import type { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Currency data structure matching Prisma model
 */
export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  decimalDigits: number;
}

/**
 * ISO 4217 currency data
 * Includes commonly used currencies for e-commerce.
 * Note: decimalDigits varies (2 for most, 0 for JPY/KRW, 3 for some)
 */
export const CURRENCIES_DATA: CurrencyData[] = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalDigits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC', decimalDigits: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3', decimalDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5', decimalDigits: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5', decimalDigits: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalDigits: 2 },

  // Americas
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalDigits: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalDigits: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalDigits: 2 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimalDigits: 2 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimalDigits: 0 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimalDigits: 2 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimalDigits: 2 },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', decimalDigits: 2 },

  // Europe
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalDigits: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalDigits: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalDigits: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142', decimalDigits: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'K\u010D', decimalDigits: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalDigits: 2 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimalDigits: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimalDigits: 2 },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', decimalDigits: 2 },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', decimalDigits: 0 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '\u20BD', decimalDigits: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '\u20B4', decimalDigits: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA', decimalDigits: 2 },

  // Asia-Pacific
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalDigits: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalDigits: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9', decimalDigits: 0 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalDigits: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalDigits: 2 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimalDigits: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0E3F', decimalDigits: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalDigits: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalDigits: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '\u20B1', decimalDigits: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '\u20AB', decimalDigits: 0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9', decimalDigits: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '\u20A8', decimalDigits: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '\u09F3', decimalDigits: 2 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimalDigits: 2 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '\u20A8', decimalDigits: 2 },

  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: '\u062F.\u0625', decimalDigits: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '\uFDFC', decimalDigits: 2 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '\u20AA', decimalDigits: 2 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '\uFDFC', decimalDigits: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: '\u062F.\u0643', decimalDigits: 3 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.\u062F.\u0628', decimalDigits: 3 },
  { code: 'OMR', name: 'Omani Rial', symbol: '\uFDFC', decimalDigits: 3 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: '\u062F.\u0627', decimalDigits: 3 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '\u00A3', decimalDigits: 2 },

  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalDigits: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6', decimalDigits: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimalDigits: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '\u20B5', decimalDigits: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: '\u062F.\u0645.', decimalDigits: 2 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: '\u062F.\u062A', decimalDigits: 3 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: '\u062F.\u062C', decimalDigits: 2 },

  // Cryptocurrencies (commonly used in e-commerce)
  { code: 'BTC', name: 'Bitcoin', symbol: '\u20BF', decimalDigits: 8 },
  { code: 'ETH', name: 'Ethereum', symbol: '\u039E', decimalDigits: 18 },
];

/**
 * Seed currencies into database
 * Uses createMany with skipDuplicates for efficiency and idempotency
 */
export async function seedCurrencies(prisma: PrismaClient): Promise<void> {
  console.log('\n--- Seeding Currencies ---');

  // Use createMany with skipDuplicates for efficiency
  const result = await prisma.currency.createMany({
    data: CURRENCIES_DATA,
    skipDuplicates: true,
  });

  console.log(`  Created: ${result.count} new currencies`);
  console.log(`  Total available: ${CURRENCIES_DATA.length} currencies`);
}
