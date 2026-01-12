# Epic 13: Module System & Extensibility

Developer peut creer, installer, et gerer des modules custom avec hot-reload et sandboxing.

**FRs covered:** FR5, FR91, FR92, FR93, FR94, FR95, FR96, FR97, FR98, FR99, FR100, FR101, FR102, FR103, FR104

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

## Story 13.5: Module Validation and Safety

As a **System**,
I want **to validate module code for security**,
So that **malicious modules can't harm the platform**.

**Acceptance Criteria:**

**Given** a module is being installed or enabled
**When** validation runs
**Then** checks include:
- No `eval()` or `Function()` usage
- No direct filesystem access outside module dir
- Network ACL compliance (allowed hosts only)
- No environment variable access (except allowed)
- Dependency vulnerability scan
**And** violations block activation
**And** detailed report explains issues

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
