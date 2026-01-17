import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@database/prisma.service';

/**
 * API Keys E2E Tests
 *
 * These tests require a running PostgreSQL database.
 * Make sure DATABASE_URL is set correctly before running.
 *
 * Run with: pnpm test:e2e
 */
describe('API Keys (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test user data
  const testEmail = 'apikeys-e2e@trafi.dev';
  const testPassword = 'TestPassword123!';
  const testStoreId = 'store_apikeys_e2e';
  let testUserId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test store
    await prisma.store.upsert({
      where: { slug: 'apikeys-e2e-store' },
      update: {},
      create: {
        id: testStoreId,
        name: 'API Keys E2E Test Store',
        slug: 'apikeys-e2e-store',
      },
    });

    // Create test user with ADMIN role (required for api-keys:manage permission)
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: { passwordHash, status: 'ACTIVE' },
      create: {
        email: testEmail,
        name: 'API Keys E2E User',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        storeId: testStoreId,
      },
    });
    testUserId = user.id;

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      // Delete all API keys created during tests
      await prisma.apiKey.deleteMany({ where: { storeId: testStoreId } });
      await prisma.user.delete({ where: { email: testEmail } });
      await prisma.store.delete({ where: { slug: 'apikeys-e2e-store' } });
    } catch {
      // Ignore if already deleted
    }
    await app.close();
  });

  describe('POST /api-keys', () => {
    it('should create a new API key', async () => {
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test API Key',
          scopes: ['products:read', 'orders:read'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test API Key');
      expect(response.body).toHaveProperty('key');
      expect(response.body.key).toMatch(/^trafi_sk_[a-f0-9]{64}$/);
      expect(response.body).toHaveProperty('keyPrefix');
      expect(response.body).toHaveProperty('lastFourChars');
      expect(response.body).toHaveProperty('scopes');
      expect(response.body.scopes).toContain('products:read');
      expect(response.body.scopes).toContain('orders:read');
    });

    it('should create API key with expiration', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Expiring API Key',
          scopes: ['products:read'],
          expiresAt: futureDate.toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('expiresAt');
      expect(new Date(response.body.expiresAt).getTime()).toBeCloseTo(
        futureDate.getTime(),
        -4 // Within 10 seconds
      );
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api-keys')
        .send({
          name: 'Test API Key',
          scopes: ['products:read'],
        })
        .expect(401);
    });

    it('should return 400 with missing name', async () => {
      await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          scopes: ['products:read'],
        })
        .expect(400);
    });

    it('should return 400 with empty scopes', async () => {
      await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Invalid Key',
          scopes: [],
        })
        .expect(400);
    });
  });

  describe('GET /api-keys', () => {
    it('should list API keys', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should not expose the plain key in list response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      for (const apiKey of response.body.data) {
        expect(apiKey).not.toHaveProperty('key');
        expect(apiKey).not.toHaveProperty('keyHash');
        expect(apiKey).toHaveProperty('keyPrefix');
        expect(apiKey).toHaveProperty('lastFourChars');
      }
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api-keys')
        .expect(401);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-keys?page=1&limit=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta.limit).toBe(1);
    });
  });

  describe('GET /api-keys/:id', () => {
    let testKeyId: string;

    beforeAll(async () => {
      // Create a key to fetch
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Fetch Test Key',
          scopes: ['products:read'],
        });

      testKeyId = response.body.id;
    });

    it('should return a single API key', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-keys/${testKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testKeyId);
      expect(response.body).toHaveProperty('name', 'Fetch Test Key');
      expect(response.body).not.toHaveProperty('key');
      expect(response.body).not.toHaveProperty('keyHash');
    });

    it('should return 404 for nonexistent key', async () => {
      await request(app.getHttpServer())
        .get('/api-keys/nonexistent-key-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api-keys/${testKeyId}`)
        .expect(401);
    });
  });

  describe('DELETE /api-keys/:id (revoke)', () => {
    let revokeKeyId: string;

    beforeEach(async () => {
      // Create a key to revoke
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Revoke Test Key',
          scopes: ['products:read'],
        });

      revokeKeyId = response.body.id;
    });

    it('should revoke an API key', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api-keys/${revokeKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', revokeKeyId);
      expect(response.body).toHaveProperty('revokedAt');
      expect(response.body.revokedAt).not.toBeNull();
    });

    it('should return the same key when revoking already revoked', async () => {
      // First revoke
      await request(app.getHttpServer())
        .delete(`/api-keys/${revokeKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Second revoke should still succeed
      const response = await request(app.getHttpServer())
        .delete(`/api-keys/${revokeKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.revokedAt).not.toBeNull();
    });

    it('should return 404 for nonexistent key', async () => {
      await request(app.getHttpServer())
        .delete('/api-keys/nonexistent-key-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api-keys/${revokeKeyId}`)
        .expect(401);
    });
  });

  describe('API Key validation', () => {
    let validKey: string;
    let revokedKey: string;
    let revokedKeyId: string;

    beforeAll(async () => {
      // Create a valid key
      const validResponse = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Validation Test Key',
          scopes: ['products:read'],
        });
      validKey = validResponse.body.key;

      // Create and revoke a key
      const revokedResponse = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Revoked Validation Key',
          scopes: ['products:read'],
        });
      revokedKey = revokedResponse.body.key;
      revokedKeyId = revokedResponse.body.id;

      // Revoke the key
      await request(app.getHttpServer())
        .delete(`/api-keys/${revokedKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should not be able to list keys with API key (requires JWT)', async () => {
      // API keys are for SDK access, not dashboard access
      await request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${validKey}`)
        .expect(401);
    });
  });

  describe('Store isolation', () => {
    let otherStoreAccessToken: string;
    let testKeyId: string;

    beforeAll(async () => {
      // Create another store and user
      const otherStoreId = 'store_other_e2e';
      const otherEmail = 'other-e2e@trafi.dev';
      const passwordHash = await bcrypt.hash(testPassword, 10);

      await prisma.store.upsert({
        where: { slug: 'other-e2e-store' },
        update: {},
        create: {
          id: otherStoreId,
          name: 'Other E2E Store',
          slug: 'other-e2e-store',
        },
      });

      await prisma.user.upsert({
        where: { email: otherEmail },
        update: { passwordHash, status: 'ACTIVE' },
        create: {
          email: otherEmail,
          name: 'Other E2E User',
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          storeId: otherStoreId,
        },
      });

      // Login as other user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: otherEmail,
          password: testPassword,
        });

      otherStoreAccessToken = loginResponse.body.accessToken;

      // Create a key in the original store
      const keyResponse = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Store Isolation Test Key',
          scopes: ['products:read'],
        });

      testKeyId = keyResponse.body.id;
    });

    afterAll(async () => {
      try {
        await prisma.apiKey.deleteMany({ where: { storeId: 'store_other_e2e' } });
        await prisma.user.delete({ where: { email: 'other-e2e@trafi.dev' } });
        await prisma.store.delete({ where: { slug: 'other-e2e-store' } });
      } catch {
        // Ignore
      }
    });

    it('should not list keys from other stores', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${otherStoreAccessToken}`)
        .expect(200);

      // Should not see the key from the original store
      const keyIds = response.body.data.map((k: { id: string }) => k.id);
      expect(keyIds).not.toContain(testKeyId);
    });

    it('should not fetch keys from other stores', async () => {
      await request(app.getHttpServer())
        .get(`/api-keys/${testKeyId}`)
        .set('Authorization', `Bearer ${otherStoreAccessToken}`)
        .expect(404);
    });

    it('should not revoke keys from other stores', async () => {
      await request(app.getHttpServer())
        .delete(`/api-keys/${testKeyId}`)
        .set('Authorization', `Bearer ${otherStoreAccessToken}`)
        .expect(404);
    });
  });
});
