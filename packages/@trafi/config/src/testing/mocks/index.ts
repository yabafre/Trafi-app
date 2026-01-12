/**
 * Shared mock factories for testing across Trafi monorepo.
 * Add common mocks here as the project grows.
 */

/**
 * Creates a mock date for consistent testing.
 * @param isoString - ISO date string (defaults to 2026-01-01T00:00:00.000Z)
 */
export function createMockDate(isoString = '2026-01-01T00:00:00.000Z'): Date {
  return new Date(isoString);
}

/**
 * Creates a mock money object with cents.
 * @param amount - Amount in cents
 * @param currency - Currency code
 */
export function createMockMoney(
  amount: number,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR'
) {
  return { amount, currency };
}

/**
 * Creates a mock pagination response.
 * @param items - Array of items
 * @param options - Pagination options
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
  } = {}
) {
  const { page = 1, limit = 20, total = items.length } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Creates a mock API success response.
 * @param data - Response data
 */
export function createMockApiSuccessResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

/**
 * Creates a mock API error response.
 * @param code - Error code
 * @param message - Error message
 * @param type - Error type
 */
export function createMockApiErrorResponse(
  code: string,
  message: string,
  type: 'validation' | 'auth' | 'payment' | 'server' = 'validation'
) {
  return {
    success: false as const,
    error: {
      code,
      message,
      type,
      requestId: `req_mock_${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Creates a mock store ID with proper prefix.
 */
export function createMockStoreId(): string {
  return `store_mock_${Math.random().toString(36).substring(7)}`;
}

/**
 * Creates a mock product ID with proper prefix.
 */
export function createMockProductId(): string {
  return `prod_mock_${Math.random().toString(36).substring(7)}`;
}

/**
 * Creates a mock order ID with proper prefix.
 */
export function createMockOrderId(): string {
  return `ord_mock_${Math.random().toString(36).substring(7)}`;
}

/**
 * Creates a mock customer ID with proper prefix.
 */
export function createMockCustomerId(): string {
  return `cust_mock_${Math.random().toString(36).substring(7)}`;
}
