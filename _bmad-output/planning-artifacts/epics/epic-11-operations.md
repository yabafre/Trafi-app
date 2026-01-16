# Epic 11: Platform Operations & Jobs

Ops peuvent monitorer la sante systeme, gerer les jobs asynchrones BullMQ, et diagnostiquer les problemes.

**FRs covered:** FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR85, FR86, FR87

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing BullMQ, monitoring libraries
- **RETRO-2:** JobService, MonitoringService use `protected` methods
- **RETRO-3:** JobsModule exports explicit public API for custom job types
- **RETRO-4:** Dashboard ops components accept customization props
- **RETRO-5:** Jobs dashboard uses composition pattern (wrappable views)
- **RETRO-6:** Code with @trafi/core override patterns (custom metrics, alerts)

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

Inspired by Trigger.dev for Jobs UI architecture.

**Visual Design:**
- **UX-1:** Dark mode default for all ops pages
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Operations > [section]
- **UX-4:** Status badges: waiting (#6B7280), active (#3B82F6), completed (#00FF94), failed (#FF3366)
- **UX-5:** Real-time logs streaming with monospace font (like Trigger.dev)
- **UX-6:** Run timeline with duration visualization (1px grid lines)
- **UX-7:** One-click replay for failed jobs (Acid Lime button)
- **UX-8:** Payload inspector for job inputs/outputs (radius-0 panels)
- **UX-9:** System health in strict rectangular grid metrics
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Error #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for logs/data, system font for labels

---

## Story 11.1: BullMQ Job Queue Setup

As a **System**,
I want **a reliable job queue for async operations**,
So that **emails, webhooks, and long tasks don't block requests**.

**Acceptance Criteria:**

**Given** the platform needs async processing
**When** BullMQ is configured
**Then** the system has:
- Redis-backed queue with named queues per job type
- Worker processes for job execution
- Job serialization with tenant context
- Configurable concurrency per queue
**And** queues are tenant-isolated where needed
**And** connection pooling prevents Redis exhaustion

---

## Story 11.2: Job Retry with Exponential Backoff

As a **System**,
I want **failed jobs to retry automatically**,
So that **transient failures are handled gracefully**.

**Acceptance Criteria:**

**Given** a job fails during execution
**When** retry logic is triggered
**Then** the job retries with:
- Exponential backoff (1s, 2s, 4s, 8s, etc.)
- Maximum retry attempts (configurable, default 5)
- Jitter to prevent thundering herd
**And** each attempt is logged with error details
**And** final failure moves job to dead-letter queue
**And** retry count is visible in job metadata

---

## Story 11.3: Dead-Letter Queue Management

As an **Ops**,
I want **to manage jobs that have permanently failed**,
So that **I can investigate and retry or dismiss them**.

**Acceptance Criteria:**

**Given** jobs have exhausted retries
**When** Ops views the dead-letter queue
**Then** they can:
- See all failed jobs with error messages
- View job payload and metadata
- Retry individual jobs
- Bulk retry or delete jobs
- Filter by job type, date, error
**And** DLQ is monitored for alerting
**And** old DLQ entries auto-expire (configurable retention)

---

## Story 11.4: Queue Status Dashboard

As an **Ops**,
I want **to view queue health in real-time**,
So that **I can identify processing bottlenecks**.

**Acceptance Criteria:**

**Given** jobs are being processed
**When** Ops views Queue Dashboard
**Then** they see per queue:
- Waiting jobs count
- Active jobs count
- Completed (recent) count
- Failed count
- Processing rate (jobs/minute)
**And** charts show trends over time
**And** alerts highlight unhealthy queues

---

## Story 11.5: System Health Dashboard

As an **Ops**,
I want **a real-time system health overview**,
So that **I can monitor platform status at a glance**.

**Acceptance Criteria:**

**Given** the platform is running
**When** Ops accesses Health Dashboard
**Then** they see:
- Service status (API, Dashboard, Workers)
- Database connection health
- Redis connection health
- Overall error rate (last hour)
- Request latency percentiles (p50, p95, p99)
**And** status indicators are color-coded (green/yellow/red)
**And** dashboard auto-refreshes (configurable interval)

---

## Story 11.6: Per-Tenant Metrics

As an **Ops**,
I want **to view metrics broken down by tenant**,
So that **I can identify tenant-specific issues**.

**Acceptance Criteria:**

**Given** multiple tenants are active
**When** Ops views Tenant Metrics
**Then** they see per tenant:
- Request count and error rate
- API latency (p95)
- Active jobs and queue depth
- Database query performance
- Storage usage
**And** tenants can be sorted by any metric
**And** problematic tenants are highlighted

---

## Story 11.7: Event Flow Health Indicator

As an **Ops**,
I want **to see per-store instrumentation health**,
So that **I know if Profit Engine data is flowing**.

**Acceptance Criteria:**

**Given** stores have event instrumentation
**When** Ops views Event Health
**Then** they see per store:
- Events received (last hour/day)
- Event types distribution
- Gap detection (missing expected events)
- Data freshness indicator
**And** unhealthy stores are flagged
**And** health is prerequisite for Profit Engine (NFR-REL-6)

---

## Story 11.8: SLO Monitoring and Alerting

As a **System**,
I want **to alert when SLO thresholds are violated**,
So that **issues are caught before customers notice**.

**Acceptance Criteria:**

**Given** SLOs are defined (availability, latency)
**When** metrics breach thresholds
**Then** alerts are triggered via:
- Slack notification
- PagerDuty (for critical)
- Dashboard banner
**And** error budget tracking shows remaining budget
**And** alerts include context (which metric, how severe)
**And** alert fatigue is prevented (deduplication, grouping)

---

## Story 11.9: Synthetic Monitoring

As a **System**,
I want **synthetic checks for critical paths**,
So that **failures are detected proactively**.

**Acceptance Criteria:**

**Given** critical paths are defined
**When** synthetic monitoring runs
**Then** it executes:
- API health check every 1 minute
- Checkout funnel ping every 5 minutes
- Database connectivity check
- Redis connectivity check
**And** failures trigger immediate alerts
**And** results are logged for trend analysis
**And** checks run from external location (not internal)

---

## Story 11.10: Support Mode Access

As an **Ops**,
I want **to access tenant stores in read-only mode**,
So that **I can help merchants troubleshoot issues**.

**Acceptance Criteria:**

**Given** a merchant requests support
**When** Ops activates support mode
**Then** they can:
- View tenant dashboard as read-only
- See all data the merchant sees
- Cannot modify any data
- Access is time-limited (auto-expires)
**And** support access is logged with reason
**And** merchant can revoke access anytime
**And** access requires explicit merchant consent

---

## Story 11.11: Diagnostic Report Generation

As an **Ops**,
I want **to generate diagnostic reports for merchants**,
So that **I can provide detailed support**.

**Acceptance Criteria:**

**Given** a support case exists
**When** Ops generates a diagnostic report
**Then** the report includes:
- Store configuration summary
- Recent error logs (sanitized)
- Performance metrics for period
- Event flow health status
- Recommendations for issues found
**And** report excludes sensitive data (PII, credentials)
**And** report is downloadable PDF

---

## Story 11.12: Deployment Rollback

As an **Ops**,
I want **to rollback to a previous deployment version**,
So that **I can quickly recover from bad deploys**.

**Acceptance Criteria:**

**Given** a deployment causes issues
**When** Ops initiates rollback
**Then** the system:
- Lists recent deployment versions
- Allows selection of target version
- Executes rollback with zero downtime
- Verifies health after rollback
**And** rollback is logged with reason
**And** database migrations are considered (forward-only warning)
**And** rollback can be scoped (API only, full platform)
