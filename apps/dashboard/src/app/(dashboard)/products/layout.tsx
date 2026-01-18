import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Produits | Trafi Dashboard',
  description: 'Gérez votre catalogue de produits',
}

/**
 * Products Layout
 *
 * Provides metadata and common layout for products routes.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
