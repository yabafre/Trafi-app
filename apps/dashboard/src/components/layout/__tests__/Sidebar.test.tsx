import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock the UI store
const mockSetSidebarOpen = vi.fn();
vi.mock('@/stores/ui-store', () => ({
  useUIStore: vi.fn(() => ({
    sidebarCollapsed: false,
    sidebarOpen: false,
    toggleSidebar: vi.fn(),
    setSidebarOpen: mockSetSidebarOpen,
    setSidebarCollapsed: vi.fn(),
    toggleSidebarCollapsed: vi.fn(),
  })),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows store name from settings', () => {
    render(<Sidebar storeName="My Awesome Store" />);

    expect(screen.getByText('My Awesome Store')).toBeInTheDocument();
  });

  it('shows default store name when none provided', () => {
    render(<Sidebar />);

    expect(screen.getByText('My Store')).toBeInTheDocument();
  });

  it('renders all navigation items with labels', () => {
    render(<Sidebar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
    // Settings is a button (expandable)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('expands sub-navigation when parent is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Initially, sub-items should not be visible (Settings is collapsed by default)
    // But since dashboard is active, settings may auto-expand if it's active
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // After click, sub-items should be visible
    expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /api keys/i })).toBeInTheDocument();
  });

  it('collapses sub-navigation when parent is clicked again', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });

    // Expand
    await user.click(settingsButton);
    expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument();

    // Collapse
    await user.click(settingsButton);
    expect(screen.queryByRole('link', { name: /store/i })).not.toBeInTheDocument();
  });

  it('applies collapsed width when sidebarCollapsed is true', async () => {
    const { useUIStore } = await import('@/stores/ui-store');
    vi.mocked(useUIStore).mockReturnValue({
      sidebarCollapsed: true,
      sidebarOpen: false,
      toggleSidebar: vi.fn(),
      setSidebarOpen: mockSetSidebarOpen,
      setSidebarCollapsed: vi.fn(),
      toggleSidebarCollapsed: vi.fn(),
    });

    const { container } = render(<Sidebar />);
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-0');
  });

  it('applies custom className', () => {
    const { container } = render(<Sidebar className="custom-sidebar" />);
    expect(container.querySelector('aside')).toHaveClass('custom-sidebar');
  });

  it('is hidden on mobile (lg:flex)', () => {
    const { container } = render(<Sidebar />);
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('hidden');
    expect(sidebar).toHaveClass('lg:flex');
  });

  it('calls onNavigate when a link is clicked', async () => {
    const user = userEvent.setup();
    const mockOnNavigate = vi.fn();
    render(<Sidebar onNavigate={mockOnNavigate} />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);

    expect(mockOnNavigate).toHaveBeenCalledOnce();
  });

  it('renders custom header when provided', () => {
    render(<Sidebar header={<div data-testid="custom-header">Custom Header</div>} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.queryByText('My Store')).not.toBeInTheDocument();
  });
});
