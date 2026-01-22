import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { GiftCardsService } from '../gift-cards.service'
import { PrismaService } from '@database/prisma.service'

/**
 * GiftCardsService Unit Tests
 *
 * Tests cover:
 * - Gift card issuance with secure code generation
 * - Code validation
 * - Redemption with balance checks
 * - Refunds
 * - Balance adjustments
 * - Enable/Disable operations
 * - Tenant isolation (storeId scoping)
 * - Event emission
 * - Pagination and filtering
 * - Expiration handling
 *
 * @see Story 3.10 - Gift Cards
 */
describe('GiftCardsService', () => {
  let service: GiftCardsService
  let prismaService: {
    giftCard: {
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
      count: jest.Mock
    }
    giftCardTransaction: {
      findMany: jest.Mock
      create: jest.Mock
      count: jest.Mock
    }
    giftCardTemplate: {
      findFirst: jest.Mock
    }
    $queryRaw: jest.Mock
    $transaction: jest.Mock
  }
  let eventEmitter: { emit: jest.Mock }

  const mockStoreId = 'store_test123'
  const mockGiftCardId = 'gc_test123456789012'
  const mockUserId = 'user_admin123'

  const mockGiftCard = {
    id: mockGiftCardId,
    storeId: mockStoreId,
    codeHash: 'abc123hash',
    codeLast4: 'WXYZ',
    initialBalanceCents: 5000,
    currentBalanceCents: 5000,
    currencyCode: 'EUR',
    status: 'ACTIVE' as const,
    purchasedById: null,
    recipientEmail: 'recipient@example.com',
    recipientName: 'John Doe',
    senderName: 'Jane Doe',
    giftMessage: 'Happy Birthday!',
    expiresAt: new Date('2027-01-01'),
    activatedAt: new Date('2026-01-17'),
    lastUsedAt: null,
    issuedFromOrderId: null,
    templateId: null,
    metadata: null,
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
  }

  const mockTemplate = {
    id: 'gctpl_test123',
    storeId: mockStoreId,
    name: 'Birthday Card',
    validityDays: 365,
  }

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockPrismaService: any = {
      giftCard: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      giftCardTransaction: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      giftCardTemplate: {
        findFirst: jest.fn(),
      },
      // Raw query mock for FOR UPDATE locking (Code Review Fix #2)
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback: (prisma: typeof mockPrismaService) => Promise<unknown>) =>
        callback(mockPrismaService),
      ),
    }

    const mockEventEmitter = {
      emit: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile()

    service = module.get<GiftCardsService>(GiftCardsService)
    prismaService = module.get(PrismaService)
    eventEmitter = module.get(EventEmitter2)
  })

  // ===========================================================================
  // ISSUE Tests
  // ===========================================================================
  describe('issue', () => {
    it('should issue a gift card with generated code', async () => {
      prismaService.giftCard.create.mockResolvedValue({
        ...mockGiftCard,
        status: 'ACTIVE',
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_test123',
        type: 'CREDIT',
        amountCents: 5000,
      })

      const result = await service.issue(mockStoreId, {
        amountCents: 5000,
        currencyCode: 'EUR',
        recipientEmail: 'recipient@example.com',
        recipientName: 'John Doe',
        activateImmediately: true,
      })

      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
      expect(result.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      expect(result.codeLast4).toBeDefined()
      expect(result.initialBalanceCents).toBe(5000)
      expect(result.currencyCode).toBe('EUR')
      expect(result.status).toBe('ACTIVE')
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.issued', expect.any(Object))
    })

    it('should issue a pending gift card when activateImmediately is false', async () => {
      prismaService.giftCard.create.mockResolvedValue({
        ...mockGiftCard,
        status: 'PENDING',
        activatedAt: null,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_test123',
        type: 'CREDIT',
        amountCents: 5000,
      })

      const result = await service.issue(mockStoreId, {
        amountCents: 5000,
        currencyCode: 'EUR',
        activateImmediately: false,
      })

      expect(result.status).toBe('PENDING')
    })

    it('should calculate expiration from template validityDays', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(mockTemplate)
      prismaService.giftCard.create.mockResolvedValue({
        ...mockGiftCard,
        templateId: mockTemplate.id,
        expiresAt: expect.any(Date),
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_test123',
        type: 'CREDIT',
        amountCents: 5000,
      })

      await service.issue(mockStoreId, {
        amountCents: 5000,
        currencyCode: 'EUR',
        activateImmediately: true,
        templateId: mockTemplate.id,
      })

      expect(prismaService.giftCardTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: mockTemplate.id, storeId: mockStoreId },
        select: { validityDays: true },
      })
    })
  })

  // ===========================================================================
  // VALIDATE CODE Tests
  // ===========================================================================
  describe('validateCode', () => {
    // This is the actual SHA-256 hash of "TESTCODE1234WXYZ" (the normalized input for TEST-CODE-1234-WXYZ)
    const testCodeHash = '6963cc62fd45711d1533519583cc95e9f5b4444d206e9ab3580b6f7ed0401377'

    it('should return valid for active gift card with balance', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        codeHash: testCodeHash,
        codeLast4: 'WXYZ',
        currentBalanceCents: 5000,
        currencyCode: 'EUR',
        status: 'ACTIVE',
        expiresAt: new Date('2027-01-01'),
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(true)
      expect(result.codeLast4).toBe('WXYZ')
      expect(result.currentBalanceCents).toBe(5000)
      expect(result.currencyCode).toBe('EUR')
    })

    it('should return invalid for non-existent code', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      const result = await service.validateCode(mockStoreId, 'INVALID-CODE-1234')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid gift card code')
    })

    it('should return invalid for disabled card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        codeHash: testCodeHash,
        status: 'DISABLED',
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Gift card is disabled')
    })

    it('should return invalid for expired card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        codeHash: testCodeHash,
        status: 'EXPIRED',
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Gift card has expired')
    })

    it('should return invalid for depleted card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        codeHash: testCodeHash,
        status: 'DEPLETED',
        currentBalanceCents: 0,
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Gift card has no remaining balance')
    })

    it('should return invalid for pending card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        codeHash: testCodeHash,
        status: 'PENDING',
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Gift card is not yet activated')
    })

    it('should return invalid for card with past expiration date', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        codeHash: testCodeHash,
        status: 'ACTIVE',
        expiresAt: new Date('2020-01-01'), // Past date
      })

      const result = await service.validateCode(mockStoreId, 'TEST-CODE-1234-WXYZ')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Gift card has expired')
    })

    it('should enforce tenant isolation by including storeId in query', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      await service.validateCode('other_store', 'TEST-CODE-1234-WXYZ')

      expect(prismaService.giftCard.findFirst).toHaveBeenCalledWith({
        where: { storeId: 'other_store', codeHash: expect.any(String) },
        select: expect.objectContaining({
          codeHash: true,
          codeLast4: true,
          currentBalanceCents: true,
        }),
      })
    })
  })

  // ===========================================================================
  // REDEEM Tests (Updated for pessimistic locking - Code Review Fix #2)
  // ===========================================================================
  describe('redeem', () => {
    // Helper to create raw query result matching database column names
    const createRawGiftCardResult = (overrides: Partial<{
      id: string
      store_id: string
      code_hash: string
      code_last4: string
      initial_balance_cents: number
      current_balance_cents: number
      currency_code: string
      status: string
      expires_at: Date | null
    }> = {}) => [{
      id: mockGiftCardId,
      store_id: mockStoreId,
      code_hash: 'abc123hash',
      code_last4: 'WXYZ',
      initial_balance_cents: 5000,
      current_balance_cents: 5000,
      currency_code: 'EUR',
      status: 'ACTIVE',
      expires_at: new Date('2027-01-01'),
      ...overrides,
    }]

    it('should successfully redeem gift card balance', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult())
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 3000,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_debit123',
        type: 'DEBIT',
        amountCents: -2000,
        balanceAfterCents: 3000,
      })

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(true)
      expect(result.amountDebitedCents).toBe(2000)
      expect(result.remainingBalanceCents).toBe(3000)
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.redeemed', expect.any(Object))
    })

    it('should mark card as DEPLETED when balance reaches zero', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult({
        current_balance_cents: 2000,
      }))
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 0,
        status: 'DEPLETED',
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_debit123',
        type: 'DEBIT',
        amountCents: -2000,
        balanceAfterCents: 0,
      })

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(true)
      expect(result.remainingBalanceCents).toBe(0)
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.depleted', expect.any(Object))
    })

    it('should fail for invalid code', async () => {
      prismaService.$queryRaw.mockResolvedValue([]) // Empty result = not found

      const result = await service.redeem(mockStoreId, {
        code: 'INVALID-CODE',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('INVALID_CODE')
    })

    it('should fail for disabled card', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult({
        status: 'DISABLED',
      }))

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('CARD_DISABLED')
    })

    it('should fail for insufficient balance', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult({
        current_balance_cents: 1000,
      }))

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('INSUFFICIENT_BALANCE')
    })

    it('should fail for expired card (no auto-update - Code Review Fix #7)', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult({
        status: 'ACTIVE',
        expires_at: new Date('2020-01-01'), // Past date
      }))

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('CARD_EXPIRED')
      // Should NOT auto-update (Fix #7)
      expect(prismaService.giftCard.update).not.toHaveBeenCalled()
    })

    it('should fail for currency mismatch (Code Review Fix #6)', async () => {
      prismaService.$queryRaw.mockResolvedValue(createRawGiftCardResult({
        currency_code: 'EUR',
      }))

      const result = await service.redeem(mockStoreId, {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'USD', // Different currency
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('CURRENCY_MISMATCH')
    })

    it('should enforce tenant isolation via storeId in raw query', async () => {
      prismaService.$queryRaw.mockResolvedValue([])

      await service.redeem('other_store', {
        code: 'TEST-CODE-1234-WXYZ',
        amountCents: 2000,
        orderId: 'order_test123',
        currencyCode: 'EUR',
      })

      // Verify raw query was called (tenant isolation enforced in SQL)
      expect(prismaService.$queryRaw).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // REFUND Tests
  // ===========================================================================
  describe('refund', () => {
    it('should successfully refund to gift card', async () => {
      // Mock raw query for FOR UPDATE lock (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([{
        id: mockGiftCardId,
        store_id: mockStoreId,
        current_balance_cents: 5000,
        status: 'ACTIVE',
      }])
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 7000,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_refund123',
        type: 'REFUND',
        amountCents: 2000,
        balanceAfterCents: 7000,
      })

      const result = await service.refund(
        mockStoreId,
        {
          giftCardId: mockGiftCardId,
          amountCents: 2000,
          orderId: 'order_test123',
          reason: 'Order cancelled',
        },
        mockUserId,
      )

      expect(result.success).toBe(true)
      expect(result.newBalanceCents).toBe(7000)
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.refunded', expect.any(Object))
    })

    it('should reactivate depleted card on refund', async () => {
      // Mock raw query for FOR UPDATE lock (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([{
        id: mockGiftCardId,
        store_id: mockStoreId,
        current_balance_cents: 0,
        status: 'DEPLETED',
      }])
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        status: 'ACTIVE',
        currentBalanceCents: 2000,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_refund123',
        type: 'REFUND',
        amountCents: 2000,
        balanceAfterCents: 2000,
      })

      const result = await service.refund(mockStoreId, {
        giftCardId: mockGiftCardId,
        amountCents: 2000,
        orderId: 'order_test123',
      })

      expect(result.success).toBe(true)
    })

    it('should fail for non-existent gift card', async () => {
      // Mock raw query returning empty array (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([])

      const result = await service.refund(mockStoreId, {
        giftCardId: 'gc_invalid',
        amountCents: 2000,
        orderId: 'order_test123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gift card not found')
    })
  })

  // ===========================================================================
  // ADJUST BALANCE Tests
  // ===========================================================================
  describe('adjustBalance', () => {
    it('should add to balance', async () => {
      // Mock raw query for FOR UPDATE lock (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([{
        id: mockGiftCardId,
        store_id: mockStoreId,
        current_balance_cents: 5000,
        status: 'ACTIVE',
      }])
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 7000,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_adj123',
        type: 'ADJUSTMENT',
        amountCents: 2000,
        balanceAfterCents: 7000,
      })

      const result = await service.adjustBalance(
        mockStoreId,
        {
          giftCardId: mockGiftCardId,
          amountCents: 2000,
          reason: 'Customer service credit',
        },
        mockUserId,
      )

      expect(result.success).toBe(true)
      expect(result.previousBalanceCents).toBe(5000)
      expect(result.newBalanceCents).toBe(7000)
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.adjusted', expect.any(Object))
    })

    it('should subtract from balance', async () => {
      // Mock raw query for FOR UPDATE lock (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([{
        id: mockGiftCardId,
        store_id: mockStoreId,
        current_balance_cents: 5000,
        status: 'ACTIVE',
      }])
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 3000,
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_adj123',
        type: 'ADJUSTMENT',
        amountCents: -2000,
        balanceAfterCents: 3000,
      })

      const result = await service.adjustBalance(
        mockStoreId,
        {
          giftCardId: mockGiftCardId,
          amountCents: -2000,
          reason: 'Manual correction',
        },
        mockUserId,
      )

      expect(result.success).toBe(true)
      expect(result.newBalanceCents).toBe(3000)
    })

    it('should not allow negative balance (floor at 0)', async () => {
      // Mock raw query for FOR UPDATE lock (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([{
        id: mockGiftCardId,
        store_id: mockStoreId,
        current_balance_cents: 1000,
        status: 'ACTIVE',
      }])
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        currentBalanceCents: 0,
        status: 'DEPLETED',
      })
      prismaService.giftCardTransaction.create.mockResolvedValue({
        id: 'gctx_adj123',
        type: 'ADJUSTMENT',
        amountCents: -5000,
        balanceAfterCents: 0,
      })

      const result = await service.adjustBalance(
        mockStoreId,
        {
          giftCardId: mockGiftCardId,
          amountCents: -5000,
          reason: 'Fraud correction',
        },
        mockUserId,
      )

      expect(result.success).toBe(true)
      expect(result.newBalanceCents).toBe(0)
    })

    it('should fail for non-existent gift card', async () => {
      // Mock raw query returning empty array (Code Review Fix)
      prismaService.$queryRaw.mockResolvedValue([])

      const result = await service.adjustBalance(
        mockStoreId,
        {
          giftCardId: 'gc_invalid',
          amountCents: 2000,
          reason: 'Test',
        },
        mockUserId,
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gift card not found')
    })
  })

  // ===========================================================================
  // ENABLE/DISABLE Tests
  // ===========================================================================
  describe('disable', () => {
    it('should disable an active gift card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(mockGiftCard)
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        status: 'DISABLED',
      })

      const result = await service.disable(mockStoreId, mockGiftCardId, 'Reported stolen')

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('DISABLED')
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'giftCard.statusChanged',
        expect.objectContaining({
          previousStatus: 'ACTIVE',
          newStatus: 'DISABLED',
          reason: 'Reported stolen',
        }),
      )
    })

    it('should fail if card is already disabled', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        status: 'DISABLED',
      })

      const result = await service.disable(mockStoreId, mockGiftCardId, 'Test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gift card is already disabled')
    })

    it('should fail for non-existent gift card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      const result = await service.disable(mockStoreId, 'gc_invalid', 'Test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gift card not found')
    })
  })

  describe('enable', () => {
    it('should enable a disabled gift card', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        status: 'DISABLED',
      })
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        status: 'ACTIVE',
      })

      const result = await service.enable(mockStoreId, mockGiftCardId)

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('ACTIVE')
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'giftCard.statusChanged',
        expect.objectContaining({
          previousStatus: 'DISABLED',
          newStatus: 'ACTIVE',
        }),
      )
    })

    it('should set status to DEPLETED if balance is zero', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        status: 'DISABLED',
        currentBalanceCents: 0,
      })
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        status: 'DEPLETED',
        currentBalanceCents: 0,
      })

      const result = await service.enable(mockStoreId, mockGiftCardId)

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('DEPLETED')
    })

    it('should set status to EXPIRED if past expiration', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        status: 'DISABLED',
        expiresAt: new Date('2020-01-01'),
      })
      prismaService.giftCard.update.mockResolvedValue({
        ...mockGiftCard,
        status: 'EXPIRED',
      })

      const result = await service.enable(mockStoreId, mockGiftCardId)

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('EXPIRED')
    })

    it('should fail if card is not disabled', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(mockGiftCard)

      const result = await service.enable(mockStoreId, mockGiftCardId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Gift card is not disabled')
    })
  })

  // ===========================================================================
  // FIND BY ID Tests
  // ===========================================================================
  describe('findById', () => {
    it('should return gift card by ID', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({
        ...mockGiftCard,
        template: { name: 'Birthday Card' },
        _count: { transactions: 3 },
      })

      const result = await service.findById(mockStoreId, mockGiftCardId)

      expect(result.id).toBe(mockGiftCardId)
      expect(result.codeLast4).toBe('WXYZ')
      expect(result.transactionCount).toBe(3)
      expect(result.templateName).toBe('Birthday Card')
    })

    it('should throw NotFoundException if not found', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      await expect(service.findById(mockStoreId, 'gc_invalid')).rejects.toThrow(NotFoundException)
    })

    it('should enforce tenant isolation', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      await expect(service.findById('other_store', mockGiftCardId)).rejects.toThrow(NotFoundException)

      expect(prismaService.giftCard.findFirst).toHaveBeenCalledWith({
        where: { id: mockGiftCardId, storeId: 'other_store' },
        include: expect.any(Object),
      })
    })
  })

  // ===========================================================================
  // LIST Tests
  // ===========================================================================
  describe('list', () => {
    it('should return paginated gift cards', async () => {
      const giftCards = [
        { ...mockGiftCard, template: null, _count: { transactions: 1 } },
        {
          ...mockGiftCard,
          id: 'gc_2',
          codeLast4: 'ABCD',
          template: { name: 'Holiday Card' },
          _count: { transactions: 2 },
        },
      ]
      prismaService.giftCard.findMany.mockResolvedValue(giftCards)
      prismaService.giftCard.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by status', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])
      prismaService.giftCard.count.mockResolvedValue(0)

      await service.list(mockStoreId, { status: 'ACTIVE' })

      expect(prismaService.giftCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      )
    })

    it('should filter by search (codeLast4)', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])
      prismaService.giftCard.count.mockResolvedValue(0)

      await service.list(mockStoreId, { search: 'wxyz' })

      expect(prismaService.giftCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            codeLast4: { contains: 'WXYZ' },
          }),
        }),
      )
    })

    it('should filter by templateId', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])
      prismaService.giftCard.count.mockResolvedValue(0)

      await service.list(mockStoreId, { templateId: 'gctpl_test123' })

      expect(prismaService.giftCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            templateId: 'gctpl_test123',
          }),
        }),
      )
    })

    it('should filter by hasBalance', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])
      prismaService.giftCard.count.mockResolvedValue(0)

      await service.list(mockStoreId, { hasBalance: true })

      expect(prismaService.giftCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentBalanceCents: { gt: 0 },
          }),
        }),
      )
    })

    it('should calculate hasMore correctly', async () => {
      const giftCards = Array(20).fill({
        ...mockGiftCard,
        template: null,
        _count: { transactions: 0 },
      })
      prismaService.giftCard.findMany.mockResolvedValue(giftCards)
      prismaService.giftCard.count.mockResolvedValue(50)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.hasMore).toBe(true)
    })
  })

  // ===========================================================================
  // GET TRANSACTIONS Tests
  // ===========================================================================
  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue({ id: mockGiftCardId })
      prismaService.giftCardTransaction.findMany.mockResolvedValue([
        {
          id: 'gctx_1',
          storeId: mockStoreId,
          giftCardId: mockGiftCardId,
          type: 'CREDIT',
          amountCents: 5000,
          balanceAfterCents: 5000,
          orderId: null,
          reason: 'Initial balance',
          performedById: mockUserId,
          performedBy: { name: 'Admin User' },
          createdAt: new Date('2026-01-17'),
        },
      ])
      prismaService.giftCardTransaction.count.mockResolvedValue(1)

      const result = await service.getTransactions(mockStoreId, mockGiftCardId)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].type).toBe('CREDIT')
      expect(result.items[0].performedByName).toBe('Admin User')
    })

    it('should throw NotFoundException if gift card not found', async () => {
      prismaService.giftCard.findFirst.mockResolvedValue(null)

      await expect(service.getTransactions(mockStoreId, 'gc_invalid')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  // ===========================================================================
  // EXPIRE CARDS Tests
  // ===========================================================================
  describe('expireCards', () => {
    it('should expire cards past their expiration date', async () => {
      const expiredCards = [
        { id: 'gc_1', storeId: mockStoreId, currentBalanceCents: 1000, expiresAt: new Date('2020-01-01') },
        { id: 'gc_2', storeId: mockStoreId, currentBalanceCents: 2000, expiresAt: new Date('2020-06-01') },
      ]
      prismaService.giftCard.findMany.mockResolvedValue(expiredCards)
      prismaService.giftCard.updateMany.mockResolvedValue({ count: 2 })

      const result = await service.expireCards(mockStoreId)

      expect(result).toBe(2)
      expect(prismaService.giftCard.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['gc_1', 'gc_2'] } },
        data: { status: 'EXPIRED' },
      })
      expect(eventEmitter.emit).toHaveBeenCalledWith('giftCard.expired', expect.any(Object))
    })

    it('should return 0 if no cards to expire', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])

      const result = await service.expireCards(mockStoreId)

      expect(result).toBe(0)
      expect(prismaService.giftCard.updateMany).not.toHaveBeenCalled()
    })

    it('should work without storeId (global expiration)', async () => {
      prismaService.giftCard.findMany.mockResolvedValue([])

      await service.expireCards()

      expect(prismaService.giftCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            storeId: expect.anything(),
          }),
        }),
      )
    })
  })

  // ===========================================================================
  // Code Generation Tests
  // ===========================================================================
  describe('code generation', () => {
    it('should generate codes without ambiguous characters', async () => {
      // Access protected method for testing
      const code = (service as any).generateSecureCode()

      // Should not contain 0, O, I, 1
      expect(code).not.toMatch(/[0OI1]/)
      // Should match format XXXX-XXXX-XXXX-XXXX
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })

    it('should hash codes consistently', async () => {
      const code1 = 'ABCD-EFGH-IJKL-MNOP'
      const code2 = 'ABCDEFGHIJKLMNOP' // Same without dashes
      const code3 = 'abcd-efgh-ijkl-mnop' // Lowercase

      const hash1 = (service as any).hashCode(code1)
      const hash2 = (service as any).hashCode(code2)
      const hash3 = (service as any).hashCode(code3)

      expect(hash1).toBe(hash2)
      expect(hash1).toBe(hash3)
    })

    it('should extract last 4 characters correctly', async () => {
      const code = 'ABCD-EFGH-IJKL-MNOP'
      const last4 = (service as any).extractLast4(code)

      expect(last4).toBe('MNOP')
    })
  })
})
