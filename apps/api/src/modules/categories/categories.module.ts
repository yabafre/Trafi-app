import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';

/**
 * Categories Module
 *
 * Provides hierarchical category management for organizing products.
 * @see Story 3.4 - Categories Management
 */
@Module({
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
