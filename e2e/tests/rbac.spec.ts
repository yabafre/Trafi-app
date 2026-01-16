import { test, expect } from '@playwright/test';

/**
 * API base URL - configurable via environment variable for CI/CD flexibility.
 * Default matches the API default port (4000) from apps/api
 */
const API_BASE_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Helper to login and get access token
 */
async function loginAndGetToken(
  request: any,
  email: string,
  password: string
): Promise<string | null> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    return null;
  }

  const data = await response.json();
  return data.accessToken;
}

/**
 * E2E tests for RBAC (Role-Based Access Control).
 * Tests permission-based and role-based access control on API endpoints.
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */
test.describe('RBAC - Role-Based Access Control', () => {
  // Test user credentials (from seed data)
  const testOwner = {
    email: 'admin@trafi.io',
    password: 'Admin123!',
    role: 'OWNER',
  };

  test.describe('Permission-Protected Endpoints', () => {
    test('should return 401 for products:read endpoint without token', async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/auth/test/products-read`
      );

      expect(response.status()).toBe(401);
    });

    test('should return 401 for admin-only endpoint without token', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/auth/test/admin-only`);

      expect(response.status()).toBe(401);
    });

    test('should return 401 for permission endpoint with invalid token', async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/auth/test/products-read`,
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );

      expect(response.status()).toBe(401);
    });
  });

  test.describe('OWNER Role Access', () => {
    test.skip('should allow OWNER to access products:read endpoint', async ({
      request,
    }) => {
      // Skip until database is seeded with test users
      const token = await loginAndGetToken(
        request,
        testOwner.email,
        testOwner.password
      );
      expect(token).not.toBeNull();

      const response = await request.get(
        `${API_BASE_URL}/auth/test/products-read`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({
        message: 'Access granted',
        permission: 'products:read',
      });
    });

    test.skip('should allow OWNER to access admin-only endpoint', async ({
      request,
    }) => {
      // Skip until database is seeded with test users
      const token = await loginAndGetToken(
        request,
        testOwner.email,
        testOwner.password
      );
      expect(token).not.toBeNull();

      const response = await request.get(
        `${API_BASE_URL}/auth/test/admin-only`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({
        message: 'Access granted',
        requiredRoles: ['OWNER', 'ADMIN'],
      });
    });
  });

  test.describe('403 Forbidden Response Format', () => {
    test.skip('should return structured 403 error with required permissions', async ({
      request,
    }) => {
      // This test requires a VIEWER user to be seeded
      // A VIEWER trying to access products:delete should get 403

      // For now, this test documents the expected response format:
      // {
      //   "code": "FORBIDDEN",
      //   "message": "Insufficient permissions",
      //   "requiredPermissions": ["products:delete"]
      // }

      // Skip until we have multiple test users with different roles
      expect(true).toBe(true);
    });

    test.skip('should return structured 403 error with required roles', async ({
      request,
    }) => {
      // This test requires a VIEWER user to be seeded
      // A VIEWER trying to access OWNER/ADMIN endpoint should get 403

      // For now, this test documents the expected response format:
      // {
      //   "code": "FORBIDDEN",
      //   "message": "Insufficient role privileges",
      //   "requiredRoles": ["OWNER", "ADMIN"],
      //   "userRole": "VIEWER"
      // }

      // Skip until we have multiple test users with different roles
      expect(true).toBe(true);
    });
  });
});

test.describe('API RBAC Error Handling', () => {
  test('should return proper error structure for 401 Unauthorized', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE_URL}/auth/test/products-read`
    );

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('statusCode', 401);
  });
});
