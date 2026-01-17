import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rail } from '../Rail';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock the UI store
const mockToggleSidebarCollapsed = vi.fn();
vi.mock('@/stores/ui-store', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: false,
    toggleSidebarCollapsed: mockToggleSidebarCollapsed,
  })),
}));

describe('Rail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation icons as links or buttons', () => {
    render(<Rail />);

    // Check for main navigation items via href (Settings is a button with popover)
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4); // dashboard, products, orders, customers

    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/products');
    expect(hrefs).toContain('/orders');
    expect(hrefs).toContain('/customers');

    // Settings is a button that opens a popover with child navigation
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('shows active state on current route', () => {
    render(<Rail />);

    // Dashboard link should have active styles (border-l-2 and text-primary)
    const links = screen.getAllByRole('link');
    const dashboardLink = links.find(
      (link) => link.getAttribute('href') === '/dashboard'
    );

    expect(dashboardLink).toHaveClass('border-l-2');
    expect(dashboardLink).toHaveClass('text-primary');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders expand toggle button (Rail always shows expand since it is only visible when collapsed)', () => {
    render(<Rail />);

    const toggleButton = screen.getByRole('button', {
      name: /expand sidebar/i,
    });
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls toggleSidebarCollapsed when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<Rail />);

    const toggleButton = screen.getByRole('button', {
      name: /expand sidebar/i,
    });
    await user.click(toggleButton);

    expect(mockToggleSidebarCollapsed).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(<Rail className="test-class" />);
    expect(container.querySelector('aside')).toHaveClass('test-class');
  });

  it('is hidden on mobile (lg:flex)', () => {
    const { container } = render(<Rail />);
    const rail = container.querySelector('aside');
    expect(rail).toHaveClass('hidden');
    expect(rail).toHaveClass('lg:flex');
  });
});
