/**
 * tRPC NestJS Module
 *
 * Integrates tRPC with NestJS dependency injection.
 * Provides the tRPC middleware factory that can be used in main.ts.
 */
import { Module, Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/user/user.module';
import { AuthService } from '../modules/auth/auth.service';
import { UserService } from '../modules/user/user.service';
import { appRouter } from './routers/_app';
import { createContext, type TRPCServices } from './context';

/**
 * tRPC Middleware - integrates tRPC with Express/NestJS
 *
 * Creates the Express middleware with NestJS services injected.
 */
@Injectable()
export class TRPCMiddleware implements NestMiddleware {
  private readonly middleware: ReturnType<typeof trpcExpress.createExpressMiddleware>;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {
    const services: TRPCServices = {
      authService: this.authService,
      userService: this.userService,
    };

    this.middleware = trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createContext({ req, res, services }),
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    return this.middleware(req, res, next);
  }
}

/**
 * tRPC Service - provides access to tRPC router and middleware factory
 */
@Injectable()
export class TRPCService {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  /**
   * Get the services to inject into tRPC context
   */
  getServices(): TRPCServices {
    return {
      authService: this.authService,
      userService: this.userService,
    };
  }

  /**
   * Create Express middleware for tRPC
   */
  createMiddleware() {
    const services = this.getServices();

    return trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createContext({ req, res, services }),
    });
  }
}

@Module({
  imports: [AuthModule, UserModule],
  providers: [TRPCService, TRPCMiddleware],
  exports: [TRPCService, TRPCMiddleware],
})
export class TRPCModule {}
