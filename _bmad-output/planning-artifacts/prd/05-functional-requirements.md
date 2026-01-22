## Functional Requirements

### Developer Experience

- FR1: Developer can scaffold a new Trafi store project via CLI with configurable options
- FR2: Developer can seed demo data for local development and testing
- FR3: Developer can interact with all commerce modules via type-safe SDK
- FR4: Developer can customize storefront using provided templates (Next.js)
- FR5: Developer can extend platform functionality through plugin architecture
- FR6: Developer can access comprehensive API documentation and code examples
- FR7: Developer can upgrade SDK/API versions with clear deprecation warnings
- FR8: Developer can connect their store to Trafi Cloud via CLI commands
- FR9: Developer can generate and manage API keys for store access

### Commerce Core

- FR10: Merchant can create, edit, and manage product catalog with variants and media
- FR11: Merchant can organize products into categories and collections
- FR12: Merchant can set and manage product pricing with tax rules
- FR13: System can calculate cart totals including taxes and shipping
- FR14: Buyer can add products to persistent cart across sessions
- FR15: Buyer can complete checkout as guest or registered customer
- FR16: Buyer can select shipping method with real-time rate display
- FR17: Buyer can pay via integrated payment methods (Stripe, Apple Pay, etc.)
- FR18: Merchant can view and manage customer orders and order history
- FR19: Merchant can process refunds and manage order status transitions
- FR20: System can track inventory levels and prevent overselling
- FR21: Merchant can configure shipping zones and rates
- FR22: System can calculate applicable taxes based on buyer location

### Profit Engine

- FR23: System can instrument entire customer journey automatically
- FR24: System can diagnose checkout funnel drop-offs and conversion issues
- FR25: System can generate actionable optimization recommendations
- FR26: Merchant can review and approve/reject Autopilot recommendations
- FR27: System can execute approved optimizations via feature flags
- FR28: System can measure statistical impact with confidence intervals
- FR29: System can automatically rollback optimizations that degrade metrics
- FR30: Merchant can view profit attribution and ROI in dashboard
- FR31: Merchant can configure Profit Guardrails with margin thresholds
- FR32: System can block recommendations that violate margin or stock rules
- FR33: System can send abandoned cart recovery email sequences
- FR34: Buyer can restore abandoned cart via one-click email link

### User & Access Management

- FR35: Admin can create and manage admin user accounts
- FR36: Admin can assign roles and permissions to users (RBAC)
- FR37: Admin can manage API keys with scoped permissions
- FR38: System can enforce tenant-scoped authorization on all requests
- FR39: Owner can transfer store ownership to another user
- FR40: Owner can access billing and subscription management

### Customer Management

- FR41: Buyer can create customer account with email and password
- FR42: Buyer can manage saved addresses for faster checkout
- FR43: Buyer can view order history and track shipments
- FR44: Buyer can reset password via email
- FR45: System can identify returning customers across sessions

### Payments & Transactions

- FR46: Merchant can connect Stripe account for payment processing
- FR47: System can process payments with 3DS authentication when required
- FR48: System can handle payment webhooks for order status updates
- FR49: Merchant can issue full or partial refunds
- FR50: System can log all payment events for audit trail

### Fulfillment & Logistics

- FR51: Merchant can mark orders as fulfilled and add tracking numbers
- FR52: System can send shipping notification emails with tracking links
- FR53: System can expose fulfillment webhooks for 3PL integration
- FR54: 3PL Partner can receive order payloads for fulfillment
- FR55: 3PL Partner can update tracking information via API
- FR56: Merchant can configure return authorization workflow

### Privacy & Compliance

- FR57: Privacy Manager can search and view customer data by email
- FR58: Privacy Manager can export customer data in GDPR-compliant formats
- FR59: Privacy Manager can process erasure requests with legal retention handling
- FR60: System can track consent status per data category
- FR61: System can log all data operations with timestamp and actor
- FR62: Merchant can configure cookie consent preferences

### Analytics & Insights

- FR63: Merchant can view store performance dashboard with key metrics
- FR64: Merchant can view checkout funnel visualization with drop-off points
- FR65: Merchant can view Profit Engine recommendations and their status
- FR66: System can aggregate events for statistical analysis
- FR67: Ops can view per-store event flow health status

### Platform Operations

- FR68: Ops can monitor system health with real-time dashboards
- FR69: Ops can view error rates and latency metrics per tenant
- FR70: Ops can initiate rollback to previous deployment version
- FR71: Ops can access tenant stores in read-only support mode
- FR72: Ops can generate diagnostic reports for merchant support
- FR73: System can alert on SLO threshold violations

### Cloud & Multi-tenancy

- FR74: Merchant can sign up for Trafi Cloud managed hosting
- FR75: System can provision isolated database per tenant
- FR76: System can handle tenant-specific backups and restores
- FR77: System can scale resources based on tenant traffic
- FR78: Merchant can migrate store data from Shopify

### Buyer Authentication (Extended)

- FR79: Buyer can create account with email/password, login/logout, and reset password
- FR80: Buyer can authenticate via OAuth Google
- FR81: Buyer can authenticate via "Sign in with Apple" (web flow) with configurable Services ID and redirect URLs

### Wishlist & Favorites

- FR82: Buyer can add/remove products to a persistent wishlist and view it
- FR83: Buyer can edit, sort, and move wishlist items to cart
- FR84: System provides one-click wishlist add and simple move-to-cart UX

### Background Jobs & Queue Management

- FR85: System can execute asynchronous jobs for emails, webhooks, and long-running tasks via queue
- FR86: System can automatically retry failed jobs with exponential backoff and track failures in dead-letter queue
- FR87: Ops can view queue status (waiting/active/failed) and inspect job payload and errors

### SDK (Extended Capabilities)

- FR88: Developer can consume API via SDK with distinct clients (Storefront vs Admin) and scoped API keys
- FR89: Developer can instrument checkout funnel via SDK standardized events to feed Profit Engine
- FR90: SDK provides safe defaults (idempotency keys, client-side retries, error mapping)

### Module System & Extensibility

- FR91: Developer can install modules via CLI from path, URL, or package registry
- FR92: Developer can enable/disable modules without full system restart
- FR93: Developer can validate module manifest and code safety before activation
- FR94: Developer can update modules with version compatibility checking
- FR95: Developer can rollback/remove modules with data cleanup
- FR96: System can discover and dynamically load modules at runtime
- FR97: System can hot-reload modules on file changes without restart
- FR98: Module can extend backend with services, controllers, and API endpoints
- FR99: Module can extend dashboard with custom views and routes
- FR100: Module can hook into business events (payment.created, order.statusChanged, etc.)
- FR101: Module can extend database schema with isolated migrations
- FR102: System validates module code for security threats (no eval, FS isolation, network ACL)
- FR103: Module can register custom metrics for observability
- FR104: Developer can list installed modules with status and version info

### Promotions & Discounts

- FR105: Merchant can create promotions with percentage or fixed amount discounts
- FR106: Merchant can set promotion rules (min purchase, product/category restrictions)
- FR107: Merchant can generate unique coupon codes (single or bulk)
- FR108: Merchant can set promotion start/end dates and usage limits
- FR109: System tracks promotion usage per customer and globally

### Gift Cards

- FR110: Merchant can create gift card templates with denominations
- FR111: Merchant can issue gift cards manually or via purchase
- FR112: System tracks gift card balances and transactions
- FR113: Buyer can use gift card as payment method at checkout

### Regions & Multi-Currency

- FR114: Merchant can create geographic regions with currency settings
- FR115: Merchant can assign countries to regions
- FR116: System can detect customer region automatically
- FR117: Merchant can create price lists for regional or segment pricing
- FR118: System can convert prices between currencies using exchange rates

### Payment Enhancements

- FR119: System tracks complete payment lifecycle with audit logs
- FR120: System supports partial refunds with reason tracking

### Fulfillment & Returns Enhancements

- FR121: System tracks fulfillment with carrier and tracking events
- FR122: System supports return requests with RMA workflow
- FR123: Merchant can configure return policies per store

### Customer Segmentation

- FR124: Merchant can create customer groups (VIP, Wholesale, B2B)
- FR125: Merchant can assign group-specific discounts and price lists

### Suppliers & Purchase Orders

- FR126: Merchant can manage suppliers with contact info and payment terms
- FR127: Merchant can link products to suppliers with cost information
- FR128: Merchant can create and submit purchase orders
- FR129: Merchant can record goods receipt and update inventory
- FR130: System auto-generates PO numbers and tracks order status

### Module Sandbox: Security Enforcement System

Modules and marketplace extensions represent a significant attack surface. Without proper sandboxing, a malicious module can compromise the entire platform. The Module Sandbox enforces strict security boundaries.

#### Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULE SANDBOX LAYERS                             │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  STATIC CHECKS  │  Pre-install validation (AST analysis)            │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │   FS ISOLATION  │  Module can only access allowed paths              │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │  NETWORK ACL    │  Explicit allowlist for external requests          │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │ RUNTIME POLICY  │  CPU/memory limits, syscall restrictions           │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Static Analysis Checks (Pre-Install)

| Check | Policy | Fail Action |
|-------|--------|-------------|
| **No `eval()` or `Function()`** | Block dynamic code execution | Reject module |
| **No `require()` with variables** | Block dynamic imports | Reject module |
| **No `child_process`** | Block shell access | Reject module |
| **No `fs` outside sandbox** | Block arbitrary file access | Reject module |
| **No `net` without ACL** | Block arbitrary network | Reject module |
| **No obfuscated code** | Require readable source | Reject module |
| **Dependency audit** | Check deps for known CVEs | Warn + require approval |

```typescript
// Static analysis configuration
const staticAnalysisRules: AnalysisRule[] = [
  {
    pattern: /eval\s*\(/,
    severity: 'critical',
    message: 'Dynamic code execution not allowed',
  },
  {
    pattern: /new\s+Function\s*\(/,
    severity: 'critical',
    message: 'Function constructor not allowed',
  },
  {
    pattern: /require\s*\(\s*[^'"]/,
    severity: 'critical',
    message: 'Dynamic require not allowed',
  },
  {
    pattern: /child_process/,
    severity: 'critical',
    message: 'Shell access not allowed',
  },
];
```

#### Filesystem Isolation

```typescript
// Module manifest declares FS permissions
interface ModuleManifest {
  permissions: {
    fs: {
      read: string[];   // Allowed read paths (relative to module root)
      write: string[];  // Allowed write paths
    };
  };
}

// Example: A shipping module
{
  "permissions": {
    "fs": {
      "read": ["./config", "./templates"],
      "write": ["./cache", "./logs"]
    }
  }
}

// Runtime enforcement
class SandboxedFS {
  constructor(private allowedPaths: FSPermissions) {}

  readFile(path: string): Buffer {
    if (!this.isAllowed(path, 'read')) {
      throw new SecurityError(`FS read not allowed: ${path}`);
    }
    return fs.readFileSync(this.resolvePath(path));
  }

  writeFile(path: string, data: Buffer): void {
    if (!this.isAllowed(path, 'write')) {
      throw new SecurityError(`FS write not allowed: ${path}`);
    }
    fs.writeFileSync(this.resolvePath(path), data);
  }
}
```

#### Network ACL (Allowlist)

```typescript
// Module declares network permissions
interface NetworkPermissions {
  allowlist: {
    domain: string;           // e.g., "api.stripe.com"
    ports: number[];          // e.g., [443]
    protocols: ('https')[];   // HTTP not allowed by default
    reason: string;           // Why this access is needed
  }[];
}

// Example: Payment module network permissions
{
  "network": {
    "allowlist": [
      {
        "domain": "api.stripe.com",
        "ports": [443],
        "protocols": ["https"],
        "reason": "Stripe payment API"
      },
      {
        "domain": "hooks.stripe.com",
        "ports": [443],
        "protocols": ["https"],
        "reason": "Stripe webhooks"
      }
    ]
  }
}

// Runtime enforcement (proxy all HTTP requests)
class NetworkProxy {
  async fetch(url: string, options: RequestInit): Promise<Response> {
    const parsedUrl = new URL(url);

    if (!this.isAllowed(parsedUrl)) {
      throw new SecurityError(
        `Network access denied: ${parsedUrl.hostname} not in allowlist`
      );
    }

    return originalFetch(url, options);
  }
}
```

#### Runtime Policy Enforcement

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU time per request** | 5 seconds | Kill process, return 503 |
| **Memory per module** | 256MB | OOM kill, restart module |
| **Open file handles** | 100 | Reject new opens |
| **Network connections** | 50 concurrent | Queue or reject |
| **Database queries** | Tenant-scoped only | Reject cross-tenant |

#### Marketplace Module Tiers

| Tier | Review Level | Permissions |
|------|--------------|-------------|
| **Verified** | Full audit + Trafi team review | Full permissions (with ACL) |
| **Community** | Automated checks + community review | Limited permissions |
| **Private** | Owner responsibility | Full permissions (owner risk) |

#### Security Incident Response

```typescript
// When a sandbox violation is detected
interface SecurityIncident {
  moduleId: string;
  storeId: string;
  violationType: 'fs' | 'network' | 'cpu' | 'memory' | 'static';
  details: string;
  timestamp: Date;
  action: 'blocked' | 'terminated' | 'quarantined';
}

// Automatic response
function handleSecurityIncident(incident: SecurityIncident): void {
  // 1. Log to security audit trail
  auditLog.security(incident);

  // 2. Quarantine module (disable immediately)
  moduleManager.quarantine(incident.moduleId);

  // 3. Notify store owner
  notifications.send(incident.storeId, {
    type: 'security_alert',
    message: `Module ${incident.moduleId} was disabled due to security violation`,
  });

  // 4. If marketplace module, notify Trafi security team
  if (isMarketplaceModule(incident.moduleId)) {
    securityTeam.alert(incident);
  }
}
```

**The Module Sandbox ensures that third-party code cannot compromise platform security — or fails with full audit trail.**

