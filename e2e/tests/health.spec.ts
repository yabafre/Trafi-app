import { test, expect } from '@playwright/test';

/**
 * API base URL - configurable via environment variable for CI/CD flexibility.
 */
const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3001';

/**
 * E2E tests for API health endpoint.
 * Verifies that the API is running and responding correctly.
 */
test.describe('API Health Check', () => {
  test('should return healthy status from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('info');
    expect(body).toHaveProperty('details');
  });

  test('should include memory health indicators', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.info).toHaveProperty('memory_heap');
    expect(body.info).toHaveProperty('memory_rss');
  });
});

test.describe('Dashboard', () => {
  test('should load the dashboard homepage', async ({ page }) => {
    await page.goto('/');

    // The page should load without errors
    await expect(page).toHaveURL('/');

    // Basic check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have correct title', async ({ page }) => {
    await page.goto('/');

    // Check that the page has a title (will be set by Next.js)
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
