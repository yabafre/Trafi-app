# Epic 10: Privacy & Compliance

DPO peut gerer les demandes GDPR (recherche, export, suppression) avec audit trail complet et consent tracking.

**FRs covered:** FR57, FR58, FR59, FR60, FR61, FR62

---

## Story 10.1: Privacy Manager Role

As an **Owner/Admin**,
I want **to assign Privacy Manager permissions**,
So that **designated staff can handle data requests**.

**Acceptance Criteria:**

**Given** the RBAC system exists
**When** Privacy Manager role is assigned
**Then** the user can:
- Access Privacy Center in dashboard
- Search customer data
- Process export and erasure requests
- View privacy audit logs
**And** role is separate from other admin functions
**And** Privacy Manager actions are logged with actor ID

---

## Story 10.2: Customer Data Search

As a **Privacy Manager**,
I want **to search and view customer data by email**,
So that **I can respond to data access requests**.

**Acceptance Criteria:**

**Given** a Privacy Manager accesses Privacy Center
**When** they search by email address
**Then** they see all data associated with that email:
- Customer profile information
- Order history
- Addresses
- Wishlist items
- Consent records
- Cart data (if exists)
**And** search is logged in audit trail
**And** partial matches are not shown (exact email only)

---

## Story 10.3: GDPR Data Export

As a **Privacy Manager**,
I want **to export customer data in GDPR-compliant format**,
So that **I can fulfill Subject Access Requests (SAR)**.

**Acceptance Criteria:**

**Given** a customer's data is found
**When** Privacy Manager initiates export
**Then** the system generates:
- JSON file with all personal data
- Human-readable PDF summary
- Data categories clearly labeled
- Timestamp of export
**And** export is generated asynchronously (job)
**And** download link is sent to Privacy Manager
**And** export request is logged in audit trail

---

## Story 10.4: Data Erasure Request Processing

As a **Privacy Manager**,
I want **to process erasure requests**,
So that **I can comply with GDPR right to be forgotten**.

**Acceptance Criteria:**

**Given** an erasure request is received
**When** Privacy Manager initiates deletion
**Then** the system:
- Deletes/anonymizes personal data
- Retains legally required data (invoices, tax records)
- Marks customer record as "erased"
- Documents what was deleted vs retained
**And** legal retention periods are enforced (configurable)
**And** erasure is irreversible with confirmation required
**And** erasure is logged with reason and legal basis

---

## Story 10.5: Consent Tracking System

As a **System**,
I want **to track consent status per data category**,
So that **data processing is lawful**.

**Acceptance Criteria:**

**Given** consent categories are defined
**When** a customer provides or withdraws consent
**Then** the system records:
- Consent category (marketing, analytics, etc.)
- Status (granted/withdrawn)
- Timestamp
- Method (checkbox, banner, etc.)
- Version of privacy policy accepted
**And** consent can be queried before processing
**And** consent changes are immutable (append-only log)

---

## Story 10.6: Customer Consent Management

As a **Buyer (Emma)**,
I want **to manage my consent preferences**,
So that **I control how my data is used**.

**Acceptance Criteria:**

**Given** a logged-in customer
**When** they access Privacy Settings
**Then** they can:
- View current consent status per category
- Grant or withdraw consent
- See what each category means
- Download their consent history
**And** changes take effect immediately
**And** withdrawal doesn't affect past lawful processing

---

## Story 10.7: Cookie Consent Banner

As a **Buyer (Emma)**,
I want **to control cookie preferences**,
So that **I decide what tracking is allowed**.

**Acceptance Criteria:**

**Given** a new visitor arrives at the storefront
**When** the page loads
**Then** a cookie consent banner appears with:
- Clear explanation of cookie categories
- Accept All / Reject All / Customize options
- Link to privacy policy
**And** essential cookies don't require consent
**And** choice is remembered for future visits
**And** banner meets GDPR/ePrivacy requirements

---

## Story 10.8: Cookie Consent Configuration

As a **Merchant**,
I want **to configure cookie consent settings**,
So that **the banner matches my compliance needs**.

**Acceptance Criteria:**

**Given** a Merchant accesses Privacy Settings
**When** they configure cookie consent
**Then** they can:
- Customize banner text and styling
- Define cookie categories
- Set default state (opt-in vs opt-out by region)
- Configure consent expiration period
**And** preview shows banner appearance
**And** configuration is region-aware (GDPR vs CCPA)

---

## Story 10.9: Data Operation Audit Log

As a **System**,
I want **to log all data operations**,
So that **there's a complete audit trail**.

**Acceptance Criteria:**

**Given** any operation on personal data occurs
**When** the operation completes
**Then** an audit entry is created with:
- Timestamp (ISO 8601)
- Actor (user ID, system, or API key)
- Operation type (read, export, delete, update)
- Affected data categories
- Legal basis (consent, legitimate interest, etc.)
- Request reference (SAR number if applicable)
**And** audit logs are immutable
**And** logs are retained per legal requirements
**And** logs are searchable by Privacy Manager
