import { z } from '@trafi/zod'

/**
 * Inventory Schemas
 * @see Story 3.7 - Inventory Tracking
 */

// =============================================================================
// Enums
// =============================================================================

/**
 * Inventory adjustment reason enum
 * Matches Prisma enum InventoryAdjustmentReason
 */
export const InventoryAdjustmentReasonSchema = z.enum([
  'MANUAL_ADJUSTMENT',
  'ORDER_PLACED',
  'ORDER_CANCELLED',
  'ORDER_REFUNDED',
  'RECEIVED_STOCK',
  'DAMAGED',
  'RETURNED',
  'CORRECTION',
])

export type InventoryAdjustmentReason = z.infer<typeof InventoryAdjustmentReasonSchema>

// =============================================================================
// Inventory Settings Schemas
// =============================================================================

/**
 * Update inventory settings input
 */
export const UpdateInventorySettingsSchema = z.object({
  variantId: z.string(),
  trackInventory: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowOversell: z.boolean().optional(),
})

export type UpdateInventorySettingsInput = z.infer<typeof UpdateInventorySettingsSchema>

// =============================================================================
// Inventory Adjustment Schemas
// =============================================================================

/**
 * Adjust inventory by a delta
 */
export const AdjustInventorySchema = z.object({
  variantId: z.string(),
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity change must not be zero',
  }),
  reason: InventoryAdjustmentReasonSchema,
  note: z.string().max(500).optional(),
})

export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>

/**
 * Set inventory to an absolute value
 */
export const SetInventorySchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(0),
  reason: InventoryAdjustmentReasonSchema.optional().default('MANUAL_ADJUSTMENT'),
  note: z.string().max(500).optional(),
})

export type SetInventoryInput = z.infer<typeof SetInventorySchema>

// =============================================================================
// Inventory History Schemas
// =============================================================================

/**
 * Inventory history record response
 */
export const InventoryHistorySchema = z.object({
  id: z.string(),
  variantId: z.string(),
  quantityBefore: z.number().int(),
  quantityAfter: z.number().int(),
  quantityChange: z.number().int(),
  reason: InventoryAdjustmentReasonSchema,
  note: z.string().nullable(),
  createdById: z.string().nullable(),
  createdByName: z.string().nullable().optional(), // Joined from User
  createdAt: z.string().datetime(),
})

export type InventoryHistory = z.infer<typeof InventoryHistorySchema>

/**
 * List inventory history query
 */
export const ListInventoryHistorySchema = z.object({
  variantId: z.string(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type ListInventoryHistoryInput = z.infer<typeof ListInventoryHistorySchema>

// =============================================================================
// Variant Inventory Response Schemas
// =============================================================================

/**
 * Variant inventory info response
 */
export const VariantInventorySchema = z.object({
  variantId: z.string(),
  quantity: z.number().int(),
  trackInventory: z.boolean(),
  lowStockThreshold: z.number().int(),
  allowOversell: z.boolean(),
  isLowStock: z.boolean(),
  isOutOfStock: z.boolean(),
})

export type VariantInventory = z.infer<typeof VariantInventorySchema>

/**
 * Stock status enum for UI display
 */
export const StockStatusSchema = z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'])

export type StockStatus = z.infer<typeof StockStatusSchema>
