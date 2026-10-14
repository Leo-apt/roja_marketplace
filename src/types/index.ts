export type Role = "preparer" | "approver" | "operations";

export type ProductStatus = "Active" | "Draft" | "Archived";
export type PurchaseModel = "One-time" | "Subscription" | "Trial";

/** [name, allocatedPriceCents, allocatedCostCents] */
export type BundleComponent = [string, number, number];

export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    type: "One-time" | "Subscription";
    provider: string;
    price: number; // cents
    cost: number; // cents
    status: ProductStatus;
    version: string;
    components: BundleComponent[];
}

export interface OrderLine {
    productId: string;
    sku: string;
    name: string;
    provider: string;
    qty: number;
    unit: number; // cents
    cost: number; // cents
    discount: number;
    refund: number;
    credit: number;
    chargeback: number;
    version: string;
    fulfillment: string;
}

export interface Order {
    id: string;
    customer: string;
    customerId: string;
    email: string;
    stage: string;
    currentStage: string;
    date: string; // YYYY-MM-DD
    captureDate: string | null;
    items: OrderLine[];
    channel: "iOS" | "Android" | "Web";
    payment: string;
    fulfillment: string;
    funds: string;
    shipping: number;
    tax: number;
    refundTax: number;
    refundShipping: number;
    refundDate: string | null;
    creditDate: string | null;
    disputeDate: string | null;
    disputeFee: number;
    refundFee: number;
    settlement: string;
    hold: string;
    subscriptionId: string | null;
    type: PurchaseModel;
    renewal?: boolean;
    gatewayVariance?: number;
    // derived
    subtotal: number;
    discount: number;
    productAmount: number;
    total: number;
    captured: number;
    fee: number;
    refunded: number;
    chargeback: number;
}

export interface Subscription {
    id: string;
    order: string;
    customer: string;
    product: string;
    productId: string;
    provider: string;
    stage: string;
    amount: number;
    status: string;
    start: string;
    next: string;
    termEnd: string;
    attempts: number;
    version: string;
}

export type BatchStatus =
    | "Draft"
    | "Pending approval"
    | "Approved"
    | "Payment submitted"
    | "Paid"
    | "Voided";

export interface Batch {
    id: string;
    payee: string;
    status: BatchStatus;
    created: string;
    period: string;
    entries: string[];
    amount: number;
    preparedBy: string;
    approvedBy: string;
    reference: string;
    paid?: string;
    note: string;
    timeline: [string, string, string][]; // [date, label, actor]
}