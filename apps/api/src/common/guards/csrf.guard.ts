import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'trafi_csrf_token';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF validation for specific routes
 * Uses NestJS standard SetMetadata pattern
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

/**
 * CSRF Guard - Validates CSRF tokens on state-changing requests
 * Uses Double-Submit Cookie pattern
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip CSRF validation for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Check if CSRF validation is skipped for this handler
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Get CSRF token from header and cookie
    const headerToken = request.headers[CSRF_HEADER_NAME] as string | undefined;
    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME] as string | undefined;

    // Validate tokens
    if (!this.validateCsrfToken(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private validateCsrfToken(
    cookieToken: string | undefined,
    headerToken: string | undefined,
  ): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    if (cookieToken.length !== headerToken.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < cookieToken.length; i++) {
      result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
    }

    return result === 0;
  }
}
