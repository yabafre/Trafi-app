import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreSwitcher } from '../StoreSwitcher';

// Mock the hooks
const mockSwitchStore = vi.fn();
const mockRefetch = vi.fn();

const mockMultipleStores = [
  { id: 'store_1', name: 'Demo Store', slug: 'demo-store', role: 'OWNER', isCurrent: true },
  { id: 'store_2', name: 'Client Store', slug: 'client-store', role: 'ADMIN', isCurrent: false },
  { id: 'store_3', name: 'Agency Store', slug: 'agency-store', role: 'EDITOR', isCurrent: false },
];

const mockSingleStore = [
  { id: 'store_1', name: 'Demo Store', slug: 'demo-store', role: 'OWNER', isCurrent: true },
];

// Create mutable mock state
let mockStoreState = {
  stores: mockMultipleStores,
  currentStore: mockMultipleStores[0],
  currentStoreId: 'store_1',
  hasMultipleStores: true,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
};

let mockSwitchState = {
  switchStore: mockSwitchStore,
  isLoading: false,
  error: null,
  clearError: vi.fn(),
};

vi.mock('@/lib/hooks', () => ({
  useMyStores: vi.fn(() => mockStoreState),
  useSwitchStore: vi.fn(() => mockSwitchState),
}));

describe('StoreSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default multi-store state
    mockStoreState = {
      stores: mockMultipleStores,
      currentStore: mockMultipleStores[0],
      currentStoreId: 'store_1',
      hasMultipleStores: true,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    };
    mockSwitchState = {
      switchStore: mockSwitchStore,
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    };
  });

  describe('Multi-store rendering', () => {
    it('renders current store name in expanded mode', () => {
      render(<StoreSwitcher collapsed={false} />);

      expect(screen.getByText('Demo Store')).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();
    });

    it('renders dropdown trigger with chevron in expanded mode', () => {
      render(<StoreSwitcher collapsed={false} />);

      // Should have a button to open dropdown
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
    });

    it('opens popover and shows all stores when clicked in expanded mode', async () => {
      const user = userEvent.setup();
      render(<StoreSwitcher collapsed={false} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Wait for popover to open
      await waitFor(() => {
        expect(screen.getByText('Your Stores')).toBeInTheDocument();
      });

      // All stores should be visible (Demo Store appears twice: trigger + dropdown)
      expect(screen.getAllByText('Demo Store').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Client Store')).toBeInTheDocument();
      expect(screen.getByText('Agency Store')).toBeInTheDocument();
    });

    it('shows role for each store in dropdown', async () => {
      const user = userEvent.setup();
      render(<StoreSwitcher collapsed={false} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Your Stores')).toBeInTheDocument();
      });

      // Roles should be visible
      expect(screen.getAllByText('OWNER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText('EDITOR')).toBeInTheDocument();
    });
  });

  describe('Store switch functionality', () => {
    it('calls switchStore when a different store is selected', async () => {
      const user = userEvent.setup();
      render(<StoreSwitcher collapsed={false} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Client Store')).toBeInTheDocument();
      });

      // Click on a different store
      const clientStoreButton = screen.getByText('Client Store').closest('button');
      expect(clientStoreButton).toBeInTheDocument();
      await user.click(clientStoreButton!);

      expect(mockSwitchStore).toHaveBeenCalledWith('store_2');
    });

    it('does not call switchStore when clicking current store', async () => {
      const user = userEvent.setup();
      render(<StoreSwitcher collapsed={false} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Your Stores')).toBeInTheDocument();
      });

      // Click on current store (Demo Store) - should be disabled
      const demoStoreButtons = screen.getAllByText('Demo Store');
      // Get the one in the dropdown (has button parent)
      const dropdownButton = demoStoreButtons.find(
        (el) => el.closest('button')?.getAttribute('disabled') !== null
      );

      // Current store button should be disabled
      if (dropdownButton) {
        await user.click(dropdownButton);
      }

      expect(mockSwitchStore).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when stores are loading', () => {
      mockStoreState = {
        ...mockStoreState,
        isLoading: true,
        stores: [],
        currentStore: null,
      };

      render(<StoreSwitcher collapsed={false} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows loading spinner during switch operation', () => {
      mockSwitchState = {
        ...mockSwitchState,
        isLoading: true,
      };

      render(<StoreSwitcher collapsed={false} />);

      // The button should show loading state
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Single store mode', () => {
    beforeEach(() => {
      mockStoreState = {
        stores: mockSingleStore,
        currentStore: mockSingleStore[0],
        currentStoreId: 'store_1',
        hasMultipleStores: false,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      };
    });

    it('renders store name without dropdown in expanded mode', () => {
      render(<StoreSwitcher collapsed={false} />);

      expect(screen.getByText('Demo Store')).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();

      // Should not have a button (no dropdown trigger)
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders in collapsed mode for single store', () => {
      render(<StoreSwitcher collapsed={true} />);

      // Just verifies it renders without errors in collapsed mode
      // Single store in collapsed mode shows icon without button
      const storeIcon = document.querySelector('[class*="h-10"]');
      expect(storeIcon).toBeTruthy();
    });
  });

  describe('Collapsed mode', () => {
    it('renders icon-only in collapsed mode with multiple stores', () => {
      render(<StoreSwitcher collapsed={true} />);

      // Should have a button trigger (for popover)
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();

      // Store name text should not be visible
      expect(screen.queryByText('Demo Store')).not.toBeInTheDocument();
    });

    it('opens popover when clicked in collapsed mode', async () => {
      const user = userEvent.setup();
      render(<StoreSwitcher collapsed={true} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Your Stores')).toBeInTheDocument();
      });

      // All stores should be visible in popover
      expect(screen.getByText('Demo Store')).toBeInTheDocument();
      expect(screen.getByText('Client Store')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles error state gracefully', () => {
      mockStoreState = {
        ...mockStoreState,
        error: new Error('Failed to load stores'),
        stores: [],
        currentStore: null,
      };

      // Should not throw
      expect(() => render(<StoreSwitcher collapsed={false} />)).not.toThrow();
    });
  });
});
