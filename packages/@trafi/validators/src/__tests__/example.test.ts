import { describe, it, expect } from 'vitest';
import { MoneySchema, CurrencySchema, PriceSchema } from '../common/money.schema';
import { PaginationSchema } from '../common/pagination.schema';

/**
 * Example tests for @trafi/validators package.
 * Tests Zod schema validation for core domain models.
 */
describe('MoneySchema', () => {
  it('should validate correct money object', () => {
    const validMoney = { amount: 1999, currency: 'EUR' };
    const result = MoneySchema.safeParse(validMoney);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1999);
      expect(result.data.currency).toBe('EUR');
    }
  });

  it('should reject non-integer amounts', () => {
    const invalidMoney = { amount: 19.99, currency: 'EUR' };
    const result = MoneySchema.safeParse(invalidMoney);

    expect(result.success).toBe(false);
  });

  it('should reject invalid currency', () => {
    const invalidMoney = { amount: 1999, currency: 'JPY' };
    const result = MoneySchema.safeParse(invalidMoney);

    expect(result.success).toBe(false);
  });
});

describe('CurrencySchema', () => {
  it('should accept valid currencies', () => {
    expect(CurrencySchema.safeParse('EUR').success).toBe(true);
    expect(CurrencySchema.safeParse('USD').success).toBe(true);
    expect(CurrencySchema.safeParse('GBP').success).toBe(true);
  });

  it('should reject invalid currencies', () => {
    expect(CurrencySchema.safeParse('JPY').success).toBe(false);
    expect(CurrencySchema.safeParse('EURO').success).toBe(false);
    expect(CurrencySchema.safeParse('').success).toBe(false);
  });
});

describe('PriceSchema', () => {
  it('should validate price with compareAtPrice', () => {
    const priceWithDiscount = {
      price: { amount: 1599, currency: 'EUR' },
      compareAtPrice: { amount: 1999, currency: 'EUR' },
    };
    const result = PriceSchema.safeParse(priceWithDiscount);

    expect(result.success).toBe(true);
  });

  it('should validate price without compareAtPrice', () => {
    const priceWithoutDiscount = {
      price: { amount: 1599, currency: 'USD' },
    };
    const result = PriceSchema.safeParse(priceWithoutDiscount);

    expect(result.success).toBe(true);
  });
});

describe('PaginationSchema', () => {
  it('should apply default values', () => {
    const result = PaginationSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should validate custom pagination values', () => {
    const result = PaginationSchema.safeParse({ page: 5, limit: 50 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject invalid page numbers', () => {
    const result = PaginationSchema.safeParse({ page: 0 });

    expect(result.success).toBe(false);
  });

  it('should reject exceeding limit', () => {
    const result = PaginationSchema.safeParse({ limit: 200 });

    expect(result.success).toBe(false);
  });
});
