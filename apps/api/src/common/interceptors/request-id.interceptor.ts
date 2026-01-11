import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Generate a unique request ID
 * Format: req_{timestamp}_{random}
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Use existing request ID or generate new one
    const requestId = (request.headers['x-request-id'] as string) || generateRequestId();

    // Set on request for use in filters/handlers
    request.headers['x-request-id'] = requestId;

    // Set on response for client tracing
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data: unknown) => {
        // If data is already formatted, pass through
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          (data as Record<string, unknown>).success !== undefined
        ) {
          return data;
        }

        // Wrap successful responses in standard format
        return {
          success: true,
          data,
          requestId,
        };
      })
    );
  }
}
