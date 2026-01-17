import { z } from '@trafi/zod';

// =============================================================================
// Transfer Status Enum
// =============================================================================

export const TransferStatusSchema = z.enum(['pending', 'confirmed', 'cancelled']);

export type TransferStatus = z.infer<typeof TransferStatusSchema>;

// =============================================================================
// Input Schemas
// =============================================================================

/**
 * Schema for initiating an ownership transfer.
 * Requires password re-confirmation for security.
 */
export const InitiateTransferSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  password: z.string().min(1, 'Password is required for confirmation'),
  reason: z.string().max(500).optional(),
});

export type InitiateTransfer = z.infer<typeof InitiateTransferSchema>;

/**
 * Schema for confirming an ownership transfer.
 * Only the target user can confirm with their password.
 */
export const ConfirmTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  password: z.string().min(1, 'Password is required for confirmation'),
});

export type ConfirmTransfer = z.infer<typeof ConfirmTransferSchema>;

/**
 * Schema for cancelling an ownership transfer.
 * Both initiator and target can cancel a pending transfer.
 */
export const CancelTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
});

export type CancelTransfer = z.infer<typeof CancelTransferSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for user reference in transfer records.
 */
export const TransferUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

export type TransferUser = z.infer<typeof TransferUserSchema>;

/**
 * Schema for ownership transfer response.
 */
export const TransferResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  fromUser: TransferUserSchema,
  toUser: TransferUserSchema,
  status: TransferStatusSchema,
  reason: z.string().nullable(),
  expiresAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type TransferResponse = z.infer<typeof TransferResponseSchema>;

/**
 * Schema for transfer history list response.
 */
export const TransferHistoryResponseSchema = z.array(TransferResponseSchema);

export type TransferHistoryResponse = z.infer<typeof TransferHistoryResponseSchema>;
