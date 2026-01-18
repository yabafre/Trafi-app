import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MediaSection } from '../MediaSection'
import type { MediaResponse } from '@trafi/validators'

// Mock data
const mockMedia: MediaResponse[] = [
  {
    id: 'med_test1',
    productId: 'prod_test123',
    variantId: null,
    url: 'https://cdn.example.com/image1.webp',
    thumbnailUrl: 'https://cdn.example.com/image1_thumb.webp',
    altText: 'Product image 1',
    type: 'IMAGE',
    position: 0,
    isPrimary: true,
    width: 1000,
    height: 800,
    sizeInBytes: 50000,
    mimeType: 'image/jpeg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med_test2',
    productId: 'prod_test123',
    variantId: null,
    url: 'https://cdn.example.com/image2.webp',
    thumbnailUrl: 'https://cdn.example.com/image2_thumb.webp',
    altText: null,
    type: 'IMAGE',
    position: 1,
    isPrimary: false,
    width: 800,
    height: 600,
    sizeInBytes: 40000,
    mimeType: 'image/png',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

// Create mock functions that we can control per test
const mockUseMedia = vi.fn()
const mockUseReorderMedia = vi.fn()
const mockUseUpdateMedia = vi.fn()
const mockUseUploadMedia = vi.fn()
const mockUseDeleteMedia = vi.fn()

// Mock the hooks
vi.mock('../../_hooks', () => ({
  useMedia: () => mockUseMedia(),
  useReorderMedia: () => mockUseReorderMedia(),
  useUpdateMedia: () => mockUseUpdateMedia(),
  useUploadMedia: () => mockUseUploadMedia(),
  useDeleteMedia: () => mockUseDeleteMedia(),
}))

// Mock usePermissions hook
const mockHasPermission = vi.fn()
vi.mock('@/lib/hooks', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    permissions: ['products:read', 'products:update'],
  }),
}))

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Default mock return values
const defaultMediaReturn = {
  data: mockMedia,
  isLoading: false,
  error: null,
}

const defaultMutationReturn = {
  mutate: vi.fn(),
  isPending: false,
}

const defaultUploadReturn = {
  upload: vi.fn(),
  isUploading: false,
  progress: 0,
  error: null,
}

const defaultDeleteReturn = {
  mutate: vi.fn(),
  isPending: false,
}

describe('MediaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMedia.mockReturnValue(defaultMediaReturn)
    mockUseReorderMedia.mockReturnValue(defaultMutationReturn)
    mockUseUpdateMedia.mockReturnValue(defaultMutationReturn)
    mockUseUploadMedia.mockReturnValue(defaultUploadReturn)
    mockUseDeleteMedia.mockReturnValue(defaultDeleteReturn)
    mockHasPermission.mockReturnValue(true)
  })

  it('should render the media section header', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByText('IMAGES')).toBeInTheDocument()
  })

  it('should display media count', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByText('2/10 images')).toBeInTheDocument()
  })

  it('should render add button when user has edit permission', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument()
  })

  it('should show loading skeleton when loading', () => {
    mockUseMedia.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    // Should show skeleton elements
    const skeletons = document.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show error message on error', () => {
    mockUseMedia.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load media'),
    })

    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByText(/ERREUR/)).toBeInTheDocument()
    expect(screen.getByText(/Failed to load media/)).toBeInTheDocument()
  })

  it('should show drag hint when multiple images exist and user can edit', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByText(/GLISSEZ-DEPOSEZ POUR REORGANISER/i)).toBeInTheDocument()
  })
})

describe('MediaSection - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMedia.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
    mockUseReorderMedia.mockReturnValue(defaultMutationReturn)
    mockUseUpdateMedia.mockReturnValue(defaultMutationReturn)
    mockUseUploadMedia.mockReturnValue(defaultUploadReturn)
    mockUseDeleteMedia.mockReturnValue(defaultDeleteReturn)
    mockHasPermission.mockReturnValue(true)
  })

  it('should show empty state when no media exists', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByText('AUCUNE IMAGE')).toBeInTheDocument()
  })

  it('should show add button in empty state when user has edit permission', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /ajouter des images/i })).toBeInTheDocument()
  })
})

describe('MediaSection - Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMedia.mockReturnValue(defaultMediaReturn)
    mockUseReorderMedia.mockReturnValue(defaultMutationReturn)
    mockUseUpdateMedia.mockReturnValue(defaultMutationReturn)
    mockUseUploadMedia.mockReturnValue(defaultUploadReturn)
    mockUseDeleteMedia.mockReturnValue(defaultDeleteReturn)
    mockHasPermission.mockReturnValue(false) // No edit permission
  })

  it('should hide add button when user lacks edit permission', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.queryByRole('button', { name: /ajouter/i })).not.toBeInTheDocument()
  })

  it('should hide drag hint when user lacks edit permission', () => {
    render(<MediaSection productId="prod_test123" />, { wrapper: createWrapper() })

    expect(screen.queryByText(/GLISSEZ-DEPOSEZ/i)).not.toBeInTheDocument()
  })
})
