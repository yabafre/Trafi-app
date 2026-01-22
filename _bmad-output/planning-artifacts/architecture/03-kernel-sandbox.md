## Module Sandbox: Security Architecture

_Added in revision 2026-01-14 - Security enforcement for third-party modules_

Modules and marketplace extensions represent a significant attack surface. The Module Sandbox enforces strict security boundaries.

### Sandbox Architecture Layers

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

### Static Analysis Checks (Pre-Install)

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
// Location: modules/plugins/sandbox/static-analyzer.ts
const staticAnalysisRules: AnalysisRule[] = [
  { pattern: /eval\s*\(/, severity: 'critical', message: 'Dynamic code execution not allowed' },
  { pattern: /new\s+Function\s*\(/, severity: 'critical', message: 'Function constructor not allowed' },
  { pattern: /require\s*\(\s*[^'"']/, severity: 'critical', message: 'Dynamic require not allowed' },
  { pattern: /child_process/, severity: 'critical', message: 'Shell access not allowed' },
];
```

### Filesystem Isolation

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
}
```

### Network ACL (Allowlist)

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
      }
    ]
  }
}
```

### Runtime Policy Enforcement

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU time per request** | 5 seconds | Kill process, return 503 |
| **Memory per module** | 256MB | OOM kill, restart module |
| **Open file handles** | 100 | Reject new opens |
| **Network connections** | 50 concurrent | Queue or reject |
| **Database queries** | Tenant-scoped only | Reject cross-tenant |

### Security Incident Response

```typescript
interface SecurityIncident {
  moduleId: string;
  storeId: string;
  violationType: 'fs' | 'network' | 'cpu' | 'memory' | 'static';
  details: string;
  timestamp: Date;
  action: 'blocked' | 'terminated' | 'quarantined';
}

function handleSecurityIncident(incident: SecurityIncident): void {
  // 1. Log to security audit trail
  auditLog.security(incident);
  // 2. Quarantine module (disable immediately)
  moduleManager.quarantine(incident.moduleId);
  // 3. Notify store owner
  notifications.send(incident.storeId, { type: 'security_alert', ... });
  // 4. If marketplace module, notify Trafi security team
  if (isMarketplaceModule(incident.moduleId)) {
    securityTeam.alert(incident);
  }
}
```

### Marketplace Module Tiers

| Tier | Review Level | Permissions |
|------|--------------|-------------|
| **Verified** | Full audit + Trafi team review | Full permissions (with ACL) |
| **Community** | Automated checks + community review | Limited permissions |
| **Private** | Owner responsibility | Full permissions (owner risk) |

## Non-Negotiable Security Rules

_Added in revision 2026-01-14 - From PRD consolidated non-negotiables_

These requirements are **ABSOLUTE** — no exceptions, no "we'll add it later":

| Non-Negotiable | Why It's Critical | Violation Consequence | Enforcement |
|----------------|-------------------|----------------------|-------------|
| **Tenant Isolation** | Data leakage = catastrophic breach | Security incident, legal liability | Every query includes `storeId` |
| **RBAC on Every Request** | Unauthorized access = data breach | Security incident | Guards on all controllers |
| **Rate Limiting** | No limits = DoS vulnerability | Service outage, abuse | @nestjs/throttler + Redis |
| **Audit Logging** | No audit = no forensics | GDPR violation | All sensitive operations logged |
| **Input Validation** | Unvalidated input = injection | SQL injection, XSS, RCE | Zod schemas on all inputs |

### Enforcement Patterns

```typescript
// ❌ NEVER - Query without tenant scope
const products = await prisma.product.findMany();

// ✅ ALWAYS - Explicit tenant scope
const products = await prisma.product.findMany({
  where: { storeId: ctx.tenant.id }
});

// ❌ NEVER - Controller without guards
@Controller('products')
export class ProductController { ... }

// ✅ ALWAYS - Guards on controller
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('products')
export class ProductController { ... }
```

## Development Rules (Epic 1 Retrospective)

_Added in revision 2026-01-14 - Lessons learned from Epic 1 implementation_

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
| **Business logic in protected** | Methods that may need customization | `protected calculatePrice()` |
| **Explicit public API** | Clear interface per service | `class ProductService { getById(), create() }` |
| **Dependency injection** | NEVER instantiate manually | Use `@Injectable()` + constructor injection |
| **Tenant isolation** | EVERY query includes storeId | `findMany({ where: { storeId } })` |

### Pre-Completion Checklist

Before marking any story as complete, verify:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm build` succeeds without warnings
- [ ] `pnpm test` passes all tests
- [ ] New code has appropriate test coverage
- [ ] Context7 was consulted for library usage
- [ ] Services follow override-ready patterns
- [ ] Tenant isolation verified in all queries
- [ ] Swagger decorators on all API endpoints

### Type System Rules

| Rule | Description |
|------|-------------|
| **Types from @trafi/validators** | NEVER define types locally in apps/ |
| **Zod → TypeScript** | `z.infer<typeof Schema>` generates types |
| **import type** | Use `import type { X }` for type-only imports |
| **No implicit any** | All parameters must be explicitly typed |

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

