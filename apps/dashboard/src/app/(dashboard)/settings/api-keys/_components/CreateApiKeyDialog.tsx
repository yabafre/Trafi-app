'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
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
import { useCreateApiKey } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import { API_KEY_SCOPES, type ApiKeyScope } from '@trafi/validators'

interface CreateApiKeyDialogProps {
  onKeyCreated: (keyValue: string, keyName: string) => void
}

// Use the descriptions from the API_KEY_SCOPES constant
// These are French translations for the UI
const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  'products:read': 'Lire les produits',
  'products:write': 'Modifier les produits',
  'orders:read': 'Lire les commandes',
  'orders:write': 'Modifier les commandes',
  'customers:read': 'Lire les clients',
  'inventory:read': 'Lire l\'inventaire',
  'inventory:write': 'Modifier l\'inventaire',
}

// Get all scopes as an array
const ALL_SCOPES = Object.keys(API_KEY_SCOPES) as ApiKeyScope[]

export function CreateApiKeyDialog({ onKeyCreated }: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([])
  const [expiresInDays, setExpiresInDays] = useState<string>('')
  const [nameError, setNameError] = useState('')
  const [scopesError, setScopesError] = useState('')

  const { mutate: createApiKey, isPending } = useCreateApiKey()
  const { hasPermission } = usePermissions()

  const canManageKeys = hasPermission('api-keys:manage')

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Nom requis')
      return false
    }
    if (value.length < 3) {
      setNameError('Minimum 3 caracteres')
      return false
    }
    if (value.length > 50) {
      setNameError('Maximum 50 caracteres')
      return false
    }
    setNameError('')
    return true
  }

  const validateScopes = (): boolean => {
    if (selectedScopes.length === 0) {
      setScopesError('Selectionnez au moins un scope')
      return false
    }
    setScopesError('')
    return true
  }

  const toggleScope = (scope: ApiKeyScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    )
    if (scopesError) setScopesError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const isNameValid = validateName(name)
    const isScopesValid = validateScopes()

    if (!isNameValid || !isScopesValid) {
      return
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000)
      : undefined

    createApiKey(
      { name: name.trim(), scopes: selectedScopes, expiresAt },
      {
        onSuccess: (result) => {
          if (result && 'key' in result) {
            onKeyCreated(result.key as string, name.trim())
          }
          setOpen(false)
          resetForm()
        },
      }
    )
  }

  const resetForm = () => {
    setName('')
    setSelectedScopes([])
    setExpiresInDays('')
    setNameError('')
    setScopesError('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  if (!canManageKeys) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="create-api-key-button">
          <Plus className="mr-2 size-4" />
          CREER UNE CLE API
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>CREER UNE CLE API</DialogTitle>
            <DialogDescription>
              Creez une cle API pour integrer des services externes avec votre store.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name Input */}
            <div className="grid gap-2">
              <Label htmlFor="name">NOM</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ma cle de production"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) validateName(e.target.value)
                }}
                onBlur={() => validateName(name)}
                disabled={isPending}
                data-testid="api-key-name-input"
              />
              {nameError && (
                <span className="font-mono text-xs text-destructive">{nameError}</span>
              )}
            </div>

            {/* Scopes Selection */}
            <div className="grid gap-2">
              <Label>SCOPES</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto border border-border p-2">
                {ALL_SCOPES.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    className={`flex items-center justify-between px-3 py-2 text-left transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'bg-[#CCFF00]/10 border border-[#CCFF00]'
                        : 'bg-secondary/20 border border-border hover:bg-secondary/40'
                    }`}
                    onClick={() => toggleScope(scope)}
                    disabled={isPending}
                    data-testid={`scope-${scope}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{scope}</span>
                      <span className="text-xs text-muted-foreground">
                        {SCOPE_DESCRIPTIONS[scope]}
                      </span>
                    </div>
                    {selectedScopes.includes(scope) && (
                      <Check className="size-4 text-[#CCFF00]" />
                    )}
                  </button>
                ))}
              </div>
              {scopesError && (
                <span className="font-mono text-xs text-destructive">{scopesError}</span>
              )}
            </div>

            {/* Expiration */}
            <div className="grid gap-2">
              <Label htmlFor="expiration">EXPIRATION (OPTIONNEL)</Label>
              <select
                id="expiration"
                className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm font-mono ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                disabled={isPending}
                data-testid="api-key-expiration-select"
              >
                <option value="">Jamais</option>
                <option value="30">30 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
                <option value="180">180 jours</option>
                <option value="365">1 an</option>
              </select>
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
            <Button
              type="submit"
              disabled={isPending || !name || selectedScopes.length === 0}
              data-testid="create-api-key-submit"
            >
              {isPending ? 'CREATION...' : 'CREER LA CLE'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
