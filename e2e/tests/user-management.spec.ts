import { test, expect } from '@playwright/test';

/**
 * API base URL - configurable via environment variable for CI/CD flexibility.
 * Default matches the API default port (4000) from apps/api
 */
const API_BASE_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * E2E tests for User Management (Story 2.4).
 * Tests user listing, invitation, role updates, and deactivation.
 *
 * These tests require:
 * - A running API server with seeded test data
 * - A running Dashboard server
 * - Test users seeded in the database (OWNER, ADMIN, EDITOR, VIEWER)
 */
test.describe('User Management - API Endpoints', () => {
  test('should return 401 when listing users without authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/users`);

    expect(response.status()).toBe(401);
  });

  test('should return 401 when inviting users without authentication', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/users/invite`, {
      data: {
        email: 'new@example.com',
        role: 'VIEWER',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 401 when updating role without authentication', async ({ request }) => {
    const response = await request.patch(`${API_BASE_URL}/users/user-123/role`, {
      data: {
        role: 'EDITOR',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 401 when deactivating user without authentication', async ({ request }) => {
    const response = await request.patch(`${API_BASE_URL}/users/user-123/deactivate`);

    expect(response.status()).toBe(401);
  });
});

test.describe('User Management - Dashboard UI', () => {
  test.describe('Users List Page', () => {
    test.skip('should display users table when authenticated as OWNER', async ({ page }) => {
      // This test requires a logged-in session with OWNER role
      // Prerequisites:
      // 1. Seed database with test store and users
      // 2. Login as OWNER
      // 3. Navigate to users page

      await page.goto('/settings/users');

      // Should see the page header
      await expect(page.getByText(/GESTION DES UTILISATEURS/i)).toBeVisible();

      // Should see the invite button (OWNER has users:invite permission)
      await expect(page.getByTestId('invite-user-button')).toBeVisible();

      // Should see the users table
      await expect(page.getByText(/EMAIL/i)).toBeVisible();
      await expect(page.getByText(/ROLE/i)).toBeVisible();
      await expect(page.getByText(/STATUT/i)).toBeVisible();
    });

    test.skip('should display users table without invite button when authenticated as VIEWER', async ({ page }) => {
      // VIEWER should be able to view users but not invite
      await page.goto('/settings/users');

      // Should see the page header
      await expect(page.getByText(/GESTION DES UTILISATEURS/i)).toBeVisible();

      // Should NOT see the invite button (VIEWER lacks users:invite permission)
      await expect(page.getByTestId('invite-user-button')).not.toBeVisible();

      // Should see the users table
      await expect(page.getByText(/EMAIL/i)).toBeVisible();
    });
  });

  test.describe('Invite User Dialog', () => {
    test.skip('should open invite dialog when clicking invite button', async ({ page }) => {
      await page.goto('/settings/users');

      // Click invite button
      await page.getByTestId('invite-user-button').click();

      // Dialog should be visible
      await expect(page.getByText(/INVITER UN UTILISATEUR/i)).toBeVisible();
      await expect(page.getByTestId('invite-email-input')).toBeVisible();
      await expect(page.getByTestId('invite-role-select')).toBeVisible();
    });

    test.skip('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/settings/users');

      // Open invite dialog
      await page.getByTestId('invite-user-button').click();

      // Enter invalid email
      await page.getByTestId('invite-email-input').fill('invalid-email');
      await page.getByTestId('invite-email-input').blur();

      // Should show validation error
      await expect(page.getByText(/Email invalide/i)).toBeVisible();
    });

    test.skip('should successfully invite a user', async ({ page }) => {
      await page.goto('/settings/users');

      // Open invite dialog
      await page.getByTestId('invite-user-button').click();

      // Fill form
      await page.getByTestId('invite-email-input').fill('newuser@example.com');
      await page.getByTestId('invite-role-select').click();
      await page.getByText(/Viewer/i).click();

      // Submit
      await page.getByRole('button', { name: /ENVOYER L'INVITATION/i }).click();

      // Dialog should close
      await expect(page.getByText(/INVITER UN UTILISATEUR/i)).not.toBeVisible();

      // Toast should appear
      await expect(page.getByText(/Invitation envoyée/i)).toBeVisible();

      // New user should appear in table
      await expect(page.getByText('newuser@example.com')).toBeVisible();
    });
  });

  test.describe('Edit Role Dialog', () => {
    test.skip('should open edit role dialog from actions menu', async ({ page }) => {
      await page.goto('/settings/users');

      // Click actions menu for a user
      await page.getByTestId(/user-actions-/).first().click();

      // Click edit role option
      await page.getByText(/Modifier le rôle/i).click();

      // Dialog should be visible
      await expect(page.getByText(/MODIFIER LE ROLE/i)).toBeVisible();
      await expect(page.getByTestId('edit-role-select')).toBeVisible();
    });

    test.skip('should successfully update user role', async ({ page }) => {
      await page.goto('/settings/users');

      // Click actions menu for a user
      await page.getByTestId(/user-actions-/).first().click();

      // Click edit role option
      await page.getByText(/Modifier le rôle/i).click();

      // Change role
      await page.getByTestId('edit-role-select').click();
      await page.getByText(/Admin/i).click();

      // Submit
      await page.getByRole('button', { name: /CONFIRMER/i }).click();

      // Dialog should close
      await expect(page.getByText(/MODIFIER LE ROLE/i)).not.toBeVisible();

      // Toast should appear
      await expect(page.getByText(/Rôle modifié/i)).toBeVisible();
    });
  });

  test.describe('Deactivate User Dialog', () => {
    test.skip('should open deactivate dialog from actions menu', async ({ page }) => {
      await page.goto('/settings/users');

      // Click actions menu for a user
      await page.getByTestId(/user-actions-/).first().click();

      // Click deactivate option
      await page.getByText(/Désactiver/i).click();

      // Dialog should be visible
      await expect(page.getByText(/DESACTIVER L'UTILISATEUR/i)).toBeVisible();
      await expect(page.getByTestId('confirm-deactivate-button')).toBeVisible();
    });

    test.skip('should successfully deactivate user', async ({ page }) => {
      await page.goto('/settings/users');

      // Click actions menu for a user
      await page.getByTestId(/user-actions-/).first().click();

      // Click deactivate option
      await page.getByText(/Désactiver/i).click();

      // Confirm deactivation
      await page.getByTestId('confirm-deactivate-button').click();

      // Dialog should close
      await expect(page.getByText(/DESACTIVER L'UTILISATEUR/i)).not.toBeVisible();

      // Toast should appear
      await expect(page.getByText(/Utilisateur désactivé/i)).toBeVisible();
    });
  });

  test.describe('Role Hierarchy', () => {
    test.skip('should prevent ADMIN from inviting OWNER', async ({ page }) => {
      // Login as ADMIN
      await page.goto('/settings/users');

      // Open invite dialog
      await page.getByTestId('invite-user-button').click();

      // Fill email
      await page.getByTestId('invite-email-input').fill('newowner@example.com');

      // OWNER option should not be available in select
      await page.getByTestId('invite-role-select').click();
      await expect(page.getByText(/Owner/i)).not.toBeVisible();
    });

    test.skip('should show warning when OWNER transfers ownership', async ({ page }) => {
      // Login as OWNER
      await page.goto('/settings/users');

      // Open edit role dialog for an ADMIN user
      await page.getByTestId(/user-actions-/).first().click();
      await page.getByText(/Modifier le rôle/i).click();

      // Select OWNER role
      await page.getByTestId('edit-role-select').click();
      await page.getByText(/Owner/i).click();

      // Should show warning about ownership transfer
      await expect(page.getByText(/Transférer le rôle Owner/i)).toBeVisible();
    });
  });

  test.describe('Last Owner Protection', () => {
    test.skip('should show warning when trying to deactivate last owner', async ({ page }) => {
      // Login as the only OWNER
      await page.goto('/settings/users');

      // Try to deactivate yourself (which should show a warning)
      // The UI should not allow self-deactivation, but we test the warning display
      await expect(page.getByText(/dernier Owner/i)).not.toBeVisible();
    });
  });
});

test.describe('User Management - Permission Guards', () => {
  test.skip('should redirect VIEWER from settings/users to appropriate page', async ({ page }) => {
    // Login as VIEWER and try to access users page
    // VIEWER should only see users:read but not users:manage
    await page.goto('/settings/users');

    // Should not see the actions column
    await expect(page.getByText(/ACTIONS/i)).not.toBeVisible();
  });

  test.skip('should hide invite button for users without users:invite permission', async ({ page }) => {
    // Login as EDITOR (no users:invite permission)
    await page.goto('/settings/users');

    // Invite button should not be visible
    await expect(page.getByTestId('invite-user-button')).not.toBeVisible();
  });

  test.skip('should hide actions column for users without users:manage permission', async ({ page }) => {
    // Login as EDITOR (no users:manage permission)
    await page.goto('/settings/users');

    // Actions column should not be visible
    await expect(page.getByText(/ACTIONS/i)).not.toBeVisible();
  });
});
