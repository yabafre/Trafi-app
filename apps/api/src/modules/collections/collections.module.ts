import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';

/**
 * Collections Module
 *
 * Provides flat collection management for curated product groups.
 * Collections are used for marketing purposes (e.g., "Summer Sale", "Featured Products").
 * @see Story 3.5 - Collections Management
 */
@Module({
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
