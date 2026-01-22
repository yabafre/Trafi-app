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
import { Slider } from '@/components/ui/slider'
import type { CommerceSettingsFormData } from './CommerceSettingsForm'

interface PromotionsSettingsSectionProps {
  control: Control<CommerceSettingsFormData>
  disabled?: boolean
}

/**
 * Promotions settings section
 * AC1: promotionsEnabled, maxDiscountPercent, allowStackablePromos
 */
export function PromotionsSettingsSection({
  control,
  disabled,
}: PromotionsSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">PROMOTIONS</h3>
      </div>

      {/* promotionsEnabled */}
      <FormField
        control={control}
        name="promotionsEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between border border-border p-4">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                ACTIVER LES PROMOTIONS
              </FormLabel>
              <FormDescription className="font-mono text-xs text-muted-foreground">
                Permettre la creation de codes promo et reductions
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                data-testid="promotions-enabled-switch"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* maxDiscountPercent */}
      <FormField
        control={control}
        name="maxDiscountPercent"
        render={({ field }) => (
          <FormItem className="border border-border p-4">
            <div className="flex flex-row items-center justify-between">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                REDUCTION MAXIMALE
              </FormLabel>
              <span className="font-mono text-sm font-bold text-primary">
                {field.value}%
              </span>
            </div>
            <FormControl>
              <Slider
                value={[field.value]}
                onValueChange={([val]) => field.onChange(val)}
                min={0}
                max={100}
                step={5}
                disabled={disabled}
                className="mt-2"
                data-testid="max-discount-slider"
                aria-label={`Reduction maximale: ${field.value} pourcent`}
              />
            </FormControl>
            <FormDescription className="font-mono text-xs text-muted-foreground mt-2">
              Limite le pourcentage de reduction applicable sur une commande
            </FormDescription>
          </FormItem>
        )}
      />

      {/* allowStackablePromos */}
      <FormField
        control={control}
        name="allowStackablePromos"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between border border-border p-4">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase tracking-wider">
                PROMOTIONS CUMULABLES
              </FormLabel>
              <FormDescription className="font-mono text-xs text-muted-foreground">
                Autoriser plusieurs promotions sur une meme commande
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                data-testid="allow-stackable-promos-switch"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
