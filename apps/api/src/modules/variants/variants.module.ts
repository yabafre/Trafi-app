import { Module } from '@nestjs/common';
import { VariantsService } from './variants.service';

/**
 * Variants Module
 *
 * Provides variant management functionality for products.
 * Exports VariantsService for use in tRPC routers and other modules.
 *
 * @see Story 3.2 - Product Variants Management
 */
@Module({
  providers: [VariantsService],
  exports: [VariantsService],
})
export class VariantsModule {}
