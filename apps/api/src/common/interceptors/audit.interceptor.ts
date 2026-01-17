/**
 * Audit Interceptor
 *
 * Global interceptor that logs all state-changing operations to the AuditLog table.
 * Captures tenant context, timing, and request details for security compliance.
 *
 * Features:
 * - Only logs state-changing operations (POST, PUT, PATCH, DELETE)
 * - Extracts tenant context from AsyncLocalStorage
 * - Captures request duration for performance monitoring
 * - Logs both success and error cases
 * - Uses protected method for @trafi/core extensibility (RETRO-2)
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#4)
 * @see NFR-SEC-7 - Audit Trail Requirements
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { getTenantContext } from '../context/tenant.context';
import { PrismaService } from '@database/prisma.service';
import type { Request } from 'express';

/**
 * HTTP methods that represent state-changing operations
 */
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // Only log state-changing operations
    if (!STATE_CHANGING_METHODS.includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget: don't await, don't block the response
        this.logAudit(request, 'success', startTime).catch((err) => {
          this.logger.error('Failed to create audit log entry', err);
        });
      }),
      catchError((error) => {
        // Fire-and-forget: don't await, don't block the error response
        this.logAudit(request, 'error', startTime, error).catch((err) => {
          this.logger.error('Failed to create audit log entry for error', err);
        });
        throw error;
      }),
    );
  }

  /**
   * Log an audit entry to the database
   *
   * Protected method for @trafi/core extensibility (RETRO-2).
   * Merchants can override this to add custom audit logic.
   *
   * @param request - Express request object
   * @param status - Operation status (success or error)
   * @param startTime - Timestamp when request started
   * @param error - Error object if operation failed
   */
  protected async logAudit(
    request: Request,
    status: 'success' | 'error',
    startTime: number,
    error?: Error,
  ): Promise<void> {
    const ctx = getTenantContext();

    // Skip if no tenant context (shouldn't happen for state-changing ops, but safety check)
    if (!ctx) {
      this.logger.warn('Audit log skipped: no tenant context available');
      return;
    }

    const durationMs = Date.now() - startTime;

    await this.prisma.auditLog.create({
      data: {
        storeId: ctx.storeId,
        userId: ctx.userId,
        requestId: ctx.requestId,
        action: `${request.method} ${request.path}`,
        resource: this.extractResource(request.path),
        status,
        durationMs,
        ipAddress: this.extractIpAddress(request),
        userAgent: this.truncateString(request.headers['user-agent'], 255),
        errorMessage: error ? this.truncateString(error.message, 500) : null,
        metadata: this.buildMetadata(request) as object,
      },
    });
  }

  /**
   * Extract resource name from request path
   * Examples:
   * - /api/products/prod_123 -> 'products'
   * - /api/v1/orders -> 'orders'
   * - /trpc/users.create -> 'users'
   */
  private extractResource(path: string): string {
    // Handle tRPC paths
    const trpcMatch = path.match(/\/trpc\/(\w+)\./);
    if (trpcMatch) {
      return trpcMatch[1];
    }

    // Handle REST API paths
    const restMatch = path.match(/\/api(?:\/v\d+)?\/(\w+)/);
    if (restMatch) {
      return restMatch[1];
    }

    return 'unknown';
  }

  /**
   * Extract client IP address from request
   * Handles proxied requests (X-Forwarded-For header)
   */
  private extractIpAddress(request: Request): string | undefined {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim();
    }

    return request.ip || (request.socket?.remoteAddress as string | undefined);
  }

  /**
   * Build metadata object for the audit log
   * Excludes sensitive data (passwords, tokens)
   */
  private buildMetadata(request: Request): Record<string, unknown> {
    return {
      params: request.params,
      query: request.query,
      // Note: We don't log request body to avoid storing sensitive data
      // Individual endpoints can add specific body fields via custom audit
    };
  }

  /**
   * Truncate string to max length
   */
  private truncateString(value: string | undefined, maxLength: number): string | undefined {
    if (!value) return undefined;
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  }
}
