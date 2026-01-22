import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, Logger } from '@nestjs/common'
import request from 'supertest'
import * as bcrypt from 'bcrypt'
import { AppModule } from '../src/app.module'
import { PrismaService } from '@database/prisma.service'
import { TRPCService } from '../src/trpc/trpc.module'

/**
 * Promotions & Coupons E2E Tests
 *
 * Tests cover:
 * - Promotion creation flow (Task 12.1)
 * - Coupon generation and listing (Task 12.2)
 * - Status transitions (Task 12.3)
 * - Tenant isolation for promotions
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
describe('Promotions (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  const logger = new Logger('PromotionsE2E')

  // Test data
  const storeId = 'store_e2e_promos'
  const storeSlug = 'e2e-promo-store'
  const userEmail = 'owner@e2e-promos.dev'
  const userPassword = 'PromoTest123!'

  // Track created resources for cleanup
  let promotionId: string
  let couponId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Setup tRPC middleware
    const trpcService = app.get(TRPCService)
    app.use('/trpc', trpcService.createMiddleware())

    await app.init()

    prisma = app.get<PrismaService>(PrismaService)

    // Create test store
    await prisma.store.upsert({
      where: { slug: storeSlug },
      update: {},
      create: {
        id: storeId,
        name: 'E2E Promo Store',
        slug: storeSlug,
      },
    })

    // Create test user and membership
    const passwordHash = await bcrypt.hash(userPassword, 10)
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: { passwordHash, status: 'ACTIVE' },
      create: {
        email: userEmail,
        name: 'Promo Test Owner',
        passwordHash,
        status: 'ACTIVE',
      },
    })

    // Create StoreMembership to link user to store with OWNER role
    await prisma.storeMembership.upsert({
      where: {
        storeId_userId: {
          storeId,
          userId: user.id,
        },
      },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: {
        storeId,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        acceptedAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    try {
      // Cleanup in correct order (respecting foreign key constraints)
      await prisma.promotionUsage.deleteMany({ where: { storeId } })
      await prisma.coupon.deleteMany({ where: { storeId } })
      await prisma.promotion.deleteMany({ where: { storeId } })
      await prisma.auditLog.deleteMany({ where: { storeId } })
      await prisma.storeMembership.deleteMany({ where: { storeId } })
      await prisma.user.deleteMany({ where: { email: userEmail } })
      await prisma.store.deleteMany({ where: { slug: storeSlug } })
    } catch (error) {
      logger.warn('Cleanup error (non-fatal):', error)
    }
    await app.close()
  })

  /**
   * Helper to login and get access token
   */
  async function loginAs(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })

    return response.body.accessToken
  }

  // ===========================================================================
  // Task 12.1: Test Promotion Creation Flow (E2E)
  // ===========================================================================
  describe('Promotion Creation Flow (Task 12.1)', () => {
    it('should create a percentage discount promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Summer Sale 20%',
          description: '20% off all products',
          type: 'PERCENT',
          discountValue: 20,
          conditions: { minOrderCents: 5000 },
          maxDiscountCents: 10000,
          usageLimit: 100,
          perCustomerLimit: 2,
          startsAt: new Date('2026-01-01').toISOString(),
          endsAt: new Date('2026-12-31').toISOString(),
          priority: 0,
          stackable: false,
        })
        .expect(200)

      expect(response.body.result?.data).toBeDefined()
      const promo = response.body.result.data
      expect(promo.name).toBe('Summer Sale 20%')
      expect(promo.type).toBe('PERCENT')
      expect(promo.discountValue).toBe(20)
      expect(promo.status).toBe('DRAFT')

      promotionId = promo.id
    })

    it('should create a fixed amount discount promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Fixed 10 EUR Off',
          type: 'FIXED',
          discountValue: 1000, // 10.00 EUR in cents
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })
        .expect(200)

      const promo = response.body.result.data
      expect(promo.type).toBe('FIXED')
      expect(promo.discountValue).toBe(1000)
    })

    it('should create a free shipping promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Free Shipping',
          type: 'FREE_SHIPPING',
          conditions: { minOrderCents: 10000 }, // Min 100 EUR
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: true,
        })
        .expect(200)

      const promo = response.body.result.data
      expect(promo.type).toBe('FREE_SHIPPING')
      expect(promo.stackable).toBe(true)
    })

    it('should create a BUY_X_GET_Y promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Buy 2 Get 1 Free',
          type: 'BUY_X_GET_Y',
          conditions: { buyQuantity: 2, getQuantity: 1 },
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })
        .expect(200)

      const promo = response.body.result.data
      expect(promo.type).toBe('BUY_X_GET_Y')
      expect(promo.conditions.buyQuantity).toBe(2)
      expect(promo.conditions.getQuantity).toBe(1)
    })

    it('should reject invalid percentage discount (> 100)', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Promo',
          type: 'PERCENT',
          discountValue: 150,
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })

      // tRPC returns 200 with error in body
      expect(response.body.error).toBeDefined()
    })

    it('should reject end date before start date', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Dates',
          type: 'PERCENT',
          discountValue: 10,
          startsAt: new Date('2026-12-01').toISOString(),
          endsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })

      expect(response.body.error).toBeDefined()
    })

    it('should list promotions', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .get('/trpc/promotions.list?input={}')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.result?.data?.items).toBeDefined()
      expect(Array.isArray(response.body.result.data.items)).toBe(true)
      expect(response.body.result.data.items.length).toBeGreaterThan(0)
    })

    it('should get a promotion by ID', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .get(`/trpc/promotions.get?input=${encodeURIComponent(JSON.stringify({ id: promotionId }))}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.result?.data?.id).toBe(promotionId)
    })

    it('should update a promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.update')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: promotionId,
          name: 'Updated Summer Sale',
          description: 'Updated description',
        })
        .expect(200)

      expect(response.body.result?.data?.name).toBe('Updated Summer Sale')
    })
  })

  // ===========================================================================
  // Task 12.2: Test Coupon Generation and Listing (E2E)
  // ===========================================================================
  describe('Coupon Generation and Listing (Task 12.2)', () => {
    it('should create a single coupon', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/coupons.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          promotionId,
          code: 'SUMMER2026',
          usageLimit: 10,
          expiresAt: new Date('2026-12-31').toISOString(),
        })
        .expect(200)

      expect(response.body.result?.data).toBeDefined()
      const coupon = response.body.result.data
      expect(coupon.code).toBe('SUMMER2026')
      expect(coupon.promotionId).toBe(promotionId)
      expect(coupon.isActive).toBe(true)

      couponId = coupon.id
    })

    it('should generate bulk coupons', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/coupons.generateBulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          promotionId,
          count: 5,
          codeLength: 8,
          prefix: 'BULK',
          usageLimit: 1,
        })
        .expect(200)

      expect(response.body.result?.data).toBeDefined()
      const result = response.body.result.data
      expect(result.count).toBe(5)
      expect(result.coupons.length).toBe(5)
      result.coupons.forEach((coupon: { code: string }) => {
        expect(coupon.code.startsWith('BULK')).toBe(true)
      })
    })

    it('should list coupons for a promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .get(`/trpc/coupons.list?input=${encodeURIComponent(JSON.stringify({ promotionId }))}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.result?.data?.items).toBeDefined()
      expect(response.body.result.data.items.length).toBeGreaterThan(0)
    })

    it('should find coupon by code', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .get(`/trpc/coupons.findByCode?input=${encodeURIComponent(JSON.stringify({ code: 'SUMMER2026' }))}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.result?.data?.code).toBe('SUMMER2026')
    })

    it('should validate a coupon code', async () => {
      const token = await loginAs(userEmail, userPassword)

      // First activate the promotion
      await request(app.getHttpServer())
        .post('/trpc/promotions.activate')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: promotionId })

      const response = await request(app.getHttpServer())
        .get(`/trpc/coupons.validate?input=${encodeURIComponent(JSON.stringify({
          code: 'SUMMER2026',
          orderTotalCents: 10000,
        }))}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.result?.data?.valid).toBe(true)
    })

    it('should reject duplicate coupon code', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/coupons.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          promotionId,
          code: 'SUMMER2026', // Duplicate
        })

      expect(response.body.error).toBeDefined()
    })

    it('should deactivate a coupon', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/coupons.deactivate')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: couponId })
        .expect(200)

      expect(response.body.result?.data?.isActive).toBe(false)
    })
  })

  // ===========================================================================
  // Task 12.3: Test Status Transitions (E2E)
  // ===========================================================================
  describe('Status Transitions (Task 12.3)', () => {
    let transitionPromoId: string

    beforeAll(async () => {
      const token = await loginAs(userEmail, userPassword)

      // Create a promotion for status transition tests
      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Status Test Promo',
          type: 'PERCENT',
          discountValue: 15,
          startsAt: new Date('2026-01-01').toISOString(),
          endsAt: new Date('2026-12-31').toISOString(),
          priority: 0,
          stackable: false,
        })

      transitionPromoId = response.body.result.data.id
    })

    it('should activate a DRAFT promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.activate')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: transitionPromoId })
        .expect(200)

      expect(response.body.result?.data?.status).toBe('ACTIVE')
    })

    it('should pause an ACTIVE promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.pause')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: transitionPromoId })
        .expect(200)

      expect(response.body.result?.data?.status).toBe('PAUSED')
    })

    it('should reactivate a PAUSED promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.activate')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: transitionPromoId })
        .expect(200)

      expect(response.body.result?.data?.status).toBe('ACTIVE')
    })

    it('should archive an ACTIVE promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.archive')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: transitionPromoId })
        .expect(200)

      expect(response.body.result?.data?.status).toBe('ARCHIVED')
    })

    it('should prevent reactivating an ARCHIVED promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.activate')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: transitionPromoId })

      expect(response.body.error).toBeDefined()
    })

    it('should update status via updateStatus', async () => {
      const token = await loginAs(userEmail, userPassword)

      // Create another promotion for this test
      const createResponse = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Status Update Test',
          type: 'PERCENT',
          discountValue: 10,
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })

      const promoId = createResponse.body.result.data.id

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.updateStatus')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: promoId, status: 'ACTIVE' })
        .expect(200)

      expect(response.body.result?.data?.status).toBe('ACTIVE')
    })
  })

  // ===========================================================================
  // Tenant Isolation Tests
  // ===========================================================================
  describe('Tenant Isolation', () => {
    const otherStoreId = 'store_e2e_promos_other'
    const otherStoreSlug = 'e2e-promo-store-other'
    const otherUserEmail = 'owner@e2e-promos-other.dev'

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash(userPassword, 10)

      await prisma.store.upsert({
        where: { slug: otherStoreSlug },
        update: {},
        create: {
          id: otherStoreId,
          name: 'E2E Promo Store Other',
          slug: otherStoreSlug,
        },
      })

      const otherUser = await prisma.user.upsert({
        where: { email: otherUserEmail },
        update: { passwordHash, status: 'ACTIVE' },
        create: {
          email: otherUserEmail,
          name: 'Other Store Owner',
          passwordHash,
          status: 'ACTIVE',
        },
      })

      // Create StoreMembership for other user
      await prisma.storeMembership.upsert({
        where: {
          storeId_userId: {
            storeId: otherStoreId,
            userId: otherUser.id,
          },
        },
        update: { role: 'OWNER', status: 'ACTIVE' },
        create: {
          storeId: otherStoreId,
          userId: otherUser.id,
          role: 'OWNER',
          status: 'ACTIVE',
          acceptedAt: new Date(),
        },
      })
    })

    afterAll(async () => {
      try {
        await prisma.coupon.deleteMany({ where: { storeId: otherStoreId } })
        await prisma.promotion.deleteMany({ where: { storeId: otherStoreId } })
        await prisma.storeMembership.deleteMany({ where: { storeId: otherStoreId } })
        await prisma.user.deleteMany({ where: { email: otherUserEmail } })
        await prisma.store.deleteMany({ where: { slug: otherStoreSlug } })
      } catch (error) {
        logger.warn('Other store cleanup error:', error)
      }
    })

    it('should not allow access to other store promotions', async () => {
      const otherToken = await loginAs(otherUserEmail, userPassword)

      // Try to get a promotion from the other store
      const response = await request(app.getHttpServer())
        .get(`/trpc/promotions.get?input=${encodeURIComponent(JSON.stringify({ id: promotionId }))}`)
        .set('Authorization', `Bearer ${otherToken}`)

      // Should get error (not found)
      expect(response.body.error).toBeDefined()
    })

    it('should only list promotions from own store', async () => {
      const token = await loginAs(userEmail, userPassword)
      const otherToken = await loginAs(otherUserEmail, userPassword)

      // Get promotions for main store
      const mainResponse = await request(app.getHttpServer())
        .get('/trpc/promotions.list?input={}')
        .set('Authorization', `Bearer ${token}`)

      // Get promotions for other store (should be empty or different)
      const otherResponse = await request(app.getHttpServer())
        .get('/trpc/promotions.list?input={}')
        .set('Authorization', `Bearer ${otherToken}`)

      const mainIds = mainResponse.body.result.data.items.map((p: { id: string }) => p.id)
      const otherIds = otherResponse.body.result.data.items.map((p: { id: string }) => p.id)

      // No overlap between stores
      mainIds.forEach((id: string) => {
        expect(otherIds).not.toContain(id)
      })
    })
  })

  // ===========================================================================
  // Delete Tests (cleanup)
  // ===========================================================================
  describe('Delete Operations', () => {
    it('should delete a coupon', async () => {
      const token = await loginAs(userEmail, userPassword)

      // Create a coupon to delete
      const createResponse = await request(app.getHttpServer())
        .post('/trpc/coupons.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          promotionId,
          code: 'DELETE_ME',
        })

      const couponToDelete = createResponse.body.result.data.id

      const response = await request(app.getHttpServer())
        .post('/trpc/coupons.delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: couponToDelete })
        .expect(200)

      expect(response.body.result?.data?.success).toBe(true)
    })

    it('should delete a promotion', async () => {
      const token = await loginAs(userEmail, userPassword)

      // Create a promotion to delete
      const createResponse = await request(app.getHttpServer())
        .post('/trpc/promotions.create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Delete Me Promo',
          type: 'PERCENT',
          discountValue: 5,
          startsAt: new Date('2026-01-01').toISOString(),
          priority: 0,
          stackable: false,
        })

      const promoToDelete = createResponse.body.result.data.id

      const response = await request(app.getHttpServer())
        .post('/trpc/promotions.delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: promoToDelete })
        .expect(200)

      expect(response.body.result?.data?.success).toBe(true)
    })
  })
})
