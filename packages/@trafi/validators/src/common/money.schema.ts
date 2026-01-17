import { z } from '@trafi/zod';

/**
 * Supported currencies
 */
export const CurrencySchema = z.enum(['EUR', 'USD', 'GBP']);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * Money schema - ALWAYS stored as integer cents
 * NEVER use floats for currency calculations
 */
export const MoneySchema = z.object({
  amount: z.number().int().describe('Amount in cents (e.g., 1999 = 19.99)'),
  currency: CurrencySchema,
});

export type Money = z.infer<typeof MoneySchema>;

/**
 * Price schema with optional compare-at price for discounts
 */
export const PriceSchema = z.object({
  price: MoneySchema,
  compareAtPrice: MoneySchema.optional(),
});

export type Price = z.infer<typeof PriceSchema>;
