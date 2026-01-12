import { describe, it, expect } from 'vitest';
import type { Product, ProductStatus, CreateProductInput } from '../product.types';
import type { Order, OrderStatus, OrderLineItem } from '../order.types';
import type { Customer, SavedAddress } from '../customer.types';
import type { Store, StoreSettings } from '../store.types';
import type { ApiSuccessResponse, ApiErrorResponse } from '../api.types';

/**
 * Type tests for @trafi/types package.
 * Verifies that types are correctly inferred from validators.
 */
describe('@trafi/types Type Inference', () => {
  describe('Product Types', () => {
    it('should correctly type Product', () => {
      const product: Product = {
        id: 'prod_123',
        storeId: 'store_456',
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        status: 'active',
        price: 1999,
        currency: 'EUR',
        inventoryQuantity: 100,
        trackInventory: true,
        allowBackorder: false,
        taxable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(product.id).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.status).toBe('active');
    });

    it('should correctly type ProductStatus', () => {
      const status: ProductStatus = 'active';
      expect(['active', 'draft', 'archived']).toContain(status);
    });

    it('should correctly type CreateProductInput', () => {
      const input: CreateProductInput = {
        storeId: 'store_456',
        name: 'New Product',
        slug: 'new-product',
        description: 'Product description',
        price: 2999,
        currency: 'USD',
        status: 'draft',
        inventoryQuantity: 50,
        trackInventory: true,
        allowBackorder: false,
        taxable: true,
      };

      expect(input.name).toBe('New Product');
      expect(input.price).toBe(2999);
    });
  });

  describe('Order Types', () => {
    it('should correctly type Order', () => {
      const order: Order = {
        id: 'ord_123',
        storeId: 'store_456',
        orderNumber: 'ORD-001',
        email: 'customer@example.com',
        status: 'pending',
        fulfillmentStatus: 'unfulfilled',
        paymentStatus: 'pending',
        currency: 'EUR',
        subtotal: 5999,
        taxTotal: 1140,
        shippingTotal: 499,
        discountTotal: 0,
        grandTotal: 7638,
        lineItems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
    });

    it('should correctly type OrderStatus', () => {
      const status: OrderStatus = 'pending';
      expect(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).toContain(status);
    });

    it('should correctly type OrderLineItem', () => {
      const lineItem: OrderLineItem = {
        id: 'li_123',
        productId: 'prod_456',
        name: 'Test Product',
        quantity: 2,
        unitPrice: 1999,
        totalPrice: 3998,
        taxAmount: 0,
      };

      expect(lineItem.quantity).toBe(2);
      expect(lineItem.totalPrice).toBe(3998);
    });
  });

  describe('Customer Types', () => {
    it('should correctly type Customer', () => {
      const customer: Customer = {
        id: 'cust_123',
        storeId: 'store_456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        acceptsMarketing: false,
        totalOrders: 0,
        totalSpent: 0,
        addresses: [],
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(customer.email).toBe('test@example.com');
    });

    it('should correctly type SavedAddress', () => {
      const address: SavedAddress = {
        id: 'addr_123',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'Paris',
        country: 'FR',
        postalCode: '75001',
        isDefault: true,
      };

      expect(address.city).toBe('Paris');
      expect(address.isDefault).toBe(true);
    });
  });

  describe('Store Types', () => {
    it('should correctly type Store', () => {
      const store: Store = {
        id: 'store_123',
        name: 'My Shop',
        slug: 'my-shop',
        ownerId: 'user_456',
        status: 'active',
        plan: 'free',
        settings: {
          defaultCurrency: 'EUR',
          defaultLocale: 'en',
          timezone: 'Europe/Paris',
          weightUnit: 'g',
          taxIncluded: true,
          autoArchiveOrders: false,
          orderNumberPrefix: 'ORD-',
          lowStockThreshold: 5,
        },
        contact: {},
        branding: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(store.name).toBe('My Shop');
      expect(store.settings.defaultCurrency).toBe('EUR');
    });

    it('should correctly type StoreSettings', () => {
      const settings: StoreSettings = {
        defaultCurrency: 'EUR',
        defaultLocale: 'en',
        timezone: 'UTC',
        weightUnit: 'kg',
        taxIncluded: false,
        autoArchiveOrders: true,
        orderNumberPrefix: 'INV-',
        lowStockThreshold: 10,
      };

      expect(settings.weightUnit).toBe('kg');
    });
  });

  describe('API Response Types', () => {
    it('should correctly type ApiSuccessResponse', () => {
      const response: ApiSuccessResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
        requestId: 'req_123',
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe('123');
    });

    it('should correctly type ApiErrorResponse', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          type: 'validation',
          requestId: 'req_123',
          timestamp: new Date().toISOString(),
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('NOT_FOUND');
    });
  });
});
