/**
 * tRPC NestJS Module
 *
 * Integrates tRPC with NestJS dependency injection.
 * Provides the tRPC middleware factory that can be used in main.ts.
 */
import { Module, Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/user/user.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { ApiKeysModule } from '../modules/api-keys/api-keys.module';
import { OwnershipModule } from '../modules/ownership/ownership.module';
import { ProductsModule } from '../modules/products/products.module';
import { VariantsModule } from '../modules/variants/variants.module';
import { MediaModule } from '../modules/media/media.module';
import { CategoriesModule } from '../modules/categories/categories.module';
import { CollectionsModule } from '../modules/collections/collections.module';
import { AuthService } from '../modules/auth/auth.service';
import { UserService } from '../modules/user/user.service';
import { SettingsService } from '../modules/settings/settings.service';
import { ApiKeysService } from '../modules/api-keys/api-keys.service';
import { OwnershipService } from '../modules/ownership/ownership.service';
import { ProductsService } from '../modules/products/products.service';
import { VariantsService } from '../modules/variants/variants.service';
import { MediaService } from '../modules/media/media.service';
import { CategoriesService } from '../modules/categories/categories.service';
import { CollectionsService } from '../modules/collections/collections.service';
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
    private readonly userService: UserService,
    private readonly settingsService: SettingsService,
    private readonly apiKeysService: ApiKeysService,
    private readonly ownershipService: OwnershipService,
    private readonly productsService: ProductsService,
    private readonly variantsService: VariantsService,
    private readonly mediaService: MediaService,
    private readonly categoriesService: CategoriesService,
    private readonly collectionsService: CollectionsService,
    private readonly jwtService: JwtService
  ) {
    const services: TRPCServices = {
      authService: this.authService,
      userService: this.userService,
      settingsService: this.settingsService,
      apiKeysService: this.apiKeysService,
      ownershipService: this.ownershipService,
      productsService: this.productsService,
      variantsService: this.variantsService,
      mediaService: this.mediaService,
      categoriesService: this.categoriesService,
      collectionsService: this.collectionsService,
      jwtService: this.jwtService,
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
    private readonly userService: UserService,
    private readonly settingsService: SettingsService,
    private readonly apiKeysService: ApiKeysService,
    private readonly ownershipService: OwnershipService,
    private readonly productsService: ProductsService,
    private readonly variantsService: VariantsService,
    private readonly mediaService: MediaService,
    private readonly categoriesService: CategoriesService,
    private readonly collectionsService: CollectionsService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Get the services to inject into tRPC context
   */
  getServices(): TRPCServices {
    return {
      authService: this.authService,
      userService: this.userService,
      settingsService: this.settingsService,
      apiKeysService: this.apiKeysService,
      ownershipService: this.ownershipService,
      productsService: this.productsService,
      variantsService: this.variantsService,
      mediaService: this.mediaService,
      categoriesService: this.categoriesService,
      collectionsService: this.collectionsService,
      jwtService: this.jwtService,
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
  imports: [AuthModule, UserModule, SettingsModule, ApiKeysModule, OwnershipModule, ProductsModule, VariantsModule, MediaModule, CategoriesModule, CollectionsModule],
  providers: [TRPCService, TRPCMiddleware],
  exports: [TRPCService, TRPCMiddleware],
})
export class TRPCModule {}
