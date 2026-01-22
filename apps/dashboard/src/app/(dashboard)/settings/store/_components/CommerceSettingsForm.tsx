'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from '@trafi/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'
import { PromotionsSettingsSection } from './PromotionsSettingsSection'
import { GiftCardsSettingsSection } from './GiftCardsSettingsSection'
import { MultiCurrencySettingsSection } from './MultiCurrencySettingsSection'

/**
 * Form validation schema for commerce settings.
 * Aligned with UpdateStoreSettingsSchema from @trafi/validators but with
 * form-specific constraints (AC4: giftCardMinCents <= giftCardMaxCents, maxDiscountPercent 0-100).
 * UI enforces stricter min(100) for gift cards per AC2 business requirement.
 */
const commerceSettingsSchema = z
  .object({
    // Promotions
    promotionsEnabled: z.boolean(),
    maxDiscountPercent: z.number().int().min(0).max(100),
    allowStackablePromos: z.boolean(),
    // Gift Cards (min 100 cents = $1.00 per AC2)
    giftCardsEnabled: z.boolean(),
    giftCardMinCents: z.number().int().min(100),
    giftCardMaxCents: z.number().int().min(100),
    giftCardValidityDays: z.number().int().min(1).nullable(),
    // Multi-currency
    multiCurrencyEnabled: z.boolean(),
    displayPriceIncTax: z.boolean(),
  })
  .refine((data) => data.giftCardMinCents <= data.giftCardMaxCents, {
    message: 'Le montant minimum doit etre inferieur ou egal au maximum',
    path: ['giftCardMinCents'],
  })

export type CommerceSettingsFormData = z.infer<typeof commerceSettingsSchema>

/**
 * Commerce settings form for promotions, gift cards, and multi-currency
 * AC: 1, 2, 3, 4, 5, 6, 7
 */
export function CommerceSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const form = useForm<CommerceSettingsFormData>({
    resolver: zodResolver(commerceSettingsSchema),
    defaultValues: {
      promotionsEnabled: true,
      maxDiscountPercent: 100,
      allowStackablePromos: false,
      giftCardsEnabled: false,
      giftCardMinCents: 1000,
      giftCardMaxCents: 50000,
      giftCardValidityDays: null,
      multiCurrencyEnabled: false,
      displayPriceIncTax: true,
    },
  })

  const { reset, formState } = form
  const { isDirty, isValid } = formState

  // Sync form with server data
  useEffect(() => {
    if (settings) {
      reset({
        promotionsEnabled: settings.promotionsEnabled,
        maxDiscountPercent: settings.maxDiscountPercent,
        allowStackablePromos: settings.allowStackablePromos,
        giftCardsEnabled: settings.giftCardsEnabled,
        giftCardMinCents: settings.giftCardMinCents,
        giftCardMaxCents: settings.giftCardMaxCents,
        giftCardValidityDays: settings.giftCardValidityDays,
        multiCurrencyEnabled: settings.multiCurrencyEnabled,
        displayPriceIncTax: settings.displayPriceIncTax,
      })
    }
  }, [settings, reset])

  const onSubmit = (data: CommerceSettingsFormData) => {
    // Build payload with only changed fields
    const payload: Partial<CommerceSettingsFormData> = {}

    if (data.promotionsEnabled !== settings?.promotionsEnabled) {
      payload.promotionsEnabled = data.promotionsEnabled
    }
    if (data.maxDiscountPercent !== settings?.maxDiscountPercent) {
      payload.maxDiscountPercent = data.maxDiscountPercent
    }
    if (data.allowStackablePromos !== settings?.allowStackablePromos) {
      payload.allowStackablePromos = data.allowStackablePromos
    }
    if (data.giftCardsEnabled !== settings?.giftCardsEnabled) {
      payload.giftCardsEnabled = data.giftCardsEnabled
    }
    if (data.giftCardMinCents !== settings?.giftCardMinCents) {
      payload.giftCardMinCents = data.giftCardMinCents
    }
    if (data.giftCardMaxCents !== settings?.giftCardMaxCents) {
      payload.giftCardMaxCents = data.giftCardMaxCents
    }
    if (data.giftCardValidityDays !== settings?.giftCardValidityDays) {
      payload.giftCardValidityDays = data.giftCardValidityDays
    }
    if (data.multiCurrencyEnabled !== settings?.multiCurrencyEnabled) {
      payload.multiCurrencyEnabled = data.multiCurrencyEnabled
    }
    if (data.displayPriceIncTax !== settings?.displayPriceIncTax) {
      payload.displayPriceIncTax = data.displayPriceIncTax
    }

    if (Object.keys(payload).length === 0) {
      return // Nothing to update
    }

    updateSettings(payload)
  }

  // AC7: Loading skeleton
  if (isLoading) {
    return <SettingsFormSkeleton />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <PromotionsSettingsSection control={form.control} disabled={isPending} />
        <GiftCardsSettingsSection
          control={form.control}
          watch={form.watch}
          disabled={isPending}
          currency={settings?.defaultCurrency}
        />
        <MultiCurrencySettingsSection control={form.control} disabled={isPending} />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending || !isDirty || !isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase rounded-none"
          data-testid="commerce-settings-save-button"
        >
          {isPending ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
        </Button>
      </form>
    </Form>
  )
}
