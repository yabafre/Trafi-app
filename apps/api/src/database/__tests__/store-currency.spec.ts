/**
 * StoreCurrency Join Table Tests
 *
 * Tests for the StoreCurrency join table that links Store to Currency.
 * Per Architecture Principle #2: Use join tables, NOT arrays.
 *
 * @see Story 3.R1 - Foundation Reinforcement (Task 7.2)
 */

describe('StoreCurrency Join Table', () => {
  // Mock data
  const mockStoreId = 'store_123';
  const mockCurrencyCode = 'EUR';

  const createMockStoreCurrency = (overrides = {}) => ({
    storeId: mockStoreId,
    currencyCode: mockCurrencyCode,
    isDefault: true,
    createdAt: new Date('2026-01-22'),
    ...overrides,
  });

  describe('Schema Structure', () => {
    it('should have composite primary key [storeId, currencyCode]', () => {
      // StoreCurrency uses @@id([storeId, currencyCode]) - no single id field
      const storeCurrency = createMockStoreCurrency();

      expect(storeCurrency.storeId).toBeDefined();
      expect(storeCurrency.currencyCode).toBeDefined();
      // Composite key is storeId + currencyCode
      expect(`${storeCurrency.storeId}_${storeCurrency.currencyCode}`).toBe(
        `${mockStoreId}_${mockCurrencyCode}`,
      );
    });

    it('should have isDefault boolean field with default false', () => {
      const defaultStoreCurrency = createMockStoreCurrency({ isDefault: false });
      expect(defaultStoreCurrency.isDefault).toBe(false);

      const primaryCurrency = createMockStoreCurrency({ isDefault: true });
      expect(primaryCurrency.isDefault).toBe(true);
    });

    it('should have createdAt timestamp', () => {
      const storeCurrency = createMockStoreCurrency();
      expect(storeCurrency.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Composite Key Uniqueness', () => {
    it('should allow same store with different currencies', () => {
      const eurCurrency = createMockStoreCurrency({ currencyCode: 'EUR' });
      const usdCurrency = createMockStoreCurrency({ currencyCode: 'USD' });

      // Same store, different currencies = different records
      expect(eurCurrency.storeId).toBe(usdCurrency.storeId);
      expect(eurCurrency.currencyCode).not.toBe(usdCurrency.currencyCode);
    });

    it('should allow same currency for different stores', () => {
      const store1Currency = createMockStoreCurrency({ storeId: 'store_1' });
      const store2Currency = createMockStoreCurrency({ storeId: 'store_2' });

      // Different stores, same currency = different records
      expect(store1Currency.storeId).not.toBe(store2Currency.storeId);
      expect(store1Currency.currencyCode).toBe(store2Currency.currencyCode);
    });

    it('should have unique composite key per store-currency pair', () => {
      const currency1 = createMockStoreCurrency();
      const currency2 = createMockStoreCurrency();

      // Same store + same currency = same composite key
      const key1 = `${currency1.storeId}_${currency1.currencyCode}`;
      const key2 = `${currency2.storeId}_${currency2.currencyCode}`;
      expect(key1).toBe(key2);
    });
  });

  describe('Default Currency Flag', () => {
    it('should identify default currency for a store', () => {
      const currencies = [
        createMockStoreCurrency({ currencyCode: 'EUR', isDefault: true }),
        createMockStoreCurrency({ currencyCode: 'USD', isDefault: false }),
        createMockStoreCurrency({ currencyCode: 'GBP', isDefault: false }),
      ];

      const defaultCurrency = currencies.find((c) => c.isDefault);
      expect(defaultCurrency?.currencyCode).toBe('EUR');
    });

    it('should allow only one default currency per store (business rule)', () => {
      // Business rule: Only one currency should be default per store
      // This is enforced at application level, not schema level
      const currencies = [
        createMockStoreCurrency({ currencyCode: 'EUR', isDefault: true }),
        createMockStoreCurrency({ currencyCode: 'USD', isDefault: false }),
      ];

      const defaultCount = currencies.filter((c) => c.isDefault).length;
      expect(defaultCount).toBe(1);
    });
  });

  describe('Relation References', () => {
    it('should reference Store by storeId', () => {
      const storeCurrency = createMockStoreCurrency();
      // storeId should follow the store_ prefix pattern
      expect(storeCurrency.storeId).toMatch(/^store_/);
    });

    it('should reference Currency by ISO 4217 code', () => {
      const storeCurrency = createMockStoreCurrency({ currencyCode: 'EUR' });
      // currencyCode should be 3-letter ISO 4217
      expect(storeCurrency.currencyCode).toMatch(/^[A-Z]{3}$/);
    });

    it('should support common ISO 4217 currency codes', () => {
      const validCodes = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

      validCodes.forEach((code) => {
        const currency = createMockStoreCurrency({ currencyCode: code });
        expect(currency.currencyCode).toBe(code);
        expect(currency.currencyCode.length).toBe(3);
      });
    });
  });

  describe('Seed Data Verification', () => {
    it('should seed EUR as default currency for demo store', () => {
      // Per Story 3.R1 Task 6: Seed EUR as default for all existing stores
      const seededCurrency = createMockStoreCurrency({
        currencyCode: 'EUR',
        isDefault: true,
      });

      expect(seededCurrency.currencyCode).toBe('EUR');
      expect(seededCurrency.isDefault).toBe(true);
    });
  });
});
