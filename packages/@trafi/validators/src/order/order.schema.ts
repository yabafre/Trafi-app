import { z } from '@trafi/zod';
import { IdSchema, TimestampsSchema, TenantScopedSchema, EmailSchema } from '../common';
import { CurrencySchema } from '../common/money.schema';

/**
 * Order status lifecycle
 */
export const OrderStatusSchema = z.enum([
  'pending',      // Order created, awaiting payment
  'paid',         // Payment confirmed
  'processing',   // Being prepared/picked
  'shipped',      // Handed to carrier
  'delivered',    // Confirmed delivery
  'cancelled',    // Cancelled before fulfillment
  'refunded',     // Fully refunded
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Fulfillment status
 */
export const FulfillmentStatusSchema = z.enum([
  'unfulfilled',
  'partial',
  'fulfilled',
]);
export type FulfillmentStatus = z.infer<typeof FulfillmentStatusSchema>;

/**
 * Payment status
 */
export const PaymentStatusSchema = z.enum([
  'pending',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Shipping address schema
 */
export const AddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(255).optional(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).describe('ISO 3166-1 alpha-2 country code'),
  phone: z.string().max(30).optional(),
});
export type Address = z.infer<typeof AddressSchema>;

/**
 * Order line item schema
 */
export const OrderLineItemSchema = z.object({
  id: IdSchema,
  productId: IdSchema,
  variantId: IdSchema.optional(),
  name: z.string().min(1).max(255),
  sku: z.string().max(255).optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative().describe('Unit price in cents'),
  totalPrice: z.number().int().nonnegative().describe('Total line price in cents'),
  taxAmount: z.number().int().nonnegative().default(0).describe('Tax amount in cents'),
});
export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

/**
 * Complete order schema
 */
export const OrderSchema = TenantScopedSchema.extend({
  id: IdSchema,
  orderNumber: z.string().min(1).max(50),
  customerId: IdSchema.optional(),
  email: EmailSchema,
  status: OrderStatusSchema.default('pending'),
  fulfillmentStatus: FulfillmentStatusSchema.default('unfulfilled'),
  paymentStatus: PaymentStatusSchema.default('pending'),
  currency: CurrencySchema,
  subtotal: z.number().int().nonnegative().describe('Subtotal in cents'),
  taxTotal: z.number().int().nonnegative().default(0).describe('Total tax in cents'),
  shippingTotal: z.number().int().nonnegative().default(0).describe('Shipping cost in cents'),
  discountTotal: z.number().int().nonnegative().default(0).describe('Total discounts in cents'),
  grandTotal: z.number().int().nonnegative().describe('Grand total in cents'),
  lineItems: z.array(OrderLineItemSchema),
  shippingAddress: AddressSchema.optional(),
  billingAddress: AddressSchema.optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string()).optional(),
}).merge(TimestampsSchema);

export type Order = z.infer<typeof OrderSchema>;

/**
 * Schema for creating a new order
 */
export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  orderNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

/**
 * Schema for updating order status
 */
export const UpdateOrderStatusSchema = z.object({
  storeId: IdSchema,
  status: OrderStatusSchema.optional(),
  fulfillmentStatus: FulfillmentStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
