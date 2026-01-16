# Epic 14: Cloud & Multi-tenancy

Merchant peut utiliser Trafi Cloud sans gerer l'infrastructure, avec migration Shopify automatisee.

**FRs covered:** FR74, FR75, FR76, FR77, FR78

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing Stripe billing, provisioning
- **RETRO-2:** TenantService, ProvisioningService use `protected` methods
- **RETRO-3:** CloudModule exports explicit public API for custom provisioning
- **RETRO-4:** Dashboard cloud components accept customization props
- **RETRO-5:** Cloud signup uses composition pattern
- **RETRO-6:** Tenant-scoped authorization follows @trafi/core patterns

### UX Design Requirements (Marketing Site - Signup - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.

**Signup Visual Design:**
- **UX-STORE-1:** Minimal, grid-based signup flow
- **UX-STORE-2:** Progress indicator with rectangular steps (1px borders)
- **UX-STORE-3:** Plan comparison with clear pricing in grid layout
- **UX-STORE-4:** Stripe Elements for payment (radius-0 styling)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for CTAs, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-TYPE:** JetBrains Mono for pricing/numbers, system font for body

### UX Design Requirements (Dashboard - Cloud Settings - Digital Brutalism v2)

**Visual Design:**
- **UX-1:** Dark mode default
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > Billing
- **UX-4:** Plan usage visualization (rectangular progress bars, no radius)
- **UX-5:** Domain configuration with DNS validation status badges
- **UX-6:** Migration wizard with step-by-step progress (1px borders)
- **UX-8:** Shadcn UI: Progress, Card, Dialog, Stepper (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Warning #EAB308 for usage alerts
- **UX-RADIUS:** 0px everywhere

### Shopify Migration UX (Digital Brutalism v2)
- **UX-MIG-1:** Connect to Shopify via OAuth (Acid Lime connect button)
- **UX-MIG-2:** Data preview before import (DataTable, radius-0)
- **UX-MIG-3:** Progress tracking with item counts (rectangular bars)
- **UX-MIG-4:** Validation report with warnings/errors (badge colors: #00FF94, #FF3366)
- **UX-MIG-5:** Side-by-side comparison for verification (1px grid borders)

---

## Story 14.1: Cloud Signup Flow

As a **Merchant (Sophie)**,
I want **to sign up for Trafi Cloud**,
So that **I can have a managed store without DevOps**.

**Acceptance Criteria:**

**Given** a visitor accesses the Cloud signup page
**When** they complete registration
**Then** the flow includes:
- Email and password creation
- Store name and URL selection (subdomain)
- Plan selection (free trial, paid tiers)
- Payment method (Stripe) for paid plans
**And** account is created immediately
**And** store provisioning begins automatically
**And** confirmation email with next steps is sent

---

## Story 14.2: Tenant Provisioning Orchestration

As a **System**,
I want **to automatically provision new tenants**,
So that **stores are ready quickly**.

**Acceptance Criteria:**

**Given** a new tenant signs up
**When** provisioning is triggered
**Then** the system:
- Creates tenant record in control plane
- Provisions isolated PostgreSQL database
- Runs initial schema migrations
- Seeds default configuration
- Configures DNS/subdomain routing
- Provisions Redis namespace
**And** provisioning completes in < 2 minutes
**And** progress is shown to merchant
**And** failures trigger cleanup and retry

---

## Story 14.3: Database-Per-Tenant Isolation

As a **System**,
I want **each tenant to have an isolated database**,
So that **data security is guaranteed**.

**Acceptance Criteria:**

**Given** multiple tenants exist
**When** databases are provisioned
**Then** each tenant has:
- Dedicated PostgreSQL database
- Unique connection credentials
- Separate connection pool
- No cross-tenant query possibility
**And** connection strings are encrypted at rest
**And** tenant context is validated on every request
**And** architecture supports 500+ tenants (NFR-SCALE-1)

---

## Story 14.4: Tenant Database Backups

As a **System**,
I want **to perform tenant-specific backups**,
So that **data can be recovered per-tenant**.

**Acceptance Criteria:**

**Given** tenants have data
**When** backup schedule runs
**Then** backups include:
- Daily automated backups (14-day retention MVP)
- Point-in-time recovery capability
- Per-tenant backup isolation
- Backup encryption at rest
**And** backup status is visible to Ops
**And** backup success/failure is alerted
**And** backups are stored in separate region

---

## Story 14.5: Tenant Database Restore

As an **Ops**,
I want **to restore a tenant's database**,
So that **I can recover from data issues**.

**Acceptance Criteria:**

**Given** backups exist for a tenant
**When** Ops initiates restore
**Then** they can:
- Select backup point (date/time)
- Choose restore type (full or to new DB)
- Preview affected data range
- Execute with confirmation
**And** restore runs without affecting other tenants
**And** RTO target: 8 hours MVP (NFR-REL-8)
**And** restore is logged with reason

---

## Story 14.6: Resource Auto-Scaling

As a **System**,
I want **to scale resources based on tenant traffic**,
So that **performance is maintained during spikes**.

**Acceptance Criteria:**

**Given** tenants have varying traffic
**When** traffic increases
**Then** the system:
- Monitors request rates and latency
- Scales API containers horizontally
- Scales worker pool based on queue depth
- Adjusts database connection pools
**And** scaling is automatic (no manual intervention)
**And** 3x traffic spike handling (NFR-PERF-6)
**And** scale-down occurs after traffic normalizes

---

## Story 14.7: Tenant Resource Limits

As a **System**,
I want **to enforce resource limits per tenant**,
So that **one tenant can't affect others**.

**Acceptance Criteria:**

**Given** multiple tenants share infrastructure
**When** a tenant exceeds limits
**Then** limits are enforced for:
- API rate limiting (requests/minute)
- Storage quota (products, media)
- Database connections
- Queue depth
**And** limits vary by plan tier
**And** approaching limits trigger warnings
**And** exceeded limits return 429 with upgrade CTA

---

## Story 14.8: Shopify Migration - Data Export

As a **Merchant (Sophie)**,
I want **to export my data from Shopify**,
So that **I can migrate to Trafi**.

**Acceptance Criteria:**

**Given** a Merchant wants to migrate
**When** they access Migration Wizard
**Then** they can:
- Connect Shopify via OAuth or API key
- Select data to migrate (products, customers, orders)
- Preview data volume and estimated time
- Initiate export from Shopify
**And** export handles Shopify API rate limits
**And** progress is visible in dashboard
**And** partial export resumes on failure

---

## Story 14.9: Shopify Migration - Data Import

As a **System**,
I want **to import Shopify data into Trafi**,
So that **migration is seamless**.

**Acceptance Criteria:**

**Given** Shopify data is exported
**When** import runs
**Then** the system imports:
- Products with variants and images
- Categories/collections mapping
- Customer accounts (with consent)
- Historical orders
**And** IDs are mapped (Shopify -> Trafi)
**And** duplicates are detected and handled
**And** import is idempotent (can retry safely)

---

## Story 14.10: Shopify Migration - Validation

As a **Merchant (Sophie)**,
I want **to validate my migrated data**,
So that **I know everything transferred correctly**.

**Acceptance Criteria:**

**Given** import is complete
**When** validation runs
**Then** the system checks:
- Product count matches
- Image integrity (no broken links)
- Customer data completeness
- Order totals reconciliation
**And** validation report is generated
**And** discrepancies are highlighted
**And** Merchant can approve or request fixes

---

## Story 14.11: Custom Domain Configuration

As a **Merchant (Sophie)**,
I want **to use my own domain for my store**,
So that **my brand is prominent**.

**Acceptance Criteria:**

**Given** a Merchant has a custom domain
**When** they configure it in settings
**Then** they can:
- Enter their domain name
- See required DNS records
- Verify DNS propagation
- Enable SSL certificate (auto-provisioned)
**And** SSL uses Let's Encrypt
**And** domain propagation is monitored
**And** fallback to subdomain if domain fails

---

## Story 14.12: Tenant Offboarding

As a **System**,
I want **to handle tenant cancellation cleanly**,
So that **resources are freed and data handled properly**.

**Acceptance Criteria:**

**Given** a Merchant cancels their subscription
**When** offboarding is triggered
**Then** the system:
- Provides data export option (30 days)
- Deactivates storefront after grace period
- Retains data per legal requirements
- Cleans up resources after retention period
- Releases subdomain/domain
**And** Merchant can reactivate within grace period
**And** final invoice is generated
**And** offboarding is logged
