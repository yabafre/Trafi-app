'use client'

import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import type { CommerceSettingsFormData } from './CommerceSettingsForm'

interface MultiCurrencySettingsSectionProps {
  control: Control<CommerceSettingsFormData>
  disabled?: boolean
}

/**
 * Multi-currency settings section
 * AC3: multiCurrencyEnabled, displayPriceIncTax
 */
export function MultiCurrencySettingsSection({
  control,
  disabled,
}: MultiCurrencySettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">MULTI-DEVISES</h3>
      </div>

      {/* multiCurrencyEnabled */}
      <FormField
        control={control}
        name="multiCurrencyEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between border border-border p-4">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                MULTI-DEVISES
              </FormLabel>
              <FormDescription className="font-mono text-xs text-muted-foreground">
                Autoriser les transactions dans plusieurs devises
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                data-testid="multi-currency-enabled-switch"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* displayPriceIncTax */}
      <FormField
        control={control}
        name="displayPriceIncTax"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between border border-border p-4">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                PRIX TTC
              </FormLabel>
              <FormDescription className="font-mono text-xs text-muted-foreground">
                Afficher les prix avec les taxes incluses
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                data-testid="display-price-inc-tax-switch"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
