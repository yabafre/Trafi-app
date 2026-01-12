# Epic 5: Payment Processing

Systeme gere les paiements Stripe complets avec 3DS, webhooks, remboursements, et audit trail.

**FRs covered:** FR46, FR47, FR48, FR49, FR50

---

## Story 5.1: Stripe Account Connection

As a **Merchant**,
I want **to connect my Stripe account to the store**,
So that **I can accept payments from customers**.

**Acceptance Criteria:**

**Given** a Merchant is in Payment Settings
**When** they initiate Stripe connection
**Then** they are redirected to Stripe OAuth flow
**And** upon authorization, Stripe credentials are securely stored
**And** credentials are encrypted at rest (NFR-SEC-1)
**And** connection status is visible in dashboard
**And** test mode vs live mode is clearly indicated

---

## Story 5.2: Stripe Elements Integration

As a **Buyer (Emma)**,
I want **to enter payment details securely**,
So that **my card information is protected**.

**Acceptance Criteria:**

**Given** a buyer is at the payment step
**When** the payment form loads
**Then** Stripe Elements is rendered for card input
**And** card data never touches our servers (PCI SAQ-A)
**And** real-time validation shows card errors
**And** supported card brands are displayed
**And** the form is accessible via keyboard (NFR-A11Y-3)

---

## Story 5.3: Express Checkout (Apple Pay / Google Pay)

As a **Buyer (Emma)**,
I want **to pay with Apple Pay or Google Pay**,
So that **I can complete purchase in seconds**.

**Acceptance Criteria:**

**Given** a buyer is on a supported device/browser
**When** checkout loads
**Then** Apple Pay / Google Pay buttons appear above fold (UX-11)
**And** clicking triggers native payment sheet
**And** successful authorization creates the payment
**And** unsupported devices gracefully hide these options
**And** express checkout includes shipping address collection

---

## Story 5.4: Payment Processing with 3DS

As a **System**,
I want **to process payments with 3DS when required**,
So that **transactions are secure and compliant**.

**Acceptance Criteria:**

**Given** a buyer submits payment
**When** 3DS authentication is required
**Then** the buyer is redirected to 3DS challenge
**And** upon successful authentication, payment completes
**And** failed 3DS shows appropriate error message
**And** payment intent uses idempotency keys (NFR-INT-9)
**And** the entire flow handles redirects gracefully

---

## Story 5.5: Payment Webhook Handler

As a **System**,
I want **to receive and process Stripe webhooks**,
So that **order status stays synchronized with payment status**.

**Acceptance Criteria:**

**Given** Stripe sends a webhook event
**When** the webhook endpoint receives it
**Then** signature is verified via HMAC-SHA256 (NFR-INT-6)
**And** events are processed idempotently by event_id (NFR-INT-8)
**And** handled events include:
- `payment_intent.succeeded` -> order confirmed
- `payment_intent.payment_failed` -> order marked failed
- `charge.refunded` -> order updated with refund
**And** unhandled events are logged but don't error

---

## Story 5.6: Payment Failure Handling

As a **Buyer (Emma)**,
I want **clear feedback when payment fails**,
So that **I can fix the issue and try again**.

**Acceptance Criteria:**

**Given** a payment attempt fails
**When** the error is returned
**Then** user-friendly error message is displayed
**And** specific guidance is given (e.g., "Card declined - try another card")
**And** the buyer can retry without re-entering all details
**And** failed attempts are logged for merchant visibility
**And** repeated failures trigger rate limiting

---

## Story 5.7: Refund Processing

As a **Merchant**,
I want **to issue full or partial refunds**,
So that **I can handle returns and disputes**.

**Acceptance Criteria:**

**Given** a Merchant views a paid order
**When** they initiate a refund
**Then** they can specify:
- Full refund or partial amount
- Reason for refund
- Whether to restock inventory
**And** refund is processed via Stripe API
**And** order status updates to reflect refund
**And** customer receives refund confirmation email
**And** refund amount cannot exceed original payment

---

## Story 5.8: Payment Audit Trail

As a **System**,
I want **to log all payment events**,
So that **there's a complete audit trail for compliance**.

**Acceptance Criteria:**

**Given** any payment-related action occurs
**When** the action completes
**Then** an audit log entry is created with:
- Timestamp
- Actor (system, admin, or customer reference)
- Action type (payment, refund, failure, etc.)
- Amount and currency
- Stripe event/transaction ID
- Order reference
**And** logs are immutable and retained per policy
**And** logs are queryable for merchant support
