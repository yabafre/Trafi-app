## Story 3.10: Gift Cards

As a **Merchant**,
I want **to sell and manage gift cards**,
So that **customers can purchase them as gifts and use them for payment**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they access Gift Cards settings
**Then** they can:
- Create gift card templates with denominations
- Issue gift cards manually or via purchase
- Track gift card balances and transactions
- View gift card usage analytics
**And** gift cards can be used as payment method at checkout
**And** partial balance usage is supported
**And** gift cards have secure, unique codes

**FRs covered:** FR110, FR111, FR112, FR113

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/marketing/gift-cards/
├── page.tsx                          # RSC - Gift cards list
├── _components/
│   ├── GiftCardsDataTable.tsx
│   ├── GiftCardStatusBadge.tsx
│   ├── IssueGiftCardDialog.tsx
│   └── GiftCardBalanceCell.tsx
├── _hooks/
│   ├── useGiftCards.ts
│   └── useIssueGiftCard.ts
├── templates/
│   ├── page.tsx                      # Gift card templates
│   └── _components/
│       └── TemplateForm.tsx
└── [giftCardId]/
    ├── page.tsx                      # Gift card detail
    └── _components/
        ├── GiftCardDetails.tsx
        └── TransactionsTable.tsx

apps/api/src/modules/gift-cards/
├── gift-cards.module.ts
├── gift-cards.service.ts
├── gift-card-payment.service.ts      # Payment integration
└── dto/
    ├── issue-gift-card.dto.ts
    └── redeem-gift-card.dto.ts
```

#### Prisma Schema (`apps/api/prisma/schema/gift-card.prisma`)
```prisma
// =============================================================================
// Gift Cards Domain Schema
// =============================================================================
// Digital gift cards with balance tracking
// ID prefix: gc_, gctx_, gctpl_
// Money fields: INTEGER cents (ARCH-25)
// =============================================================================

enum GiftCardStatus {
  PENDING      // Purchased but not yet delivered
  ACTIVE       // Ready to use
  DISABLED     // Manually disabled by admin
  EXPIRED      // Past expiration date
  DEPLETED     // Zero balance
}

enum GiftCardTransactionType {
  CREDIT       // Initial load or top-up
  DEBIT        // Used for purchase
  REFUND       // Returned to balance
  ADJUSTMENT   // Admin manual change
  EXPIRATION   // Balance expired
}

model GiftCard {
  id                    String                @id @default(cuid())
  storeId               String                @map("store_id")
  codeHash              String                @map("code_hash")     // Hashed for security
  codeLast4             String                @map("code_last4")    // Last 4 for display
  initialBalanceCents   Int                   @map("initial_balance_cents")
  currentBalanceCents   Int                   @map("current_balance_cents")
  currencyCode          String                @default("EUR") @map("currency_code")
  status                GiftCardStatus        @default(PENDING)
  purchasedById         String?               @map("purchased_by_id")
  recipientEmail        String?               @map("recipient_email")
  recipientName         String?               @map("recipient_name")
  senderName            String?               @map("sender_name")
  giftMessage           String?               @map("gift_message")
  expiresAt             DateTime?             @map("expires_at")
  activatedAt           DateTime?             @map("activated_at")
  lastUsedAt            DateTime?             @map("last_used_at")
  issuedFromOrderId     String?               @map("issued_from_order_id")
  templateId            String?               @map("template_id")
  metadata              Json?
  createdAt             DateTime              @default(now()) @map("created_at")
  updatedAt             DateTime              @updatedAt @map("updated_at")

  // Relations
  store                 Store                 @relation(fields: [storeId], references: [id], onDelete: Cascade)
  purchasedBy           Customer?             @relation("GiftCardPurchaser", fields: [purchasedById], references: [id])
  template              GiftCardTemplate?     @relation(fields: [templateId], references: [id])
  transactions          GiftCardTransaction[]

  @@unique([storeId, codeHash])
  @@index([storeId])
  @@index([storeId, status])
  @@index([recipientEmail])
  @@map("gift_cards")
}

model GiftCardTransaction {
  id                String                    @id @default(cuid())
  storeId           String                    @map("store_id")
  giftCardId        String                    @map("gift_card_id")
  type              GiftCardTransactionType
  amountCents       Int                       @map("amount_cents")  // Positive = credit
  balanceAfterCents Int                       @map("balance_after_cents")
  orderId           String?                   @map("order_id")
  reason            String?
  performedById     String?                   @map("performed_by_id")
  createdAt         DateTime                  @default(now()) @map("created_at")

  // Relations
  store             Store                     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  giftCard          GiftCard                  @relation(fields: [giftCardId], references: [id], onDelete: Cascade)
  performedBy       User?                     @relation(fields: [performedById], references: [id])

  @@index([storeId])
  @@index([giftCardId])
  @@index([orderId])
  @@map("gift_card_transactions")
}

model GiftCardTemplate {
  id                  String      @id @default(cuid())
  storeId             String      @map("store_id")
  name                String
  description         String?
  designImageUrl      String?     @map("design_image_url")
  denominations       Int[]       // Available amounts in cents
  allowCustomAmount   Boolean     @default(false) @map("allow_custom_amount")
  minAmountCents      Int?        @map("min_amount_cents")
  maxAmountCents      Int?        @map("max_amount_cents")
  validityDays        Int?        @map("validity_days")  // null = never expires
  isActive            Boolean     @default(true) @map("is_active")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  store               Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  giftCards           GiftCard[]

  @@index([storeId])
  @@index([storeId, isActive])
  @@map("gift_card_templates")
}
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/gift-card/gift-card.schema.ts
import { z } from 'zod';

export const GiftCardStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'DISABLED',
  'EXPIRED',
  'DEPLETED',
]);

export const IssueGiftCardSchema = z.object({
  templateId: z.string().optional(),
  amountCents: z.number().int().positive(),
  currencyCode: z.string().length(3).default('EUR'),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(100).optional(),
  senderName: z.string().max(100).optional(),
  giftMessage: z.string().max(500).optional(),
  expiresAt: z.date().optional(),
  sendEmail: z.boolean().default(true),
});

export const RedeemGiftCardSchema = z.object({
  code: z.string().min(8).max(32),
  orderId: z.string(),
  amountCents: z.number().int().positive(),
});

export const CreateGiftCardTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  designImageUrl: z.string().url().optional(),
  denominations: z.array(z.number().int().positive()).min(1),
  allowCustomAmount: z.boolean().default(false),
  minAmountCents: z.number().int().positive().optional(),
  maxAmountCents: z.number().int().positive().optional(),
  validityDays: z.number().int().positive().optional(),
});
```

#### Backend Service (`apps/api/src/modules/gift-cards/gift-cards.service.ts`)
```typescript
@Injectable()
export class GiftCardsService {
  private readonly CODE_LENGTH = 16;

  constructor(
    private prisma: PrismaService,
    private idService: IdService,
    private emailService: EmailService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async issue(storeId: string, input: IssueGiftCardInput): Promise<GiftCard> {
    // Generate secure code
    const code = this.generateSecureCode();
    const codeHash = await this.hashCode(code);
    const codeLast4 = code.slice(-4);

    // Determine expiration
    let expiresAt = input.expiresAt;
    if (!expiresAt && input.templateId) {
      const template = await this.prisma.giftCardTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (template?.validityDays) {
        expiresAt = new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000);
      }
    }

    const giftCard = await this.prisma.$transaction(async (tx) => {
      // Create gift card
      const gc = await tx.giftCard.create({
        data: {
          id: this.idService.generate('gc'),
          storeId,
          codeHash,
          codeLast4,
          initialBalanceCents: input.amountCents,
          currentBalanceCents: input.amountCents,
          currencyCode: input.currencyCode,
          status: input.recipientEmail ? 'PENDING' : 'ACTIVE',
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          senderName: input.senderName,
          giftMessage: input.giftMessage,
          expiresAt,
          templateId: input.templateId,
        },
      });

      // Create initial transaction
      await tx.giftCardTransaction.create({
        data: {
          id: this.idService.generate('gctx'),
          storeId,
          giftCardId: gc.id,
          type: 'CREDIT',
          amountCents: input.amountCents,
          balanceAfterCents: input.amountCents,
          reason: 'Initial issue',
        },
      });

      return gc;
    });

    // Send email if requested
    if (input.sendEmail && input.recipientEmail) {
      await this.emailService.sendGiftCardEmail({
        to: input.recipientEmail,
        recipientName: input.recipientName,
        senderName: input.senderName,
        giftMessage: input.giftMessage,
        code, // Plain code for email only
        amountCents: input.amountCents,
        currencyCode: input.currencyCode,
      });
    }

    return { ...giftCard, code }; // Return plain code only on creation
  }

  protected async redeem(
    storeId: string,
    code: string,
    orderId: string,
    amountCents: number,
  ): Promise<RedeemResult> {
    const codeHash = await this.hashCode(code);

    const giftCard = await this.prisma.giftCard.findUnique({
      where: { storeId_codeHash: { storeId, codeHash } },
    });

    if (!giftCard) {
      return { success: false, error: 'INVALID_CODE' };
    }

    if (giftCard.status !== 'ACTIVE') {
      return { success: false, error: 'CARD_NOT_ACTIVE' };
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return { success: false, error: 'CARD_EXPIRED' };
    }

    if (giftCard.currentBalanceCents < amountCents) {
      return { success: false, error: 'INSUFFICIENT_BALANCE', availableBalance: giftCard.currentBalanceCents };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const newBalance = giftCard.currentBalanceCents - amountCents;

      // Update balance
      const updated = await tx.giftCard.update({
        where: { id: giftCard.id },
        data: {
          currentBalanceCents: newBalance,
          status: newBalance === 0 ? 'DEPLETED' : 'ACTIVE',
          lastUsedAt: new Date(),
          activatedAt: giftCard.activatedAt ?? new Date(),
        },
      });

      // Record transaction
      await tx.giftCardTransaction.create({
        data: {
          id: this.idService.generate('gctx'),
          storeId,
          giftCardId: giftCard.id,
          type: 'DEBIT',
          amountCents: -amountCents,
          balanceAfterCents: newBalance,
          orderId,
        },
      });

      return updated;
    });

    return {
      success: true,
      amountRedeemed: amountCents,
      remainingBalance: result.currentBalanceCents,
    };
  }

  private generateSecureCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
    let code = '';
    const randomBytes = crypto.randomBytes(this.CODE_LENGTH);
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    // Format: XXXX-XXXX-XXXX-XXXX
    return code.match(/.{4}/g)!.join('-');
  }

  private async hashCode(code: string): Promise<string> {
    const normalized = code.replace(/-/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
```

#### UX Implementation Notes
- **Gift card list:** Balance shown as progress bar, status badges
- **Issue form:** Template selection with visual preview
- **Transaction history:** Timeline view with credits/debits
- **Storefront:** Gift card purchase as product type, redeem at checkout

---

