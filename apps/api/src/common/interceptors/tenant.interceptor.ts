/**
 * Tenant Interceptor
 *
 * Global interceptor that extracts tenant context from authenticated requests
 * and makes it available via AsyncLocalStorage throughout the request lifecycle.
 *
 * This interceptor runs after JwtAuthGuard has validated and set the user.
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#1, AC#6)
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  tenantContext,
  generateRequestId,
  type TenantContextData,
} from '../context/tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if not authenticated (public endpoints)
    // JWT payload uses 'tenantId' which we normalize to 'storeId'
    if (!user?.tenantId) {
      return next.handle();
    }

    const tenantData: TenantContextData = {
      storeId: user.tenantId, // JWT uses tenantId, normalize to storeId
      userId: user.sub,
      role: user.role,
      requestId: generateRequestId(),
    };

    // Run request within AsyncLocalStorage context
    // This makes tenant context available anywhere in the request lifecycle
    return new Observable((subscriber) => {
      tenantContext.run(tenantData, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
