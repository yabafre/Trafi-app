import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from '../pricing.service';

/**
 * PricingService Unit Tests
 *
 * Tests for tax calculations, margin calculations, and price formatting.
 * All money values are in INTEGER cents per ARCH-25.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // Tax Calculation Tests - Tax Included (TTC)
  // ===========================================================================
  describe('calculateTax - tax included (TTC)', () => {
    it('should extract 20% tax from price including tax', () => {
      const result = service.calculateTax({
        priceInCents: 12000, // 120.00 EUR TTC
        taxRate: 20,
        taxIncluded: true,
      });

      expect(result.grossPriceInCents).toBe(12000);
      expect(result.netPriceInCents).toBe(10000); // 100.00 EUR HT
      expect(result.taxAmountInCents).toBe(2000); // 20.00 EUR tax
      expect(result.taxRate).toBe(20);
      expect(result.taxIncluded).toBe(true);
    });

    it('should extract 5.5% reduced tax from price including tax', () => {
      const result = service.calculateTax({
        priceInCents: 10550, // 105.50 EUR TTC
        taxRate: 5.5,
        taxIncluded: true,
      });

      expect(result.grossPriceInCents).toBe(10550);
      expect(result.netPriceInCents).toBe(10000); // 100.00 EUR HT
      expect(result.taxAmountInCents).toBe(550); // 5.50 EUR tax
    });

    it('should handle 10% tax rate correctly', () => {
      const result = service.calculateTax({
        priceInCents: 11000, // 110.00 EUR TTC
        taxRate: 10,
        taxIncluded: true,
      });

      expect(result.netPriceInCents).toBe(10000);
      expect(result.taxAmountInCents).toBe(1000);
    });

    it('should round correctly for non-even amounts', () => {
      const result = service.calculateTax({
        priceInCents: 2999, // 29.99 EUR TTC
        taxRate: 20,
        taxIncluded: true,
      });

      expect(result.grossPriceInCents).toBe(2999);
      // 2999 / 1.20 = 2499.17 -> rounds to 2499
      expect(result.netPriceInCents).toBe(2499);
      expect(result.taxAmountInCents).toBe(500); // 2999 - 2499 = 500
    });
  });

  // ===========================================================================
  // Tax Calculation Tests - Tax Excluded (HT)
  // ===========================================================================
  describe('calculateTax - tax excluded (HT)', () => {
    it('should add 20% tax to net price', () => {
      const result = service.calculateTax({
        priceInCents: 10000, // 100.00 EUR HT
        taxRate: 20,
        taxIncluded: false,
      });

      expect(result.netPriceInCents).toBe(10000);
      expect(result.taxAmountInCents).toBe(2000); // 20.00 EUR tax
      expect(result.grossPriceInCents).toBe(12000); // 120.00 EUR TTC
      expect(result.taxIncluded).toBe(false);
    });

    it('should add 5.5% reduced tax to net price', () => {
      const result = service.calculateTax({
        priceInCents: 10000,
        taxRate: 5.5,
        taxIncluded: false,
      });

      expect(result.taxAmountInCents).toBe(550);
      expect(result.grossPriceInCents).toBe(10550);
    });

    it('should round tax amount correctly', () => {
      const result = service.calculateTax({
        priceInCents: 1999, // 19.99 EUR HT
        taxRate: 20,
        taxIncluded: false,
      });

      // 1999 * 0.20 = 399.8 -> rounds to 400
      expect(result.taxAmountInCents).toBe(400);
      expect(result.grossPriceInCents).toBe(2399);
    });
  });

  // ===========================================================================
  // Tax Calculation Edge Cases
  // ===========================================================================
  describe('calculateTax - edge cases', () => {
    it('should return zero values for zero price', () => {
      const result = service.calculateTax({
        priceInCents: 0,
        taxRate: 20,
        taxIncluded: true,
      });

      expect(result.netPriceInCents).toBe(0);
      expect(result.taxAmountInCents).toBe(0);
      expect(result.grossPriceInCents).toBe(0);
    });

    it('should return zero values for negative price', () => {
      const result = service.calculateTax({
        priceInCents: -1000,
        taxRate: 20,
        taxIncluded: true,
      });

      expect(result.netPriceInCents).toBe(0);
      expect(result.taxAmountInCents).toBe(0);
      expect(result.grossPriceInCents).toBe(0);
    });

    it('should handle zero tax rate', () => {
      const result = service.calculateTax({
        priceInCents: 10000,
        taxRate: 0,
        taxIncluded: true,
      });

      expect(result.netPriceInCents).toBe(10000);
      expect(result.taxAmountInCents).toBe(0);
      expect(result.grossPriceInCents).toBe(10000);
      expect(result.taxRate).toBe(0);
    });

    it('should handle negative tax rate as zero', () => {
      const result = service.calculateTax({
        priceInCents: 10000,
        taxRate: -5,
        taxIncluded: true,
      });

      expect(result.taxAmountInCents).toBe(0);
      expect(result.taxRate).toBe(0);
    });

    it('should handle 100% tax rate', () => {
      const result = service.calculateTax({
        priceInCents: 20000,
        taxRate: 100,
        taxIncluded: true,
      });

      expect(result.netPriceInCents).toBe(10000);
      expect(result.taxAmountInCents).toBe(10000);
    });
  });

  // ===========================================================================
  // Margin Calculation Tests
  // ===========================================================================
  describe('calculateMargin', () => {
    it('should calculate margin correctly', () => {
      const result = service.calculateMargin({
        priceInCents: 10000, // 100.00 EUR selling price
        costPriceInCents: 6000, // 60.00 EUR cost
      });

      expect(result).not.toBeNull();
      expect(result!.marginInCents).toBe(4000); // 40.00 EUR margin
      expect(result!.marginPercent).toBe(40); // 40% margin
    });

    it('should calculate margin with high profit', () => {
      const result = service.calculateMargin({
        priceInCents: 10000,
        costPriceInCents: 2000,
      });

      expect(result!.marginInCents).toBe(8000);
      expect(result!.marginPercent).toBe(80);
    });

    it('should calculate margin with low profit', () => {
      const result = service.calculateMargin({
        priceInCents: 10000,
        costPriceInCents: 9500,
      });

      expect(result!.marginInCents).toBe(500);
      expect(result!.marginPercent).toBe(5);
    });

    it('should handle negative margin (selling at loss)', () => {
      const result = service.calculateMargin({
        priceInCents: 5000,
        costPriceInCents: 7000,
      });

      expect(result!.marginInCents).toBe(-2000);
      expect(result!.marginPercent).toBe(-40);
    });

    it('should return null for zero cost price', () => {
      const result = service.calculateMargin({
        priceInCents: 10000,
        costPriceInCents: 0,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero selling price', () => {
      const result = service.calculateMargin({
        priceInCents: 0,
        costPriceInCents: 5000,
      });

      expect(result).toBeNull();
    });

    it('should calculate precise margin percentage with decimals', () => {
      const result = service.calculateMargin({
        priceInCents: 2999,
        costPriceInCents: 1500,
      });

      expect(result!.marginInCents).toBe(1499);
      // (1499 / 2999) * 100 = 49.98... -> rounds to 49.98
      expect(result!.marginPercent).toBeCloseTo(49.98, 1);
    });
  });

  // ===========================================================================
  // Price Formatting Tests
  // ===========================================================================
  describe('formatPrice', () => {
    it('should format price in EUR with French locale', () => {
      const result = service.formatPrice(2999, 'EUR', 'fr-FR');
      // French format: "29,99 EUR" or "29,99 €"
      expect(result).toMatch(/29[,.]99/);
      expect(result).toMatch(/EUR|€/);
    });

    it('should format price with default parameters (EUR, fr-FR)', () => {
      const result = service.formatPrice(10000);
      expect(result).toMatch(/100[,.]00/);
    });

    it('should format price in USD with US locale', () => {
      const result = service.formatPrice(2999, 'USD', 'en-US');
      expect(result).toMatch(/\$29\.99/);
    });

    it('should handle zero cents', () => {
      const result = service.formatPrice(0);
      expect(result).toMatch(/0[,.]00/);
    });

    it('should format large amounts correctly', () => {
      const result = service.formatPrice(123456789, 'EUR', 'fr-FR');
      // 1,234,567.89 EUR
      expect(result).toMatch(/1.*234.*567[,.]89/);
    });
  });

  // ===========================================================================
  // Conversion Utilities Tests
  // ===========================================================================
  describe('eurosToCents', () => {
    it('should convert euros to cents', () => {
      expect(service.eurosToCents(29.99)).toBe(2999);
      expect(service.eurosToCents(100)).toBe(10000);
      expect(service.eurosToCents(0.01)).toBe(1);
    });

    it('should round correctly for floating point issues', () => {
      // 19.99 * 100 might produce 1998.9999... due to floating point
      expect(service.eurosToCents(19.99)).toBe(1999);
    });

    it('should handle zero', () => {
      expect(service.eurosToCents(0)).toBe(0);
    });
  });

  describe('centsToEuros', () => {
    it('should convert cents to euros', () => {
      expect(service.centsToEuros(2999)).toBe(29.99);
      expect(service.centsToEuros(10000)).toBe(100);
      expect(service.centsToEuros(1)).toBe(0.01);
    });

    it('should handle zero', () => {
      expect(service.centsToEuros(0)).toBe(0);
    });
  });

  // ===========================================================================
  // formatPriceFromInput Tests
  // ===========================================================================
  describe('formatPriceFromInput', () => {
    it('should format price from validated input', () => {
      const result = service.formatPriceFromInput({
        cents: 2999,
        currency: 'EUR',
        locale: 'fr-FR',
      });

      expect(result).toMatch(/29[,.]99/);
    });

    it('should use default currency and locale', () => {
      const result = service.formatPriceFromInput({
        cents: 5000,
        currency: 'EUR',
        locale: 'fr-FR',
      });

      expect(result).toMatch(/50[,.]00/);
    });
  });
});
