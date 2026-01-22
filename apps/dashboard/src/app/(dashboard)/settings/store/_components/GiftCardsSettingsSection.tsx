'use client'

import type { Control, UseFormWatch } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import type { CommerceSettingsFormData } from './CommerceSettingsForm'

interface GiftCardsSettingsSectionProps {
  control: Control<CommerceSettingsFormData>
  watch: UseFormWatch<CommerceSettingsFormData>
  disabled?: boolean
  currency?: string
}

/**
 * Convert cents to display value (e.g., 1000 -> "10.00")
 */
const centsToDisplay = (cents: number): string => (cents / 100).toFixed(2)

/**
 * Convert display value to cents using string manipulation to avoid
 * floating point precision issues (e.g., "10.05" -> 1005, not 1004.9999...)
 */
const displayToCents = (display: string): number => {
  const trimmed = display.trim()
  if (!trimmed || trimmed === '.') return 0

  // Split on decimal point and handle integer/decimal parts separately
  const parts = trimmed.split('.')
  const integerPart = parseInt(parts[0] || '0', 10) || 0
  const decimalPart = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00'
  const decimalValue = parseInt(decimalPart, 10) || 0

  return integerPart * 100 + decimalValue
}

/**
 * Gift cards settings section
 * AC2: giftCardsEnabled, giftCardMinCents, giftCardMaxCents, giftCardValidityDays
 */
export function GiftCardsSettingsSection({
  control,
  watch,
  disabled,
  currency = 'EUR',
}: GiftCardsSettingsSectionProps) {
  const giftCardsEnabled = watch('giftCardsEnabled')

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">CARTES CADEAUX</h3>
      </div>

      {/* giftCardsEnabled */}
      <FormField
        control={control}
        name="giftCardsEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between border border-border p-4">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                ACTIVER LES CARTES CADEAUX
              </FormLabel>
              <FormDescription className="font-mono text-xs text-muted-foreground">
                Permettre la vente et l'utilisation de cartes cadeaux
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                data-testid="gift-cards-enabled-switch"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Conditional fields - only show when gift cards enabled */}
      {giftCardsEnabled && (
        <>
          {/* giftCardMinCents */}
          <FormField
            control={control}
            name="giftCardMinCents"
            render={({ field }) => (
              <FormItem className="border border-border p-4">
                <FormLabel className="font-mono text-xs uppercase tracking-wider">
                  MONTANT MINIMUM
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                      {currency}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={centsToDisplay(field.value)}
                      onChange={(e) => field.onChange(displayToCents(e.target.value))}
                      disabled={disabled}
                      className="pl-12 border-border bg-transparent rounded-none focus:border-primary focus:ring-primary font-mono"
                      data-testid="gift-card-min-cents-input"
                    />
                  </div>
                </FormControl>
                <FormDescription className="font-mono text-xs text-muted-foreground">
                  Valeur minimale d'une carte cadeau (min: 1.00 EUR)
                </FormDescription>
                <FormMessage className="font-mono text-xs" />
              </FormItem>
            )}
          />

          {/* giftCardMaxCents */}
          <FormField
            control={control}
            name="giftCardMaxCents"
            render={({ field }) => (
              <FormItem className="border border-border p-4">
                <FormLabel className="font-mono text-xs uppercase tracking-wider">
                  MONTANT MAXIMUM
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                      {currency}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={centsToDisplay(field.value)}
                      onChange={(e) => field.onChange(displayToCents(e.target.value))}
                      disabled={disabled}
                      className="pl-12 border-border bg-transparent rounded-none focus:border-primary focus:ring-primary font-mono"
                      data-testid="gift-card-max-cents-input"
                    />
                  </div>
                </FormControl>
                <FormDescription className="font-mono text-xs text-muted-foreground">
                  Valeur maximale d'une carte cadeau
                </FormDescription>
                <FormMessage className="font-mono text-xs" />
              </FormItem>
            )}
          />

          {/* giftCardValidityDays */}
          <FormField
            control={control}
            name="giftCardValidityDays"
            render={({ field }) => (
              <FormItem className="border border-border p-4">
                <FormLabel className="font-mono text-xs uppercase tracking-wider">
                  VALIDITE (JOURS)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? null : parseInt(val, 10))
                    }}
                    placeholder="Illimite"
                    disabled={disabled}
                    className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary font-mono"
                    data-testid="gift-card-validity-days-input"
                  />
                </FormControl>
                <FormDescription className="font-mono text-xs text-muted-foreground">
                  Nombre de jours avant expiration (vide = jamais)
                </FormDescription>
                <FormMessage className="font-mono text-xs" />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}
