import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VariantsSection } from '../VariantsSection';
import type { VariantResponse } from '@trafi/validators';

// Mock the hooks
const mockVariants: VariantResponse[] = [
  {
    id: 'var_test1',
    productId: 'prod_test123',
    sku: 'TES-SM-BL-A1B2',
    options: [
      { name: 'Size', value: 'Small' },
      { name: 'Color', value: 'Blue' },
    ],
    priceInCents: 2999,
    compareAtPriceInCents: null,
    costPriceInCents: null,
    taxRuleId: null,
    quantity: 10,
    trackInventory: true,
    weight: null,
    weightUnit: 'g',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'var_test2',
    productId: 'prod_test123',
    sku: 'TES-MD-RD-C3D4',
    options: [
      { name: 'Size', value: 'Medium' },
      { name: 'Color', value: 'Red' },
    ],
    priceInCents: 3499,
    compareAtPriceInCents: 3999,
    costPriceInCents: 1500,
    taxRuleId: 'tax_123',
    quantity: 0,
    trackInventory: true,
    weight: 200,
    weightUnit: 'g',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock useVariants hook
vi.mock('../../_hooks', () => ({
  useVariants: vi.fn(() => ({
    data: mockVariants,
    isLoading: false,
    error: null,
  })),
  useCreateVariant: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useBulkCreateVariants: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateVariant: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteVariant: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock usePermissions hook
vi.mock('@/lib/hooks', () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
    permissions: ['products:read', 'products:update'],
  })),
}));

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('VariantsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the variants section header', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText('VARIANTES')).toBeInTheDocument();
  });

  it('should display variant count', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText('2 variantes')).toBeInTheDocument();
  });

  it('should render variant options as chips', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    // Check for option chips
    expect(screen.getByText('Size: Small')).toBeInTheDocument();
    expect(screen.getByText('Color: Blue')).toBeInTheDocument();
    expect(screen.getByText('Size: Medium')).toBeInTheDocument();
    expect(screen.getByText('Color: Red')).toBeInTheDocument();
  });

  it('should display SKUs', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText('TES-SM-BL-A1B2')).toBeInTheDocument();
    expect(screen.getByText('TES-MD-RD-C3D4')).toBeInTheDocument();
  });

  it('should show out-of-stock indicator for zero quantity', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText('RUPTURE')).toBeInTheDocument();
  });

  it('should render action buttons when user has edit permission', () => {
    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /generer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', async () => {
    const { useVariants } = await import('../../_hooks');
    vi.mocked(useVariants).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    // Should show skeleton elements (multiple skeleton elements present)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show error message on error', async () => {
    const { useVariants } = await import('../../_hooks');
    vi.mocked(useVariants).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load variants'),
    } as any);

    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText(/ERREUR/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load variants/)).toBeInTheDocument();
  });
});

describe('VariantsSection - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no variants exist', async () => {
    const { useVariants } = await import('../../_hooks');
    vi.mocked(useVariants).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<VariantsSection productId="prod_test123" />, { wrapper: createWrapper() });

    expect(screen.getByText('AUCUNE VARIANTE')).toBeInTheDocument();
  });
});
