import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductStatusBadge } from '../ProductStatusBadge'

/**
 * ProductStatusBadge Component Tests
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
describe('ProductStatusBadge', () => {
  it('renders draft status with correct text and styling', () => {
    render(<ProductStatusBadge status="draft" />)

    const badge = screen.getByText('BROUILLON')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-muted')
    expect(badge).toHaveClass('text-muted-foreground')
  })

  it('renders active status with correct text and styling', () => {
    render(<ProductStatusBadge status="active" />)

    const badge = screen.getByText('ACTIF')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-accent/20')
    expect(badge).toHaveClass('text-accent')
  })

  it('renders archived status with correct text and styling', () => {
    render(<ProductStatusBadge status="archived" />)

    // Note: Uses French with accent "ARCHIVÉ"
    const badge = screen.getByText('ARCHIVÉ')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-secondary')
    expect(badge).toHaveClass('text-secondary-foreground')
  })

  it('applies Digital Brutalism styling (monospace, uppercase, border)', () => {
    render(<ProductStatusBadge status="active" />)

    const badge = screen.getByText('ACTIF')
    expect(badge).toHaveClass('font-mono')
    expect(badge).toHaveClass('uppercase')
    expect(badge).toHaveClass('border')
    expect(badge).toHaveClass('tracking-wider')
  })
})
