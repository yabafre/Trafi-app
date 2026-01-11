export type EventType = 'commerce.product.viewed' | 'commerce.cart.item_added' | 'commerce.cart.item_removed' | 'commerce.cart.updated' | 'commerce.checkout.started' | 'commerce.checkout.step_completed' | 'commerce.checkout.abandoned' | 'commerce.order.completed' | 'commerce.order.cancelled' | 'system.user.created' | 'system.user.updated' | 'system.store.created' | 'system.store.settings_updated';
export type EventSource = 'sdk' | 'dashboard' | 'storefront' | 'api';
export interface EventMetadata {
    source: EventSource;
    sessionId?: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
}
export interface EventPayload<T = unknown> {
    eventType: EventType;
    eventId: string;
    tenantId: string;
    timestamp: string;
    version: number;
    data: T;
    metadata?: EventMetadata;
}
export interface ProductViewedData {
    productId: string;
    variantId?: string;
    categoryId?: string;
    price: number;
    currency: string;
}
export interface CartItemAddedData {
    cartId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    currency: string;
}
export interface CheckoutStartedData {
    cartId: string;
    checkoutId: string;
    totalAmount: number;
    currency: string;
    itemCount: number;
}
export interface OrderCompletedData {
    orderId: string;
    checkoutId: string;
    totalAmount: number;
    currency: string;
    itemCount: number;
    paymentMethod: string;
}
//# sourceMappingURL=events.types.d.ts.map