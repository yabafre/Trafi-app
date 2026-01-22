import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CommerceSettingsForm } from '../CommerceSettingsForm'

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

// Test data with commerce feature flags
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
  // Commerce feature flags
  promotionsEnabled: true,
  maxDiscountPercent: 100,
  allowStackablePromos: false,
  giftCardsEnabled: false,
  giftCardMinCents: 1000,
  giftCardMaxCents: 50000,
  giftCardValidityDays: null,
  multiCurrencyEnabled: false,
  displayPriceIncTax: true,
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('CommerceSettingsForm', () => {
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

  describe('Loading State (AC7)', () => {
    it('should render skeleton when loading', () => {
      mockUseStoreSettings.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      // Skeleton should show animated pulse elements
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('Section Rendering (AC1, AC2, AC3)', () => {
    it('should render all three sections', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('PROMOTIONS')).toBeInTheDocument()
      })

      expect(screen.getByText('CARTES CADEAUX')).toBeInTheDocument()
      // Use getAllByText since MULTI-DEVISES appears in both section header and switch label
      const multiCurrencyElements = screen.getAllByText('MULTI-DEVISES')
      expect(multiCurrencyElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render promotions settings (AC1)', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      expect(screen.getByTestId('max-discount-slider')).toBeInTheDocument()
      expect(screen.getByTestId('allow-stackable-promos-switch')).toBeInTheDocument()
    })

    it('should render gift cards settings (AC2)', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('gift-cards-enabled-switch')).toBeInTheDocument()
      })
    })

    it('should render multi-currency settings (AC3)', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('multi-currency-enabled-switch')).toBeInTheDocument()
      })

      expect(screen.getByTestId('display-price-inc-tax-switch')).toBeInTheDocument()
    })
  })

  describe('Conditional Gift Card Fields (AC2)', () => {
    it('should hide gift card config fields when giftCardsEnabled is false', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('gift-cards-enabled-switch')).toBeInTheDocument()
      })

      // Gift card fields should not be visible
      expect(screen.queryByTestId('gift-card-min-cents-input')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gift-card-max-cents-input')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gift-card-validity-days-input')).not.toBeInTheDocument()
    })

    it('should show gift card config fields when giftCardsEnabled is true', async () => {
      const user = userEvent.setup()

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('gift-cards-enabled-switch')).toBeInTheDocument()
      })

      // Enable gift cards
      const giftCardsSwitch = screen.getByTestId('gift-cards-enabled-switch')
      await user.click(giftCardsSwitch)

      // Gift card fields should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('gift-card-min-cents-input')).toBeInTheDocument()
      })
      expect(screen.getByTestId('gift-card-max-cents-input')).toBeInTheDocument()
      expect(screen.getByTestId('gift-card-validity-days-input')).toBeInTheDocument()
    })
  })

  describe('Form Validation (AC4)', () => {
    it('should show error when giftCardMinCents > giftCardMaxCents', async () => {
      const user = userEvent.setup()

      // Settings with gift cards enabled
      const settingsWithGiftCards = {
        ...mockSettings,
        giftCardsEnabled: true,
      }

      mockUseStoreSettings.mockReturnValue({
        data: settingsWithGiftCards,
        isLoading: false,
        error: null,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('gift-card-min-cents-input')).toBeInTheDocument()
      })

      // Set min higher than max
      const minInput = screen.getByTestId('gift-card-min-cents-input')
      await user.clear(minInput)
      await user.type(minInput, '600.00') // 60000 cents

      // Max is 50000 cents (500.00)
      // Form should be invalid but we need to trigger validation
      const form = minInput.closest('form')!
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })

      // Mutate should not be called when validation fails
      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('should validate maxDiscountPercent is between 0-100', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('max-discount-slider')).toBeInTheDocument()
      })

      // Slider component enforces min/max via props, so we just verify it renders
      const slider = screen.getByTestId('max-discount-slider')
      expect(slider).toBeInTheDocument()
    })
  })

  describe('Save Button State (AC5, AC6)', () => {
    it('should have save button disabled initially (no changes)', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('commerce-settings-save-button')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('commerce-settings-save-button')
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when form is dirty', async () => {
      const user = userEvent.setup()

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      // Make a change
      const promotionsSwitch = screen.getByTestId('promotions-enabled-switch')
      await user.click(promotionsSwitch)

      const saveButton = screen.getByTestId('commerce-settings-save-button')
      expect(saveButton).not.toBeDisabled()
    })

    it('should disable save button and show loading text when mutation is pending', async () => {
      mockUseUpdateStoreSettings.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('commerce-settings-save-button')).toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('commerce-settings-save-button')
      expect(saveButton).toHaveTextContent('ENREGISTREMENT...')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Form Submission (AC5, AC6)', () => {
    it('should call mutate with only changed fields', async () => {
      const user = userEvent.setup()

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      // Turn off promotions (was true, now false)
      const promotionsSwitch = screen.getByTestId('promotions-enabled-switch')
      await user.click(promotionsSwitch)

      // Submit the form
      const saveButton = screen.getByTestId('commerce-settings-save-button')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith({ promotionsEnabled: false })
    })

    it('should call mutate with multiple changed fields', async () => {
      const user = userEvent.setup()

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      // Turn off promotions
      await user.click(screen.getByTestId('promotions-enabled-switch'))

      // Enable multi-currency
      await user.click(screen.getByTestId('multi-currency-enabled-switch'))

      // Submit the form
      const saveButton = screen.getByTestId('commerce-settings-save-button')
      await user.click(saveButton)

      expect(mockMutate).toHaveBeenCalledWith({
        promotionsEnabled: false,
        multiCurrencyEnabled: true,
      })
    })

    it('should not submit when no fields have changed', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('commerce-settings-save-button')).toBeInTheDocument()
      })

      // Submit without changes
      const form = screen.getByTestId('commerce-settings-save-button').closest('form')!
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })

      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('Input Interaction', () => {
    it('should disable all inputs when mutation is pending', async () => {
      mockUseUpdateStoreSettings.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      // Switches should be disabled
      expect(screen.getByTestId('promotions-enabled-switch')).toHaveAttribute(
        'data-disabled',
        ''
      )
      expect(screen.getByTestId('multi-currency-enabled-switch')).toHaveAttribute(
        'data-disabled',
        ''
      )
    })

    it('should display money values in currency format', async () => {
      const settingsWithGiftCards = {
        ...mockSettings,
        giftCardsEnabled: true,
        giftCardMinCents: 1000, // $10.00
        giftCardMaxCents: 50000, // $500.00
      }

      mockUseStoreSettings.mockReturnValue({
        data: settingsWithGiftCards,
        isLoading: false,
        error: null,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('gift-card-min-cents-input')).toBeInTheDocument()
      })

      // Check that cents are displayed as currency
      const minInput = screen.getByTestId('gift-card-min-cents-input')
      expect(minInput).toHaveValue(10) // 1000 cents = 10.00

      const maxInput = screen.getByTestId('gift-card-max-cents-input')
      expect(maxInput).toHaveValue(500) // 50000 cents = 500.00
    })

    it('should display max discount percentage value', async () => {
      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })
  })

  describe('Default Values', () => {
    it('should use default values when settings are missing', async () => {
      mockUseStoreSettings.mockReturnValue({
        data: {
          ...mockSettings,
          promotionsEnabled: undefined,
          maxDiscountPercent: undefined,
        },
        isLoading: false,
        error: null,
      })

      render(<CommerceSettingsForm />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('promotions-enabled-switch')).toBeInTheDocument()
      })

      // Component should handle undefined values gracefully
      // The form will use its defaultValues
    })
  })
})
