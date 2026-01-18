import { Injectable, Logger } from '@nestjs/common';
import type {
  TaxCalculation,
  MarginCalculation,
  CalculateTaxInput,
  CalculateMarginInput,
  FormatPriceInput,
} from '@trafi/types';

/**
 * Pricing calculation service
 *
 * Handles tax calculations, margin calculations, and price formatting.
 * All money values are in INTEGER cents per ARCH-25.
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
@Injectable()
export class PricingService {
  protected readonly logger = new Logger(PricingService.name);

  // ==========================================================================
  // Tax Calculation Methods
  // ==========================================================================

  /**
   * Calculate tax from a price.
   * Protected for @trafi/core consumers to customize tax calculation.
   *
   * @param priceInCents - Price in cents (e.g., 2999 for 29.99)
   * @param taxRate - Tax rate as percentage (e.g., 20 for 20%)
   * @param taxIncluded - Whether the price already includes tax
   * @returns Tax calculation result
   */
  protected calculateTaxInternal(
    priceInCents: number,
    taxRate: number,
    taxIncluded: boolean,
  ): TaxCalculation {
    if (priceInCents <= 0) {
      return {
        netPriceInCents: 0,
        taxAmountInCents: 0,
        grossPriceInCents: 0,
        taxRate,
        taxIncluded,
      };
    }

    if (taxRate <= 0) {
      return {
        netPriceInCents: priceInCents,
        taxAmountInCents: 0,
        grossPriceInCents: priceInCents,
        taxRate: 0,
        taxIncluded,
      };
    }

    if (taxIncluded) {
      // Price already includes tax, extract it
      // netPrice = grossPrice / (1 + taxRate/100)
      const netPriceInCents = Math.round(priceInCents / (1 + taxRate / 100));
      const taxAmountInCents = priceInCents - netPriceInCents;
      return {
        netPriceInCents,
        taxAmountInCents,
        grossPriceInCents: priceInCents,
        taxRate,
        taxIncluded,
      };
    } else {
      // Price is net, add tax
      const taxAmountInCents = Math.round(priceInCents * (taxRate / 100));
      return {
        netPriceInCents: priceInCents,
        taxAmountInCents,
        grossPriceInCents: priceInCents + taxAmountInCents,
        taxRate,
        taxIncluded,
      };
    }
  }

  /**
   * Calculate tax from validated input.
   *
   * @param input - Tax calculation input
   * @returns Tax calculation result
   */
  calculateTax(input: CalculateTaxInput): TaxCalculation {
    return this.calculateTaxInternal(input.priceInCents, input.taxRate, input.taxIncluded);
  }

  // ==========================================================================
  // Margin Calculation Methods
  // ==========================================================================

  /**
   * Calculate profit margin from price and cost.
   * Protected for @trafi/core consumers to customize margin calculation.
   *
   * @param priceInCents - Selling price in cents
   * @param costPriceInCents - Cost price in cents
   * @returns Margin calculation or null if cost is 0/missing
   */
  protected calculateMarginInternal(
    priceInCents: number,
    costPriceInCents: number | null | undefined,
  ): MarginCalculation | null {
    if (!costPriceInCents || costPriceInCents === 0) {
      return null;
    }

    if (priceInCents <= 0) {
      return null;
    }

    const marginInCents = priceInCents - costPriceInCents;
    // Calculate margin as percentage of selling price
    const marginPercent = Math.round((marginInCents / priceInCents) * 100 * 100) / 100;

    return {
      marginInCents,
      marginPercent,
    };
  }

  /**
   * Calculate margin from validated input.
   *
   * @param input - Margin calculation input
   * @returns Margin calculation or null
   */
  calculateMargin(input: CalculateMarginInput): MarginCalculation | null {
    return this.calculateMarginInternal(input.priceInCents, input.costPriceInCents);
  }

  // ==========================================================================
  // Formatting Methods
  // ==========================================================================

  /**
   * Format price in cents to localized currency string.
   *
   * @param cents - Price in cents
   * @param currency - ISO 4217 currency code (default: EUR)
   * @param locale - BCP 47 locale (default: fr-FR)
   * @returns Formatted price string (e.g., "29,99 EUR")
   */
  formatPrice(cents: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }

  /**
   * Format price from validated input.
   *
   * @param input - Format price input
   * @returns Formatted price string
   */
  formatPriceFromInput(input: FormatPriceInput): string {
    return this.formatPrice(input.cents, input.currency, input.locale);
  }

  // ==========================================================================
  // Conversion Utilities
  // ==========================================================================

  /**
   * Convert decimal euros to cents.
   * E.g., 29.99 -> 2999
   *
   * @param euros - Price in euros
   * @returns Price in cents
   */
  eurosToCents(euros: number): number {
    return Math.round(euros * 100);
  }

  /**
   * Convert cents to decimal euros.
   * E.g., 2999 -> 29.99
   *
   * @param cents - Price in cents
   * @returns Price in euros
   */
  centsToEuros(cents: number): number {
    return cents / 100;
  }
}
