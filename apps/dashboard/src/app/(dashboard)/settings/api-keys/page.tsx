'use client'

import { useState } from 'react'
import {
  ApiKeysTable,
  CreateApiKeyDialog,
  ApiKeyCreatedModal,
  RevokeApiKeyDialog,
} from './_components'
import { usePermissions } from '@/lib/hooks'
import type { ApiKeyResponse } from '@trafi/validators'

export default function ApiKeysPage() {
  const { hasPermission } = usePermissions()
  const canManageKeys = hasPermission('api-keys:manage')

  // Dialog state
  const [revokeKey, setRevokeKey] = useState<ApiKeyResponse | null>(null)

  // Created key modal state
  const [createdKeyValue, setCreatedKeyValue] = useState<string>('')
  const [createdKeyName, setCreatedKeyName] = useState<string>('')
  const [showCreatedModal, setShowCreatedModal] = useState(false)

  const handleKeyCreated = (keyValue: string, keyName: string) => {
    setCreatedKeyValue(keyValue)
    setCreatedKeyName(keyName)
    setShowCreatedModal(true)
  }

  const handleCloseCreatedModal = () => {
    setShowCreatedModal(false)
    setCreatedKeyValue('')
    setCreatedKeyName('')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            CLES API
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerez les cles API pour integrer des services externes avec votre store.
          </p>
        </div>
        {canManageKeys && <CreateApiKeyDialog onKeyCreated={handleKeyCreated} />}
      </div>

      {/* API Keys Table */}
      <ApiKeysTable onRevoke={(apiKey) => setRevokeKey(apiKey)} />

      {/* Revoke API Key Dialog */}
      <RevokeApiKeyDialog
        apiKey={revokeKey}
        open={!!revokeKey}
        onClose={() => setRevokeKey(null)}
      />

      {/* API Key Created Modal */}
      <ApiKeyCreatedModal
        open={showCreatedModal}
        onClose={handleCloseCreatedModal}
        keyValue={createdKeyValue}
        keyName={createdKeyName}
      />
    </div>
  )
}
