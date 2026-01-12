# Epic 9: Profit Engine - Cart Recovery

Systeme envoie des emails de recuperation de panier abandonne avec restauration one-click.

**FRs covered:** FR33, FR34

---

## Story 9.1: Abandoned Cart Detection

As a **System**,
I want **to detect abandoned carts**,
So that **recovery emails can be triggered**.

**Acceptance Criteria:**

**Given** a buyer has items in cart and provided email
**When** they leave without completing checkout
**Then** the cart is marked as abandoned after 30 minutes of inactivity
**And** abandonment is detected via:
- Checkout started but not completed
- Browser close during checkout
- Session timeout
**And** carts without email are tracked but not emailable
**And** completed orders clear the abandonment flag

---

## Story 9.2: Recovery Email Sequence Configuration

As a **Merchant**,
I want **to configure cart recovery email timing**,
So that **I can optimize for my audience**.

**Acceptance Criteria:**

**Given** a Merchant accesses Recovery Settings
**When** they configure the sequence
**Then** they can set:
- Email 1 delay (default: 37 minutes)
- Email 2 delay (default: 24 hours)
- Email 3 delay (default: 48 hours)
- Enable/disable each email
- Maximum emails per abandoned cart
**And** defaults follow UX-12 best practices
**And** sequence can be disabled entirely

---

## Story 9.3: Recovery Email Templates

As a **Merchant**,
I want **to customize recovery email content**,
So that **emails match my brand voice**.

**Acceptance Criteria:**

**Given** a Merchant accesses Email Templates
**When** they edit recovery emails
**Then** they can customize:
- Subject line (with merge tags)
- Email body with product image placeholder
- Call-to-action button text
- Optional discount code for Email 2/3
**And** preview shows rendered email with sample data
**And** templates use store branding (logo, colors)

---

## Story 9.4: Recovery Email Job Scheduling

As a **System**,
I want **to schedule and send recovery emails**,
So that **abandoned carts are recovered automatically**.

**Acceptance Criteria:**

**Given** a cart is marked as abandoned
**When** the configured delay passes
**Then** a job is queued to send the recovery email
**And** email includes:
- Product images from the cart
- Cart total and item count
- One-click recovery link
**And** subsequent emails are cancelled if cart is recovered
**And** jobs use exponential backoff on failure (FR86)

---

## Story 9.5: Magic Link Cart Restoration

As a **Buyer (Emma)**,
I want **to restore my cart with one click**,
So that **I can easily complete my purchase**.

**Acceptance Criteria:**

**Given** a buyer receives a recovery email
**When** they click the recovery link
**Then** they are taken to the storefront
**And** their cart is automatically restored with all items
**And** checkout page is pre-loaded (ready to pay)
**And** link is valid for 7 days
**And** link is single-use or tied to session for security
**And** expired links show friendly message with store link

---

## Story 9.6: Recovery Attribution Tracking

As a **System**,
I want **to track cart recovery attribution**,
So that **merchants see the value of recovery emails**.

**Acceptance Criteria:**

**Given** a cart is recovered via email link
**When** the order is completed
**Then** the order is attributed to:
- Cart recovery (vs organic)
- Specific email in sequence (1, 2, or 3)
- Time to recovery
**And** attribution is visible in order details
**And** aggregate stats show in Profit Engine dashboard

---

## Story 9.7: Recovery Analytics Dashboard

As a **Merchant (Sophie)**,
I want **to see cart recovery performance**,
So that **I know if recovery emails are working**.

**Acceptance Criteria:**

**Given** recovery emails have been sent
**When** Merchant views Recovery Analytics
**Then** they see:
- Total abandoned carts in period
- Emails sent per sequence step
- Open rates and click rates
- Recovered carts count and rate
- Revenue recovered
**And** metrics are filterable by date range
**And** comparison to previous period is shown

---

## Story 9.8: Recovery Email Unsubscribe

As a **Buyer (Emma)**,
I want **to unsubscribe from recovery emails**,
So that **I control my email preferences**.

**Acceptance Criteria:**

**Given** a buyer receives a recovery email
**When** they click unsubscribe
**Then** they are removed from recovery sequences
**And** unsubscribe is immediate and confirmed
**And** preference is stored per email address
**And** unsubscribe does not affect transactional emails
**And** compliance with email regulations (CAN-SPAM, GDPR)
