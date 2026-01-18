import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMedia, MEDIA_QUERY_KEY } from '../useMedia'
import type { MediaResponse } from '@trafi/validators'

// Mock the server action hooks
vi.mock('@/lib/server-action-hooks', () => ({
  useServerActionQuery: vi.fn(),
}))

// Mock the media actions
vi.mock('../../_actions', () => ({
  getMediaAction: vi.fn(),
}))

import { useServerActionQuery } from '@/lib/server-action-hooks'

const mockUseServerActionQuery = vi.mocked(useServerActionQuery)

// Test data
const mockMediaResponse: MediaResponse[] = [
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

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call useServerActionQuery with correct parameters', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockMediaResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useMedia({ productId: 'prod_test123' }), {
      wrapper: createWrapper(),
    })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function), // getMediaAction
      expect.objectContaining({
        input: 'prod_test123',
        queryKey: MEDIA_QUERY_KEY('prod_test123'),
        enabled: true,
      })
    )
  })

  it('should return media list data structure', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockMediaResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useMedia({ productId: 'prod_test123' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toEqual(mockMediaResponse)
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].isPrimary).toBe(true)
    expect(result.current.data?.[1].isPrimary).toBe(false)
  })

  it('should be disabled when enabled is false', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useMedia({ productId: 'prod_test123', enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        enabled: false,
      })
    )
  })

  it('should be disabled when productId is empty', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useMedia({ productId: '' }), {
      wrapper: createWrapper(),
    })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        enabled: false,
      })
    )
  })

  it('should return loading state correctly', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useMedia({ productId: 'prod_test123' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return error state correctly', () => {
    const mockError = new Error('Failed to fetch media')
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useMedia({ productId: 'prod_test123' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.error).toBe(mockError)
    expect(result.current.data).toBeUndefined()
  })
})

describe('MEDIA_QUERY_KEY', () => {
  it('should generate correct query key structure', () => {
    const key = MEDIA_QUERY_KEY('prod_abc123')
    expect(key).toEqual(['products', 'prod_abc123', 'media'])
  })
})
