'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInviteUser } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import type { UserRole } from '@trafi/validators'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'VIEWER', label: 'Viewer', description: 'Lecture seule' },
  { value: 'EDITOR', label: 'Editor', description: 'Modifier le contenu' },
  { value: 'ADMIN', label: 'Admin', description: 'Gestion complète' },
  { value: 'OWNER', label: 'Owner', description: 'Propriétaire du store' },
]

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('VIEWER')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const { mutate: inviteUser, isPending } = useInviteUser()
  const { userRole } = usePermissions()

  // Filter roles based on current user's role (can only invite roles at or below their own)
  // Note: Backend enforces hierarchy, frontend filters for UX
  const availableRoles = ROLE_OPTIONS.filter(
    (option) => ROLE_HIERARCHY[option.value] <= ROLE_HIERARCHY[userRole as UserRole]
  )

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email requis')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Email invalide')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    inviteUser(
      { email, role, message: message || undefined },
      {
        onSuccess: () => {
          setOpen(false)
          resetForm()
        },
      }
    )
  }

  const resetForm = () => {
    setEmail('')
    setRole('VIEWER')
    setMessage('')
    setEmailError('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="invite-user-button">
          <UserPlus className="mr-2 size-4" />
          INVITER UN UTILISATEUR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>INVITER UN UTILISATEUR</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour rejoindre votre store.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) validateEmail(e.target.value)
                }}
                onBlur={() => validateEmail(email)}
                disabled={isPending}
                data-testid="invite-email-input"
              />
              {emailError && (
                <span className="font-mono text-xs text-destructive">{emailError}</span>
              )}
            </div>

            {/* Role Select */}
            <div className="grid gap-2">
              <Label htmlFor="role">ROLE</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isPending}
              >
                <SelectTrigger data-testid="invite-role-select">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Message */}
            <div className="grid gap-2">
              <Label htmlFor="message">MESSAGE (OPTIONNEL)</Label>
              <textarea
                id="message"
                className="flex min-h-[80px] w-full border border-border bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ajoutez un message personnalisé..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isPending}
                data-testid="invite-message-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              ANNULER
            </Button>
            <Button type="submit" disabled={isPending || !email || availableRoles.length === 0}>
              {isPending ? 'ENVOI...' : 'ENVOYER L\'INVITATION'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
