"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceSchema = exports.MoneySchema = exports.CurrencySchema = void 0;
const zod_1 = require("zod");
exports.CurrencySchema = zod_1.z.enum(['EUR', 'USD', 'GBP']);
exports.MoneySchema = zod_1.z.object({
    amount: zod_1.z.number().int().describe('Amount in cents (e.g., 1999 = 19.99)'),
    currency: exports.CurrencySchema,
});
exports.PriceSchema = zod_1.z.object({
    price: exports.MoneySchema,
    compareAtPrice: exports.MoneySchema.optional(),
});
//# sourceMappingURL=money.schema.js.map