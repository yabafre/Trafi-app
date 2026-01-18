/**
 * Product Variant Validation Schemas
 *
 * @see Story 3.2 - Product Variants Management
 */
import { z } from '@trafi/zod';
import { WeightUnitSchema } from '../store/store-settings.schema';

// NOTE: WeightUnit and WeightUnitSchema are exported from '../store/store-settings.schema'
// and will be available via the main index.ts export from './store'

// =============================================================================
// Option Schema
// =============================================================================

/**
 * Single variant option (e.g., { name: "Size", value: "M" })
 */
export const VariantOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required').max(50),
  value: z.string().min(1, 'Option value is required').max(100),
});
export type VariantOption = z.infer<typeof VariantOptionSchema>;

// =============================================================================
// Create Variant Schema
// =============================================================================

export const CreateVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().max(100).optional(),
  options: z
    .array(VariantOptionSchema)
    .min(1, 'At least one option is required')
    .max(3, 'Maximum 3 options allowed'),
  priceInCents: z.number().int().positive('Price must be positive'),
  compareAtPriceInCents: z.number().int().positive().optional(),
  costPriceInCents: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().default(0),
  trackInventory: z.boolean().default(true),
  weight: z.number().nonnegative().optional(),
  weightUnit: WeightUnitSchema.default('g'),
});
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;

// =============================================================================
// Update Variant Schema
// =============================================================================

export const UpdateVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
  productId: z.string().optional(), // For revalidation path
  sku: z.string().max(100).optional(),
  options: z
    .array(VariantOptionSchema)
    .min(1, 'At least one option is required')
    .max(3, 'Maximum 3 options allowed')
    .optional(),
  priceInCents: z.number().int().positive('Price must be positive').optional(),
  compareAtPriceInCents: z.number().int().positive().nullable().optional(),
  costPriceInCents: z.number().int().nonnegative().nullable().optional(),
  quantity: z.number().int().nonnegative().optional(),
  trackInventory: z.boolean().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  weightUnit: WeightUnitSchema.optional(),
});
export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;

// =============================================================================
// Bulk Create Variants Schema
// =============================================================================

export const OptionTypeSchema = z.object({
  name: z.string().min(1).max(50),
  values: z.array(z.string().min(1).max(100)).min(1).max(10),
});
export type OptionType = z.infer<typeof OptionTypeSchema>;

export const BulkCreateVariantsSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  optionTypes: z
    .array(OptionTypeSchema)
    .min(1, 'At least one option type is required')
    .max(3, 'Maximum 3 option types allowed'),
  defaultPriceInCents: z.number().int().positive('Default price must be positive'),
});
export type BulkCreateVariantsInput = z.infer<typeof BulkCreateVariantsSchema>;

// =============================================================================
// List Variants Schema
// =============================================================================

export const ListVariantsSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});
export type ListVariantsInput = z.infer<typeof ListVariantsSchema>;

// =============================================================================
// Variant Response Schema
// =============================================================================

export const VariantResponseSchema = z.object({
  id: z.string(), // var_xxx
  productId: z.string(),
  sku: z.string().nullable(),
  options: z.array(VariantOptionSchema),
  priceInCents: z.number(),
  compareAtPriceInCents: z.number().nullable(),
  costPriceInCents: z.number().nullable(),
  taxRuleId: z.string().nullable(), // Story 3.6 - Tax rule assignment
  quantity: z.number(),
  trackInventory: z.boolean(),
  weight: z.number().nullable(),
  weightUnit: WeightUnitSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type VariantResponse = z.infer<typeof VariantResponseSchema>;
