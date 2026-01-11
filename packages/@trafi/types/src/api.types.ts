/**
 * Standardized API response types
 */

/**
 * Error types for API responses
 */
export type ErrorType = 'validation' | 'auth' | 'payment' | 'server' | 'not_found';

/**
 * Standardized error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: ErrorType;
    details?: {
      field?: string;
      provider?: string;
      [key: string]: unknown;
    };
    requestId: string;
    timestamp: string;
  };
}

/**
 * Standardized success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

/**
 * Combined API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard for success response
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard for error response
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}
