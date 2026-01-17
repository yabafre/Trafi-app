'use client'

import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ApiKeyCreatedModalProps {
  open: boolean
  onClose: () => void
  keyValue: string
  keyName: string
}

export function ApiKeyCreatedModal({ open, onClose, keyValue, keyName }: ApiKeyCreatedModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = keyValue
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setCopied(false)
    setConfirmed(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-[#00FF94]">CLE API CREEE</span>
          </DialogTitle>
          <DialogDescription>
            Votre cle API <span className="font-mono text-foreground">{keyName}</span> a ete creee avec succes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Warning Banner */}
          <div className="mb-4 flex items-start gap-3 border border-[#FF9900] bg-[#FF9900]/10 p-4">
            <AlertTriangle className="size-5 text-[#FF9900] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-[#FF9900]">ATTENTION</p>
              <p className="text-muted-foreground">
                Cette cle ne sera affichee qu'une seule fois. Copiez-la maintenant et
                conservez-la en lieu sur. Si vous la perdez, vous devrez en creer une nouvelle.
              </p>
            </div>
          </div>

          {/* Key Display */}
          <div className="grid gap-2">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              VOTRE CLE API
            </label>
            <div className="relative">
              <code className="block w-full overflow-x-auto border border-border bg-neutral-900 p-4 font-mono text-sm break-all">
                {keyValue}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2"
                onClick={handleCopy}
                data-testid="copy-api-key-button"
              >
                {copied ? (
                  <Check className="size-4 text-[#00FF94]" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mt-4">
            <button
              type="button"
              className={`flex items-center gap-3 w-full px-3 py-3 text-left transition-colors ${
                confirmed
                  ? 'bg-[#CCFF00]/10 border border-[#CCFF00]'
                  : 'bg-secondary/20 border border-border hover:bg-secondary/40'
              }`}
              onClick={() => setConfirmed(!confirmed)}
              data-testid="confirm-key-copied"
            >
              <div
                className={`flex items-center justify-center size-5 border ${
                  confirmed
                    ? 'bg-[#CCFF00] border-[#CCFF00]'
                    : 'bg-transparent border-neutral-600'
                }`}
              >
                {confirmed && <Check className="size-3 text-black" />}
              </div>
              <span className="text-sm">J'ai copie ma cle API en lieu sur</span>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleClose}
            disabled={!confirmed}
            data-testid="close-api-key-modal"
          >
            FERMER
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
