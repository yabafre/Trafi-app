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
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user';
import { SettingsModule } from '@modules/settings';
import { ApiKeysModule } from '@modules/api-keys';
import { OwnershipModule } from '@modules/ownership';
import { ProductsModule } from '@modules/products';
import { VariantsModule } from '@modules/variants';
import { MediaModule } from '@modules/media';
import { CategoriesModule } from '@modules/categories';
import { CollectionsModule } from '@modules/collections';
import { PricingModule } from '@modules/pricing';
import { InventoryModule, InventoryService } from '@modules/inventory';
import { PromotionsModule, PromotionsService, CouponService } from '@modules/promotions';
import { GiftCardsModule, GiftCardsService, GiftCardTemplateService } from '@modules/gift-cards';
import { AuthService } from '@modules/auth/auth.service';
import { UserService } from '@modules/user';
import { SettingsService } from '@modules/settings';
import { ApiKeysService } from '@modules/api-keys';
import { OwnershipService } from '@modules/ownership';
import { ProductsService } from '@modules/products';
import { VariantsService } from '@modules/variants';
import { MediaService } from '@modules/media';
import { CategoriesService } from '@modules/categories';
import { CollectionsService } from '@modules/collections';
import { TaxRulesService, PricingService } from '@modules/pricing';
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
    private readonly taxRulesService: TaxRulesService,
    private readonly pricingService: PricingService,
    private readonly inventoryService: InventoryService,
    private readonly promotionsService: PromotionsService,
    private readonly couponService: CouponService,
    private readonly giftCardsService: GiftCardsService,
    private readonly giftCardTemplateService: GiftCardTemplateService,
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
      taxRulesService: this.taxRulesService,
      pricingService: this.pricingService,
      inventoryService: this.inventoryService,
      promotionsService: this.promotionsService,
      couponService: this.couponService,
      giftCardsService: this.giftCardsService,
      giftCardTemplateService: this.giftCardTemplateService,
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
    private readonly taxRulesService: TaxRulesService,
    private readonly pricingService: PricingService,
    private readonly inventoryService: InventoryService,
    private readonly promotionsService: PromotionsService,
    private readonly couponService: CouponService,
    private readonly giftCardsService: GiftCardsService,
    private readonly giftCardTemplateService: GiftCardTemplateService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Get the services to inject into tRPC context
   *
   * NOTE: CartValidationService is NOT included - it uses REST for storefront.
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
      taxRulesService: this.taxRulesService,
      pricingService: this.pricingService,
      inventoryService: this.inventoryService,
      promotionsService: this.promotionsService,
      couponService: this.couponService,
      giftCardsService: this.giftCardsService,
      giftCardTemplateService: this.giftCardTemplateService,
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
  imports: [
    AuthModule,
    UserModule,
    SettingsModule,
    ApiKeysModule,
    OwnershipModule,
    ProductsModule,
    VariantsModule,
    MediaModule,
    CategoriesModule,
    CollectionsModule,
    PricingModule,
    InventoryModule,
    PromotionsModule,
    GiftCardsModule,
  ],
  providers: [TRPCService, TRPCMiddleware],
  exports: [TRPCService, TRPCMiddleware],
})
export class TRPCModule {}
