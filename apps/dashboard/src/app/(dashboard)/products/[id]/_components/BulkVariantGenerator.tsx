'use client'

/**
 * Bulk Variant Generator
 *
 * Multi-step wizard to generate all variant combinations from option types.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useState, useMemo } from 'react'
import { Plus, X, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBulkCreateVariants } from '../_hooks'

interface BulkVariantGeneratorProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface OptionType {
  name: string
  values: string[]
}

type Step = 'options' | 'price' | 'preview'

export function BulkVariantGenerator({ productId, open, onOpenChange }: BulkVariantGeneratorProps) {
  const [step, setStep] = useState<Step>('options')
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([{ name: '', values: [''] }])
  const [defaultPriceEuros, setDefaultPriceEuros] = useState('')

  const { mutate, isPending } = useBulkCreateVariants({
    productId,
    onSuccess: () => {
      resetForm()
      onOpenChange(false)
    },
  })

  const resetForm = () => {
    setStep('options')
    setOptionTypes([{ name: '', values: [''] }])
    setDefaultPriceEuros('')
  }

  // Calculate combinations
  const combinationsCount = useMemo(() => {
    const validTypes = optionTypes.filter(
      (t) => t.name.trim() && t.values.some((v) => v.trim())
    )
    if (validTypes.length === 0) return 0

    return validTypes.reduce((acc, type) => {
      const validValues = type.values.filter((v) => v.trim())
      return acc * validValues.length
    }, 1)
  }, [optionTypes])

  // Generate preview combinations
  const previewCombinations = useMemo(() => {
    const validTypes = optionTypes.filter(
      (t) => t.name.trim() && t.values.some((v) => v.trim())
    )
    if (validTypes.length === 0) return []

    let combinations: { name: string; value: string }[][] = [[]]

    for (const type of validTypes) {
      const validValues = type.values.filter((v) => v.trim())
      const newCombinations: { name: string; value: string }[][] = []

      for (const combo of combinations) {
        for (const value of validValues) {
          newCombinations.push([...combo, { name: type.name.trim(), value: value.trim() }])
        }
      }
      combinations = newCombinations
    }

    return combinations
  }, [optionTypes])

  // Option type management
  const addOptionType = () => {
    if (optionTypes.length < 3) {
      setOptionTypes([...optionTypes, { name: '', values: [''] }])
    }
  }

  const removeOptionType = (index: number) => {
    if (optionTypes.length > 1) {
      setOptionTypes(optionTypes.filter((_, i) => i !== index))
    }
  }

  const updateOptionTypeName = (index: number, name: string) => {
    const newTypes = [...optionTypes]
    newTypes[index].name = name
    setOptionTypes(newTypes)
  }

  const addValue = (typeIndex: number) => {
    if (optionTypes[typeIndex].values.length < 10) {
      const newTypes = [...optionTypes]
      newTypes[typeIndex].values.push('')
      setOptionTypes(newTypes)
    }
  }

  const removeValue = (typeIndex: number, valueIndex: number) => {
    if (optionTypes[typeIndex].values.length > 1) {
      const newTypes = [...optionTypes]
      newTypes[typeIndex].values = newTypes[typeIndex].values.filter((_, i) => i !== valueIndex)
      setOptionTypes(newTypes)
    }
  }

  const updateValue = (typeIndex: number, valueIndex: number, value: string) => {
    const newTypes = [...optionTypes]
    newTypes[typeIndex].values[valueIndex] = value
    setOptionTypes(newTypes)
  }

  const handleSubmit = () => {
    const validTypes = optionTypes
      .filter((t) => t.name.trim() && t.values.some((v) => v.trim()))
      .map((t) => ({
        name: t.name.trim(),
        values: t.values.filter((v) => v.trim()).map((v) => v.trim()),
      }))

    const defaultPriceInCents = Math.round(
      parseFloat(defaultPriceEuros.replace(',', '.')) * 100
    )

    mutate({
      productId,
      optionTypes: validTypes,
      defaultPriceInCents,
    })
  }

  const canProceedToPrice =
    optionTypes.some((t) => t.name.trim() && t.values.some((v) => v.trim())) &&
    combinationsCount > 0

  const canProceedToPreview =
    defaultPriceEuros && parseFloat(defaultPriceEuros.replace(',', '.')) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generer des variantes</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <StepIndicator label="Options" active={step === 'options'} complete={step !== 'options'} />
            <ChevronRight className="size-4 text-muted-foreground" />
            <StepIndicator label="Prix" active={step === 'price'} complete={step === 'preview'} />
            <ChevronRight className="size-4 text-muted-foreground" />
            <StepIndicator label="Apercu" active={step === 'preview'} complete={false} />
          </div>
        </DialogHeader>

        {/* Step 1: Options */}
        {step === 'options' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Definissez les types d&apos;options et leurs valeurs. Ex: Taille (S, M, L), Couleur
              (Rouge, Bleu)
            </p>

            {optionTypes.map((type, typeIndex) => (
              <div key={typeIndex} className="border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type d'option (ex: Taille)"
                    value={type.name}
                    onChange={(e) => updateOptionTypeName(typeIndex, e.target.value)}
                    className="flex-1"
                  />
                  {optionTypes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOptionType(typeIndex)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">Valeurs</Label>
                  {type.values.map((value, valueIndex) => (
                    <div key={valueIndex} className="flex items-center gap-2">
                      <Input
                        placeholder={`Valeur ${valueIndex + 1}`}
                        value={value}
                        onChange={(e) => updateValue(typeIndex, valueIndex, e.target.value)}
                        className="flex-1"
                      />
                      {type.values.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeValue(typeIndex, valueIndex)}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {type.values.length < 10 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addValue(typeIndex)}
                    >
                      <Plus className="mr-1 size-3" />
                      Ajouter une valeur
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {optionTypes.length < 3 && (
              <Button type="button" variant="outline" onClick={addOptionType}>
                <Plus className="mr-2 size-4" />
                Ajouter un type d&apos;option
              </Button>
            )}

            {combinationsCount > 0 && (
              <div className="border border-border p-3 bg-secondary/30">
                <p className="font-mono text-sm">
                  {combinationsCount} combinaison{combinationsCount > 1 ? 's' : ''} seront creees
                </p>
                {combinationsCount > 50 && (
                  <p className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                    <AlertTriangle className="size-3" />
                    Attention: nombre eleve de variantes
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Price */}
        {step === 'price' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Definissez le prix par defaut pour toutes les variantes. Vous pourrez modifier les
              prix individuellement apres.
            </p>

            <div className="space-y-1">
              <Label htmlFor="defaultPrice" className="font-mono text-xs uppercase">
                Prix par defaut (EUR) *
              </Label>
              <Input
                id="defaultPrice"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={defaultPriceEuros}
                onChange={(e) => setDefaultPriceEuros(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifiez les variantes qui seront creees:
            </p>

            <div className="max-h-64 overflow-y-auto border border-border">
              <table className="w-full">
                <thead className="bg-secondary/30 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-mono text-xs uppercase text-muted-foreground">
                      Options
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-xs uppercase text-muted-foreground">
                      Prix
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewCombinations.map((combo, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {combo.map((opt, i) => (
                            <span
                              key={i}
                              className="bg-[#333333] px-2 py-0.5 text-xs font-mono text-white"
                            >
                              {opt.name}: {opt.value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(parseFloat(defaultPriceEuros.replace(',', '.')))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-accent p-3 bg-accent/10">
              <p className="font-mono text-sm text-accent">
                {combinationsCount} variante{combinationsCount > 1 ? 's' : ''} seront creees
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step !== 'options' && (
              <Button
                variant="ghost"
                onClick={() => setStep(step === 'preview' ? 'price' : 'options')}
                disabled={isPending}
              >
                <ChevronLeft className="mr-1 size-4" />
                Retour
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isPending}
            >
              Annuler
            </Button>

            {step === 'options' && (
              <Button onClick={() => setStep('price')} disabled={!canProceedToPrice}>
                Suivant
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}

            {step === 'price' && (
              <Button onClick={() => setStep('preview')} disabled={!canProceedToPreview}>
                Apercu
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}

            {step === 'preview' && (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Creation...' : `Creer ${combinationsCount} variantes`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({
  label,
  active,
  complete,
}: {
  label: string
  active: boolean
  complete: boolean
}) {
  return (
    <span
      className={`font-mono text-xs ${
        active ? 'text-accent' : complete ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {label}
    </span>
  )
}
