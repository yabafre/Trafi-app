'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Copy, Check } from 'lucide-react'
import { useIssueGiftCard, useGiftCardTemplatesForSelect } from '../_hooks'
import { formatCurrency, parseEuroToCents, formatCentsToEuroInput } from '@/lib/utils'

interface IssueGiftCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog for issuing a new gift card
 *
 * Supports template selection with pre-defined denominations
 * or custom amount input.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC2, AC6)
 */
export function IssueGiftCardDialog({ open, onOpenChange }: IssueGiftCardDialogProps) {
  const [issuedCode, setIssuedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [templateId, setTemplateId] = useState<string>('')
  const [amountCents, setAmountCents] = useState(5000)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [activateImmediately, setActivateImmediately] = useState(true)

  const issueMutation = useIssueGiftCard()
  const { data: templates } = useGiftCardTemplatesForSelect()

  const selectedTemplate = templates?.find((t) => t.id === templateId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await issueMutation.mutateAsync({
      templateId: templateId || undefined,
      amountCents,
      currencyCode: 'EUR',
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      senderName: senderName || undefined,
      giftMessage: giftMessage || undefined,
      activateImmediately,
    })
    setIssuedCode(result.code)
  }

  const handleCopyCode = async () => {
    if (issuedCode) {
      await navigator.clipboard.writeText(issuedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetForm = () => {
    setTemplateId('')
    setAmountCents(5000)
    setRecipientEmail('')
    setRecipientName('')
    setSenderName('')
    setGiftMessage('')
    setActivateImmediately(true)
  }

  const handleClose = () => {
    setIssuedCode(null)
    setCopied(false)
    resetForm()
    onOpenChange(false)
  }

  // Show success view with code
  if (issuedCode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gift Card Issued</DialogTitle>
            <DialogDescription>
              Copy this code now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 bg-muted rounded-none border-2 border-dashed">
              <p className="text-center font-mono text-2xl tracking-wider select-all">
                {issuedCode}
              </p>
            </div>
            <Button onClick={handleCopyCode} className="w-full" variant="outline">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Gift Card</DialogTitle>
          <DialogDescription>
            Create a new gift card. The code will be shown once after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Templates have pre-defined denominations and validity settings.
              </p>
            </div>
          )}

          {/* Amount Selection */}
          <div className="space-y-2">
            <Label>Amount *</Label>
            {selectedTemplate?.denominations ? (
              <Select
                value={amountCents.toString()}
                onValueChange={(value) => setAmountCents(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select amount..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedTemplate.denominations.map((amount) => (
                    <SelectItem key={amount} value={amount.toString()}>
                      {formatCurrency(amount, 'EUR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                step="0.01"
                placeholder="50.00"
                value={formatCentsToEuroInput(amountCents)}
                onChange={(e) => setAmountCents(parseEuroToCents(e.target.value))}
                required
              />
            )}
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label>Recipient Email (Optional)</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For email delivery of the gift card code.
            </p>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label>Recipient Name (Optional)</Label>
            <Input
              placeholder="John Doe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          {/* Sender Name */}
          <div className="space-y-2">
            <Label>Sender Name (Optional)</Label>
            <Input
              placeholder="From: Jane"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          {/* Gift Message */}
          <div className="space-y-2">
            <Label>Gift Message (Optional)</Label>
            <Textarea
              placeholder="Happy Birthday! Enjoy your gift..."
              rows={3}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A personal message to include with the gift card.
            </p>
          </div>

          {/* Activate Immediately */}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Activate Immediately</Label>
              <p className="text-xs text-muted-foreground">
                If off, the card will be in &quot;Pending&quot; status.
              </p>
            </div>
            <Switch
              checked={activateImmediately}
              onCheckedChange={setActivateImmediately}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={issueMutation.isPending || amountCents <= 0}>
              {issueMutation.isPending ? 'Issuing...' : 'Issue Gift Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
