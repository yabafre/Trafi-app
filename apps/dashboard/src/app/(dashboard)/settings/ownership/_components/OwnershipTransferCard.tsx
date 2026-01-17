'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, AlertTriangle } from 'lucide-react'
import { useUsers } from '../../users/_hooks'
import { TransferConfirmationDialog } from './TransferConfirmationDialog'

/**
 * Ownership transfer card for initiating transfers (Owner view)
 * AC: #1 - Shows eligible users (admin/editor) in dropdown
 */
export function OwnershipTransferCard() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [showDialog, setShowDialog] = useState(false)
  const { data: users, isLoading } = useUsers()

  // Filter to admins and editors only
  const eligibleUsers = users?.users?.filter(
    (u) => ['admin', 'editor'].includes(u.role.toLowerCase())
  ) ?? []

  const selectedUser = eligibleUsers.find((u) => u.id === selectedUserId)

  const handleTransferClick = () => {
    if (selectedUserId) {
      setShowDialog(true)
    }
  }

  return (
    <>
      <div className="border border-[#333333] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-[#CCFF00]" />
          <h2 className="font-mono uppercase tracking-wider">
            TRANSFERT DE PROPRIETE
          </h2>
        </div>

        <div className="p-4 bg-[#FF3366]/10 border border-[#FF3366]/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF3366] mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-[#FF3366]">Action irreversible</p>
              <p className="text-[#999999] mt-1">
                Le nouveau proprietaire aura le controle total. Vous serez
                retrograde au role Admin.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={isLoading}
          >
            <SelectTrigger className="border-[#333333] bg-transparent rounded-none">
              <SelectValue placeholder="Selectionner un admin..." />
            </SelectTrigger>
            <SelectContent className="bg-black border-[#333333]">
              {eligibleUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email}) -{' '}
                  {user.role.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleTransferClick}
            disabled={!selectedUserId}
            className="bg-[#FF3366] text-white hover:bg-[#FF3366]/90 rounded-none font-mono uppercase w-full"
          >
            INITIER LE TRANSFERT
          </Button>
        </div>
      </div>

      {selectedUser && (
        <TransferConfirmationDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          targetUser={selectedUser}
          onSuccess={() => {
            setSelectedUserId('')
            setShowDialog(false)
          }}
        />
      )}
    </>
  )
}
