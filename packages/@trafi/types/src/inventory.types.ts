/**
 * @trafi/types - Inventory Domain Types
 *
 * Types for inventory tracking and history.
 * Re-exported from @trafi/validators Zod schemas.
 * @see Story 3.7 - Inventory Tracking
 */

export type {
  // Enums
  InventoryAdjustmentReason,
  StockStatus,
  // Input types
  UpdateInventorySettingsInput,
  AdjustInventoryInput,
  SetInventoryInput,
  ListInventoryHistoryInput,
  // Response types
  InventoryHistory,
  VariantInventory,
} from '@trafi/validators';

/**
 * Inventory history response from API (with Date objects instead of strings)
 */
export interface InventoryHistoryResponse {
  id: string;
  variantId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reason: string;
  note: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: Date;
}

/**
 * Paginated inventory history list result
 */
export interface InventoryHistoryListResult {
  items: InventoryHistoryResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Inventory adjustment event payload
 */
export interface InventoryAdjustedEvent {
  variantId: string;
  storeId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reason: string;
}

/**
 * Low stock event payload
 */
export interface InventoryLowStockEvent {
  variantId: string;
  storeId: string;
  quantity: number;
  threshold: number;
}

/**
 * Inventory settings updated event payload
 */
export interface InventorySettingsUpdatedEvent {
  variantId: string;
  storeId: string;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  allowOversell?: boolean;
}
