import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@database/prisma.service';

/**
 * Auth E2E Tests
 *
 * These tests require a running PostgreSQL database.
 * Make sure DATABASE_URL is set correctly before running.
 *
 * Run with: pnpm test:e2e
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test user data
  const testEmail = 'e2e-test@trafi.dev';
  const testPassword = 'TestPassword123!';
  const testStoreId = 'store_e2e_test';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test store and user
    await prisma.store.upsert({
      where: { slug: 'e2e-test-store' },
      update: {},
      create: {
        id: testStoreId,
        name: 'E2E Test Store',
        slug: 'e2e-test-store',
      },
    });

    const passwordHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.upsert({
      where: { email: testEmail },
      update: { passwordHash, status: 'ACTIVE' },
      create: {
        email: testEmail,
        name: 'E2E Test User',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        storeId: testStoreId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.user.delete({ where: { email: testEmail } });
      await prisma.store.delete({ where: { slug: 'e2e-test-store' } });
    } catch {
      // Ignore if already deleted
    }
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return tokens on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@trafi.dev',
          password: testPassword,
        })
        .expect(401);

      // Should not reveal if email exists
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for missing email', async () => {
      // Note: LocalAuthGuard returns 401 for any auth failure before Zod validation
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testPassword,
        })
        .expect(401);
    });

    it('should return 401 for missing password', async () => {
      // Note: LocalAuthGuard returns 401 for any auth failure before Zod validation
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
        })
        .expect(401);
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      const inactiveEmail = 'inactive-e2e@trafi.dev';
      const passwordHash = await bcrypt.hash(testPassword, 10);

      await prisma.user.upsert({
        where: { email: inactiveEmail },
        update: { status: 'INACTIVE' },
        create: {
          email: inactiveEmail,
          name: 'Inactive User',
          passwordHash,
          role: 'ADMIN',
          status: 'INACTIVE',
          storeId: testStoreId,
        },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: inactiveEmail,
          password: testPassword,
        })
        .expect(401);

      // Cleanup
      await prisma.user.delete({ where: { email: inactiveEmail } });
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get fresh tokens
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      refreshToken = response.body.refreshToken;
    });

    it('should return new tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      // Verify token structure is valid
      expect(response.body.accessToken).toMatch(/^eyJ/); // JWT starts with eyJ
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        })
        .expect(401);
    });

    it('should return new access token on refresh', async () => {
      // Get first refresh
      const response1 = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Wait a moment to ensure different token generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use new refresh token from first response
      const response2 = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: response1.body.refreshToken })
        .expect(200);

      // Tokens should be valid
      expect(response2.body.accessToken).toMatch(/^eyJ/);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Refresh token should be invalidated after logout
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should return 401 with invalid access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      accessToken = response.body.accessToken;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('permissions');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });
  });

  describe('Protected routes access', () => {
    it('should allow access to protected routes with valid token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      const accessToken = loginResponse.body.accessToken;

      // Test accessing a protected endpoint
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should deny access to protected routes without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should deny access with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });
  });
});
