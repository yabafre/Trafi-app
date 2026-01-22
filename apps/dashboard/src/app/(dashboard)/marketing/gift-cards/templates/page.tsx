'use client'

import { GiftCardTemplatesDataTable } from './_components'
import { usePermissions } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * Gift Card Templates Management Page
 *
 * Allows Owner/Admin users to manage gift card templates.
 * Templates define pre-configured denominations and validity settings.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export default function GiftCardTemplatesPage() {
  const { hasPermission } = usePermissions()
  const canRead = hasPermission('settings:read')
  const canUpdate = hasPermission('settings:update')

  // Permission check - show access denied if no read permission
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          ACCESS DENIED
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the necessary permissions to access this page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/marketing/gift-cards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-2xl uppercase tracking-wider">
              GIFT CARD TEMPLATES
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {canUpdate
                ? 'Configure templates with pre-defined denominations and settings.'
                : 'View templates (read-only).'}
            </p>
          </div>
        </div>
      </div>

      {/* Read-only indicator for viewers */}
      {!canUpdate && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-yellow-500">
            READ-ONLY MODE - Contact an administrator to manage templates.
          </p>
        </div>
      )}

      {/* Templates List */}
      <GiftCardTemplatesDataTable />
    </div>
  )
}
