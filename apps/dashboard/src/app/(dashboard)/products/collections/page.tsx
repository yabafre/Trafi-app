import { CollectionsList } from './_components'

export const metadata = {
  title: 'Collections | Trafi',
  description: 'Manage product collections',
}

/**
 * Collections Page
 *
 * Displays the collection management interface with:
 * - Grid view of collections
 * - Search and filtering
 * - Add/Edit/Delete functionality
 *
 * @see Story 3.5 - Collections Management
 */
export default function CollectionsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Collections</h1>
        <p className="text-zinc-400 mt-1">
          Create curated product collections for marketing and promotions.
        </p>
      </div>

      {/* Collections List */}
      <CollectionsList />
    </div>
  )
}
