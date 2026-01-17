# Story 2.8: Ownership Transfer

Status: done

## Story

As an **Owner**,
I want **to transfer store ownership to another admin**,
So that **I can hand over control when needed**.

## Acceptance Criteria

1. **Given** the current Owner initiates a transfer from the Ownership settings page
   **When** they select a target admin from the eligible users dropdown
   **Then** the target user is validated as an existing team member with role `admin` or `editor`
   **And** the TransferConfirmationDialog opens requiring password re-confirmation

2. **Given** the Owner confirms the transfer with valid password
   **When** the initiate mutation is called
   **Then** an OwnershipTransfer record is created with status `pending`
   **And** the transfer has a 72-hour expiration (`expiresAt`)
   **And** the `ownership.transfer.initiated` event is emitted
   **And** an email notification is sent to the target user (via event listener)

3. **Given** a pending transfer exists and has not expired
   **When** the target user views their dashboard
   **Then** a PendingTransferBanner is displayed with transfer details
   **And** they can accept or decline the transfer

4. **Given** the target user accepts the transfer
   **When** they enter their password and confirm
   **Then** the password is validated against their account
   **And** in a single transaction:
     - OwnershipTransfer status is updated to `confirmed` with `completedAt`
     - Target user's role is updated to `owner`
     - Previous owner's role is demoted to `admin`
   **And** the `ownership.transfer.completed` event is emitted
   **And** both users receive email confirmation

5. **Given** a pending transfer exists
   **When** either the current owner or target user cancels it
   **Then** the transfer status is updated to `cancelled`
   **And** no role changes occur

6. **Given** a pending transfer exists
   **When** 72 hours pass without acceptance
   **Then** the transfer is considered expired and cannot be confirmed
   **And** queries filter out expired transfers

7. **Given** all ownership transfer operations (initiate, confirm, cancel)
   **When** the operation completes
   **Then** it is logged in the AuditLog via AuditInterceptor with full tenant context

## Tasks / Subtasks

- [x] **Task 1: Backend - Prisma OwnershipTransfer Model** (AC: #1, #2, #6)
  - [x] 1.1 Create `apps/api/prisma/schema/ownership-transfer.prisma`
  - [x] 1.2 Define OwnershipTransfer model with all fields (id, storeId, fromUserId, toUserId, status, reason, expiresAt, completedAt, createdAt)
  - [x] 1.3 Add ApprovalStatus enum (PENDING, CONFIRMED, CANCELLED)
  - [x] 1.4 Add relations to Store and User models
  - [x] 1.5 Add index on [storeId, status]
  - [x] 1.6 Run `pnpm db:push` and `pnpm db:generate`

- [x] **Task 2: Validators - Ownership Schemas** (AC: #1, #4)
  - [x] 2.1 Create `packages/@trafi/validators/src/ownership/ownership.schema.ts`
  - [x] 2.2 Define `InitiateTransferSchema` with targetUserId, password, optional reason
  - [x] 2.3 Define `ConfirmTransferSchema` with transferId, password
  - [x] 2.4 Define `CancelTransferSchema` with transferId
  - [x] 2.5 Define `TransferStatusSchema` enum
  - [x] 2.6 Define `TransferRecordSchema` for API responses
  - [x] 2.7 Export from `packages/@trafi/validators/src/ownership/index.ts`
  - [x] 2.8 Export from `packages/@trafi/validators/src/index.ts`

- [x] **Task 3: Backend - Ownership DTOs** (AC: #1, #2, #4)
  - [x] 3.1 Create `apps/api/src/modules/ownership/dto/index.ts`
  - [x] 3.2 Create `initiate-transfer.dto.ts` with Swagger decorators
  - [x] 3.3 Create `confirm-transfer.dto.ts` with Swagger decorators
  - [x] 3.4 Create `transfer-response.dto.ts` with Swagger decorators
  - [x] 3.5 Export all DTOs from index.ts

- [x] **Task 4: Backend - Ownership Service** (AC: #2, #4, #5, #6)
  - [x] 4.1 Create `apps/api/src/modules/ownership/ownership.module.ts`
  - [x] 4.2 Create `apps/api/src/modules/ownership/ownership.service.ts`
  - [x] 4.3 Implement `protected validateOwnerPassword()` method using bcrypt
  - [x] 4.4 Implement `protected getTransferExpirationHours()` returning 72
  - [x] 4.5 Implement `async initiate()` with all validation logic
  - [x] 4.6 Implement `async confirm()` with Prisma transaction for role swap
  - [x] 4.7 Implement `async cancel()` for both initiator and target
  - [x] 4.8 Implement `async getPending()` with expiration filter
  - [x] 4.9 Implement `async getHistory()` for transfer audit
  - [x] 4.10 Inject EventEmitter2 for event emission

- [x] **Task 5: Backend - Ownership Controller** (AC: #1, #2, #4, #7)
  - [x] 5.1 Create `apps/api/src/modules/ownership/ownership.controller.ts`
  - [x] 5.2 Add `@ApiTags('ownership')` and `@ApiBearerAuth('JWT-auth')`
  - [x] 5.3 Implement `POST /ownership/transfer` with `@RequirePermissions('ownership:transfer')`
  - [x] 5.4 Implement `POST /ownership/transfer/:id/confirm` (no special permission - target user only)
  - [x] 5.5 Implement `POST /ownership/transfer/:id/cancel` (owner or target can cancel)
  - [x] 5.6 Implement `GET /ownership/transfer/pending`
  - [x] 5.7 Implement `GET /ownership/transfer/history` with `@RequirePermissions('ownership:transfer')`
  - [x] 5.8 Add complete Swagger documentation for all endpoints

- [x] **Task 6: Backend - Register Module** (AC: #1)
  - [x] 6.1 Import and add `OwnershipModule` to `AppModule` imports
  - [x] 6.2 Verify module loads correctly with `pnpm dev`

- [x] **Task 7: Dashboard - Server Actions** (AC: #1, #2, #4, #5)
  - [x] 7.1 Create `apps/dashboard/src/app/(dashboard)/settings/ownership/_actions/ownership-actions.ts`
  - [x] 7.2 Implement `getPendingTransferAction` with `createServerAction()`
  - [x] 7.3 Implement `getTransferHistoryAction`
  - [x] 7.4 Implement `initiateTransferAction` with InitiateTransferSchema validation
  - [x] 7.5 Implement `confirmTransferAction` with ConfirmTransferSchema validation
  - [x] 7.6 Implement `cancelTransferAction`

- [x] **Task 8: Dashboard - Custom Hooks** (AC: #1, #3, #4, #5)
  - [x] 8.1 Create `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/usePendingTransfer.ts`
  - [x] 8.2 Implement with `useServerActionQuery` and 60s refetch interval
  - [x] 8.3 Create `useTransferHistory.ts` with `useServerActionQuery`
  - [x] 8.4 Create `useTransferOwnership.ts` with `useServerActionMutation`
  - [x] 8.5 Add queryClient invalidation and toast notifications
  - [x] 8.6 Create `useConfirmTransfer.ts` with auth query invalidation
  - [x] 8.7 Create `useCancelTransfer.ts`

- [x] **Task 9: Dashboard - Ownership Page Components** (AC: #1, #3, #4, #5)
  - [x] 9.1 Create `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/`
  - [x] 9.2 Implement `OwnershipTransferCard.tsx` - main transfer form with admin selector
  - [x] 9.3 Implement `TransferConfirmationDialog.tsx` - password confirmation modal
  - [x] 9.4 Implement `PendingTransferBanner.tsx` - shows pending transfer to target user
  - [x] 9.5 Implement `TransferHistoryTable.tsx` - past transfers with status badges
  - [x] 9.6 Implement `AcceptTransferDialog.tsx` - for target user to accept
  - [x] 9.7 Add status badges with correct colors (Pending: #CCFF00, Confirmed: #00FF94, Cancelled: gray, Expired: #FF3366)

- [x] **Task 10: Dashboard - Ownership Settings Page** (AC: #1, #3)
  - [x] 10.1 Create `apps/dashboard/src/app/(dashboard)/settings/ownership/page.tsx`
  - [x] 10.2 Add permission check - only visible to Owner role
  - [x] 10.3 Conditionally show PendingTransferBanner for target users
  - [x] 10.4 Wire up OwnershipTransferCard and TransferHistoryTable

- [x] **Task 11: Backend Unit Tests** (AC: #2, #4, #5, #6)
  - [x] 11.1 Create `apps/api/src/modules/ownership/__tests__/ownership.service.spec.ts`
  - [x] 11.2 Test `initiate()` validates owner password
  - [x] 11.3 Test `initiate()` rejects if target not eligible
  - [x] 11.4 Test `initiate()` rejects if pending transfer exists
  - [x] 11.5 Test `confirm()` validates target password
  - [x] 11.6 Test `confirm()` updates roles in transaction
  - [x] 11.7 Test `confirm()` rejects expired transfers
  - [x] 11.8 Test `cancel()` works for both owner and target
  - [x] 11.9 Test tenant isolation

- [x] **Task 12: Dashboard Component Tests** (AC: #1, #4)
  - [x] 12.1 Create `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/__tests__/`
  - [x] 12.2 Test TransferConfirmationDialog password validation
  - [x] 12.3 Test form disabled state during mutation
  - [x] 12.4 Test success toast on transfer initiation
  - [x] 12.5 Test PendingTransferBanner renders with correct countdown

## Dev Notes

### Architecture Patterns (CRITICAL)

**RETRO-2:** All services MUST use `protected` methods for @trafi/core extensibility:
```typescript
@Injectable()
export class OwnershipService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // Protected for password validation customization (e.g., 2FA in @trafi/core)
  protected async validateOwnerPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  // Protected for customizable expiration period
  protected getTransferExpirationHours(): number {
    return 72; // 3 days
  }
}
```

**RETRO-3:** Export explicit public API from module:
```typescript
// ownership/index.ts
export { OwnershipModule } from './ownership.module';
export { OwnershipService } from './ownership.service';
export type { TransferResponseDto, InitiateTransferDto, ConfirmTransferDto } from './dto';
```

### Prisma OwnershipTransfer Model

```prisma
// apps/api/prisma/schema/ownership-transfer.prisma

enum TransferStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

model OwnershipTransfer {
  id              String         @id @default(cuid())
  storeId         String         @map("store_id")
  fromUserId      String         @map("from_user_id")
  toUserId        String         @map("to_user_id")
  status          TransferStatus @default(PENDING)
  reason          String?

  expiresAt       DateTime       @map("expires_at")
  completedAt     DateTime?      @map("completed_at")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  store           Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  fromUser        User           @relation("TransferFrom", fields: [fromUserId], references: [id])
  toUser          User           @relation("TransferTo", fields: [toUserId], references: [id])

  @@index([storeId, status])
  @@index([toUserId, status])
  @@map("ownership_transfers")
}
```

**Add to user.prisma:**
```prisma
model User {
  // ... existing fields
  transfersInitiated  OwnershipTransfer[] @relation("TransferFrom")
  transfersReceived   OwnershipTransfer[] @relation("TransferTo")
}
```

**Add to store.prisma:**
```prisma
model Store {
  // ... existing fields
  ownershipTransfers  OwnershipTransfer[]
}
```

### Ownership Service Implementation

```typescript
// apps/api/src/modules/ownership/ownership.service.ts
import { Injectable, ForbiddenException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import type { InitiateTransferDto, ConfirmTransferDto, TransferResponseDto } from './dto';

@Injectable()
export class OwnershipService {
  protected readonly logger = new Logger(OwnershipService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility (e.g., add 2FA)
  protected async validateOwnerPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  // Protected for customizable expiration
  protected getTransferExpirationHours(): number {
    return 72;
  }

  async initiate(storeId: string, currentOwnerId: string, input: InitiateTransferDto): Promise<TransferResponseDto> {
    // 1. Verify current owner password
    const isValidPassword = await this.validateOwnerPassword(currentOwnerId, input.password);
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // 2. Verify target user exists and is eligible (admin or editor in same store)
    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: input.targetUserId,
        storeId,
        role: { in: ['admin', 'editor'] },
        status: 'active',
      },
    });
    if (!targetUser) {
      throw new BadRequestException('Target user not found or not eligible for ownership');
    }

    // 3. Check no pending transfer exists for this store
    const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (existingTransfer) {
      throw new BadRequestException('A transfer is already pending for this store');
    }

    // 4. Create transfer record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.getTransferExpirationHours());

    const transfer = await this.prisma.ownershipTransfer.create({
      data: {
        storeId,
        fromUserId: currentOwnerId,
        toUserId: input.targetUserId,
        status: 'PENDING',
        reason: input.reason,
        expiresAt,
      },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    // 5. Emit event for email notification
    this.eventEmitter.emit('ownership.transfer.initiated', {
      transfer: this.toTransferResponse(transfer),
      fromUser: transfer.fromUser,
      toUser: transfer.toUser,
    });

    this.logger.log(`Ownership transfer initiated: ${currentOwnerId} -> ${input.targetUserId} for store ${storeId}`);

    return this.toTransferResponse(transfer);
  }

  async confirm(storeId: string, userId: string, input: ConfirmTransferDto): Promise<TransferResponseDto> {
    // 1. Find valid pending transfer for this user
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: input.transferId,
        storeId,
        toUserId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found, expired, or not intended for this user');
    }

    // 2. Validate new owner password
    const isValidPassword = await this.validateOwnerPassword(userId, input.password);
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // 3. Execute transfer in transaction
    const [updatedTransfer] = await this.prisma.$transaction([
      // Update transfer record
      this.prisma.ownershipTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'CONFIRMED',
          completedAt: new Date(),
        },
        include: {
          fromUser: { select: { id: true, email: true, name: true } },
          toUser: { select: { id: true, email: true, name: true } },
        },
      }),
      // Promote new owner
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'owner' },
      }),
      // Demote old owner to admin
      this.prisma.user.update({
        where: { id: transfer.fromUserId },
        data: { role: 'admin' },
      }),
    ]);

    // 4. Emit completion event
    this.eventEmitter.emit('ownership.transfer.completed', {
      transfer: this.toTransferResponse(updatedTransfer),
    });

    this.logger.log(`Ownership transfer completed: ${transfer.fromUserId} -> ${userId} for store ${storeId}`);

    return this.toTransferResponse(updatedTransfer);
  }

  async cancel(storeId: string, userId: string, transferId: string): Promise<TransferResponseDto> {
    // Find transfer where user is either initiator or target
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: transferId,
        storeId,
        status: 'PENDING',
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found or cannot be cancelled');
    }

    const updatedTransfer = await this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: { status: 'CANCELLED' },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    this.eventEmitter.emit('ownership.transfer.cancelled', {
      transfer: this.toTransferResponse(updatedTransfer),
      cancelledBy: userId,
    });

    this.logger.log(`Ownership transfer cancelled by ${userId} for store ${storeId}`);

    return this.toTransferResponse(updatedTransfer);
  }

  async getPending(storeId: string, userId: string): Promise<TransferResponseDto | null> {
    // Find any pending transfer where user is either owner or target
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    return transfer ? this.toTransferResponse(transfer) : null;
  }

  async getHistory(storeId: string): Promise<TransferResponseDto[]> {
    const transfers = await this.prisma.ownershipTransfer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    return transfers.map((t) => this.toTransferResponse(t));
  }

  // Protected for response customization
  protected toTransferResponse(transfer: any): TransferResponseDto {
    return {
      id: transfer.id,
      storeId: transfer.storeId,
      fromUser: transfer.fromUser,
      toUser: transfer.toUser,
      status: transfer.status.toLowerCase(),
      reason: transfer.reason,
      expiresAt: transfer.expiresAt.toISOString(),
      completedAt: transfer.completedAt?.toISOString() ?? null,
      createdAt: transfer.createdAt.toISOString(),
    };
  }
}
```

### Ownership Controller with Swagger

```typescript
// apps/api/src/modules/ownership/ownership.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/decorators/permissions.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { OwnershipService } from './ownership.service';
import { InitiateTransferDto, ConfirmTransferDto, TransferResponseDto } from './dto';
import type { AuthenticatedUser } from '@trafi/types';

@ApiTags('ownership')
@Controller('ownership')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Post('transfer')
  @RequirePermissions('ownership:transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate ownership transfer',
    description: 'Start the ownership transfer process to another team member. Requires password confirmation.',
  })
  @ApiBody({ type: InitiateTransferDto })
  @ApiResponse({ status: 201, description: 'Transfer initiated', type: TransferResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request or pending transfer exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Invalid password or insufficient permissions' })
  async initiate(
    @Body() input: InitiateTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.initiate(user.storeId, user.userId, input);
  }

  @Post('transfer/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm ownership transfer',
    description: 'Accept the ownership transfer. Only the target user can confirm. Requires password.',
  })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiBody({ type: ConfirmTransferDto })
  @ApiResponse({ status: 200, description: 'Transfer confirmed', type: TransferResponseDto })
  @ApiResponse({ status: 400, description: 'Transfer not found or expired' })
  @ApiResponse({ status: 403, description: 'Invalid password' })
  async confirm(
    @Param('id') id: string,
    @Body() input: ConfirmTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.confirm(user.storeId, user.userId, { ...input, transferId: id });
  }

  @Post('transfer/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel ownership transfer',
    description: 'Cancel a pending transfer. Both the initiator and target can cancel.',
  })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiResponse({ status: 200, description: 'Transfer cancelled', type: TransferResponseDto })
  @ApiResponse({ status: 400, description: 'Transfer not found or already processed' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.cancel(user.storeId, user.userId, id);
  }

  @Get('transfer/pending')
  @ApiOperation({
    summary: 'Get pending transfer',
    description: 'Get any pending ownership transfer involving the current user.',
  })
  @ApiResponse({ status: 200, description: 'Pending transfer or null', type: TransferResponseDto })
  async getPending(@CurrentUser() user: AuthenticatedUser): Promise<TransferResponseDto | null> {
    return this.ownershipService.getPending(user.storeId, user.userId);
  }

  @Get('transfer/history')
  @RequirePermissions('ownership:transfer')
  @ApiOperation({
    summary: 'Get transfer history',
    description: 'Get the history of ownership transfers for this store.',
  })
  @ApiResponse({ status: 200, description: 'Transfer history', type: [TransferResponseDto] })
  async getHistory(@CurrentUser() user: AuthenticatedUser): Promise<TransferResponseDto[]> {
    return this.ownershipService.getHistory(user.storeId);
  }
}
```

### Dashboard Server Actions

```typescript
// apps/dashboard/src/app/(dashboard)/settings/ownership/_actions/ownership-actions.ts
'use server'

import { cookies } from 'next/headers'
import { createServerAction } from 'zsa'
import {
  InitiateTransferSchema,
  ConfirmTransferSchema,
  type TransferResponse,
} from '@trafi/validators'
import { z } from '@trafi/zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const ACCESS_TOKEN_COOKIE = 'trafi_access_token'

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken()
  if (!accessToken) throw new Error('Not authenticated')

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `API error: ${response.status}`)
  }

  return response.json()
}

export const getPendingTransferAction = createServerAction()
  .handler(async (): Promise<TransferResponse | null> => {
    return apiRequest<TransferResponse | null>('/ownership/transfer/pending')
  })

export const getTransferHistoryAction = createServerAction()
  .handler(async (): Promise<TransferResponse[]> => {
    return apiRequest<TransferResponse[]>('/ownership/transfer/history')
  })

export const initiateTransferAction = createServerAction()
  .input(InitiateTransferSchema)
  .handler(async ({ input }): Promise<TransferResponse> => {
    return apiRequest<TransferResponse>('/ownership/transfer', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  })

export const confirmTransferAction = createServerAction()
  .input(ConfirmTransferSchema)
  .handler(async ({ input }): Promise<TransferResponse> => {
    return apiRequest<TransferResponse>(`/ownership/transfer/${input.transferId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ password: input.password }),
    })
  })

export const cancelTransferAction = createServerAction()
  .input(z.object({ transferId: z.string() }))
  .handler(async ({ input }): Promise<TransferResponse> => {
    return apiRequest<TransferResponse>(`/ownership/transfer/${input.transferId}/cancel`, {
      method: 'POST',
    })
  })
```

### Dashboard Custom Hooks

```typescript
// apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/usePendingTransfer.ts
'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getPendingTransferAction } from '../_actions/ownership-actions'

export function usePendingTransfer() {
  return useServerActionQuery(getPendingTransferAction, {
    queryKey: ['pending-transfer'],
    refetchInterval: 60000, // Check every minute
  })
}
```

```typescript
// apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useTransferOwnership.ts
'use client'

import { useServerActionMutation } from '@/lib/server-action-hooks'
import { initiateTransferAction } from '../_actions/ownership-actions'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useTransferOwnership() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(initiateTransferAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-transfer'] })
      toast.success('Demande de transfert envoyee')
      router.refresh()
    },
    onError: (error) => {
      if (error.message.includes('password')) {
        toast.error('Mot de passe incorrect')
      } else {
        toast.error(error.message || 'Erreur lors du transfert')
      }
    },
  })
}
```

```typescript
// apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useConfirmTransfer.ts
'use client'

import { useServerActionMutation } from '@/lib/server-action-hooks'
import { confirmTransferAction } from '../_actions/ownership-actions'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useConfirmTransfer() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(confirmTransferAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-transfer'] })
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Transfert confirme. Vous etes maintenant proprietaire.')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la confirmation')
    },
  })
}
```

### File Structure

```
apps/api/
├── prisma/schema/
│   ├── ownership-transfer.prisma        # NEW: OwnershipTransfer model
│   ├── user.prisma                      # MODIFIED: Add transfer relations
│   └── store.prisma                     # MODIFIED: Add transfers relation
├── src/modules/ownership/
│   ├── ownership.module.ts              # NEW: Module definition
│   ├── ownership.service.ts             # NEW: Business logic
│   ├── ownership.controller.ts          # NEW: REST endpoints
│   ├── index.ts                         # NEW: Public API exports
│   ├── dto/
│   │   ├── index.ts                     # NEW: DTO exports
│   │   ├── initiate-transfer.dto.ts     # NEW: Initiate DTO
│   │   ├── confirm-transfer.dto.ts      # NEW: Confirm DTO
│   │   └── transfer-response.dto.ts     # NEW: Response DTO
│   └── __tests__/
│       └── ownership.service.spec.ts    # NEW: Unit tests

packages/@trafi/validators/src/
├── ownership/
│   ├── ownership.schema.ts              # NEW: Zod schemas
│   └── index.ts                         # NEW: Exports
└── index.ts                             # MODIFIED: Export ownership

apps/dashboard/src/app/(dashboard)/settings/ownership/
├── page.tsx                             # NEW: RSC page
├── _components/
│   ├── index.ts                         # NEW: Component exports
│   ├── OwnershipTransferCard.tsx        # NEW: Main transfer form
│   ├── TransferConfirmationDialog.tsx   # NEW: Password modal
│   ├── PendingTransferBanner.tsx        # NEW: Target user banner
│   ├── TransferHistoryTable.tsx         # NEW: History table
│   ├── AcceptTransferDialog.tsx         # NEW: Accept modal
│   └── __tests__/
│       └── TransferConfirmationDialog.test.tsx # NEW: Component tests
├── _hooks/
│   ├── index.ts                         # NEW: Hook exports
│   ├── usePendingTransfer.ts            # NEW: Query hook
│   ├── useTransferHistory.ts            # NEW: History hook
│   ├── useTransferOwnership.ts          # NEW: Initiate mutation
│   ├── useConfirmTransfer.ts            # NEW: Confirm mutation
│   └── useCancelTransfer.ts             # NEW: Cancel mutation
└── _actions/
    └── ownership-actions.ts             # NEW: Server actions
```

### UX Implementation (Digital Brutalism v2)

**Layout:**
- Pure Black (#000000) background
- Settings page with "Ownership" tab (only visible to Owner)
- Breadcrumb: Dashboard > Settings > Ownership

**Ownership Transfer Card (Owner View):**
```typescript
'use client'

import { useState } from 'react'
import { useUsers } from '../../users/_hooks/useUsers'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle } from 'lucide-react'

export function OwnershipTransferCard() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const { data: users } = useUsers()

  // Filter to admins and editors only
  const eligibleUsers = users?.filter(u => ['admin', 'editor'].includes(u.role)) ?? []

  return (
    <div className="border border-[#333333] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-[#CCFF00]" />
        <h2 className="font-mono uppercase tracking-wider">TRANSFERT DE PROPRIETE</h2>
      </div>

      <div className="p-4 bg-[#FF3366]/10 border border-[#FF3366]/20 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF3366] mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-[#FF3366]">Action irreversible</p>
            <p className="text-[#999999] mt-1">
              Le nouveau proprietaire aura le controle total. Vous serez retrograde au role Admin.
            </p>
          </div>
        </div>
      </div>

      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
        <SelectTrigger className="border-[#333333] bg-transparent rounded-none">
          <SelectValue placeholder="Selectionner un admin..." />
        </SelectTrigger>
        <SelectContent className="bg-black border-[#333333]">
          {eligibleUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.email}) - {user.role.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        disabled={!selectedUserId}
        className="mt-4 bg-[#FF3366] text-white hover:bg-[#FF3366]/90 rounded-none font-mono uppercase"
      >
        INITIER LE TRANSFERT
      </Button>
    </div>
  )
}
```

**Pending Transfer Banner (Target User View):**
```typescript
'use client'

import { usePendingTransfer } from '../_hooks/usePendingTransfer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, X } from 'lucide-react'

export function PendingTransferBanner() {
  const { data: transfer, isLoading } = usePendingTransfer()

  if (isLoading || !transfer) return null

  const expiresAt = new Date(transfer.expiresAt)
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))

  return (
    <div className="border-2 border-[#CCFF00] bg-[#CCFF00]/5 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRight className="w-5 h-5 text-[#CCFF00]" />
          <div>
            <p className="font-mono uppercase text-sm">TRANSFERT DE PROPRIETE EN ATTENTE</p>
            <p className="text-sm text-[#999999]">
              {transfer.fromUser.name} souhaite vous transferer la propriete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[#999999]">
            <Clock className="w-4 h-4" />
            <span>{hoursRemaining}h restantes</span>
          </div>
          <Button className="bg-[#CCFF00] text-black rounded-none font-mono uppercase">
            ACCEPTER
          </Button>
          <Button variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Status Badges:**
- Pending: `bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]`
- Confirmed: `bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]`
- Cancelled: `bg-[#666666]/10 text-[#666666] border-[#666666]`
- Expired: `bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]`

### Previous Story Learnings (CRITICAL)

**From Story 2.7 (Store Settings):**
- Use `createServerAction()` from `zsa` for server actions
- Use `useServerActionQuery` and `useServerActionMutation` from custom hooks
- Toast notifications via `sonner`
- Query invalidation in `onSuccess` callback
- Forms use controlled state pattern
- All forms follow Digital Brutalism v2 design

**From Story 2.6 (Tenant Authorization):**
- All queries include tenant context via `storeId` from JWT
- AuditInterceptor automatically logs state-changing operations (POST/PATCH/DELETE)
- TenantInterceptor provides AsyncLocalStorage context

**From Story 2.5 (API Keys):**
- Password validation using bcrypt
- Response DTO pattern with Swagger decorators
- `@ApiBearerAuth('JWT-auth')` for protected endpoints

### Security Considerations

1. **Password Re-confirmation:** Both initiate and confirm require password validation
2. **Permission Enforcement:** `ownership:transfer` permission required for initiate (Owner only has this)
3. **Tenant Isolation:** All queries scoped by `storeId` from JWT
4. **Transaction Safety:** Role swap happens in Prisma transaction to prevent partial updates
5. **Expiration:** 72-hour window prevents abandoned transfers from lingering
6. **Audit Trail:** All operations logged via AuditInterceptor

### Testing Patterns

**Service Unit Tests (Jest):**
```typescript
describe('OwnershipService', () => {
  it('should reject transfer if password invalid', async () => {
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(
      service.initiate('store_1', 'owner_1', { targetUserId: 'admin_1', password: 'wrong' })
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject if target not eligible', async () => {
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.initiate('store_1', 'owner_1', { targetUserId: 'viewer_1', password: 'correct' })
    ).rejects.toThrow(BadRequestException);
  });

  it('should execute role swap in transaction', async () => {
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.ownershipTransfer.findFirst.mockResolvedValue({
      id: 'transfer_1',
      fromUserId: 'owner_1',
      toUserId: 'admin_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000),
    });

    await service.confirm('store_1', 'admin_1', { transferId: 'transfer_1', password: 'correct' });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});
```

### Git Commit Pattern

```
feat(epic-2): Story 2.8 - Ownership Transfer

- Add OwnershipTransfer Prisma model with status enum
- Implement OwnershipService with transaction-safe role swap
- Create OwnershipController with Swagger documentation
- Build Dashboard ownership page with transfer card and banner
- Add password re-confirmation for security
- Include unit tests for all business logic paths
```

### Common Pitfalls to Avoid

1. **DON'T** forget to add relations to User and Store models in Prisma
2. **DON'T** use `private` methods in service - use `protected` for @trafi/core
3. **DON'T** forget to use Prisma transaction for role swap
4. **DON'T** forget to filter expired transfers in queries
5. **DON'T** forget to emit events for email notifications
6. **DON'T** allow viewers to receive ownership - only admin/editor eligible
7. **DON'T** forget password validation on both initiate AND confirm

### Package Dependencies

**Uses existing:**
- `bcrypt` (already in apps/api for auth)
- `@nestjs/event-emitter` (already added in Story 2.7)
- `zsa` (already in dashboard)
- `sonner` (already in dashboard)

### Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_API_URL` - API base URL
- `DATABASE_URL` - Prisma connection

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#Story 2.8]
- [Source: _bmad-output/project-context.md#NestJS Backend Rules]
- [Source: _bmad-output/project-context.md#Dashboard Data Flow Pattern]
- [Source: _bmad-output/implementation-artifacts/2-7-store-settings-configuration.md]
- [Source: _bmad-output/planning-artifacts/architecture.md#Fundamental Architectural Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All backend tests passing (16/16)
- API build successful
- Dashboard tests had Radix UI pointer capture issues (fixed in review)

### Completion Notes List

- Story implemented with full feature set
- Password re-confirmation on both initiate and confirm
- Transaction-safe role swap in Prisma
- Event emission for email notifications
- 72-hour transfer expiration
- Digital Brutalism v2 UI design applied

### File List

**New Files:**
- `apps/api/prisma/schema/ownership-transfer.prisma` - OwnershipTransfer model with TransferStatus enum
- `apps/api/src/modules/ownership/ownership.module.ts` - NestJS module definition
- `apps/api/src/modules/ownership/ownership.service.ts` - Business logic with protected methods
- `apps/api/src/modules/ownership/ownership.controller.ts` - REST endpoints with Swagger docs
- `apps/api/src/modules/ownership/index.ts` - Public API exports
- `apps/api/src/modules/ownership/dto/index.ts` - DTO exports
- `apps/api/src/modules/ownership/dto/initiate-transfer.dto.ts` - Initiate DTO with Swagger
- `apps/api/src/modules/ownership/dto/confirm-transfer.dto.ts` - Confirm DTO with Swagger
- `apps/api/src/modules/ownership/dto/transfer-response.dto.ts` - Response DTO with Swagger
- `apps/api/src/modules/ownership/__tests__/ownership.service.spec.ts` - Unit tests (16 tests)
- `packages/@trafi/validators/src/ownership/ownership.schema.ts` - Zod schemas
- `packages/@trafi/validators/src/ownership/index.ts` - Validator exports
- `apps/dashboard/src/app/(dashboard)/settings/ownership/page.tsx` - Settings page
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_actions/ownership-actions.ts` - Server actions
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/index.ts` - Hook exports
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/usePendingTransfer.ts` - Query hook
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useTransferHistory.ts` - History hook
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useTransferOwnership.ts` - Initiate mutation
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useConfirmTransfer.ts` - Confirm mutation
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_hooks/useCancelTransfer.ts` - Cancel mutation
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/index.ts` - Component exports
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/OwnershipTransferCard.tsx` - Transfer form
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/TransferConfirmationDialog.tsx` - Password modal
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/PendingTransferBanner.tsx` - Target banner
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/AcceptTransferDialog.tsx` - Accept modal
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/TransferHistoryTable.tsx` - History table
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/__tests__/OwnershipTransferCard.test.tsx` - Component tests
- `apps/dashboard/src/app/(dashboard)/settings/ownership/_components/__tests__/TransferHistoryTable.test.tsx` - Component tests

**Modified Files:**
- `apps/api/prisma/schema/user.prisma` - Added transfer relations
- `apps/api/prisma/schema/store.prisma` - Added ownershipTransfers relation
- `apps/api/src/app.module.ts` - Imported OwnershipModule
- `packages/@trafi/validators/src/index.ts` - Exported ownership schemas
