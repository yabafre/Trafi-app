## Story 4.8: Checkout Flow - Address and Shipping Selection

As a **Buyer (Emma)**,
I want **to enter my shipping address and select delivery method**,
So that **I know when and how my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer is in checkout
**When** they enter shipping address
**Then** address autocomplete helps speed entry
**And** available shipping methods update based on address
**And** shipping costs and delivery estimates are shown
**And** selected method is highlighted with price and timeframe
**And** address validation prevents invalid submissions

### Technical Implementation

#### File Structure
```
apps/storefront/src/app/checkout/_components/
├── shipping-step.tsx                  # Step 2: Address + Shipping
├── address-form.tsx                   # Address input with autocomplete
├── address-autocomplete.tsx           # Google Places integration
└── saved-addresses-list.tsx           # For logged-in users

apps/api/src/
├── address/
│   ├── address.module.ts
│   ├── address-validation.service.ts  # Address verification
│   └── google-places.service.ts       # Places API integration
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/address.ts
export const AddressAutocompleteInputSchema = z.object({
  query: z.string().min(3),
  countryCode: z.string().length(2).optional(),
  sessionToken: z.string(), // Google Places session token
});

export const AddressAutocompleteResultSchema = z.object({
  placeId: z.string(),
  description: z.string(),
  mainText: z.string(),
  secondaryText: z.string(),
});

export const AddressValidationInputSchema = z.object({
  address: CheckoutShippingAddressSchema,
});

export const AddressValidationResultSchema = z.object({
  isValid: z.boolean(),
  normalizedAddress: CheckoutShippingAddressSchema.optional(),
  suggestions: z.array(CheckoutShippingAddressSchema).optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});
```

#### Backend Service (`apps/api/src/address/address-validation.service.ts`)
```typescript
@Injectable()
export class AddressValidationService {
  constructor(private googlePlaces: GooglePlacesService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async validateAddress(
    address: ShippingAddress,
  ): Promise<AddressValidationResult> {
    // Basic format validation
    const formatErrors = this.validateFormat(address);
    if (formatErrors.length) {
      return { isValid: false, errors: formatErrors };
    }

    // Validate postal code format for country
    const postalValid = this.validatePostalCode(
      address.postalCode,
      address.countryCode,
    );
    if (!postalValid) {
      return {
        isValid: false,
        errors: [{ field: 'postalCode', message: 'Invalid postal code format' }],
      };
    }

    // Optional: Use Google Address Validation API for accuracy
    if (this.googlePlaces.isEnabled()) {
      const normalized = await this.googlePlaces.validateAddress(address);
      if (normalized) {
        return {
          isValid: true,
          normalizedAddress: normalized,
        };
      }
    }

    return { isValid: true };
  }

  protected async autocomplete(
    input: AddressAutocompleteInput,
  ): Promise<AddressAutocompleteResult[]> {
    return this.googlePlaces.autocomplete({
      input: input.query,
      sessionToken: input.sessionToken,
      types: ['address'],
      componentRestrictions: input.countryCode
        ? { country: input.countryCode }
        : undefined,
    });
  }

  protected async getPlaceDetails(
    placeId: string,
    sessionToken: string,
  ): Promise<ShippingAddress> {
    const details = await this.googlePlaces.getPlaceDetails(placeId, sessionToken);
    return this.mapPlaceToAddress(details);
  }

  private validatePostalCode(postalCode: string, countryCode: string): boolean {
    const patterns: Record<string, RegExp> = {
      FR: /^\d{5}$/,
      US: /^\d{5}(-\d{4})?$/,
      GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      DE: /^\d{5}$/,
      // Add more as needed
    };
    const pattern = patterns[countryCode];
    return !pattern || pattern.test(postalCode);
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/address.router.ts`)
```typescript
export const addressRouter = router({
  autocomplete: publicProcedure
    .input(AddressAutocompleteInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.addressValidationService.autocomplete(input);
    }),

  getPlaceDetails: publicProcedure
    .input(z.object({ placeId: z.string(), sessionToken: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.addressValidationService.getPlaceDetails(
        input.placeId,
        input.sessionToken,
      );
    }),

  validate: publicProcedure
    .input(AddressValidationInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.addressValidationService.validateAddress(input.address);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│ ShippingStep (Client Component)                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ AddressForm                                                        │ │
│ │   ├─ AddressAutocomplete (first name, address line 1)              │ │
│ │   │   └─ On type: trpc.address.autocomplete.useQuery()             │ │
│ │   │   └─ On select: trpc.address.getPlaceDetails.useQuery()        │ │
│ │   │       └─ Auto-fills: address1, city, stateCode, postalCode     │ │
│ │   │                                                                │ │
│ │   ├─ Manual fields (editable after autocomplete):                  │ │
│ │   │   [First Name] [Last Name]                                     │ │
│ │   │   [Address 1] (with autocomplete)                              │ │
│ │   │   [Address 2] (optional)                                       │ │
│ │   │   [City] [State] [Postal Code]                                 │ │
│ │   │   [Country] (dropdown)                                         │ │
│ │   │   [Phone] (optional)                                           │ │
│ │   │                                                                │ │
│ │   └─ onBlur: trpc.address.validate.useMutation()                   │ │
│ │       └─ Shows normalized address suggestion if different          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ShippingMethodSelector (appears after valid address)               │ │
│ │   └─ Uses trpc.shipping.calculateRates (from Story 4.5)            │ │
│ │   └─ Auto-selects recommended (cheapest) option                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Continue to Payment Button                                          │ │
│ │   └─ Disabled until address valid + shipping selected              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Address Form (`apps/storefront/src/app/checkout/_components/address-form.tsx`)
```typescript
'use client';

export function AddressForm({ onSubmit, defaultValues }: AddressFormProps) {
  const form = useForm<ShippingAddress>({
    resolver: zodResolver(CheckoutShippingAddressSchema),
    defaultValues,
  });

  const [sessionToken] = useState(() => crypto.randomUUID());
  const countryCode = form.watch('countryCode');

  // Address validation on blur
  const validateAddress = trpc.address.validate.useMutation();

  const handleAddressBlur = async () => {
    const address = form.getValues();
    if (!address.address1 || !address.city || !address.postalCode) return;

    const result = await validateAddress.mutateAsync({ address });
    if (result.normalizedAddress) {
      // Show suggestion dialog
      setNormalizedSuggestion(result.normalizedAddress);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="address1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <AddressAutocomplete
                  {...field}
                  sessionToken={sessionToken}
                  countryCode={countryCode}
                  onSelect={(address) => {
                    form.setValue('address1', address.address1);
                    form.setValue('city', address.city);
                    form.setValue('stateCode', address.stateCode);
                    form.setValue('postalCode', address.postalCode);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ... other fields ... */}

        <FormField
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <CountrySelect {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

#### Address Autocomplete (`apps/storefront/src/app/checkout/_components/address-autocomplete.tsx`)
```typescript
'use client';

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  sessionToken,
  countryCode,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const { data: suggestions } = trpc.address.autocomplete.useQuery(
    { query, sessionToken, countryCode },
    { enabled: query.length >= 3 },
  );

  const getDetails = trpc.address.getPlaceDetails.useMutation();

  const handleSelect = async (placeId: string) => {
    const address = await getDetails.mutateAsync({ placeId, sessionToken });
    onChange(address.address1);
    onSelect(address);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen && !!suggestions?.length} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Start typing your address..."
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {suggestions?.map((suggestion) => (
          <button
            key={suggestion.placeId}
            onClick={() => handleSelect(suggestion.placeId)}
            className="w-full px-4 py-2 text-left hover:bg-muted"
          >
            <p className="font-medium">{suggestion.mainText}</p>
            <p className="text-sm text-muted-foreground">
              {suggestion.secondaryText}
            </p>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

#### UX Implementation Notes
- **Autocomplete**: Uses Google Places API, debounced 300ms, minimum 3 characters
- **Session Token**: Reuse same token for autocomplete + details to reduce API costs
- **Country Pre-select**: Default to store's primary country, allow change
- **Address Validation**: On blur, suggest normalized address if different
- **Shipping Methods**: Auto-refresh when country or postal code changes
- **Error Messages**: Inline validation errors, clear field-specific messages
- **Accessibility**: Proper ARIA labels, keyboard navigation for autocomplete
- **Mobile UX**: Full-width inputs, native country picker, appropriate keyboard types

---

