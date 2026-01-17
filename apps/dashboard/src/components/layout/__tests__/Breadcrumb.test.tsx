import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb, useBreadcrumb } from '../Breadcrumb';
import { renderHook } from '@testing-library/react';

// Mock Next.js navigation
const mockPathname = vi.fn(() => '/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('Breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  it('renders path segments correctly', () => {
    mockPathname.mockReturnValue('/settings/store');
    render(<Breadcrumb />);

    // Dashboard is not shown for non-dashboard paths, only settings and store
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
  });

  it('maps slugs to human-readable labels', () => {
    mockPathname.mockReturnValue('/settings/api-keys');
    render(<Breadcrumb />);

    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });

  it('last segment is not a link', () => {
    mockPathname.mockReturnValue('/settings/store');
    render(<Breadcrumb />);

    // 'Store' should be a span, not a link
    const storeElement = screen.getByText('Store');
    expect(storeElement.tagName).toBe('SPAN');
    expect(storeElement).toHaveAttribute('aria-current', 'page');
  });

  it('earlier segments are clickable links', () => {
    mockPathname.mockReturnValue('/settings/store');
    render(<Breadcrumb />);

    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('handles root path', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);

    // Only Dashboard should be shown, and it's the last segment
    const dashboardElement = screen.getByText('Dashboard');
    expect(dashboardElement.tagName).toBe('SPAN');
    expect(dashboardElement).toHaveAttribute('aria-current', 'page');
  });

  it('displays store name as root when provided', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<Breadcrumb storeName="Maison Cleo" />);

    expect(screen.getByText('Maison Cleo')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<Breadcrumb />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Breadcrumb className="custom-breadcrumb" />);
    expect(container.querySelector('nav')).toHaveClass('custom-breadcrumb');
  });

  it('renders separators between segments', () => {
    mockPathname.mockReturnValue('/settings/store');
    const { container } = render(<Breadcrumb />);

    // Check for separator icons (ChevronRight)
    const separators = container.querySelectorAll('svg');
    // Should have 1 separator for 2 segments (Settings > Store)
    expect(separators.length).toBe(1);
  });
});

describe('useBreadcrumb hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct segments for nested path', () => {
    mockPathname.mockReturnValue('/settings/api-keys');

    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toEqual({
      label: 'Settings',
      href: '/settings',
      isLast: false,
    });
    expect(result.current[1]).toEqual({
      label: 'API Keys',
      href: '/settings/api-keys',
      isLast: true,
    });
  });

  it('returns single segment for root dashboard path', () => {
    mockPathname.mockReturnValue('/dashboard');

    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      label: 'Dashboard',
      href: '/dashboard',
      isLast: true,
    });
  });

  it('uses store name as root label when provided', () => {
    mockPathname.mockReturnValue('/dashboard');

    const { result } = renderHook(() => useBreadcrumb('Test Store'));

    expect(result.current[0].label).toBe('Test Store');
  });
});
