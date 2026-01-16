import { test, expect } from '@playwright/test';

/**
 * API base URL - configurable via environment variable for CI/CD flexibility.
 * Default matches the API default port (4000) from apps/api
 */
const API_BASE_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * E2E tests for Dashboard Authentication.
 * Tests login flow, session management, and route protection.
 */
test.describe('Dashboard Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Check page title
      await expect(page).toHaveTitle(/Login.*Trafi/i);

      // Check form elements are present
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for validation errors
      await expect(page.getByText(/email.*required/i)).toBeVisible();
      await expect(page.getByText(/password.*required/i)).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login');

      // Fill with invalid email
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for validation error
      await expect(page.getByText(/invalid.*email/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill with valid format but wrong credentials
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for error message
      await expect(page.getByText(/invalid.*credentials|unauthorized|login failed/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
      // Try to access dashboard directly
      await page.goto('/');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from protected routes to login', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/settings');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow access to login page when unauthenticated', async ({ page }) => {
      await page.goto('/login');

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test.skip('should login successfully with valid credentials', async ({ page }) => {
      // This test is skipped until we have a proper test user seeded in the database
      // or a mock authentication endpoint

      await page.goto('/login');

      // Fill with valid credentials (from seeded test data)
      await page.getByLabel(/email/i).fill('admin@trafi.io');
      await page.getByLabel(/password/i).fill('admin123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should be redirected to dashboard
      await expect(page).toHaveURL('/');

      // Should see user email in header
      await expect(page.getByText('admin@trafi.io')).toBeVisible();
    });

    test.skip('should logout successfully', async ({ page }) => {
      // This test is skipped until we have a proper test user and logout button

      // First login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('admin@trafi.io');
      await page.getByLabel(/password/i).fill('admin123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for dashboard
      await expect(page).toHaveURL('/');

      // Click logout
      await page.getByRole('button', { name: /logout|sign out/i }).click();

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('API Authentication Endpoints', () => {
  test('should return 401 for protected endpoints without token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);

    expect(response.status()).toBe(401);
  });

  test('should return 401 for invalid token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 401 for login with invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 400 for login with invalid email format', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'invalid-email',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for login with missing password', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(400);
  });
});
