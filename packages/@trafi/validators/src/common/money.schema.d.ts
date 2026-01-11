import { z } from 'zod';
export declare const CurrencySchema: z.ZodEnum<["EUR", "USD", "GBP"]>;
export type Currency = z.infer<typeof CurrencySchema>;
export declare const MoneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodEnum<["EUR", "USD", "GBP"]>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: "EUR" | "USD" | "GBP";
}, {
    amount: number;
    currency: "EUR" | "USD" | "GBP";
}>;
export type Money = z.infer<typeof MoneySchema>;
export declare const PriceSchema: z.ZodObject<{
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["EUR", "USD", "GBP"]>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    }, {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    }>;
    compareAtPrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["EUR", "USD", "GBP"]>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    }, {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    }>>;
}, "strip", z.ZodTypeAny, {
    price: {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    };
    compareAtPrice?: {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    } | undefined;
}, {
    price: {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    };
    compareAtPrice?: {
        amount: number;
        currency: "EUR" | "USD" | "GBP";
    } | undefined;
}>;
export type Price = z.infer<typeof PriceSchema>;
//# sourceMappingURL=money.schema.d.ts.map