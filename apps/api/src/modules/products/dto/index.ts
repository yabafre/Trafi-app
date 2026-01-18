/**
 * Products DTO exports
 *
 * DTOs for Swagger documentation.
 * Actual validation is done via Zod schemas in @trafi/validators.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */

export { CreateProductDto } from './create-product.dto';
export { UpdateProductDto } from './update-product.dto';
export { ProductResponseDto, PaginatedProductsResponseDto } from './product-response.dto';
export { ListProductsQueryDto } from './list-products-query.dto';
