import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rail } from '../Rail';

// Mock Next.js navigation - use '/' since that's the Dashboard href
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
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

    // Check for direct link items (items without children)
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3); // dashboard, orders, customers

    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/'); // Dashboard
    expect(hrefs).toContain('/orders');
    expect(hrefs).toContain('/customers');

    // Products, Marketing, and Settings have children, so they're buttons with popovers
    const productsButton = screen.getByRole('button', { name: /products/i });
    expect(productsButton).toBeInTheDocument();
    const marketingButton = screen.getByRole('button', { name: /marketing/i });
    expect(marketingButton).toBeInTheDocument();
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('shows active state on current route', () => {
    render(<Rail />);

    // Dashboard link should have active styles (border-l-2 and text-primary)
    // Rail shows only icons, so we query by href. Dashboard href is '/'
    const links = screen.getAllByRole('link');
    const dashboardLink = links.find(link => link.getAttribute('href') === '/');

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
