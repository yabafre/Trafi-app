import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductForm } from '../ProductForm'
import type { ProductResponse } from '@trafi/validators'

/**
 * ProductForm Component Tests
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
describe('ProductForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Create Mode', () => {
    it('renders empty form in create mode', () => {
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      expect(screen.getByTestId('product-name-input')).toHaveValue('')
      expect(screen.getByTestId('product-slug-input')).toHaveValue('')
      expect(screen.getByTestId('product-status-select')).toHaveValue('draft')
    })

    it('shows create button text', () => {
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      expect(screen.getByTestId('product-save-button')).toHaveTextContent(
        /CRÉER LE PRODUIT/i
      )
    })

    it('validates required name field on submit', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      // Fill price but not name
      await user.type(screen.getByTestId('product-price-input'), '1999')
      await user.click(screen.getByTestId('product-save-button'))

      expect(screen.getByText(/Le nom est obligatoire/i)).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('validates price is required in create mode on blur', async () => {
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      // Focus then blur price input
      const priceInput = screen.getByTestId('product-price-input')
      fireEvent.focus(priceInput)
      fireEvent.blur(priceInput)

      await waitFor(() => {
        expect(screen.getByText(/Le prix est obligatoire/i)).toBeInTheDocument()
      })
    })

    it('validates slug format on blur', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      // Type invalid slug (uppercase and special chars)
      await user.type(screen.getByTestId('product-slug-input'), 'INVALID!')
      fireEvent.blur(screen.getByTestId('product-slug-input'))

      await waitFor(() => {
        expect(
          screen.getByText(/Le slug doit contenir uniquement/i)
        ).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={false} />
      )

      await user.type(screen.getByTestId('product-name-input'), 'Test Product')
      await user.type(screen.getByTestId('product-price-input'), '1999')
      await user.type(screen.getByTestId('product-tags-input'), 'tag1, tag2')

      await user.click(screen.getByTestId('product-save-button'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Product',
            priceInCents: 1999,
            status: 'draft',
            tags: ['tag1', 'tag2'],
          })
        )
      })
    })
  })

  describe('Edit Mode', () => {
    const mockProduct: ProductResponse = {
      id: 'prod_test123',
      storeId: 'store_test',
      name: 'Existing Product',
      slug: 'existing-product',
      description: 'A test description',
      priceInCents: 2999,
      status: 'active',
      productType: 'Physical',
      vendor: 'Test Vendor',
      tags: ['existing', 'tags'],
      createdAt: new Date('2026-01-17'),
      updatedAt: new Date('2026-01-17'),
    }

    it('populates form with existing product data', () => {
      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSubmit={mockOnSubmit}
          isPending={false}
        />
      )

      expect(screen.getByTestId('product-name-input')).toHaveValue(
        'Existing Product'
      )
      expect(screen.getByTestId('product-slug-input')).toHaveValue(
        'existing-product'
      )
      expect(screen.getByTestId('product-price-input')).toHaveValue(2999)
      expect(screen.getByTestId('product-status-select')).toHaveValue('active')
      expect(screen.getByTestId('product-vendor-input')).toHaveValue(
        'Test Vendor'
      )
      expect(screen.getByTestId('product-tags-input')).toHaveValue(
        'existing, tags'
      )
    })

    it('shows save button text in edit mode', () => {
      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSubmit={mockOnSubmit}
          isPending={false}
        />
      )

      expect(screen.getByTestId('product-save-button')).toHaveTextContent(
        /ENREGISTRER/i
      )
    })

    it('disables submit button when form is not dirty', () => {
      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSubmit={mockOnSubmit}
          isPending={false}
        />
      )

      expect(screen.getByTestId('product-save-button')).toBeDisabled()
    })

    it('enables submit button after form changes', async () => {
      const user = userEvent.setup()
      render(
        <ProductForm
          mode="edit"
          product={mockProduct}
          onSubmit={mockOnSubmit}
          isPending={false}
        />
      )

      await user.clear(screen.getByTestId('product-name-input'))
      await user.type(screen.getByTestId('product-name-input'), 'Updated Name')

      expect(screen.getByTestId('product-save-button')).not.toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('disables all inputs when pending', () => {
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={true} />
      )

      expect(screen.getByTestId('product-name-input')).toBeDisabled()
      expect(screen.getByTestId('product-slug-input')).toBeDisabled()
      expect(screen.getByTestId('product-price-input')).toBeDisabled()
      expect(screen.getByTestId('product-status-select')).toBeDisabled()
    })

    it('shows loading text on submit button when pending in create mode', () => {
      render(
        <ProductForm mode="create" onSubmit={mockOnSubmit} isPending={true} />
      )

      expect(screen.getByTestId('product-save-button')).toHaveTextContent(
        /CRÉATION/i
      )
    })
  })
})
