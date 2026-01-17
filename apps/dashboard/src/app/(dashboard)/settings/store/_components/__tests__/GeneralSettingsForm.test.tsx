import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GeneralSettingsForm } from '../GeneralSettingsForm'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the hooks
const mockMutate = vi.fn()
const mockUseStoreSettings = vi.fn()
const mockUseUpdateStoreSettings = vi.fn()

vi.mock('../../_hooks', () => ({
  useStoreSettings: () => mockUseStoreSettings(),
  useUpdateStoreSettings: () => mockUseUpdateStoreSettings(),
}))

import { toast } from 'sonner'

// Test data
const mockSettings = {
  id: 'settings-123',
  storeId: 'store-123',
  name: 'My Store',
  description: 'A great store',
  slug: 'my-store',
  defaultCurrency: 'EUR',
  defaultLocale: 'en',
  timezone: 'UTC',
  weightUnit: 'g',
  taxIncluded: true,
  autoArchiveOrders: false,
  orderNumberPrefix: 'ORD-',
  lowStockThreshold: 5,
  contactEmail: null,
  supportEmail: null,
  phoneNumber: null,
  address: null,
  primaryColor: '#CCFF00',
  logoUrl: null,
  faviconUrl: null,
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('GeneralSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutate.mockClear()

    // Default mock implementations
    mockUseStoreSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    })

    mockUseUpdateStoreSettings.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
  })

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockUseStoreSettings.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      // Skeleton should show animated pulse elements
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('Data Display', () => {
    it('should render form with current settings values', async () => {
      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      // Wait for form to populate with settings data
      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      expect(screen.getByTestId('settings-description-input')).toHaveValue('A great store')
      expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
    })

    it('should render form labels', () => {
      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      expect(screen.getByText('NOM DE LA BOUTIQUE')).toBeInTheDocument()
      expect(screen.getByText('DESCRIPTION')).toBeInTheDocument()
      expect(screen.getByText('SLUG (URL)')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error for invalid slug format', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      // Enter invalid slug with spaces (gets lowercased but spaces make it invalid)
      const slugInput = screen.getByTestId('settings-slug-input')
      await user.clear(slugInput)
      await user.type(slugInput, 'invalid slug with spaces')
      await user.tab() // Trigger blur

      // Error message should appear
      await waitFor(() => {
        expect(screen.getByTestId('slug-error')).toBeInTheDocument()
      })
      expect(screen.getByText('Slug must be lowercase with hyphens and numbers only')).toBeInTheDocument()
    })

    it('should clear error when user fixes slug', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      const slugInput = screen.getByTestId('settings-slug-input')

      // Enter invalid slug (with spaces - invalid after lowercasing)
      await user.clear(slugInput)
      await user.type(slugInput, 'invalid slug')
      await user.tab()

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('slug-error')).toBeInTheDocument()
      })

      // Fix the slug
      await user.clear(slugInput)
      await user.type(slugInput, 'valid-slug')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('slug-error')).not.toBeInTheDocument()
      })
    })

    it('should not show error for empty slug (optional field)', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      const slugInput = screen.getByTestId('settings-slug-input')
      await user.clear(slugInput)
      await user.tab()

      // No error should appear for empty slug
      expect(screen.queryByTestId('slug-error')).not.toBeInTheDocument()
    })
  })

  describe('Save Button State', () => {
    it('should have save button disabled initially (no changes)', async () => {
      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      const saveButton = screen.getByTestId('settings-save-button')
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when form is dirty', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      // Make a change
      const nameInput = screen.getByTestId('settings-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Store')

      const saveButton = screen.getByTestId('settings-save-button')
      expect(saveButton).not.toBeDisabled()
    })

    it('should disable save button and show loading text when mutation is pending', async () => {
      mockUseUpdateStoreSettings.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      const saveButton = screen.getByTestId('settings-save-button')
      // Button shows loading text when pending
      expect(saveButton).toHaveTextContent('ENREGISTREMENT...')
      // Button is disabled when pending (regardless of dirty state)
      expect(saveButton).toBeDisabled()
    })

    it('should disable save button when form has validation errors', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      // Enter invalid slug (with spaces - remains invalid after lowercasing)
      const slugInput = screen.getByTestId('settings-slug-input')
      await user.clear(slugInput)
      await user.type(slugInput, 'invalid slug')
      await user.tab()

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('slug-error')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('settings-save-button')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call mutate with changed fields only', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      // Change only the name
      const nameInput = screen.getByTestId('settings-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Store Name')

      // Submit the form
      const saveButton = screen.getByTestId('settings-save-button')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Updated Store Name' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      )
    })

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      // Enter invalid slug
      const slugInput = screen.getByTestId('settings-slug-input')
      await user.clear(slugInput)
      await user.type(slugInput, 'INVALID SLUG!')

      // Submit the form by clicking button (won't work due to disabled state)
      // But let's try to trigger submit manually to test validation
      const form = slugInput.closest('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      // mutate should not be called
      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('should not submit when no fields have changed', async () => {
      const user = userEvent.setup()

      // Start with settings already matching form values
      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      // Type and then clear to original value - simulating "no real change"
      const nameInput = screen.getByTestId('settings-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'My Store')

      // Even if form is technically "dirty", the values match original
      // So no API call should be made
      const form = nameInput.closest('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('Success Toast (AC #4)', () => {
    it('should trigger onSuccess callback after successful mutation', async () => {
      const user = userEvent.setup()

      // Mock mutate to immediately call onSuccess
      mockMutate.mockImplementation((_payload, options) => {
        // Simulate successful mutation by calling onSuccess
        if (options?.onSuccess) {
          options.onSuccess()
        }
      })

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      // Change the name
      const nameInput = screen.getByTestId('settings-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Store Name')

      // Submit the form
      const saveButton = screen.getByTestId('settings-save-button')
      await user.click(saveButton)

      // Verify mutate was called with onSuccess callback
      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      )

      // Note: The actual toast.success call happens in useUpdateStoreSettings hook
      // which is mocked. To fully test toast, we would need an integration test.
      // This test verifies the form correctly triggers the mutation with onSuccess.
    })
  })

  describe('Input Interaction', () => {
    it('should disable inputs when mutation is pending', async () => {
      mockUseUpdateStoreSettings.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-name-input')).toHaveValue('My Store')
      })

      expect(screen.getByTestId('settings-name-input')).toBeDisabled()
      expect(screen.getByTestId('settings-description-input')).toBeDisabled()
      expect(screen.getByTestId('settings-slug-input')).toBeDisabled()
    })

    it('should convert slug to lowercase on input', async () => {
      const user = userEvent.setup()

      render(<GeneralSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('settings-slug-input')).toHaveValue('my-store')
      })

      const slugInput = screen.getByTestId('settings-slug-input')
      await user.clear(slugInput)
      await user.type(slugInput, 'MY-NEW-STORE')

      // Should be converted to lowercase
      expect(slugInput).toHaveValue('my-new-store')
    })
  })
})
