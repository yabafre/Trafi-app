# Epic 13: Module System & Extensibility

Developer peut creer, installer, et gerer des modules custom avec hot-reload et **Module Sandbox** (4-layer security architecture).

**FRs covered:** FR5, FR91, FR92, FR93, FR94, FR95, FR96, FR97, FR98, FR99, FR100, FR101, FR102, FR103, FR104

**Revision:** v2.0 (2026-01-15) - PRD v2 Alignment: Module Sandbox 4-Layer Security, Marketplace Tiers, Brutalist UX

---

## Epic Implementation Guidelines

### Module Sandbox Architecture (PRD v2 CRITICAL)

Modules and marketplace extensions represent a significant attack surface. The Module Sandbox enforces strict security boundaries through **4 layers**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULE SANDBOX LAYERS                             │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  STATIC CHECKS  │  Pre-install validation (AST analysis)            │
│  │  Story 13.5a    │  No eval(), no dynamic require, no child_process  │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │   FS ISOLATION  │  Module can only access allowed paths              │
│  │  Story 13.5b    │  SandboxedFS class, path permissions manifest     │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │  NETWORK ACL    │  Explicit allowlist for external requests          │
│  │  Story 13.5c    │  Domain + port + protocol per module              │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │ RUNTIME POLICY  │  CPU/memory limits, syscall restrictions           │
│  │  Story 13.5d    │  Per-module resource isolation                    │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Marketplace Module Tiers (PRD v2)

| Tier | Review Level | Permissions | Badge |
|------|--------------|-------------|-------|
| **Verified** | Full audit + Trafi team review | Full permissions (with ACL) | ✓ VERIFIED |
| **Community** | Automated checks + community review | Limited permissions | COMMUNITY |
| **Private** | Owner responsibility | Full permissions (owner risk) | PRIVATE |

### Retrospective Learnings (MANDATORY) - CRITICAL EPIC
This epic enables the @trafi/core vision. All retrospective learnings culminate here.

- **RETRO-1:** Use Context7 MCP before implementing module loading, sandboxing
- **RETRO-2:** All core services must have `protected` methods for module override
- **RETRO-3:** Core modules export explicit public API for extension
- **RETRO-4:** Module dashboard components follow customization props pattern
- **RETRO-5:** Module pages use composition pattern (modules wrap core pages)
- **RETRO-6:** This epic implements @trafi/core override patterns:
  - Backend: Services with `protected` methods, DI-based override
  - Dashboard: Composition pattern, slot-based customization
  - CLI: `trafi dev`, `trafi build`, `trafi db:push`
- **RETRO-7:** Module Sandbox implements all 4 security layers from PRD v2

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Layout:**
- **UX-1:** Pure Black (#000000) background
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > Modules
- **UX-4:** Module cards with ENABLE/DISABLE toggle (Brutalist switch)
- **UX-5:** Module detail page with settings, permissions, security logs
- **UX-6:** Status badges: ACTIVE (#00FF94), DISABLED (gray), ERROR (#FF3366), QUARANTINED (#FF3366 + border)
- **UX-7:** Security violation alerts in red border with monospace details
- **UX-8:** Tier badges: VERIFIED (green border), COMMUNITY (neutral), PRIVATE (yellow border)

**Visual Design:**
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Security alert #FF3366 with visible border
- **UX-TYPE:** JetBrains Mono for permissions, logs, code paths
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None

### CLI Experience (Developer UX)
```bash
npx create-trafi my-store
cd my-store
trafi dev      # Starts both server (3001) and dashboard (3000)
trafi build    # Builds everything
trafi db:push  # Database operations
trafi module add ./my-custom-module
trafi module validate ./my-module  # Run sandbox validation
trafi module quarantine <name>     # Emergency disable
```

---

## Story 13.1: Module Manifest Schema

As a **Developer (Thomas)**,
I want **a clear module manifest format**,
So that **I can define my module's capabilities**.

**Acceptance Criteria:**

**Given** a developer creates a module
**When** they define the manifest
**Then** `trafi-module.json` includes:
- name, version, description
- author and license
- trafi version compatibility
- entry points (backend, dashboard)
- required permissions
- database migrations path
- event subscriptions
**And** manifest is validated with Zod schema
**And** example manifest is documented

---

## Story 13.2: Module CLI - Install

As a **Developer (Thomas)**,
I want **to install modules via CLI**,
So that **I can add functionality easily**.

**Acceptance Criteria:**

**Given** a developer has a Trafi project
**When** they run `trafi module add <source>`
**Then** they can install from:
- Local path: `trafi module add ./my-module`
- Git URL: `trafi module add github:user/repo`
- NPM: `trafi module add @scope/module-name`
**And** dependencies are resolved
**And** manifest is validated before install
**And** module is registered in `trafi.config.json`

---

## Story 13.3: Module CLI - List and Status

As a **Developer (Thomas)**,
I want **to see installed modules and their status**,
So that **I know what's active in my project**.

**Acceptance Criteria:**

**Given** modules are installed
**When** running `trafi module list`
**Then** output shows:
- Module name and version
- Status (enabled/disabled)
- Source (path, npm, git)
- Compatibility status
**And** `--json` flag outputs machine-readable format
**And** warnings show for incompatible versions

---

## Story 13.4: Module Enable/Disable

As a **Developer (Thomas)**,
I want **to enable or disable modules without restart**,
So that **I can toggle functionality dynamically**.

**Acceptance Criteria:**

**Given** a module is installed
**When** running `trafi module enable/disable <name>`
**Then** the module state changes
**And** backend services are loaded/unloaded
**And** dashboard routes are registered/unregistered
**And** event hooks are attached/detached
**And** no full system restart is required
**And** state persists across restarts

---

## Story 13.5: Module Sandbox - 4 Layer Security Architecture

This story implements the **Module Sandbox** from PRD v2, providing defense-in-depth security for third-party modules.

---

### Story 13.5a: Static Analysis Layer (Pre-Install)

As a **System**,
I want **to perform AST-based static analysis before module installation**,
So that **dangerous code patterns are blocked before execution**.

**Acceptance Criteria:**

**Given** a module is being installed
**When** static analysis runs
**Then** the following patterns are detected and **BLOCKED**:
| Check | Policy | Action |
|-------|--------|--------|
| `eval()` or `Function()` | Block dynamic code execution | Reject module |
| `require()` with variables | Block dynamic imports | Reject module |
| `child_process` imports | Block shell access | Reject module |
| `fs` outside sandbox | Block arbitrary file access | Reject module |
| `net` without ACL | Block arbitrary network | Reject module |
| Obfuscated code | Require readable source | Reject module |
| Dependency CVEs | Check deps for known vulnerabilities | Warn + require approval |

**And** analysis uses AST parsing (not regex)
**And** detailed report shows exact line numbers
**And** `trafi module validate <path>` runs analysis without installing

---

### Story 13.5b: Filesystem Isolation Layer

As a **System**,
I want **to isolate module filesystem access to declared paths only**,
So that **modules cannot access sensitive files**.

**Acceptance Criteria:**

**Given** a module declares FS permissions in manifest:
```json
{
  "permissions": {
    "fs": {
      "read": ["./config", "./templates"],
      "write": ["./cache", "./logs"]
    }
  }
}
```
**When** the module attempts filesystem operations
**Then** the system:
- Provides `SandboxedFS` class instead of native `fs`
- Validates all paths against declared permissions
- Resolves relative paths to module root only
- Blocks access to parent directories (`../`)
- Blocks access to system paths (`/etc`, `/var`, etc.)
**And** violations throw `SecurityError` with clear message
**And** violations are logged to security audit trail

---

### Story 13.5c: Network ACL Layer

As a **System**,
I want **to restrict module network access to an explicit allowlist**,
So that **modules cannot exfiltrate data or attack external systems**.

**Acceptance Criteria:**

**Given** a module declares network permissions:
```json
{
  "permissions": {
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
}
```
**When** the module attempts network requests
**Then** the system:
- Validates domain against allowlist
- Validates port against allowed ports
- Blocks HTTP (only HTTPS allowed by default)
- Logs all network requests to audit trail
**And** unauthorized requests throw `SecurityError`
**And** DNS resolution is restricted to allowed domains
**And** localhost/internal IP ranges are blocked by default

---

### Story 13.5d: Runtime Policy Layer

As a **System**,
I want **to enforce resource limits on module execution**,
So that **modules cannot exhaust system resources**.

**Acceptance Criteria:**

**Given** a module is executing
**When** resource consumption is monitored
**Then** the following limits are enforced:

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU time per request** | 5 seconds | Kill process, return 503 |
| **Memory per module** | 256MB | OOM kill, restart module |
| **Open file handles** | 100 | Reject new opens |
| **Network connections** | 50 concurrent | Queue or reject |
| **Database queries** | Tenant-scoped only | Reject cross-tenant |

**And** limits are configurable in `trafi.config.ts`
**And** resource usage is exposed in module metrics
**And** repeated limit violations trigger quarantine

---

## Story 13.6: Module Discovery and Loading

As a **System**,
I want **to dynamically discover and load modules at runtime**,
So that **modules integrate seamlessly**.

**Acceptance Criteria:**

**Given** enabled modules exist
**When** the system starts
**Then** modules are loaded in dependency order
**And** module entry points are executed
**And** failures in one module don't crash the system
**And** loading time is logged per module
**And** circular dependencies are detected and rejected

---

## Story 13.7: Module Hot-Reload (Development)

As a **Developer (Thomas)**,
I want **modules to hot-reload on file changes**,
So that **I can develop modules efficiently**.

**Acceptance Criteria:**

**Given** development mode is active
**When** module files change
**Then** the module reloads automatically
**And** backend services are re-registered
**And** dashboard components refresh
**And** state is preserved where possible
**And** reload errors show helpful messages
**And** hot-reload only applies to changed module

---

## Story 13.8: Backend Extension - Services

As a **Developer (Thomas)**,
I want **modules to register backend services**,
So that **I can add custom business logic**.

**Acceptance Criteria:**

**Given** a module defines backend services
**When** the module is loaded
**Then** services are registered with NestJS DI
**And** services can inject core Trafi services
**And** services are scoped to module namespace
**And** service lifecycle is managed (init, destroy)
**And** example service pattern is documented

---

## Story 13.9: Backend Extension - API Endpoints

As a **Developer (Thomas)**,
I want **modules to add custom API endpoints**,
So that **I can expose custom functionality**.

**Acceptance Criteria:**

**Given** a module defines controllers
**When** the module is loaded
**Then** endpoints are registered at `/api/modules/<module-name>/...`
**And** endpoints inherit authentication/authorization
**And** endpoints are documented in OpenAPI
**And** rate limiting applies per tenant
**And** endpoints can be versioned

---

## Story 13.10: Dashboard Extension - Views

As a **Developer (Thomas)**,
I want **modules to add dashboard pages**,
So that **custom UI is integrated seamlessly**.

**Acceptance Criteria:**

**Given** a module defines dashboard components
**When** the module is loaded
**Then** routes are registered in dashboard navigation
**And** components render within dashboard shell
**And** components can use Shadcn UI primitives
**And** module state is isolated (no cross-module leaks)
**And** permissions control access to module views

---

## Story 13.11: Event Hooks System

As a **Developer (Thomas)**,
I want **modules to subscribe to business events**,
So that **I can react to platform activity**.

**Acceptance Criteria:**

**Given** a module subscribes to events
**When** events occur (e.g., order.created, payment.completed)
**Then** module handlers are invoked
**And** handlers receive typed event payload
**And** handler errors don't block the main flow
**And** async handlers are queued as jobs
**And** available events are documented

---

## Story 13.12: Database Schema Extension

As a **Developer (Thomas)**,
I want **modules to extend the database schema**,
So that **I can store custom data**.

**Acceptance Criteria:**

**Given** a module defines migrations
**When** module is enabled
**Then** migrations run automatically
**And** tables are prefixed with module name
**And** migrations are reversible (up/down)
**And** migration state is tracked separately
**And** module removal prompts for data cleanup
**And** Prisma schema extension is supported

---

## Story 13.13: Module Update and Compatibility

As a **Developer (Thomas)**,
I want **to update modules with version checking**,
So that **updates don't break my store**.

**Acceptance Criteria:**

**Given** a module update is available
**When** running `trafi module update <name>`
**Then** the system:
- Checks version compatibility with core
- Runs migration if schema changed
- Validates new code
- Preserves configuration
**And** breaking changes show warning
**And** rollback is available if update fails

---

## Story 13.14: Module Rollback and Removal

As a **Developer (Thomas)**,
I want **to rollback or remove modules cleanly**,
So that **I can undo changes safely**.

**Acceptance Criteria:**

**Given** a module is installed
**When** running `trafi module remove <name>`
**Then** the system:
- Disables the module first
- Prompts for data cleanup (keep/delete)
- Runs down migrations if requested
- Removes module files
- Updates configuration
**And** removal is logged
**And** force flag skips prompts

---

## Story 13.15: Module Custom Metrics

As a **Developer (Thomas)**,
I want **modules to register custom metrics**,
So that **module health is observable**.

**Acceptance Criteria:**

**Given** a module wants to expose metrics
**When** metrics are registered
**Then** they are:
- Prefixed with module name
- Exported via Prometheus/OTEL
- Visible in ops dashboard
- Following metric naming conventions
**And** counter, gauge, histogram types supported
**And** example metrics pattern is documented

---

## MODULE SANDBOX: Security & Marketplace Stories

_Stories 13.16-13.18 implement the PRD v2 Module Sandbox security incident response and Marketplace tier system._

---

## Story 13.16: Security Incident Response

As a **System**,
I want **to automatically respond to module security violations**,
So that **security incidents are contained immediately**.

**Acceptance Criteria:**

**Given** a module violates security policies
**When** a violation is detected (FS, Network, Runtime)
**Then** the system:
1. **Blocks** the violating operation immediately
2. **Logs** the incident to security audit trail:
   ```typescript
   interface SecurityIncident {
     moduleId: string;
     storeId: string;
     violationType: 'fs' | 'network' | 'cpu' | 'memory' | 'static';
     details: string;
     timestamp: Date;
     action: 'blocked' | 'terminated' | 'quarantined';
   }
   ```
3. **Quarantines** the module if severity is critical or repeated
4. **Notifies** the store owner via dashboard alert
5. **Reports** to Trafi security team (if Marketplace module)

**And** quarantined modules cannot be re-enabled without explicit approval
**And** security incidents are visible in Dashboard > Settings > Modules > Security Logs
**And** `trafi module quarantine <name>` CLI command for emergency disable

---

## Story 13.17: Marketplace Module Tiers

As a **Developer (Thomas)**,
I want **modules to have trust tiers based on review level**,
So that **I can make informed decisions about module risk**.

**Acceptance Criteria:**

**Given** modules are available for installation
**When** displayed in module listings
**Then** tier badges are shown:

| Tier | Badge | Requirements | Permissions |
|------|-------|--------------|-------------|
| **Verified** | ✓ VERIFIED (green) | Trafi team code audit, security review, publisher verification | Full sandbox permissions |
| **Community** | COMMUNITY (neutral) | Automated static analysis passes, >10 installs, no security incidents | Limited permissions (no network by default) |
| **Private** | PRIVATE (yellow) | Owner uploaded, no external review | Full permissions (owner accepts risk) |

**And** tier is displayed in:
- CLI: `trafi module list` and `trafi module add` output
- Dashboard: Module cards with tier badge
- Install prompts: Warning for non-Verified modules
**And** Private modules require `--trust-private` flag or dashboard confirmation
**And** Community → Verified promotion requires Trafi team review request

---

## Story 13.18: Module Permissions Dashboard UI

As a **Merchant (Sophie)**,
I want **to view and manage module permissions in a Brutalist interface**,
So that **I understand what modules can access**.

**Acceptance Criteria:**

**Given** modules are installed
**When** Merchant views Dashboard > Settings > Modules > [module] > Permissions
**Then** they see:
- **Filesystem Permissions:** Read/Write paths in monospace (JetBrains Mono)
- **Network Permissions:** Allowed domains with ports and reasons
- **Resource Limits:** CPU, memory, connections
- **Security Status:** Last scan date, violations count, quarantine status
- **Tier Badge:** VERIFIED / COMMUNITY / PRIVATE
**And** UI follows Brutalist design (0px radius, #000 background, 1px borders)
**And** security violations highlighted in #FF3366
**And** "Revoke Permissions" action with confirmation
