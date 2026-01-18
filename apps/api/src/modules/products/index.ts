/**
 * Products Module Public API
 *
 * Explicit exports for @trafi/core extensibility.
 * Follow RETRO-3 pattern: export explicit public API from modules.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */

export { ProductsModule } from './products.module';
export { ProductsService } from './products.service';

// Export response types for consumers
export type { ProductResponseDto, PaginatedProductsDto } from './products.service';
