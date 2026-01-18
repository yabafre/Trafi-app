import { CategoriesTree } from './_components'

export const metadata = {
  title: 'Categories | Trafi',
  description: 'Manage product categories',
}

/**
 * Categories Page
 *
 * Displays the category management interface with:
 * - Hierarchical tree view
 * - Add/Edit/Delete functionality
 * - Drag-and-drop reordering
 *
 * @see Story 3.4 - Categories Management
 */
export default function CategoriesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Categories</h1>
        <p className="text-zinc-400 mt-1">
          Organize your products into categories. Drag and drop to reorder.
        </p>
      </div>

      {/* Categories Tree */}
      <CategoriesTree />
    </div>
  )
}
