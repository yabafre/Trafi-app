import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as crypto from 'crypto'
import { PrismaService } from '@database/prisma.service'
import {
  type GiftCard as PrismaGiftCard,
  type GiftCardStatus,
  Prisma,
} from '@generated/prisma/client'
import type {
  IssueGiftCardInput,
  RedeemGiftCardInput,
  RefundToGiftCardInput,
  AdjustGiftCardBalanceInput,
} from '@trafi/validators'
import type {
  GiftCardResponseDTO,
  IssuedGiftCardDTO,
  RedeemResultDTO,
  ValidateResultDTO,
  GiftCardListResult,
  GiftCardTransactionDTO,
} from '@trafi/types'

// Re-export types for backwards compatibility
export type GiftCardResponseDto = GiftCardResponseDTO
export type IssuedGiftCardDto = IssuedGiftCardDTO
export type RedeemResultDto = RedeemResultDTO
export type ValidateResultDto = ValidateResultDTO
export type GiftCardsListResult = GiftCardListResult
export type GiftCardTransactionDto = GiftCardTransactionDTO

/**
 * List gift cards options (simplified for service use)
 */
export interface ListGiftCardsOptions {
  status?: GiftCardStatus
  templateId?: string
  search?: string
  fromDate?: Date
  toDate?: Date
  hasBalance?: boolean
  page?: number
  limit?: number
}

/**
 * Gift Cards management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Gift cards are tenant-scoped via storeId (defense-in-depth)
 * - IDs automatically generated with gc_ prefix via PrismaService extension
 * - Codes are stored as SHA-256 hashes (security)
 * - Emits events for gift card actions (ARCH-Principle-6)
 *
 * @see Story 3.10 - Gift Cards
 */
@Injectable()
export class GiftCardsService {
  protected readonly logger = new Logger(GiftCardsService.name)

  // Code generation constants
  protected readonly CODE_LENGTH = 16
  protected readonly CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No 0OI1

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Protected Security Methods
  // ==========================================================================

  /**
   * Generate a cryptographically secure gift card code.
   * Format: XXXX-XXXX-XXXX-XXXX
   * Uses rejection sampling to avoid modulo bias (Code Review Fix #10).
   * Protected for merchant override.
   */
  protected generateSecureCode(): string {
    // Use rejection sampling to avoid modulo bias
    // CODE_CHARS has 32 characters, 256 % 32 = 0, so no bias in this case
    // But we implement rejection sampling anyway for correctness with any charset
    const maxValidByte = 256 - (256 % this.CODE_CHARS.length)
    let code = ''
    let bytesNeeded = this.CODE_LENGTH

    while (bytesNeeded > 0) {
      const randomBytes = crypto.randomBytes(bytesNeeded * 2) // Get extra bytes for rejections
      for (let i = 0; i < randomBytes.length && bytesNeeded > 0; i++) {
        const byte = randomBytes[i]
        if (byte < maxValidByte) {
          code += this.CODE_CHARS[byte % this.CODE_CHARS.length]
          bytesNeeded--
        }
      }
    }

    // Format: XXXX-XXXX-XXXX-XXXX
    return code.match(/.{4}/g)!.join('-')
  }

  /**
   * Hash a gift card code for secure storage.
   * Protected for merchant override.
   */
  protected hashCode(code: string): string {
    // Normalize: remove dashes, uppercase
    const normalized = code.replace(/-/g, '').toUpperCase()
    return crypto.createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Extract last 4 characters for display.
   * Protected for merchant override.
   */
  protected extractLast4(code: string): string {
    const normalized = code.replace(/-/g, '')
    return normalized.slice(-4).toUpperCase()
  }

  // ==========================================================================
  // Issue Gift Card
  // ==========================================================================

  /**
   * Issue a new gift card.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Gift card creation data
   * @param performedById - Optional user ID who performed the action
   * @returns Issued gift card with plain code (show ONCE)
   */
  async issue(
    storeId: string,
    input: IssueGiftCardInput,
    performedById?: string,
  ): Promise<IssuedGiftCardDto> {
    // Generate secure code
    const plainCode = this.generateSecureCode()
    const codeHash = this.hashCode(plainCode)
    const codeLast4 = this.extractLast4(plainCode)

    // Calculate expiration from template if provided and no explicit expiration
    let expiresAt = input.expiresAt ?? null
    if (!expiresAt && input.templateId) {
      const template = await this.prisma.giftCardTemplate.findFirst({
        where: { id: input.templateId, storeId },
        select: { validityDays: true },
      })
      if (template?.validityDays) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + template.validityDays)
      }
    }

    // Determine initial status
    const status: GiftCardStatus = input.activateImmediately !== false ? 'ACTIVE' : 'PENDING'
    const activatedAt = status === 'ACTIVE' ? new Date() : null

    // Create gift card with initial transaction
    const giftCard = await this.prisma.$transaction(async (tx) => {
      // Create the gift card
      const card = await tx.giftCard.create({
        data: {
          storeId,
          codeHash,
          codeLast4,
          initialBalanceCents: input.amountCents,
          currentBalanceCents: input.amountCents,
          currencyCode: input.currencyCode ?? 'EUR',
          status,
          activatedAt,
          expiresAt,
          recipientEmail: input.recipientEmail ?? null,
          recipientName: input.recipientName ?? null,
          senderName: input.senderName ?? null,
          giftMessage: input.giftMessage ?? null,
          templateId: input.templateId ?? null,
          metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      })

      // Create initial credit transaction
      await tx.giftCardTransaction.create({
        data: {
          storeId,
          giftCardId: card.id,
          type: 'CREDIT',
          amountCents: input.amountCents,
          balanceAfterCents: input.amountCents,
          reason: 'Initial balance',
          performedById: performedById ?? null,
        },
      })

      return card
    })

    // Emit event
    this.eventEmitter.emit('giftCard.issued', {
      giftCardId: giftCard.id,
      storeId,
      codeLast4,
      amountCents: input.amountCents,
      currencyCode: giftCard.currencyCode,
      templateId: giftCard.templateId,
      recipientEmail: giftCard.recipientEmail,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Gift card issued: ${giftCard.id} (${codeLast4}) in store ${storeId}`)

    return {
      id: giftCard.id,
      code: plainCode, // Plain code - return ONCE
      codeLast4,
      initialBalanceCents: giftCard.initialBalanceCents,
      currentBalanceCents: giftCard.currentBalanceCents,
      currencyCode: giftCard.currencyCode,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt,
      createdAt: giftCard.createdAt,
    }
  }

  // ==========================================================================
  // Validate Gift Card
  // ==========================================================================

  /**
   * Validate a gift card code and return balance info.
   * Used by storefront to check balance before checkout.
   *
   * SECURITY: Uses timing-safe comparison to prevent timing attacks (Code Review Fix #1).
   *
   * @param storeId - Store ID for tenant isolation
   * @param code - Gift card code (with or without dashes)
   * @returns Validation result
   */
  async validateCode(storeId: string, code: string): Promise<ValidateResultDto> {
    const codeHash = this.hashCode(code)

    const giftCard = await this.prisma.giftCard.findFirst({
      where: { storeId, codeHash },
      select: {
        codeHash: true, // Need for timing-safe comparison
        codeLast4: true,
        currentBalanceCents: true,
        currencyCode: true,
        status: true,
        expiresAt: true,
      },
    })

    // Timing-safe comparison to prevent timing attacks
    // Even if card is null, we still perform the comparison with a dummy buffer
    const inputHashBuffer = Buffer.from(codeHash, 'hex')
    const storedHashBuffer = giftCard
      ? Buffer.from(giftCard.codeHash, 'hex')
      : crypto.randomBytes(inputHashBuffer.length) // Random dummy for constant time

    // This comparison takes constant time regardless of where mismatch occurs
    const hashesMatch =
      inputHashBuffer.length === storedHashBuffer.length &&
      crypto.timingSafeEqual(inputHashBuffer, storedHashBuffer)

    if (!hashesMatch || !giftCard) {
      return { valid: false, error: 'Invalid gift card code' }
    }

    // Check status
    if (giftCard.status === 'DISABLED') {
      return { valid: false, error: 'Gift card is disabled' }
    }

    if (giftCard.status === 'EXPIRED') {
      return { valid: false, error: 'Gift card has expired' }
    }

    if (giftCard.status === 'DEPLETED') {
      return { valid: false, error: 'Gift card has no remaining balance' }
    }

    if (giftCard.status === 'PENDING') {
      return { valid: false, error: 'Gift card is not yet activated' }
    }

    // Check expiration (don't auto-update, let scheduled job handle it - Code Review Fix #7)
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return { valid: false, error: 'Gift card has expired' }
    }

    return {
      valid: true,
      codeLast4: giftCard.codeLast4,
      currentBalanceCents: giftCard.currentBalanceCents,
      currencyCode: giftCard.currencyCode,
      expiresAt: giftCard.expiresAt,
    }
  }

  // ==========================================================================
  // Redeem Gift Card
  // ==========================================================================

  /**
   * Redeem (use) a gift card for a purchase.
   *
   * SECURITY: Uses pessimistic locking (FOR UPDATE) to prevent race conditions
   * and double-spending (Code Review Fix #2).
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Redeem input with code, amount, order ID, and currency
   * @returns Redeem result
   */
  async redeem(storeId: string, input: RedeemGiftCardInput): Promise<RedeemResultDto> {
    const codeHash = this.hashCode(input.code)
    const orderCurrency = input.currencyCode ?? 'EUR'

    try {
      // Perform entire redemption in a single transaction with pessimistic locking
      // to prevent race conditions and double-spending (Code Review Fix #2)
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Find gift card with FOR UPDATE lock to prevent concurrent modifications
          // Using raw query for pessimistic locking
          const giftCards = await tx.$queryRaw<
            Array<{
              id: string
              store_id: string
              code_hash: string
              code_last4: string
              initial_balance_cents: number
              current_balance_cents: number
              currency_code: string
              status: GiftCardStatus
              expires_at: Date | null
            }>
          >`
            SELECT id, store_id, code_hash, code_last4, initial_balance_cents,
                   current_balance_cents, currency_code, status, expires_at
            FROM gift_cards
            WHERE store_id = ${storeId} AND code_hash = ${codeHash}
            FOR UPDATE
          `

          const giftCard = giftCards[0]

          if (!giftCard) {
            throw new Error('INVALID_CODE')
          }

          // Status checks
          if (giftCard.status === 'DISABLED') {
            throw new Error('CARD_DISABLED')
          }

          if (giftCard.status === 'EXPIRED') {
            throw new Error('CARD_EXPIRED')
          }

          if (giftCard.status === 'DEPLETED') {
            throw new Error('ALREADY_DEPLETED')
          }

          // Check expiration (don't auto-update, just reject - Code Review Fix #7)
          if (giftCard.expires_at && giftCard.expires_at < new Date()) {
            throw new Error('CARD_EXPIRED')
          }

          // Currency validation (Code Review Fix #6)
          if (giftCard.currency_code !== orderCurrency) {
            throw new Error('CURRENCY_MISMATCH')
          }

          // Balance check
          if (giftCard.current_balance_cents < input.amountCents) {
            throw new Error('INSUFFICIENT_BALANCE')
          }

          // Calculate new balance
          const newBalance = giftCard.current_balance_cents - input.amountCents
          const newStatus: GiftCardStatus = newBalance === 0 ? 'DEPLETED' : giftCard.status

          // Update gift card balance
          await tx.giftCard.update({
            where: { id: giftCard.id },
            data: {
              currentBalanceCents: newBalance,
              status: newStatus,
              lastUsedAt: new Date(),
            },
          })

          // Create debit transaction
          const transaction = await tx.giftCardTransaction.create({
            data: {
              storeId,
              giftCardId: giftCard.id,
              type: 'DEBIT',
              amountCents: -input.amountCents, // Negative for debit
              balanceAfterCents: newBalance,
              orderId: input.orderId,
            },
          })

          return {
            giftCard: {
              id: giftCard.id,
              initialBalanceCents: giftCard.initial_balance_cents,
            },
            transaction,
            newBalance,
            newStatus,
          }
        },
        {
          // Use SERIALIZABLE isolation for maximum safety against race conditions
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      )

      // Emit event (after successful transaction)
      this.eventEmitter.emit('giftCard.redeemed', {
        giftCardId: result.giftCard.id,
        storeId,
        transactionId: result.transaction.id,
        orderId: input.orderId,
        amountCents: input.amountCents,
        remainingBalanceCents: result.newBalance,
        timestamp: new Date().toISOString(),
      })

      // Emit depleted event if balance is now zero
      if (result.newStatus === 'DEPLETED') {
        this.eventEmitter.emit('giftCard.depleted', {
          giftCardId: result.giftCard.id,
          storeId,
          totalUsedCents: result.giftCard.initialBalanceCents,
          timestamp: new Date().toISOString(),
        })
      }

      this.logger.log(
        `Gift card redeemed: ${result.giftCard.id} for ${input.amountCents} cents (order: ${input.orderId})`,
      )

      return {
        success: true,
        transactionId: result.transaction.id,
        amountDebitedCents: input.amountCents,
        remainingBalanceCents: result.newBalance,
      }
    } catch (error) {
      // Map internal error codes to response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      const errorMap: Record<string, { error: string; errorCode: RedeemResultDto['errorCode'] }> = {
        INVALID_CODE: { error: 'Invalid gift card code', errorCode: 'INVALID_CODE' },
        CARD_DISABLED: { error: 'Gift card is disabled', errorCode: 'CARD_DISABLED' },
        CARD_EXPIRED: { error: 'Gift card has expired', errorCode: 'CARD_EXPIRED' },
        ALREADY_DEPLETED: {
          error: 'Gift card has no remaining balance',
          errorCode: 'ALREADY_DEPLETED',
        },
        INSUFFICIENT_BALANCE: {
          error: 'Insufficient balance on gift card',
          errorCode: 'INSUFFICIENT_BALANCE',
        },
        CURRENCY_MISMATCH: {
          error: `Currency mismatch: order is ${orderCurrency}`,
          errorCode: 'CURRENCY_MISMATCH',
        },
      }

      const mapped = errorMap[errorMessage]
      if (mapped) {
        return { success: false, ...mapped }
      }

      // Re-throw unexpected errors
      this.logger.error(`Gift card redeem failed: ${errorMessage}`, error)
      throw error
    }
  }

  // ==========================================================================
  // Refund to Gift Card
  // ==========================================================================

  /**
   * Refund amount back to a gift card.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Refund input
   * @param performedById - Optional user ID who performed the action
   * @returns Refund result
   */
  async refund(
    storeId: string,
    input: RefundToGiftCardInput,
    performedById?: string,
  ): Promise<{ success: boolean; transactionId?: string; newBalanceCents?: number; error?: string }> {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: input.giftCardId, storeId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    // Calculate new balance
    const newBalance = giftCard.currentBalanceCents + input.amountCents

    // If card was depleted, reactivate it
    const newStatus: GiftCardStatus =
      giftCard.status === 'DEPLETED' || giftCard.status === 'PENDING' ? 'ACTIVE' : giftCard.status

    // Perform refund in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update gift card balance
      await tx.giftCard.update({
        where: { id: giftCard.id },
        data: {
          currentBalanceCents: newBalance,
          status: newStatus,
        },
      })

      // Create refund transaction
      const transaction = await tx.giftCardTransaction.create({
        data: {
          storeId,
          giftCardId: giftCard.id,
          type: 'REFUND',
          amountCents: input.amountCents, // Positive for credit
          balanceAfterCents: newBalance,
          orderId: input.orderId,
          reason: input.reason ?? null,
          performedById: performedById ?? null,
        },
      })

      return transaction
    })

    // Emit event
    this.eventEmitter.emit('giftCard.refunded', {
      giftCardId: giftCard.id,
      storeId,
      transactionId: result.id,
      orderId: input.orderId,
      amountCents: input.amountCents,
      newBalanceCents: newBalance,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(
      `Gift card refunded: ${giftCard.id} for ${input.amountCents} cents (order: ${input.orderId})`,
    )

    return {
      success: true,
      transactionId: result.id,
      newBalanceCents: newBalance,
    }
  }

  // ==========================================================================
  // Adjust Balance
  // ==========================================================================

  /**
   * Manually adjust gift card balance (admin action).
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Adjustment input
   * @param performedById - User ID who performed the action
   * @returns Adjustment result
   */
  async adjustBalance(
    storeId: string,
    input: AdjustGiftCardBalanceInput,
    performedById: string,
  ): Promise<{ success: boolean; transactionId?: string; previousBalanceCents?: number; newBalanceCents?: number; error?: string }> {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: input.giftCardId, storeId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    // Calculate new balance (ensure non-negative)
    const newBalance = Math.max(0, giftCard.currentBalanceCents + input.amountCents)

    // Determine new status
    let newStatus = giftCard.status
    if (newBalance === 0 && giftCard.status === 'ACTIVE') {
      newStatus = 'DEPLETED'
    } else if (newBalance > 0 && giftCard.status === 'DEPLETED') {
      newStatus = 'ACTIVE'
    }

    // Perform adjustment in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update gift card balance
      await tx.giftCard.update({
        where: { id: giftCard.id },
        data: {
          currentBalanceCents: newBalance,
          status: newStatus,
        },
      })

      // Create adjustment transaction
      const transaction = await tx.giftCardTransaction.create({
        data: {
          storeId,
          giftCardId: giftCard.id,
          type: 'ADJUSTMENT',
          amountCents: input.amountCents,
          balanceAfterCents: newBalance,
          reason: input.reason,
          performedById,
        },
      })

      return transaction
    })

    // Emit event
    this.eventEmitter.emit('giftCard.adjusted', {
      giftCardId: giftCard.id,
      storeId,
      transactionId: result.id,
      previousBalanceCents: giftCard.currentBalanceCents,
      adjustmentCents: input.amountCents,
      newBalanceCents: newBalance,
      reason: input.reason,
      performedById,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(
      `Gift card adjusted: ${giftCard.id} by ${input.amountCents} cents (${input.reason})`,
    )

    return {
      success: true,
      transactionId: result.id,
      previousBalanceCents: giftCard.currentBalanceCents,
      newBalanceCents: newBalance,
    }
  }

  // ==========================================================================
  // Enable/Disable
  // ==========================================================================

  /**
   * Disable a gift card.
   *
   * @param storeId - Store ID for tenant isolation
   * @param giftCardId - Gift card ID
   * @param reason - Reason for disabling
   * @returns Result
   */
  async disable(
    storeId: string,
    giftCardId: string,
    reason: string,
  ): Promise<{ success: boolean; newStatus?: string; error?: string }> {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: giftCardId, storeId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    if (giftCard.status === 'DISABLED') {
      return { success: false, error: 'Gift card is already disabled' }
    }

    const previousStatus = giftCard.status

    await this.prisma.giftCard.update({
      where: { id: giftCardId },
      data: { status: 'DISABLED' },
    })

    // Emit event
    this.eventEmitter.emit('giftCard.statusChanged', {
      giftCardId,
      storeId,
      previousStatus,
      newStatus: 'DISABLED',
      reason,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Gift card disabled: ${giftCardId} (${reason})`)

    return { success: true, newStatus: 'DISABLED' }
  }

  /**
   * Enable a disabled gift card.
   *
   * @param storeId - Store ID for tenant isolation
   * @param giftCardId - Gift card ID
   * @returns Result
   */
  async enable(
    storeId: string,
    giftCardId: string,
  ): Promise<{ success: boolean; newStatus?: string; error?: string }> {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: giftCardId, storeId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    if (giftCard.status !== 'DISABLED') {
      return { success: false, error: 'Gift card is not disabled' }
    }

    // Determine appropriate status based on balance and expiration
    let newStatus: GiftCardStatus = 'ACTIVE'
    if (giftCard.currentBalanceCents === 0) {
      newStatus = 'DEPLETED'
    } else if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      newStatus = 'EXPIRED'
    }

    await this.prisma.giftCard.update({
      where: { id: giftCardId },
      data: { status: newStatus },
    })

    // Emit event
    this.eventEmitter.emit('giftCard.statusChanged', {
      giftCardId,
      storeId,
      previousStatus: 'DISABLED',
      newStatus,
      reason: null,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Gift card enabled: ${giftCardId} -> ${newStatus}`)

    return { success: true, newStatus }
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Get a gift card by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param giftCardId - Gift card ID
   * @returns Gift card or throws NotFoundException
   */
  async findById(storeId: string, giftCardId: string): Promise<GiftCardResponseDto> {
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: giftCardId, storeId },
      include: {
        template: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
    })

    if (!giftCard) {
      throw new NotFoundException('Gift card not found')
    }

    return this.toGiftCardResponse(giftCard, giftCard._count.transactions, giftCard.template?.name)
  }

  /**
   * Find gift card by code hash (internal use).
   *
   * @param storeId - Store ID for tenant isolation
   * @param code - Plain gift card code
   * @returns Gift card or null
   */
  async findByCode(storeId: string, code: string): Promise<GiftCardResponseDto | null> {
    const codeHash = this.hashCode(code)

    const giftCard = await this.prisma.giftCard.findFirst({
      where: { storeId, codeHash },
      include: {
        template: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
    })

    if (!giftCard) {
      return null
    }

    return this.toGiftCardResponse(giftCard, giftCard._count.transactions, giftCard.template?.name)
  }

  /**
   * List gift cards with filtering and pagination.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - List options
   * @returns Paginated list
   */
  async list(storeId: string, input: ListGiftCardsOptions = {}): Promise<GiftCardsListResult> {
    const page = input.page ?? 1
    const limit = input.limit ?? 50
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.GiftCardWhereInput = {
      storeId,
      ...(input.status && { status: input.status as GiftCardStatus }),
      ...(input.templateId && { templateId: input.templateId }),
      ...(input.search && {
        codeLast4: { contains: input.search.toUpperCase() },
      }),
      ...(input.fromDate && { createdAt: { gte: input.fromDate } }),
      ...(input.toDate && { createdAt: { lte: input.toDate } }),
      ...(input.hasBalance !== undefined && {
        currentBalanceCents: input.hasBalance ? { gt: 0 } : { equals: 0 },
      }),
    }

    // Execute queries in parallel
    const [giftCards, total] = await Promise.all([
      this.prisma.giftCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: { select: { name: true } },
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.giftCard.count({ where }),
    ])

    return {
      items: giftCards.map((gc) =>
        this.toGiftCardResponse(gc, gc._count.transactions, gc.template?.name),
      ),
      total,
      page,
      limit,
      hasMore: skip + giftCards.length < total,
    }
  }

  /**
   * Get transactions for a gift card.
   *
   * @param storeId - Store ID for tenant isolation
   * @param giftCardId - Gift card ID
   * @param options - Pagination options
   * @returns Paginated transactions
   */
  async getTransactions(
    storeId: string,
    giftCardId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    items: GiftCardTransactionDto[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    const page = options.page ?? 1
    const limit = options.limit ?? 50
    const skip = (page - 1) * limit

    // Verify gift card exists and belongs to store
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { id: giftCardId, storeId },
      select: { id: true },
    })

    if (!giftCard) {
      throw new NotFoundException('Gift card not found')
    }

    const [transactions, total] = await Promise.all([
      this.prisma.giftCardTransaction.findMany({
        where: { giftCardId, storeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          performedBy: { select: { name: true } },
        },
      }),
      this.prisma.giftCardTransaction.count({ where: { giftCardId, storeId } }),
    ])

    return {
      items: transactions.map((tx) => ({
        id: tx.id,
        storeId: tx.storeId,
        giftCardId: tx.giftCardId,
        type: tx.type,
        amountCents: tx.amountCents,
        balanceAfterCents: tx.balanceAfterCents,
        orderId: tx.orderId,
        reason: tx.reason,
        performedById: tx.performedById,
        performedByName: tx.performedBy?.name ?? undefined,
        createdAt: tx.createdAt,
      })),
      total,
      page,
      limit,
      hasMore: skip + transactions.length < total,
    }
  }

  // ==========================================================================
  // Scheduled Jobs Support
  // ==========================================================================

  /**
   * Expire gift cards that have passed their expiration date.
   * Called by a scheduled job.
   *
   * @param storeId - Optional store ID to scope to a single store
   * @returns Number of cards expired
   */
  async expireCards(storeId?: string): Promise<number> {
    const now = new Date()

    const cards = await this.prisma.giftCard.findMany({
      where: {
        ...(storeId && { storeId }),
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      select: { id: true, storeId: true, currentBalanceCents: true, expiresAt: true },
    })

    if (cards.length === 0) {
      return 0
    }

    // Update all expired cards
    await this.prisma.giftCard.updateMany({
      where: {
        id: { in: cards.map((c) => c.id) },
      },
      data: { status: 'EXPIRED' },
    })

    // Emit events for each expired card
    for (const card of cards) {
      this.eventEmitter.emit('giftCard.expired', {
        giftCardId: card.id,
        storeId: card.storeId,
        remainingBalanceCents: card.currentBalanceCents,
        expiresAt: card.expiresAt,
        timestamp: new Date().toISOString(),
      })
    }

    this.logger.log(`Expired ${cards.length} gift cards`)

    return cards.length
  }

  // ==========================================================================
  // Protected Helpers
  // ==========================================================================

  /**
   * Convert Prisma GiftCard to API response.
   * Protected for @trafi/core customization.
   */
  protected toGiftCardResponse(
    giftCard: PrismaGiftCard,
    transactionCount?: number,
    templateName?: string | null,
  ): GiftCardResponseDto {
    return {
      id: giftCard.id,
      storeId: giftCard.storeId,
      codeLast4: giftCard.codeLast4,
      initialBalanceCents: giftCard.initialBalanceCents,
      currentBalanceCents: giftCard.currentBalanceCents,
      currencyCode: giftCard.currencyCode,
      status: giftCard.status,
      purchasedById: giftCard.purchasedById,
      recipientEmail: giftCard.recipientEmail,
      recipientName: giftCard.recipientName,
      senderName: giftCard.senderName,
      giftMessage: giftCard.giftMessage,
      expiresAt: giftCard.expiresAt,
      activatedAt: giftCard.activatedAt,
      lastUsedAt: giftCard.lastUsedAt,
      issuedFromOrderId: giftCard.issuedFromOrderId,
      templateId: giftCard.templateId,
      metadata: giftCard.metadata as Record<string, unknown> | null,
      createdAt: giftCard.createdAt,
      updatedAt: giftCard.updatedAt,
      ...(transactionCount !== undefined && { transactionCount }),
      ...(templateName && { templateName }),
    }
  }
}
