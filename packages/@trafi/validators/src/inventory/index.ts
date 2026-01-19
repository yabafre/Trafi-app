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

// =============================================================================
// Cart Validation & Reservation Schemas (Story 3.8 - Oversell Prevention)
// =============================================================================

/**
 * Reservation status enum
 * Matches Prisma enum ReservationStatus
 */
export const ReservationStatusSchema = z.enum(['ACTIVE', 'RELEASED', 'EXPIRED'])

export type ReservationStatus = z.infer<typeof ReservationStatusSchema>

/**
 * Check availability input
 */
export const CheckAvailabilityInputSchema = z.object({
  variantId: z.string(),
  requestedQuantity: z.number().int().positive(),
})

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilityInputSchema>

/**
 * Check availability result
 */
export const CheckAvailabilityResultSchema = z.object({
  available: z.boolean(),
  availableQuantity: z.number().int().min(0),
  allowOversell: z.boolean(),
  trackInventory: z.boolean(),
})

export type CheckAvailabilityResult = z.infer<typeof CheckAvailabilityResultSchema>

/**
 * Validate cart item input
 */
export const ValidateCartItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
})

export type ValidateCartItem = z.infer<typeof ValidateCartItemSchema>

/**
 * Cart adjustment response (when quantity is auto-adjusted)
 */
export const CartAdjustmentSchema = z.object({
  variantId: z.string(),
  requestedQuantity: z.number().int(),
  availableQuantity: z.number().int().min(0),
  adjusted: z.boolean(),
  message: z.string().optional(),
})

export type CartAdjustment = z.infer<typeof CartAdjustmentSchema>

/**
 * Cart validation result
 */
export const CartValidationResultSchema = z.object({
  valid: z.boolean(),
  adjustments: z.array(CartAdjustmentSchema),
  outOfStockItems: z.array(z.string()), // Variant IDs
})

export type CartValidationResult = z.infer<typeof CartValidationResultSchema>

/**
 * Create reservation input
 */
export const CreateReservationInputSchema = z.object({
  storeId: z.string(),
  cartId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().positive(),
  expiresInMinutes: z.number().int().positive().optional().default(15),
})

export type CreateReservationInput = z.infer<typeof CreateReservationInputSchema>

/**
 * Inventory reservation response
 */
export const InventoryReservationSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  cartId: z.string(),
  variantId: z.string(),
  quantity: z.number().int(),
  status: ReservationStatusSchema,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  releasedAt: z.string().datetime().nullable(),
})

export type InventoryReservation = z.infer<typeof InventoryReservationSchema>

/**
 * Release reservation input
 */
export const ReleaseReservationInputSchema = z.object({
  cartId: z.string(),
  variantId: z.string(),
  reason: z.enum(['RELEASED', 'EXPIRED']),
})

export type ReleaseReservationInput = z.infer<typeof ReleaseReservationInputSchema>

/**
 * Get available stock input
 */
export const GetAvailableStockInputSchema = z.object({
  variantId: z.string(),
})

export type GetAvailableStockInput = z.infer<typeof GetAvailableStockInputSchema>

/**
 * Get available stock result
 */
export const GetAvailableStockResultSchema = z.object({
  variantId: z.string(),
  physicalQuantity: z.number().int(),
  reservedQuantity: z.number().int(),
  availableQuantity: z.number().int(),
  trackInventory: z.boolean(),
  allowOversell: z.boolean(),
})

export type GetAvailableStockResult = z.infer<typeof GetAvailableStockResultSchema>
