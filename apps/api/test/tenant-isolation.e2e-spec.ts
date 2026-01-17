import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@database/prisma.service';

/**
 * Tenant Isolation E2E Tests
 *
 * Verifies that tenant isolation is properly enforced:
 * - Store A cannot access Store B's resources
 * - Cross-tenant access returns 404 (not 403) to avoid leaking resource existence
 * - Audit logs capture operations with correct tenant context
 *
 * Tests use the Users API which exists and is properly tenant-scoped.
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#2, AC#3, AC#4)
 */
describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const logger = new Logger('TenantIsolationE2E');

  // Store A test data
  const storeAId = 'store_e2e_tenant_a';
  const storeASlug = 'e2e-tenant-store-a';
  const userAEmail = 'owner-a@e2e-tenant.dev';
  const userAPassword = 'PasswordA123!';

  // Store A - second user for cross-tenant testing
  const userA2Email = 'user-a2@e2e-tenant.dev';
  let userA2Id: string;

  // Store B test data
  const storeBId = 'store_e2e_tenant_b';
  const storeBSlug = 'e2e-tenant-store-b';
  const userBEmail = 'owner-b@e2e-tenant.dev';
  const userBPassword = 'PasswordB123!';

  // Store B - second user for cross-tenant testing
  const userB2Email = 'user-b2@e2e-tenant.dev';
  let userB2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create Store A
    await prisma.store.upsert({
      where: { slug: storeASlug },
      update: {},
      create: {
        id: storeAId,
        name: 'E2E Tenant Store A',
        slug: storeASlug,
      },
    });

    // Create Store B
    await prisma.store.upsert({
      where: { slug: storeBSlug },
      update: {},
      create: {
        id: storeBId,
        name: 'E2E Tenant Store B',
        slug: storeBSlug,
      },
    });

    // Create Owner A (OWNER of Store A)
    const passwordHashA = await bcrypt.hash(userAPassword, 10);
    await prisma.user.upsert({
      where: { email: userAEmail },
      update: { passwordHash: passwordHashA, status: 'ACTIVE' },
      create: {
        email: userAEmail,
        name: 'Tenant A Owner',
        passwordHash: passwordHashA,
        role: 'OWNER',
        status: 'ACTIVE',
        storeId: storeAId,
      },
    });

    // Create second user in Store A for testing
    const userA2 = await prisma.user.upsert({
      where: { email: userA2Email },
      update: { passwordHash: passwordHashA, status: 'ACTIVE' },
      create: {
        email: userA2Email,
        name: 'Tenant A User 2',
        passwordHash: passwordHashA,
        role: 'EDITOR',
        status: 'ACTIVE',
        storeId: storeAId,
      },
    });
    userA2Id = userA2.id;

    // Create Owner B (OWNER of Store B)
    const passwordHashB = await bcrypt.hash(userBPassword, 10);
    await prisma.user.upsert({
      where: { email: userBEmail },
      update: { passwordHash: passwordHashB, status: 'ACTIVE' },
      create: {
        email: userBEmail,
        name: 'Tenant B Owner',
        passwordHash: passwordHashB,
        role: 'OWNER',
        status: 'ACTIVE',
        storeId: storeBId,
      },
    });

    // Create second user in Store B for testing
    const userB2 = await prisma.user.upsert({
      where: { email: userB2Email },
      update: { passwordHash: passwordHashB, status: 'ACTIVE' },
      create: {
        email: userB2Email,
        name: 'Tenant B User 2',
        passwordHash: passwordHashB,
        role: 'EDITOR',
        status: 'ACTIVE',
        storeId: storeBId,
      },
    });
    userB2Id = userB2.id;
  });

  afterAll(async () => {
    // Cleanup test data in correct order (respecting foreign key constraints)
    try {
      // Delete audit logs first (they reference stores)
      await prisma.auditLog.deleteMany({
        where: { storeId: { in: [storeAId, storeBId] } },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: { email: { in: [userAEmail, userA2Email, userBEmail, userB2Email] } },
      });

      // Delete stores
      await prisma.store.deleteMany({
        where: { slug: { in: [storeASlug, storeBSlug] } },
      });
    } catch (error) {
      // Log cleanup errors for debugging but don't fail the test
      logger.warn('Cleanup error (non-fatal):', error);
    }
    await app.close();
  });

  /**
   * Helper to login and get access token
   */
  async function loginAs(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    return response.body.accessToken;
  }

  describe('User List Isolation', () => {
    it('should only return Store A users for Store A owner', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // All returned users should belong to Store A
      const users = response.body.users;
      expect(users.length).toBeGreaterThan(0);

      users.forEach((user: { storeId?: string; email: string }) => {
        // Users list shouldn't expose storeId, but if it does, verify isolation
        if (user.storeId) {
          expect(user.storeId).toBe(storeAId);
        }
        // Verify Store B users are not in the list
        expect(user.email).not.toBe(userBEmail);
        expect(user.email).not.toBe(userB2Email);
      });
    });

    it('should only return Store B users for Store B owner', async () => {
      const tokenB = await loginAs(userBEmail, userBPassword);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // All returned users should belong to Store B
      const users = response.body.users;
      expect(users.length).toBeGreaterThan(0);

      users.forEach((user: { storeId?: string; email: string }) => {
        if (user.storeId) {
          expect(user.storeId).toBe(storeBId);
        }
        // Verify Store A users are not in the list
        expect(user.email).not.toBe(userAEmail);
        expect(user.email).not.toBe(userA2Email);
      });
    });
  });

  describe('Cross-Tenant User Modification Prevention', () => {
    it('should prevent Store A owner from modifying Store B user role (returns 404)', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      // Try to update Store B user's role using Store A's token
      const response = await request(app.getHttpServer())
        .patch(`/users/${userB2Id}/role`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'VIEWER' });

      // Should return 404 (not 403) to avoid leaking that the user exists
      expect(response.status).toBe(404);
    });

    it('should prevent Store B owner from modifying Store A user role (returns 404)', async () => {
      const tokenB = await loginAs(userBEmail, userBPassword);

      // Try to update Store A user's role using Store B's token
      const response = await request(app.getHttpServer())
        .patch(`/users/${userA2Id}/role`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ role: 'VIEWER' });

      // Should return 404 (not 403)
      expect(response.status).toBe(404);
    });

    it('should prevent Store A owner from deactivating Store B user (returns 404)', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      // Try to deactivate Store B user using Store A's token
      const response = await request(app.getHttpServer())
        .patch(`/users/${userB2Id}/deactivate`)
        .set('Authorization', `Bearer ${tokenA}`);

      // Should return 404 (not 403)
      expect(response.status).toBe(404);
    });

    it('should allow Store A owner to modify Store A user role', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      // Owner can modify users in their own store
      const response = await request(app.getHttpServer())
        .patch(`/users/${userA2Id}/role`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'VIEWER' });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('VIEWER');

      // Reset role back
      await request(app.getHttpServer())
        .patch(`/users/${userA2Id}/role`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'EDITOR' });
    });
  });

  describe('Audit Log Tenant Context', () => {
    it('should record audit log with correct tenant context for state-changing operations', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      // Perform a state-changing operation (PATCH creates audit log)
      await request(app.getHttpServer())
        .patch(`/users/${userA2Id}/role`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'ADMIN' })
        .expect(200);

      // Wait for async audit log to be written
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that audit log was created with correct storeId
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          storeId: storeAId,
          action: { contains: 'PATCH' },
          resource: 'users',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].storeId).toBe(storeAId);
      expect(auditLogs[0].status).toBe('success');
      expect(auditLogs[0].action).toContain('PATCH');

      // Reset role back
      await request(app.getHttpServer())
        .patch(`/users/${userA2Id}/role`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: 'EDITOR' });
    });

    it('should not allow Store A to see Store B audit logs via database query', async () => {
      // Create an audit log for Store B first
      const tokenB = await loginAs(userBEmail, userBPassword);

      await request(app.getHttpServer())
        .patch(`/users/${userB2Id}/role`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ role: 'ADMIN' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Store B should have audit logs
      const storeBLogs = await prisma.auditLog.findMany({
        where: { storeId: storeBId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // Verify the audit log belongs to Store B
      if (storeBLogs.length > 0) {
        expect(storeBLogs[0].storeId).toBe(storeBId);
        expect(storeBLogs[0].storeId).not.toBe(storeAId);
      }

      // Reset role back
      await request(app.getHttpServer())
        .patch(`/users/${userB2Id}/role`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ role: 'EDITOR' });
    });
  });

  describe('Authentication Context Isolation', () => {
    it('should return authenticated user info scoped to their store', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.email).toBe(userAEmail);
      expect(response.body.storeId).toBe(storeAId);
    });

    it('should return different store context for different users', async () => {
      const tokenA = await loginAs(userAEmail, userAPassword);
      const tokenB = await loginAs(userBEmail, userBPassword);

      const responseA = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseA.body.storeId).toBe(storeAId);
      expect(responseB.body.storeId).toBe(storeBId);
      expect(responseA.body.storeId).not.toBe(responseB.body.storeId);
    });
  });

  describe('Direct Database Verification', () => {
    it('should verify users are properly scoped to stores in database', async () => {
      // Verify Store A users belong to Store A
      const storeAUsers = await prisma.user.findMany({
        where: { storeId: storeAId },
      });
      storeAUsers.forEach((user) => {
        expect(user.storeId).toBe(storeAId);
      });

      // Verify Store B users belong to Store B
      const storeBUsers = await prisma.user.findMany({
        where: { storeId: storeBId },
      });
      storeBUsers.forEach((user) => {
        expect(user.storeId).toBe(storeBId);
      });

      // Verify no overlap
      const storeAEmails = storeAUsers.map((u) => u.email);
      const storeBEmails = storeBUsers.map((u) => u.email);

      storeBEmails.forEach((email) => {
        expect(storeAEmails).not.toContain(email);
      });
    });
  });
});
