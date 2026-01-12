# Epic 2: Admin Authentication & Store Setup

Admin peut se connecter au dashboard, configurer le store, et gerer les acces utilisateurs avec RBAC.

**FRs covered:** FR35, FR36, FR37, FR38, FR39, FR40

---

## Story 2.1: Admin User Model and Authentication

As an **Admin**,
I want **to log in to the dashboard with email and password**,
So that **I can securely access my store's administration**.

**Acceptance Criteria:**

**Given** the Admin user model exists in the database
**When** an admin submits valid credentials on the login form
**Then** a JWT session is created and stored securely
**And** the admin is redirected to the dashboard home
**And** invalid credentials display an appropriate error message
**And** passwords are hashed with bcrypt (min 10 rounds)

---

## Story 2.2: Dashboard Authentication Guard

As a **System**,
I want **all dashboard routes protected by authentication**,
So that **only authenticated admins can access admin features**.

**Acceptance Criteria:**

**Given** an unauthenticated user attempts to access a dashboard route
**When** the request is processed
**Then** the user is redirected to the login page
**And** authenticated users can access protected routes
**And** session expiration triggers re-authentication
**And** CSRF protection is applied to all state-changing operations (NFR-SEC-11)

---

## Story 2.3: Role-Based Access Control (RBAC) Foundation

As an **Admin**,
I want **users to have specific roles with defined permissions**,
So that **I can control what each team member can do**.

**Acceptance Criteria:**

**Given** the RBAC system is implemented
**When** roles are defined (Owner, Admin, Editor, Viewer)
**Then** each role has specific permission sets:
- Owner: full access including billing and ownership transfer
- Admin: user management, settings, all commerce features
- Editor: product, order, customer management
- Viewer: read-only access to all data
**And** custom decorators enforce permissions on API endpoints
**And** unauthorized actions return 403 Forbidden

---

## Story 2.4: Admin User Management

As an **Owner/Admin**,
I want **to create, edit, and deactivate admin user accounts**,
So that **I can manage my team's access to the store**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access the Users management page
**Then** they can:
- View all users with their roles and status
- Invite new users via email
- Change user roles (within their permission level)
- Deactivate user accounts
**And** users cannot elevate permissions beyond their own role
**And** at least one Owner must always exist

---

## Story 2.5: API Key Management

As an **Admin**,
I want **to generate and manage API keys with scoped permissions**,
So that **I can integrate external services securely**.

**Acceptance Criteria:**

**Given** an Admin is authenticated
**When** they access API Keys settings
**Then** they can:
- Generate new API keys with selected permission scopes
- View existing keys (masked, showing only last 4 chars)
- Revoke API keys immediately
- Set expiration dates for keys
**And** API keys are stored hashed in the database
**And** generated keys are shown only once at creation

---

## Story 2.6: Tenant-Scoped Authorization

As a **System**,
I want **all API requests scoped to the authenticated tenant**,
So that **stores cannot access each other's data**.

**Acceptance Criteria:**

**Given** a multi-tenant system with isolated stores
**When** any API request is made
**Then** the request is automatically scoped to the authenticated store
**And** database queries include tenant filtering
**And** attempting to access another tenant's resources returns 404
**And** audit logs capture tenant context for all operations (NFR-SEC-7)

---

## Story 2.7: Store Settings Configuration

As an **Owner/Admin**,
I want **to configure basic store settings**,
So that **my store reflects my brand and business requirements**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access Store Settings
**Then** they can configure:
- Store name and description
- Default currency and locale
- Contact email and support information
- Timezone settings
**And** changes are saved and reflected across the store immediately

---

## Story 2.8: Ownership Transfer

As an **Owner**,
I want **to transfer store ownership to another admin**,
So that **I can hand over control when needed**.

**Acceptance Criteria:**

**Given** the current Owner initiates a transfer
**When** they select a target admin and confirm
**Then** the target admin receives Owner role
**And** the initiating user is demoted to Admin
**And** email confirmation is sent to both parties
**And** transfer is logged in the audit trail
**And** transfer requires password re-confirmation for security
