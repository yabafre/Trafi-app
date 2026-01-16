# Epic 7: Customer Accounts & Wishlist

Buyer peut creer un compte (email, Google, Apple), gerer ses adresses, wishlist, et voir son historique.

**FRs covered:** FR41, FR42, FR43, FR44, FR45, FR79, FR80, FR81, FR82, FR83, FR84

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing OAuth providers, bcrypt
- **RETRO-2:** CustomerService, WishlistService use `protected` methods
- **RETRO-3:** CustomerModule exports explicit public API for custom auth flows
- **RETRO-4:** Storefront account components accept customization props
- **RETRO-5:** Account pages use composition pattern (wrappable sections)
- **RETRO-6:** Code with @trafi/core override patterns (custom customer fields)

### UX Design Requirements (Storefront - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Storefront Visual Design:**
- **UX-STORE-1:** Account pages use fixed header with solid black background
- **UX-STORE-2:** Login/Register forms centered with 1px border card styling
- **UX-STORE-3:** OAuth buttons (Google, Apple) prominent, radius-0
- **UX-STORE-4:** Wishlist heart icon with instant fill on add (no animation)
- **UX-STORE-5:** Address book in strict rectangular grid layout
- **UX-STORE-6:** Order history list with status badges (radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for CTAs, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for order data/prices, system font for body

### Dashboard UX (Merchant Customer View - Digital Brutalism v2)

**Visual Design:**
- **UX-1:** Dark mode default
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Customers > [Customer]
- **UX-8:** Shadcn UI: DataTable for customer list, Tabs for customer detail (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere

---

## Story 7.1: Customer Registration with Email

As a **Buyer (Emma)**,
I want **to create an account with my email and password**,
So that **I can have a personalized shopping experience**.

**Acceptance Criteria:**

**Given** a buyer is on the registration page
**When** they submit email and password
**Then** account is created with:
- Email validation (format and uniqueness)
- Password strength requirements (min 8 chars, mixed case)
- Password hashed with bcrypt
**And** welcome email is sent
**And** buyer is automatically logged in
**And** any guest cart is merged with the new account

### Technical Implementation

#### File Structure
```
packages/validators/src/customer/
  register.schema.ts          # Registration validation
  password.schema.ts          # Password strength rules

apps/api/src/modules/customer/
  customer.module.ts
  customer.controller.ts
  customer.service.ts         # Protected methods for extensibility
  customer.router.ts          # tRPC router
  dto/register.dto.ts

apps/storefront/src/app/(auth)/register/
  page.tsx                    # RSC - registration page
  _components/
    RegisterForm.tsx          # Client component
  _actions/
    register.action.ts        # Zsa server action
```

#### Zod Schema (packages/validators)
```typescript
// packages/validators/src/customer/register.schema.ts
import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  acceptsMarketing: z.boolean().default(false),
  guestCartId: z.string().optional(), // For cart merge
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
```

#### Backend Service (apps/api)
```typescript
// apps/api/src/modules/customer/customer.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { RegisterCustomerInput } from '@trafi/validators';

@Injectable()
export class CustomerService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private cart: CartService,
  ) {}

  protected async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  protected async checkEmailAvailability(email: string): Promise<boolean> {
    const existing = await this.prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !existing;
  }

  protected async register(input: RegisterCustomerInput): Promise<Customer> {
    const emailLower = input.email.toLowerCase();

    // Check email availability
    const isAvailable = await this.checkEmailAvailability(emailLower);
    if (!isAvailable) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(input.password);

    // Create customer with cst_ prefix
    const customer = await this.prisma.customer.create({
      data: {
        id: `cst_${cuid()}`,
        email: emailLower,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        acceptsMarketing: input.acceptsMarketing,
        emailVerified: false,
      },
    });

    // Merge guest cart if provided
    if (input.guestCartId) {
      await this.cart.mergeGuestCart(input.guestCartId, customer.id);
    }

    // Queue welcome email
    await this.email.queueWelcomeEmail(customer);

    return customer;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/customer/customer.router.ts
import { router, publicProcedure } from '../../trpc';
import { registerCustomerSchema } from '@trafi/validators';

export const customerRouter = router({
  register: publicProcedure
    .input(registerCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const customer = await ctx.customerService.register(input);

      // Create session token
      const session = await ctx.sessionService.createSession(customer.id);

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        sessionToken: session.token,
      };
    }),
});
```

#### Server Action (Zsa)
```typescript
// apps/storefront/src/app/(auth)/register/_actions/register.action.ts
'use server';

import { createServerAction } from 'zsa';
import { registerCustomerSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';
import { cookies } from 'next/headers';

export const registerAction = createServerAction()
  .input(registerCustomerSchema)
  .handler(async ({ input }) => {
    const result = await trpc.customer.register.mutate(input);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { customer: result.customer };
  });
```

#### Client Component
```typescript
// apps/storefront/src/app/(auth)/register/_components/RegisterForm.tsx
'use client';

import { useServerAction } from 'zsa-react';
import { registerAction } from '../_actions/register.action';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart';

export function RegisterForm() {
  const router = useRouter();
  const guestCartId = useCartStore((s) => s.cartId);

  const { execute, isPending, error } = useServerAction(registerAction);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const [result, err] = await execute({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      acceptsMarketing: formData.get('marketing') === 'on',
      guestCartId,
    });

    if (result) {
      router.push('/account');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error.message}</div>
      )}
      <input name="firstName" placeholder="First name" required />
      <input name="lastName" placeholder="Last name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <label>
        <input name="marketing" type="checkbox" />
        Subscribe to marketing emails
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
```

#### Data Flow
```
RegisterForm (Client)
  ↓ useServerAction(registerAction)
Server Action (registerAction)
  ↓ trpc.customer.register.mutate()
tRPC Router
  ↓ customerService.register()
CustomerService (NestJS)
  ↓ Prisma + bcrypt + EmailQueue
Database + Session Cookie
```

#### UX Implementation Notes
- Form centered with card styling (UX-STORE-2)
- Inline password strength indicator
- Real-time email availability check (debounced 300ms)
- Form validation feedback 150ms (UX-ANIM)
- General Sans font for form labels

---

## Story 7.2: Customer Login and Session

As a **Buyer (Emma)**,
I want **to log in to my account**,
So that **I can access my saved information**.

**Acceptance Criteria:**

**Given** a registered buyer
**When** they submit valid credentials
**Then** a secure session is created
**And** session persists across browser closes (remember me)
**And** invalid credentials show appropriate error
**And** account lockout after 5 failed attempts (temporary)
**And** logout clears session completely

### Technical Implementation

#### File Structure
```
packages/validators/src/customer/
  login.schema.ts             # Login validation

apps/api/src/modules/auth/
  auth.service.ts             # Login/logout, lockout logic
  session.service.ts          # Session management
  lockout.service.ts          # Rate limiting for failed attempts

apps/storefront/src/app/(auth)/login/
  page.tsx
  _components/
    LoginForm.tsx
  _actions/
    login.action.ts
    logout.action.ts
```

#### Zod Schema
```typescript
// packages/validators/src/customer/login.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

#### Backend Services
```typescript
// apps/api/src/modules/auth/lockout.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class LockoutService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60; // 15 minutes

  constructor(private redis: Redis) {}

  protected async recordFailedAttempt(email: string): Promise<number> {
    const key = `lockout:${email.toLowerCase()}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, this.LOCKOUT_DURATION);
    }
    return attempts;
  }

  protected async isLocked(email: string): Promise<boolean> {
    const key = `lockout:${email.toLowerCase()}`;
    const attempts = await this.redis.get(key);
    return parseInt(attempts || '0', 10) >= this.MAX_ATTEMPTS;
  }

  protected async clearLockout(email: string): Promise<void> {
    await this.redis.del(`lockout:${email.toLowerCase()}`);
  }
}

// apps/api/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private session: SessionService,
    private lockout: LockoutService,
  ) {}

  protected async login(input: LoginInput): Promise<{ customer: Customer; session: Session }> {
    const email = input.email.toLowerCase();

    // Check lockout
    if (await this.lockout.isLocked(email)) {
      throw new ForbiddenException('Account temporarily locked. Try again in 15 minutes.');
    }

    // Find customer
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      await this.lockout.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, customer.passwordHash);
    if (!isValid) {
      await this.lockout.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Clear lockout on success
    await this.lockout.clearLockout(email);

    // Create session
    const sessionDuration = input.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const session = await this.session.createSession(customer.id, sessionDuration);

    return { customer, session };
  }

  protected async logout(sessionToken: string): Promise<void> {
    await this.session.invalidateSession(sessionToken);
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/auth/auth.router.ts
import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { loginSchema } from '@trafi/validators';

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const { customer, session } = await ctx.authService.login(input);
      return {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        sessionToken: session.token,
        expiresAt: session.expiresAt,
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.authService.logout(ctx.session.token);
      return { success: true };
    }),
});
```

#### Server Actions (Zsa)
```typescript
// apps/storefront/src/app/(auth)/login/_actions/login.action.ts
'use server';

import { createServerAction } from 'zsa';
import { loginSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';
import { cookies } from 'next/headers';

export const loginAction = createServerAction()
  .input(loginSchema)
  .handler(async ({ input }) => {
    const result = await trpc.auth.login.mutate(input);

    const cookieStore = await cookies();
    cookieStore.set('session_token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: input.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
    });

    return { customer: result.customer };
  });

// apps/storefront/src/app/(auth)/login/_actions/logout.action.ts
'use server';

import { createServerAction } from 'zsa';
import { trpc } from '@/lib/trpc/server';
import { cookies } from 'next/headers';

export const logoutAction = createServerAction()
  .handler(async () => {
    await trpc.auth.logout.mutate();

    const cookieStore = await cookies();
    cookieStore.delete('session_token');

    return { success: true };
  });
```

#### Client Component
```typescript
// apps/storefront/src/app/(auth)/login/_components/LoginForm.tsx
'use client';

import { useServerAction } from 'zsa-react';
import { loginAction } from '../_actions/login.action';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const { execute, isPending, error } = useServerAction(loginAction);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const [result, err] = await execute({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      rememberMe: formData.get('remember') === 'on',
    });

    if (result) {
      router.push(redirectTo);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error.message}</div>
      )}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <label className="flex items-center gap-2">
        <input name="remember" type="checkbox" />
        Remember me
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

#### Data Flow
```
LoginForm (Client)
  ↓ useServerAction(loginAction)
Server Action
  ↓ trpc.auth.login.mutate()
AuthService (NestJS)
  ↓ LockoutService check → bcrypt.compare()
Session created → Cookie set
```

#### UX Implementation Notes
- OAuth buttons prominent above email form (UX-STORE-3)
- "Forgot password?" link below password field
- Lockout message with countdown timer
- Form validation feedback 150ms (UX-ANIM)

---

## Story 7.3: Password Reset Flow

As a **Buyer (Emma)**,
I want **to reset my password if I forget it**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** a buyer requests password reset
**When** they enter their email
**Then** a reset link is sent (valid for 1 hour)
**And** link leads to password reset form
**And** submitting new password updates the account
**And** all existing sessions are invalidated
**And** confirmation email is sent after reset
**And** invalid/expired links show clear messaging

### Technical Implementation

#### File Structure
```
packages/validators/src/customer/
  password-reset.schema.ts

apps/api/src/modules/auth/
  password-reset.service.ts   # Token generation, validation

apps/storefront/src/app/(auth)/forgot-password/
  page.tsx
  _components/ForgotPasswordForm.tsx
  _actions/request-reset.action.ts

apps/storefront/src/app/(auth)/reset-password/
  page.tsx
  _components/ResetPasswordForm.tsx
  _actions/reset-password.action.ts
```

#### Zod Schemas
```typescript
// packages/validators/src/customer/password-reset.schema.ts
import { z } from 'zod';
import { passwordSchema } from './register.schema';

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

#### Backend Service
```typescript
// apps/api/src/modules/auth/password-reset.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private session: SessionService,
  ) {}

  protected async requestReset(email: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!customer) return;

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Store token with expiry
    await this.prisma.passwordResetToken.create({
      data: {
        id: `prt_${cuid()}`,
        customerId: customer.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY),
      },
    });

    // Queue email with reset link
    await this.email.queuePasswordResetEmail(customer, token);
  }

  protected async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { customer: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      // Update customer password
      this.prisma.customer.update({
        where: { id: resetToken.customerId },
        data: { passwordHash },
      }),
      // Mark token as used
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Invalidate all existing sessions
    await this.session.invalidateAllSessions(resetToken.customerId);

    // Send confirmation email
    await this.email.queuePasswordChangedEmail(resetToken.customer);
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/auth/password-reset.router.ts
export const passwordResetRouter = router({
  requestReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.passwordResetService.requestReset(input.email);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.passwordResetService.resetPassword(input.token, input.newPassword);
      return { success: true };
    }),
});
```

#### Server Actions (Zsa)
```typescript
// apps/storefront/src/app/(auth)/forgot-password/_actions/request-reset.action.ts
'use server';

import { createServerAction } from 'zsa';
import { requestPasswordResetSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const requestResetAction = createServerAction()
  .input(requestPasswordResetSchema)
  .handler(async ({ input }) => {
    await trpc.passwordReset.requestReset.mutate(input);
    return { success: true };
  });

// apps/storefront/src/app/(auth)/reset-password/_actions/reset-password.action.ts
'use server';

import { createServerAction } from 'zsa';
import { resetPasswordSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const resetPasswordAction = createServerAction()
  .input(resetPasswordSchema)
  .handler(async ({ input }) => {
    await trpc.passwordReset.resetPassword.mutate(input);
    return { success: true };
  });
```

#### Data Flow
```
ForgotPasswordForm (Client)
  ↓ useServerAction(requestResetAction)
PasswordResetService
  ↓ Generate token → Queue email
Email sent with reset link

ResetPasswordForm (Client)
  ↓ useServerAction(resetPasswordAction)
PasswordResetService
  ↓ Validate token → Update password → Invalidate sessions
Success → Redirect to login
```

#### UX Implementation Notes
- Same centered card layout as login (UX-STORE-2)
- Success message: "If this email exists, you'll receive a reset link"
- Token validation shows clear expired/invalid state
- Password strength indicator on reset form

---

## Story 7.4: Google OAuth Authentication

As a **Buyer (Emma)**,
I want **to sign in with my Google account**,
So that **I can log in quickly without a new password**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Google"
**When** they authorize on Google
**Then** account is created or linked automatically
**And** email from Google is used as identifier
**And** profile name is pre-filled from Google
**And** buyer is logged in upon return
**And** existing email account can be linked to Google

### Technical Implementation

#### File Structure
```
apps/api/src/modules/oauth/
  oauth.module.ts
  oauth.service.ts            # Protected methods for extensibility
  google.strategy.ts          # Passport Google strategy
  oauth.controller.ts         # OAuth endpoints

apps/storefront/src/app/api/auth/google/
  route.ts                    # Initiate OAuth flow
apps/storefront/src/app/api/auth/google/callback/
  route.ts                    # Handle OAuth callback
```

#### Backend Service
```typescript
// apps/api/src/modules/oauth/oauth.service.ts
import { Injectable } from '@nestjs/common';

export interface OAuthProfile {
  provider: 'google' | 'apple';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private session: SessionService,
  ) {}

  protected async authenticateOAuth(profile: OAuthProfile): Promise<{
    customer: Customer;
    session: Session;
    isNewAccount: boolean;
  }> {
    // Check if OAuth account already linked
    const existingOAuth = await this.prisma.customerOAuth.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: { customer: true },
    });

    if (existingOAuth) {
      const session = await this.session.createSession(existingOAuth.customerId);
      return { customer: existingOAuth.customer, session, isNewAccount: false };
    }

    // Check if email already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    if (existingCustomer) {
      // Link OAuth to existing account
      await this.prisma.customerOAuth.create({
        data: {
          id: `oauth_${cuid()}`,
          customerId: existingCustomer.id,
          provider: profile.provider,
          providerId: profile.providerId,
        },
      });

      const session = await this.session.createSession(existingCustomer.id);
      return { customer: existingCustomer, session, isNewAccount: false };
    }

    // Create new customer with OAuth link
    const customer = await this.prisma.customer.create({
      data: {
        id: `cst_${cuid()}`,
        email: profile.email.toLowerCase(),
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        emailVerified: true, // OAuth emails are verified
        oauthAccounts: {
          create: {
            id: `oauth_${cuid()}`,
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
      },
    });

    const session = await this.session.createSession(customer.id);
    return { customer, session, isNewAccount: true };
  }
}

// apps/api/src/modules/oauth/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
```

#### OAuth Controller
```typescript
// apps/api/src/modules/oauth/oauth.controller.ts
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class OAuthController {
  constructor(private oauth: OAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const profile = req.user as OAuthProfile;
    const { session } = await this.oauth.authenticateOAuth(profile);

    // Redirect with session token (via query param, then set cookie client-side)
    const redirectUrl = new URL('/auth/oauth-callback', req.headers.origin);
    redirectUrl.searchParams.set('token', session.token);

    return res.redirect(redirectUrl.toString());
  }
}
```

#### Storefront OAuth Callback Handler
```typescript
// apps/storefront/src/app/auth/oauth-callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setSessionCookie } from '../_actions/set-session.action';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setSessionCookie(token).then(() => {
        router.push('/account');
      });
    }
  }, [searchParams, router]);

  return <div>Completing sign in...</div>;
}

// apps/storefront/src/app/auth/_actions/set-session.action.ts
'use server';

import { cookies } from 'next/headers';

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
  });
}
```

#### Data Flow
```
"Sign in with Google" Button
  ↓ Redirect to /api/auth/google
Google OAuth Consent Screen
  ↓ User authorizes
Callback to /api/auth/google/callback
  ↓ GoogleStrategy validates
OAuthService.authenticateOAuth()
  ↓ Create/link account, create session
Redirect to /auth/oauth-callback?token=xxx
  ↓ setSessionCookie server action
Cookie set → Redirect to /account
```

#### UX Implementation Notes
- Google button with official branding (UX-STORE-3)
- Button text: "Continue with Google"
- Loading state while OAuth flow in progress
- Error handling for denied/cancelled OAuth

---

## Story 7.5: Sign in with Apple

As a **Buyer (Emma)**,
I want **to sign in with my Apple ID**,
So that **I can use Apple's privacy-focused authentication**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Apple"
**When** they authorize on Apple
**Then** account is created or linked
**And** Apple's private relay email is supported
**And** configurable Services ID and redirect URLs (FR81)
**And** buyer is logged in upon return
**And** works on web flow (not just native apps)

### Technical Implementation

#### File Structure
```
apps/api/src/modules/oauth/
  apple.strategy.ts           # Passport Apple strategy
  apple-jwt.service.ts        # JWT client secret generation

apps/storefront/src/app/api/auth/apple/
  route.ts
apps/storefront/src/app/api/auth/apple/callback/
  route.ts
```

#### Backend Service - Apple JWT
```typescript
// apps/api/src/modules/oauth/apple-jwt.service.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppleJwtService {
  constructor(private config: ConfigService) {}

  // Apple requires a JWT client secret signed with private key
  protected generateClientSecret(): string {
    const privateKey = this.config.get('APPLE_PRIVATE_KEY');
    const teamId = this.config.get('APPLE_TEAM_ID');
    const clientId = this.config.get('APPLE_CLIENT_ID');
    const keyId = this.config.get('APPLE_KEY_ID');

    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      audience: 'https://appleid.apple.com',
      issuer: teamId,
      subject: clientId,
      keyid: keyId,
    });

    return token;
  }
}

// apps/api/src/modules/oauth/apple.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private config: ConfigService,
    private appleJwt: AppleJwtService,
  ) {
    super({
      clientID: config.get('APPLE_CLIENT_ID'),
      teamID: config.get('APPLE_TEAM_ID'),
      keyID: config.get('APPLE_KEY_ID'),
      privateKeyString: config.get('APPLE_PRIVATE_KEY'),
      callbackURL: config.get('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<void> {
    // Apple only sends name on first authorization
    const firstName = req.body?.user ? JSON.parse(req.body.user)?.name?.firstName : undefined;
    const lastName = req.body?.user ? JSON.parse(req.body.user)?.name?.lastName : undefined;

    const oauthProfile: OAuthProfile = {
      provider: 'apple',
      providerId: idToken.sub,
      email: idToken.email, // Can be private relay email
      firstName,
      lastName,
    };

    done(null, oauthProfile);
  }
}
```

#### OAuth Controller Extension
```typescript
// apps/api/src/modules/oauth/oauth.controller.ts (additional endpoints)
@Controller('auth')
export class OAuthController {
  // ... Google methods ...

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {
    // Passport redirects to Apple
  }

  @Post('apple/callback') // Apple uses POST for callback
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req, @Res() res) {
    const profile = req.user as OAuthProfile;
    const { session } = await this.oauth.authenticateOAuth(profile);

    const redirectUrl = new URL('/auth/oauth-callback', req.headers.origin);
    redirectUrl.searchParams.set('token', session.token);

    return res.redirect(redirectUrl.toString());
  }
}
```

#### Private Relay Email Handling
```typescript
// apps/api/src/modules/oauth/oauth.service.ts (addition)
protected isApplePrivateRelay(email: string): boolean {
  return email.endsWith('@privaterelay.appleid.com');
}

// When handling Apple relay emails, store both:
// - The relay email for authentication
// - A flag indicating it's a relay email
// - Original email (if user provides it later)
```

#### Storefront Apple Button
```typescript
// apps/storefront/src/app/(auth)/login/_components/AppleSignInButton.tsx
'use client';

export function AppleSignInButton() {
  const handleAppleSignIn = () => {
    window.location.href = '/api/auth/apple';
  };

  return (
    <button
      onClick={handleAppleSignIn}
      className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:bg-gray-900"
    >
      <AppleIcon className="w-5 h-5" />
      Continue with Apple
    </button>
  );
}
```

#### Data Flow
```
"Sign in with Apple" Button
  ↓ Redirect to /api/auth/apple
Apple Sign In Screen
  ↓ User authorizes (can hide email)
POST Callback to /api/auth/apple/callback
  ↓ AppleStrategy validates JWT
OAuthService.authenticateOAuth()
  ↓ Handle private relay email
Session created → Redirect
```

#### UX Implementation Notes
- Apple button with official black styling (UX-STORE-3)
- "Hide My Email" option supported
- Button text: "Continue with Apple"
- Consistent with Google button size/placement

---

## Story 7.6: Address Book Management

As a **Buyer (Emma)**,
I want **to save multiple shipping addresses**,
So that **I can checkout faster for different locations**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access their address book
**Then** they can:
- Add new addresses with all required fields
- Edit existing addresses
- Delete addresses
- Set a default shipping address
- Set a default billing address
**And** addresses are available at checkout for quick selection
**And** maximum 10 addresses per account

### Technical Implementation

#### File Structure
```
packages/validators/src/customer/
  address.schema.ts           # Address validation

apps/api/src/modules/customer/
  address.service.ts          # Protected methods for extensibility
  address.router.ts           # tRPC router

apps/storefront/src/app/account/addresses/
  page.tsx                    # RSC - address list
  _components/
    AddressGrid.tsx           # Client component
    AddressCard.tsx
    AddressForm.tsx
  _actions/
    address.actions.ts        # Zsa server actions
```

#### Zod Schema
```typescript
// packages/validators/src/customer/address.schema.ts
import { z } from 'zod';

export const addressSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  phone: z.string().max(20).optional(),
});

export const createAddressSchema = addressSchema.extend({
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.extend({
  id: z.string().startsWith('addr_'),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
```

#### Backend Service
```typescript
// apps/api/src/modules/customer/address.service.ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AddressService {
  private readonly MAX_ADDRESSES = 10;

  constructor(private prisma: PrismaService) {}

  protected async listAddresses(customerId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: [
        { isDefaultShipping: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  protected async createAddress(
    customerId: string,
    input: CreateAddressInput,
  ): Promise<Address> {
    // Check address limit
    const count = await this.prisma.address.count({ where: { customerId } });
    if (count >= this.MAX_ADDRESSES) {
      throw new BadRequestException(`Maximum ${this.MAX_ADDRESSES} addresses allowed`);
    }

    // Handle default flags
    if (input.isDefaultShipping) {
      await this.clearDefaultShipping(customerId);
    }
    if (input.isDefaultBilling) {
      await this.clearDefaultBilling(customerId);
    }

    return this.prisma.address.create({
      data: {
        id: `addr_${cuid()}`,
        customerId,
        ...input,
      },
    });
  }

  protected async updateAddress(
    customerId: string,
    input: UpdateAddressInput,
  ): Promise<Address> {
    const address = await this.prisma.address.findUnique({
      where: { id: input.id },
    });

    if (!address || address.customerId !== customerId) {
      throw new ForbiddenException('Address not found');
    }

    // Handle default flags
    if (input.isDefaultShipping && !address.isDefaultShipping) {
      await this.clearDefaultShipping(customerId);
    }
    if (input.isDefaultBilling && !address.isDefaultBilling) {
      await this.clearDefaultBilling(customerId);
    }

    return this.prisma.address.update({
      where: { id: input.id },
      data: input,
    });
  }

  protected async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.customerId !== customerId) {
      throw new ForbiddenException('Address not found');
    }

    await this.prisma.address.delete({ where: { id: addressId } });
  }

  private async clearDefaultShipping(customerId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { customerId, isDefaultShipping: true },
      data: { isDefaultShipping: false },
    });
  }

  private async clearDefaultBilling(customerId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { customerId, isDefaultBilling: true },
      data: { isDefaultBilling: false },
    });
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/customer/address.router.ts
import { router, protectedProcedure } from '../../trpc';
import { createAddressSchema, updateAddressSchema } from '@trafi/validators';
import { z } from 'zod';

export const addressRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.addressService.listAddresses(ctx.customer.id);
    }),

  create: protectedProcedure
    .input(createAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.addressService.createAddress(ctx.customer.id, input);
    }),

  update: protectedProcedure
    .input(updateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.addressService.updateAddress(ctx.customer.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().startsWith('addr_') }))
    .mutation(async ({ ctx, input }) => {
      await ctx.addressService.deleteAddress(ctx.customer.id, input.id);
      return { success: true };
    }),
});
```

#### Server Actions (Zsa)
```typescript
// apps/storefront/src/app/account/addresses/_actions/address.actions.ts
'use server';

import { createServerAction } from 'zsa';
import { createAddressSchema, updateAddressSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';
import { z } from 'zod';

export const listAddressesAction = createServerAction()
  .handler(async () => {
    return trpc.address.list.query();
  });

export const createAddressAction = createServerAction()
  .input(createAddressSchema)
  .handler(async ({ input }) => {
    return trpc.address.create.mutate(input);
  });

export const updateAddressAction = createServerAction()
  .input(updateAddressSchema)
  .handler(async ({ input }) => {
    return trpc.address.update.mutate(input);
  });

export const deleteAddressAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return trpc.address.delete.mutate(input);
  });
```

#### Client Component
```typescript
// apps/storefront/src/app/account/addresses/_components/AddressGrid.tsx
'use client';

import { useServerAction, useServerActionQuery } from 'zsa-react';
import { listAddressesAction, deleteAddressAction } from '../_actions/address.actions';
import { AddressCard } from './AddressCard';

export function AddressGrid() {
  const { data: addresses, refetch, isLoading } = useServerActionQuery(listAddressesAction, {
    input: undefined,
    queryKey: ['addresses'],
  });

  const { execute: deleteAddress, isPending: isDeleting } = useServerAction(deleteAddressAction);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this address?')) {
      await deleteAddress({ id });
      refetch();
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses?.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onDelete={() => handleDelete(address.id)}
        />
      ))}
    </div>
  );
}
```

#### Data Flow
```
AddressGrid (Client)
  ↓ useServerActionQuery(listAddressesAction)
Server Action
  ↓ trpc.address.list.query()
AddressService.listAddresses()
  ↓ Prisma query
Addresses returned to client

AddressForm (Client)
  ↓ useServerAction(createAddressAction)
AddressService.createAddress()
  ↓ Validate limit, handle defaults
Address created → Refetch list
```

#### UX Implementation Notes
- Card grid layout for addresses (UX-STORE-5)
- Default badges: "Default Shipping", "Default Billing"
- Edit/Delete icons on hover
- Modal form for add/edit
- Country dropdown with flag icons

---

## Story 7.7: Order History View

As a **Buyer (Emma)**,
I want **to view my past orders**,
So that **I can track purchases and reorder items**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access order history
**Then** they see all their orders with:
- Order number and date
- Order status and total
- Items purchased (thumbnails)
**And** clicking an order shows full details
**And** orders are paginated for performance
**And** guest orders can be claimed by email match

### Technical Implementation

#### File Structure
```
apps/api/src/modules/customer/
  order-history.service.ts    # Protected methods for extensibility
  order-history.router.ts     # tRPC router

apps/storefront/src/app/account/orders/
  page.tsx                    # RSC - order list
  [orderId]/page.tsx          # RSC - order detail
  _components/
    OrderList.tsx             # Client component
    OrderCard.tsx
    OrderStatusBadge.tsx
  _actions/
    order-history.actions.ts
```

#### Backend Service
```typescript
// apps/api/src/modules/customer/order-history.service.ts
import { Injectable } from '@nestjs/common';

interface OrderHistoryFilters {
  cursor?: string;
  limit?: number;
}

@Injectable()
export class OrderHistoryService {
  constructor(private prisma: PrismaService) {}

  protected async listOrders(
    customerId: string,
    filters: OrderHistoryFilters,
  ): Promise<{
    orders: Order[];
    nextCursor: string | null;
    totalCount: number;
  }> {
    const limit = filters.limit ?? 10;

    const orders = await this.prisma.order.findMany({
      where: { customerId },
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 3, // Show first 3 items as preview
          include: {
            variant: {
              include: { product: { select: { title: true, featuredImage: true } } },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });

    const hasMore = orders.length > limit;
    if (hasMore) orders.pop();

    const totalCount = await this.prisma.order.count({ where: { customerId } });

    return {
      orders,
      nextCursor: hasMore ? orders[orders.length - 1]?.id : null,
      totalCount,
    };
  }

  protected async getOrderDetail(
    customerId: string,
    orderId: string,
  ): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        fulfillments: true,
        payment: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });
  }

  // Claim guest orders by email match
  protected async claimGuestOrders(customerId: string, email: string): Promise<number> {
    const result = await this.prisma.order.updateMany({
      where: {
        email: email.toLowerCase(),
        customerId: null, // Guest orders only
      },
      data: { customerId },
    });
    return result.count;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/customer/order-history.router.ts
import { router, protectedProcedure } from '../../trpc';
import { z } from 'zod';

export const orderHistoryRouter = router({
  list: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.orderHistoryService.listOrders(ctx.customer.id, input);
    }),

  detail: protectedProcedure
    .input(z.object({ orderId: z.string().startsWith('ord_') }))
    .query(async ({ ctx, input }) => {
      return ctx.orderHistoryService.getOrderDetail(ctx.customer.id, input.orderId);
    }),

  claimGuestOrders: protectedProcedure
    .mutation(async ({ ctx }) => {
      const count = await ctx.orderHistoryService.claimGuestOrders(
        ctx.customer.id,
        ctx.customer.email,
      );
      return { claimedCount: count };
    }),
});
```

#### Server Actions (Zsa)
```typescript
// apps/storefront/src/app/account/orders/_actions/order-history.actions.ts
'use server';

import { createServerAction } from 'zsa';
import { trpc } from '@/lib/trpc/server';
import { z } from 'zod';

export const listOrdersAction = createServerAction()
  .input(z.object({
    cursor: z.string().optional(),
    limit: z.number().default(10),
  }))
  .handler(async ({ input }) => {
    return trpc.orderHistory.list.query(input);
  });

export const getOrderDetailAction = createServerAction()
  .input(z.object({ orderId: z.string() }))
  .handler(async ({ input }) => {
    return trpc.orderHistory.detail.query(input);
  });
```

#### Client Component
```typescript
// apps/storefront/src/app/account/orders/_components/OrderList.tsx
'use client';

import { useServerActionQuery } from 'zsa-react';
import { listOrdersAction } from '../_actions/order-history.actions';
import { OrderCard } from './OrderCard';
import { useState } from 'react';

export function OrderList() {
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = useServerActionQuery(listOrdersAction, {
    input: { cursor, limit: 10 },
    queryKey: ['orders', cursor],
  });

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-4">
      {data?.orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      {data?.nextCursor && (
        <button onClick={() => setCursor(data.nextCursor!)}>
          Load more
        </button>
      )}
    </div>
  );
}
```

#### Data Flow
```
OrderList (Client)
  ↓ useServerActionQuery(listOrdersAction)
Server Action
  ↓ trpc.orderHistory.list.query()
OrderHistoryService.listOrders()
  ↓ Cursor-based pagination
Orders with item previews returned
```

#### UX Implementation Notes
- Order status badges color-coded (UX-STORE-6)
- Item thumbnails in preview (max 3, "+N more" indicator)
- Infinite scroll or "Load more" button
- Click order → detail page with full items

---

## Story 7.8: Order Tracking

As a **Buyer (Emma)**,
I want **to track my order shipments**,
So that **I know when my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer views an order with shipment
**When** tracking info is available
**Then** they see:
- Carrier name and tracking number
- Link to carrier tracking page
- Shipment status (if available via API)
- Estimated delivery date
**And** multiple shipments per order are shown separately

### Technical Implementation

#### File Structure
```
apps/api/src/modules/tracking/
  tracking.service.ts         # Protected methods for extensibility
  tracking.router.ts          # tRPC router
  carriers/                   # Carrier-specific tracking adapters
    colissimo.adapter.ts
    chronopost.adapter.ts
    dhl.adapter.ts

apps/storefront/src/app/account/orders/[orderId]/
  _components/
    ShipmentTracking.tsx      # Client component
    TrackingTimeline.tsx
  _actions/
    tracking.actions.ts
```

#### Backend Service
```typescript
// apps/api/src/modules/tracking/tracking.service.ts
import { Injectable } from '@nestjs/common';

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
}

@Injectable()
export class TrackingService {
  private readonly CARRIER_URLS: Record<string, (num: string) => string> = {
    colissimo: (num) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${num}`,
    chronopost: (num) => `https://www.chronopost.fr/tracking-cxf/tracking-pied?liession=${num}`,
    dhl: (num) => `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${num}`,
    ups: (num) => `https://www.ups.com/track?tracknum=${num}`,
    fedex: (num) => `https://www.fedex.com/fedextrack/?trknbr=${num}`,
    mondialRelay: (num) => `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${num}`,
  };

  constructor(private prisma: PrismaService) {}

  protected buildTrackingUrl(carrier: string, trackingNumber: string): string {
    const builder = this.CARRIER_URLS[carrier.toLowerCase()];
    return builder ? builder(trackingNumber) : '#';
  }

  protected async getOrderFulfillments(
    customerId: string,
    orderId: string,
  ): Promise<FulfillmentWithTracking[]> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        fulfillments: {
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    variant: { include: { product: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return [];

    return order.fulfillments.map((ful) => ({
      ...ful,
      trackingUrl: ful.trackingNumber
        ? this.buildTrackingUrl(ful.carrier, ful.trackingNumber)
        : null,
    }));
  }

  // Optional: Real-time tracking from carrier API
  protected async fetchLiveTracking(
    carrier: string,
    trackingNumber: string,
  ): Promise<TrackingInfo | null> {
    // Implement carrier-specific API calls
    // For MVP, just return static info with tracking URL
    return null;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/tracking/tracking.router.ts
import { router, protectedProcedure } from '../../trpc';
import { z } from 'zod';

export const trackingRouter = router({
  getOrderFulfillments: protectedProcedure
    .input(z.object({ orderId: z.string().startsWith('ord_') }))
    .query(async ({ ctx, input }) => {
      return ctx.trackingService.getOrderFulfillments(ctx.customer.id, input.orderId);
    }),
});
```

#### Server Action (Zsa)
```typescript
// apps/storefront/src/app/account/orders/[orderId]/_actions/tracking.actions.ts
'use server';

import { createServerAction } from 'zsa';
import { trpc } from '@/lib/trpc/server';
import { z } from 'zod';

export const getOrderFulfillmentsAction = createServerAction()
  .input(z.object({ orderId: z.string() }))
  .handler(async ({ input }) => {
    return trpc.tracking.getOrderFulfillments.query(input);
  });
```

#### Client Component
```typescript
// apps/storefront/src/app/account/orders/[orderId]/_components/ShipmentTracking.tsx
'use client';

import { useServerActionQuery } from 'zsa-react';
import { getOrderFulfillmentsAction } from '../_actions/tracking.actions';

interface ShipmentTrackingProps {
  orderId: string;
}

export function ShipmentTracking({ orderId }: ShipmentTrackingProps) {
  const { data: fulfillments, isLoading } = useServerActionQuery(getOrderFulfillmentsAction, {
    input: { orderId },
    queryKey: ['tracking', orderId],
  });

  if (isLoading) return <div>Loading tracking info...</div>;

  return (
    <div className="space-y-4">
      {fulfillments?.map((fulfillment, index) => (
        <div key={fulfillment.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Shipment {index + 1}</h3>
            <span className="text-sm text-muted-foreground">
              {fulfillment.carrier}
            </span>
          </div>

          {fulfillment.trackingNumber && (
            <div className="mt-2">
              <p className="text-sm">Tracking: {fulfillment.trackingNumber}</p>
              <a
                href={fulfillment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Track on {fulfillment.carrier} →
              </a>
            </div>
          )}

          <div className="mt-3">
            <h4 className="text-sm font-medium">Items in this shipment:</h4>
            <ul className="text-sm mt-1">
              {fulfillment.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.orderItem.variant.product.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Data Flow
```
ShipmentTracking (Client)
  ↓ useServerActionQuery(getOrderFulfillmentsAction)
TrackingService.getOrderFulfillments()
  ↓ Build tracking URLs per carrier
Fulfillments with tracking URLs returned
```

#### UX Implementation Notes
- Each shipment in separate card
- External tracking link opens in new tab
- Items grouped by shipment
- Status badge showing fulfillment status
- Estimated delivery if available

---

## Story 7.9: Returning Customer Identification

As a **System**,
I want **to identify returning customers across sessions**,
So that **their experience is personalized**.

**Acceptance Criteria:**

**Given** a customer has previously purchased
**When** they visit the store (logged in or via email match)
**Then** the system recognizes them
**And** logged-in customers see their saved preferences
**And** guest checkout with known email can show order history
**And** recognition enables personalized recommendations (future)
**And** privacy is respected (no tracking without consent)

### Technical Implementation

#### File Structure
```
apps/api/src/modules/customer/
  identification.service.ts   # Protected methods for extensibility
  identification.middleware.ts

apps/storefront/src/lib/
  customer-context.tsx        # Customer context provider
```

#### Backend Service
```typescript
// apps/api/src/modules/customer/identification.service.ts
import { Injectable } from '@nestjs/common';

export interface CustomerIdentity {
  customerId: string | null;
  email: string | null;
  isLoggedIn: boolean;
  isReturning: boolean;
  orderCount: number;
  preferences: CustomerPreferences | null;
}

export interface CustomerPreferences {
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  preferredCarrier?: string;
  marketingOptIn: boolean;
}

@Injectable()
export class IdentificationService {
  constructor(
    private prisma: PrismaService,
    private session: SessionService,
  ) {}

  protected async identifyFromSession(sessionToken?: string): Promise<CustomerIdentity> {
    if (!sessionToken) {
      return this.anonymousIdentity();
    }

    const session = await this.session.validateSession(sessionToken);
    if (!session) {
      return this.anonymousIdentity();
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        _count: { select: { orders: true } },
        addresses: {
          where: {
            OR: [
              { isDefaultShipping: true },
              { isDefaultBilling: true },
            ],
          },
        },
      },
    });

    if (!customer) {
      return this.anonymousIdentity();
    }

    return {
      customerId: customer.id,
      email: customer.email,
      isLoggedIn: true,
      isReturning: customer._count.orders > 0,
      orderCount: customer._count.orders,
      preferences: {
        defaultShippingAddressId: customer.addresses.find((a) => a.isDefaultShipping)?.id,
        defaultBillingAddressId: customer.addresses.find((a) => a.isDefaultBilling)?.id,
        marketingOptIn: customer.acceptsMarketing,
      },
    };
  }

  protected async identifyFromEmail(email: string): Promise<{
    isKnown: boolean;
    hasAccount: boolean;
    orderCount: number;
  }> {
    const emailLower = email.toLowerCase();

    // Check if registered
    const customer = await this.prisma.customer.findUnique({
      where: { email: emailLower },
      select: { id: true },
    });

    // Count orders (both guest and registered)
    const orderCount = await this.prisma.order.count({
      where: { email: emailLower },
    });

    return {
      isKnown: orderCount > 0 || !!customer,
      hasAccount: !!customer,
      orderCount,
    };
  }

  private anonymousIdentity(): CustomerIdentity {
    return {
      customerId: null,
      email: null,
      isLoggedIn: false,
      isReturning: false,
      orderCount: 0,
      preferences: null,
    };
  }
}
```

#### Storefront Customer Context
```typescript
// apps/storefront/src/lib/customer-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useServerActionQuery } from 'zsa-react';
import { getIdentityAction } from '@/app/_actions/identity.action';

interface CustomerContextValue {
  isLoggedIn: boolean;
  isReturning: boolean;
  customerId: string | null;
  email: string | null;
  preferences: CustomerPreferences | null;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useServerActionQuery(getIdentityAction, {
    input: undefined,
    queryKey: ['identity'],
  });

  const value: CustomerContextValue = {
    isLoggedIn: data?.isLoggedIn ?? false,
    isReturning: data?.isReturning ?? false,
    customerId: data?.customerId ?? null,
    email: data?.email ?? null,
    preferences: data?.preferences ?? null,
    isLoading,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
}
```

#### Server Action (Zsa)
```typescript
// apps/storefront/src/app/_actions/identity.action.ts
'use server';

import { createServerAction } from 'zsa';
import { trpc } from '@/lib/trpc/server';

export const getIdentityAction = createServerAction()
  .handler(async () => {
    return trpc.customer.identify.query();
  });

// Check email recognition at checkout
export const checkEmailAction = createServerAction()
  .input(z.object({ email: z.string().email() }))
  .handler(async ({ input }) => {
    return trpc.customer.checkEmail.query(input);
  });
```

#### Data Flow
```
CustomerProvider (Client)
  ↓ useServerActionQuery(getIdentityAction)
Server Action
  ↓ Cookie session token passed via headers
IdentificationService.identifyFromSession()
  ↓ Validate session, load customer + preferences
CustomerIdentity returned → Context updated
```

#### UX Implementation Notes
- No persistent tracking cookies without consent
- Session-based recognition only
- Email recognition at checkout shows "Welcome back!" message
- Offer account creation after guest checkout for returning customers

---

## Story 7.10: Wishlist - Add and View

As a **Buyer (Emma)**,
I want **to save products to a wishlist**,
So that **I can remember items I want to buy later**.

**Acceptance Criteria:**

**Given** a buyer is viewing products
**When** they click the wishlist icon
**Then** the product is added to their wishlist
**And** visual feedback confirms the action (heart fills)
**And** wishlist persists across sessions (account-linked)
**And** anonymous users are prompted to log in
**And** one-click add without page reload (UX-84)

---

## Story 7.11: Wishlist Management

As a **Buyer (Emma)**,
I want **to manage my wishlist items**,
So that **I can organize products I'm interested in**.

**Acceptance Criteria:**

**Given** a buyer views their wishlist
**When** they manage items
**Then** they can:
- View all wishlist items with images and prices
- Remove items from wishlist
- Sort items by date added or price
- See if items are in stock or out of stock
**And** out-of-stock items are visually indicated
**And** price changes since adding are shown

---

## Story 7.12: Wishlist to Cart

As a **Buyer (Emma)**,
I want **to move wishlist items to my cart**,
So that **I can easily purchase saved items**.

**Acceptance Criteria:**

**Given** a buyer has items in wishlist
**When** they click "Add to Cart"
**Then** the item is added to cart with default variant
**And** item remains in wishlist (unless setting to remove)
**And** variant selection is available if multiple exist
**And** out-of-stock items show "Notify Me" instead
**And** bulk "Add All to Cart" is available
