# Epic 6: Order Management & Fulfillment

Merchant peut traiter, expedier, et suivre les commandes avec integration 3PL et gestion des retours.

**FRs covered:** FR18, FR19, FR51, FR52, FR53, FR54, FR55, FR56

---

## Story 6.1: Order List and Search

As a **Merchant**,
I want **to view and search all orders**,
So that **I can manage my business efficiently**.

**Acceptance Criteria:**

**Given** a Merchant accesses the Orders section
**When** the order list loads
**Then** they see orders with:
- Order number, date, customer name
- Order status, payment status, fulfillment status
- Total amount
**And** orders can be filtered by status, date range, customer
**And** orders can be searched by order number or customer email
**And** pagination handles large order volumes

---

## Story 6.2: Order Detail View

As a **Merchant**,
I want **to view complete order details**,
So that **I can process and fulfill orders correctly**.

**Acceptance Criteria:**

**Given** a Merchant clicks on an order
**When** the order detail loads
**Then** they see:
- Customer information (shipping/billing address, email)
- Line items with variants, quantities, prices
- Payment details and transaction history
- Fulfillment status per item
- Order timeline with all events
**And** actions are available based on order status

---

## Story 6.3: Order Status Transitions

As a **Merchant**,
I want **to update order status through its lifecycle**,
So that **orders progress from confirmed to completed**.

**Acceptance Criteria:**

**Given** an order exists
**When** the Merchant changes status
**Then** valid transitions are enforced:
- Confirmed -> Processing -> Shipped -> Delivered
- Any status -> Cancelled (with restrictions)
**And** status changes are logged in order timeline
**And** invalid transitions are prevented with clear messaging
**And** status changes trigger appropriate notifications

---

## Story 6.4: Order Fulfillment - Manual

As a **Merchant**,
I want **to mark orders as fulfilled with tracking info**,
So that **customers know their order is on the way**.

**Acceptance Criteria:**

**Given** a confirmed/processing order
**When** the Merchant fulfills the order
**Then** they can:
- Select items to fulfill (partial or full)
- Enter carrier and tracking number
- Add internal fulfillment notes
**And** fulfillment creates a shipment record
**And** order status updates to "Shipped" when fully fulfilled
**And** partial fulfillment is tracked separately

---

## Story 6.5: Shipping Notification Emails

As a **System**,
I want **to send shipping notifications with tracking**,
So that **customers can track their orders**.

**Acceptance Criteria:**

**Given** an order is marked as shipped
**When** fulfillment is completed
**Then** an email is sent to the customer with:
- Order summary
- Shipping carrier and tracking number
- Tracking link (carrier-specific)
- Estimated delivery date if available
**And** email uses store branding
**And** email sending is queued via job system

---

## Story 6.6: Fulfillment Webhooks for 3PL

As a **3PL Partner**,
I want **to receive order data via webhooks**,
So that **I can fulfill orders automatically**.

**Acceptance Criteria:**

**Given** a Merchant has configured 3PL webhook
**When** an order is ready for fulfillment
**Then** a webhook is sent with:
- Order details and line items
- Shipping address
- Requested shipping method
**And** webhooks are signed with HMAC-SHA256 (NFR-INT-6)
**And** failed deliveries retry with exponential backoff (NFR-INT-5)
**And** webhook events include `order.created`, `order.updated`

---

## Story 6.7: 3PL Tracking Update API

As a **3PL Partner**,
I want **to update tracking information via API**,
So that **the store has real-time shipping data**.

**Acceptance Criteria:**

**Given** a 3PL has an API key with fulfillment scope
**When** they POST tracking updates
**Then** the API accepts:
- Order ID or external reference
- Carrier code and tracking number
- Shipment status updates
**And** updates trigger customer notifications
**And** API validates the 3PL has access to the order
**And** duplicate updates are handled idempotently

---

## Story 6.8: Return Authorization (RMA)

As a **Merchant**,
I want **to manage return requests**,
So that **I can handle returns systematically**.

**Acceptance Criteria:**

**Given** a delivered order
**When** the Merchant creates a return authorization
**Then** they can:
- Select items to be returned
- Specify return reason
- Generate RMA number
- Set return instructions
**And** RMA status tracks: Requested -> Approved -> Received -> Processed
**And** return can trigger refund when received
**And** inventory is optionally restocked on return

---

## Story 6.9: Return Policy Configuration

As a **Merchant**,
I want **to configure return policies**,
So that **customers know the return rules**.

**Acceptance Criteria:**

**Given** a Merchant accesses Return Settings
**When** they configure policies
**Then** they can set:
- Return window (days after delivery)
- Eligible product categories
- Return shipping responsibility (customer/merchant)
- Restocking fees if applicable
**And** policies are displayed during checkout
**And** RMA creation validates against active policy
