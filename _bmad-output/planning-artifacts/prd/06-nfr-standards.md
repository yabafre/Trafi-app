## Non-Functional Requirements

**Tier Legend:**
- **[MVP]** = Required for launch
- **[Premium]** = Cloud + Profit Engine tier or stretch goal

### Performance

#### Response Times

| Metric | Target | Tier | Context |
|--------|--------|------|---------|
| Storefront API (critical paths) | p95 < 500ms | [MVP] | Cart, checkout, pricing |
| Checkout end-to-end | p95 < 500ms | [MVP] | API-side only, excludes PSP |
| Dashboard API | p95 < 1s | [MVP] | Admin operations |
| TTFB (Time to First Byte) | < 500ms | [MVP] | Baseline for all regions |
| TTFB (Time to First Byte) | < 200ms | [Premium] | With CDN + edge caching |

#### Core Web Vitals

| Metric | Target | Tier | Measurement Scope |
|--------|--------|------|-------------------|
| LCP (Largest Contentful Paint) | < 2.5s | [MVP] | 75th percentile of visits |
| CLS (Cumulative Layout Shift) | < 0.1 | [MVP] | 75th percentile of visits |
| INP (Interaction to Next Paint) | < 200ms | [MVP] | 75th percentile of visits |

**Scope:** Core Web Vitals targets apply to the **official Trafi Next.js storefront template only**. Custom storefronts are the responsibility of the implementing developer.

#### Load Capacity

| Scenario | Target | Tier |
|----------|--------|------|
| Concurrent checkouts per store | 100 | [MVP] |
| Traffic spike handling | 3x baseline | [MVP] |
| Traffic spike handling (Black Friday) | 10x baseline | [Premium] |

### Security

#### Non-Negotiable Security Requirements 🔒

These requirements are ABSOLUTE — no exceptions, no "we'll add it later", no cutting corners:

| Non-Negotiable | Why It's Critical | Violation Consequence |
|----------------|-------------------|----------------------|
| **Tenant Isolation** | Data leakage between stores = catastrophic breach | Security incident, legal liability |
| **RBAC on Every Request** | Unauthorized access = data breach | Security incident |
| **Rate Limiting** | No limits = DoS vulnerability | Service outage, abuse |
| **Audit Logging** | No audit = no forensics, no compliance | GDPR violation, incident blindness |
| **Input Validation** | Unvalidated input = injection attacks | SQL injection, XSS, RCE |

**Implementation Pattern for Tenant Isolation:**

```typescript
// ❌ NEVER - Query without tenant scope
const products = await prisma.product.findMany();

// ✅ ALWAYS - Explicit tenant scope
const products = await prisma.product.findMany({
  where: { storeId: ctx.tenant.id }
});
```

#### Full Security Specification

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Data encryption at rest | AES-256 for all PII and sensitive data | [MVP] |
| Data encryption in transit | TLS 1.3 for all connections | [MVP] |
| Authentication | Session-based (dashboard), API keys (SDK), OAuth 2.0 (buyers) | [MVP] |
| Authorization | Tenant-scoped RBAC on every request | [MVP] |
| Payment data | PCI DSS SAQ-A compliance via Stripe tokenization | [MVP] |
| Secrets management | Environment variables, encrypted at rest, rotatable | [MVP] |
| Audit logging | All sensitive operations logged with timestamp, actor, action | [MVP] |
| Tenant isolation | DB-per-tenant, no cross-tenant data access | [MVP] |
| Input validation | All user inputs sanitized, parameterized queries only | [MVP] |
| Rate limiting | Per-tenant API rate limits with configurable thresholds | [MVP] |
| CSRF protection | Token-based CSRF protection on all state-changing operations | [MVP] |

### Scalability

| Scenario | Requirement | Tier |
|----------|-------------|------|
| Tenant capacity | System supports 500+ tenants on DB-per-tenant | [MVP] |
| Tenant capacity | System supports 1,000+ tenants with RLS evaluation trigger | [Premium] |
| Horizontal scaling | API layer scales via container orchestration | [MVP] |
| Database scaling | Vertical scaling per tenant DB | [MVP] |
| Database scaling | Read replicas for high-traffic stores | [Premium] |
| Queue scaling | Worker pool auto-scales based on queue depth | [MVP] |
| Multi-region | Single region (EU) | [MVP] |
| Multi-region | Multi-region deployment with geo-routing | [Premium] |

### Reliability

#### Availability SLOs

| Tier | Scope | MVP Target | Premium Target |
|------|-------|------------|----------------|
| Critical Path | Checkout, Payment, Order creation | 99.9% | 99.95% - 99.99% |
| Core Commerce | Cart, Pricing, Inventory | 99.5% | 99.9% |
| Browse/Catalog | Product listings, Search | 99.5% | 99.9% |
| Dashboard/Admin | Back-office operations | 99.0% | 99.5% |

#### Error Budget Policy

- **Window:** 28-day rolling
- **Budget:** 100% - SLO (e.g., 99.9% SLO = 43 min/month downtime)
- **Rule:** If budget >50% consumed, freeze features and focus reliability
- **Escalation:** If budget exhausted, incident review mandatory before new releases

#### Profit Engine Execution Gate [MVP]

**Critical:** Autopilot can ONLY execute and measure experiments when:
- Event instrumentation is within SLO (≥99.5% event delivery)
- Webhook/job processing is within SLO (≥99.9% success rate)
- No active incidents on checkout critical path

If these conditions are not met, Autopilot enters "observation-only" mode to prevent false positives/negatives.

#### Synthetic Monitoring [MVP]

| Check | Frequency | Scope |
|-------|-----------|-------|
| Checkout funnel ping | Every 5 minutes | Full funnel: cart → checkout → payment intent (sandbox) |
| API health endpoints | Every 1 minute | All critical services |
| Webhook delivery test | Every 15 minutes | Test webhook to internal receiver |

**Purpose:** Detect regressions before merchants report them.

#### Disaster Recovery

| Metric | MVP Target | Premium Target |
|--------|------------|----------------|
| RTO (Recovery Time Objective) | 8 hours | 4 hours |
| RPO (Recovery Point Objective) | 4 hours | 1 hour |
| Backup frequency | Daily | Hourly for high-tier stores |
| Backup retention | 14 days | 30 days |

### Accessibility

| Requirement | Specification | Tier |
|-------------|---------------|------|
| WCAG compliance | Storefront template meets WCAG 2.1 Level AA | [MVP] |
| Color contrast (normal text) | Minimum 4.5:1 ratio | [MVP] |
| Color contrast (large text) | Minimum 3:1 ratio | [MVP] |
| Keyboard navigation | All interactive elements accessible via keyboard | [MVP] |
| Screen reader support | Semantic HTML, ARIA labels where needed | [MVP] |
| Focus indicators | Visible focus states on all interactive elements | [MVP] |
| Alt text | All images have descriptive alt text | [MVP] |

#### Accessibility Testing [MVP]

| Tool | Threshold | Frequency |
|------|-----------|-----------|
| Lighthouse Accessibility | ≥ 90 score | Every release |
| axe-core automated audit | 0 critical/serious violations | Every release |
| Manual keyboard navigation | Pass all interactive flows | Quarterly |

**Scope:** Accessibility requirements apply to the **official Trafi storefront template** and **Trafi Dashboard**. Custom storefronts are the responsibility of the implementing developer.

### Integration

#### API Contracts [MVP]

| Requirement | Specification |
|-------------|---------------|
| API versioning | URL path versioning (e.g., /v1/, /v2/) |
| SDK versioning | SemVer with explicit API compatibility mapping |
| Deprecation policy | 90-day window for breaking changes with migration guides |
| Rate limiting | Per-tenant rate limits documented in API reference |

#### Webhook Reliability [MVP]

| Requirement | Specification |
|-------------|---------------|
| Delivery guarantee | At-least-once with exponential backoff (max 5 retries over 24h) |
| Signature security | HMAC-SHA256 with shared secret |
| Replay protection | Timestamp in signature (reject if >5 min drift) |
| Receiver validation | Timing-safe compare for signature verification |
| Event log | All webhook attempts logged with response status |
| Replay capability | Manual replay from dashboard for failed deliveries |

#### Webhook Processing (Receiver Side) [MVP]

| Requirement | Specification |
|-------------|---------------|
| Idempotency | All webhook handlers idempotent based on `event_id` |
| Deduplication window | 24 hours minimum |
| Processing timeout | Acknowledge within 30s, process async if longer |

#### Idempotency (API) [MVP]

| Requirement | Specification |
|-------------|---------------|
| Idempotency keys | Supported on all mutating checkout/payment operations |
| Key format | Client-provided UUID, stored for 24h |
| Collision handling | Return cached response on duplicate key |

### Maintainability

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Code coverage | ≥ 70% unit test coverage for core modules | [MVP] |
| Code coverage | ≥ 80% unit test coverage for core modules | [Premium] |
| Documentation | API reference auto-generated from code | [MVP] |
| Upgrade path | Non-breaking upgrades, deprecation warnings in SDK | [MVP] |
| Module isolation | Modules updateable independently | [MVP] |
| Database migrations | Per-tenant migration orchestration with rollback | [MVP] |
| Feature flags | All new features behind flags for gradual rollout | [MVP] |

### Observability

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Metrics | Per-tenant metrics exported (Prometheus/OTEL) | [MVP] |
| Logging | Centralized logs, tenant-tagged, 30-day retention | [MVP] |
| Tracing | Distributed tracing for request correlation | [MVP] |
| Alerting | PagerDuty/Slack on SLO threshold violations | [MVP] |
| Dashboards | Real-time ops dashboards for system health | [MVP] |
| Health checks | Endpoint health checks for all services | [MVP] |
| Job monitoring | Queue status visibility (waiting/active/failed) | [MVP] |
| Event flow health | Per-store instrumentation health indicator | [MVP] |

## Development Rules & Implementation Standards

_Lessons learned from Epic 1 retrospective and project-context.md — these rules are mandatory for all development work._

### Context7 MCP Protocol (MANDATORY)

**Before implementing with ANY library, query Context7 MCP:**

```
1. resolve-library-id → Get the library ID
2. query-docs → Get current documentation
3. Implement → Use up-to-date patterns, not outdated knowledge
```

**Why:** LLM training data is stale. Context7 provides current documentation. Failure to query leads to deprecated patterns and bugs.

**Applies to:** NestJS, Next.js, Prisma, React Query, Shadcn, Tailwind, tRPC, BullMQ, Zod, and ALL other libraries.

### Service Implementation Patterns

| Rule | Pattern | Example |
|------|---------|---------|
| **Business logic in protected** | Methods that may need customization are `protected` | `protected calculatePrice()` |
| **Explicit public API** | Each service has clear public interface | `class ProductService { getById(), create(), update() }` |
| **Dependency injection** | NEVER instantiate services manually | Use `@Injectable()` + constructor injection |
| **Tenant isolation** | EVERY query includes storeId/tenantId | `findMany({ where: { storeId } })` |

### Pre-Completion Checklist

Before marking any story as complete, verify:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm build` succeeds without warnings
- [ ] `pnpm test` passes all tests
- [ ] New code has appropriate test coverage
- [ ] Context7 was consulted for library usage
- [ ] Services follow override-ready patterns
- [ ] Tenant isolation verified in all queries

### Type System Rules

| Rule | Description |
|------|-------------|
| **Types from @trafi/validators** | NEVER define types locally in apps/ |
| **Zod → TypeScript** | `z.infer<typeof Schema>` generates types |
| **import type** | Use `import type { X }` for type-only imports |
| **No implicit any** | All parameters must be explicitly typed |

### Dashboard Component Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Composable slots** | Components accept customization | `<Card slots={{ header: CustomHeader }} />` |
| **Local components** | Route-specific in `_components/` | `app/products/_components/ProductTable.tsx` |
| **Global components** | Shared in `components/` | `components/ui/Button.tsx` |
| **Data flow** | Page(RSC) → Client → Hook → Server Action → tRPC | Never skip levels |

### Swagger/OpenAPI Documentation (MANDATORY)

Every API endpoint MUST have complete Swagger decorators:

```typescript
@ApiTags('products')
@Controller('products')
export class ProductController {
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({ status: 404, type: ErrorDto })
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  getById(@Param('id') id: string) { ... }
}
```

### Module Development Guidelines

When creating new modules:

1. **One module per domain** — `product.module.ts`, `order.module.ts`
2. **Services for logic, Controllers for HTTP** — Clear separation
3. **Guards at controller level** — `@UseGuards(JwtAuthGuard, RolesGuard)`
4. **Event emission for extensibility** — Emit events for business operations
5. **Isolated migrations** — Module-specific schema changes

