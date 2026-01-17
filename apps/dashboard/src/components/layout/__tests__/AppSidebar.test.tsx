import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppSidebar } from '../AppSidebar';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock the auth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    logout: vi.fn(),
    isLoading: false,
  })),
}));

// Mock the store settings hook
vi.mock('@/app/(dashboard)/settings/store/_hooks/useStoreSettings', () => ({
  useStoreSettings: vi.fn(() => ({
    data: { name: 'Test Store Settings' },
    isLoading: false,
    error: null,
  })),
}));

// Mock the UI store
const mockToggleSidebarCollapsed = vi.fn();
const mockUseUIStore = vi.fn(() => ({
  sidebarCollapsed: false,
  toggleSidebarCollapsed: mockToggleSidebarCollapsed,
}));

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => mockUseUIStore(),
}));

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUIStore.mockReturnValue({
      sidebarCollapsed: false,
      toggleSidebarCollapsed: mockToggleSidebarCollapsed,
    });
  });

  it('renders store name when provided', () => {
    render(<AppSidebar storeName="Test Store" />);

    expect(screen.getByText('Test Store')).toBeInTheDocument();
  });

  it('renders store name from settings when none provided', () => {
    render(<AppSidebar />);

    // When no prop is provided, it uses the store settings name
    expect(screen.getByText('Test Store Settings')).toBeInTheDocument();
  });

  it('renders TRAFI logo text when expanded', () => {
    render(<AppSidebar />);

    expect(screen.getByText('TRAFI')).toBeInTheDocument();
  });

  it('hides TRAFI logo text when collapsed', () => {
    mockUseUIStore.mockReturnValue({
      sidebarCollapsed: true,
      toggleSidebarCollapsed: mockToggleSidebarCollapsed,
    });

    render(<AppSidebar />);

    expect(screen.queryByText('TRAFI')).not.toBeInTheDocument();
  });

  it('renders all navigation items when expanded', () => {
    render(<AppSidebar />);

    // Check for main navigation items
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
    // Settings is a button (expandable)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('shows collapsed width (w-16) when sidebarCollapsed is true', () => {
    mockUseUIStore.mockReturnValue({
      sidebarCollapsed: true,
      toggleSidebarCollapsed: mockToggleSidebarCollapsed,
    });

    const { container } = render(<AppSidebar />);
    const sidebar = container.querySelector('aside');

    expect(sidebar).toHaveClass('w-16');
  });

  it('shows expanded width (w-64) when sidebarCollapsed is false', () => {
    const { container } = render(<AppSidebar />);
    const sidebar = container.querySelector('aside');

    expect(sidebar).toHaveClass('w-64');
  });

  it('calls toggleSidebarCollapsed when collapse button is clicked', async () => {
    const user = userEvent.setup();
    render(<AppSidebar />);

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(collapseButton);

    expect(mockToggleSidebarCollapsed).toHaveBeenCalledOnce();
  });

  it('renders user initials from email', () => {
    render(<AppSidebar />);

    // User email is test@example.com, first letter is 'T'
    // There are multiple 'T' in the DOM (TRAFI logo), so we look for the avatar specifically
    const avatarContainer = screen.getAllByText('T').find(
      (el) => el.closest('div')?.className?.includes('h-8 w-8')
    );
    expect(avatarContainer).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    render(<AppSidebar />);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('is hidden on mobile (lg:flex)', () => {
    const { container } = render(<AppSidebar />);
    const sidebar = container.querySelector('aside');

    expect(sidebar).toHaveClass('hidden');
    expect(sidebar).toHaveClass('lg:flex');
  });

  it('applies custom className', () => {
    const { container } = render(<AppSidebar className="custom-class" />);
    const sidebar = container.querySelector('aside');

    expect(sidebar).toHaveClass('custom-class');
  });

  it('expands settings sub-navigation when clicked', async () => {
    const user = userEvent.setup();
    render(<AppSidebar />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // After click, sub-items should be visible
    expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /api keys/i })).toBeInTheDocument();
  });

  it('shows navigation label when expanded', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('hides navigation label when collapsed', () => {
    mockUseUIStore.mockReturnValue({
      sidebarCollapsed: true,
      toggleSidebarCollapsed: mockToggleSidebarCollapsed,
    });

    render(<AppSidebar />);

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
  });
});
