export type ErrorType = 'validation' | 'auth' | 'payment' | 'server' | 'not_found';
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
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    requestId: string;
}
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export declare function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T>;
export declare function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse;
//# sourceMappingURL=api.types.d.ts.map