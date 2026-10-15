export type ViewKey =
    | "overview" | "products" | "purchases" | "subscriptions"
    | "margin" | "settlements" | "reconciliation"
    | "productCategories" | "bundles" | "catalogProducts" | "margins" | "instances" | "engineConfig";

export interface ViewInfo {
    title: string;
    subtitle: string;
    nav: string;
    path: string;
    icon: string;
    dateLabel: string;
    search: string;
    scope: string;
    statuses: string[];
    statusLabel: string;
}

const defaultScope = "Current status as of 7 Oct; date range selects the purchase origin.";
const orderSearch = "order / customer / product";

export const viewInfo: Record<ViewKey, ViewInfo> = {
    overview: {
        title: "Marketplace overview", nav: "Overview & reports", path: "/overview", icon: "▦",
        subtitle: "Track sales, conversion, fulfillment, margin, and supplier payables in one place.",
        dateLabel: "Purchase created date", search: orderSearch, statuses: [], statusLabel: "Primary status",
        scope: "Finance by event date; purchase metrics by created/captured date.",
    },
    products: {
        title: "Products & bundles", nav: "Products & bundles", path: "/products", icon: "▤",
        subtitle: "Review published products, price and cost versions, bundle components, and indicative catalog margins.",
        dateLabel: "Sales metrics period", search: "product / SKU",
        statuses: ["all", "Active", "Draft", "Archived"], statusLabel: "Primary status",
        scope: "Catalog shown regardless of sales activity. Date range applies to sales metrics only.",
    },
    purchases: {
        title: "Marketplace purchases", nav: "Purchase list", path: "/purchases", icon: "▣",
        subtitle: "One row per customer order. Open an order for line items, payment attempts, fulfillment, and margin.",
        dateLabel: "Purchase created date", search: orderSearch,
        statuses: ["all", "Captured", "Authorized", "Failed", "No charge"], statusLabel: "Payment status",
        scope: defaultScope,
    },
    subscriptions: {
        title: "Marketplace subscriptions", nav: "Marketplace subscriptions", path: "/subscriptions", icon: "↻",
        subtitle: "Track marketplace plans, trials, renewals, grace periods, and cancellations. Separate from EWA membership.",
        dateLabel: "Purchase created date", search: orderSearch,
        statuses: ["all", "Active", "Trialing", "Past due", "Cancel scheduled", "Suspended", "Cancelled"],
        statusLabel: "Primary status", scope: defaultScope,
    },
    margin: {
        title: "Margin reports", nav: "Margin reports", path: "/margin", icon: "↗",
        subtitle: "Financial-event reporting with historical price/cost snapshots, confirmed supplier credits, and payment fees.",
        dateLabel: "Financial event date", search: orderSearch,
        statuses: ["all", "Negative contribution", "Unrecovered cost"], statusLabel: "Primary status",
        scope: "Financial events within this range; refunds and credits may relate to older purchases.",
    },
    settlements: {
        title: "Supplier settlements", nav: "Supplier settlements", path: "/settlements", icon: "⇄",
        subtitle: "Prepare and approve supplier payouts from eligible payables. Gateway deposits are tracked separately.",
        dateLabel: "Payable-origin date", search: "order / invoice / payee",
        statuses: ["all", "Ready", "Held", "Awaiting funds", "Draft", "Pending approval", "Approved", "Payment submitted", "Paid", "Recovered"],
        statusLabel: "Primary status",
        scope: "As-of payable balances at 7 Oct. Date range selects original payable or credit date.",
    },
    reconciliation: {
        title: "Reconciliation & exceptions", nav: "Reconciliation", path: "/reconciliation", icon: "≋",
        subtitle: "Compare the ROJA payment ledger with gateway transactions and deposits, and review fulfillment or credit exceptions.",
        dateLabel: "Purchase created date", search: orderSearch,
        statuses: ["all", "Matched", "Mismatch", "Awaiting deposit", "Action required"], statusLabel: "Primary status",
        scope: defaultScope,
    },
    productCategories: {
        title: "Product categories", nav: "Product categories", path: "/catalog/product-categories", icon: "▦",
        subtitle: "Manage the categories products are grouped under.",
        dateLabel: "Created on", search: "category name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All product categories.",
    },
    bundles: {
        title: "Bundles", nav: "Bundles", path: "/catalog/bundles", icon: "▤",
        subtitle: "Manage add-on and bundle features, their pricing and content.",
        dateLabel: "Created on", search: "bundle name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All bundles and add-ons.",
    },
    catalogProducts: {
        title: "Products", nav: "Products", path: "/catalog/products", icon: "▣",
        subtitle: "Manage products, pricing, audience and placement.",
        dateLabel: "Created on", search: "product name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All products.",
    },
    margins: {
        title: "Margins", nav: "Margins", path: "/catalog/margins", icon: "↗",
        subtitle: "Wholesale, retail, Roja markup and margin per product.",
        dateLabel: "Created on", search: "product name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All margin records.",
    },
    instances: {
        title: "Entity", nav: "Entity", path: "/instances", icon: "▥",
        subtitle: "Manage entities, their products and access tokens.",
        dateLabel: "Created on", search: "entities name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All entities.",
    },
    engineConfig: {
        title: "Engine configuration", nav: "Engine configuration", path: "/catalog/engine-configuration", icon: "⚙",
        subtitle: "Scoring configs, decision thresholds and signals per provider and offer type.",
        dateLabel: "Created on", search: "config name", statuses: ["all", "Active", "Inactive"], statusLabel: "Status",
        scope: "All engine configurations.",
    },
};

export const navGroups: { label: string; items: ViewKey[] }[] = [
    // { label: "ARS Marketplace", items: ["overview", "products", "purchases", "subscriptions"] },
    // { label: "Finance & control", items: ["margin", "settlements", "reconciliation"] },
    { label: "Catalog", items: ["productCategories", "bundles", "catalogProducts", "margins", "engineConfig"] },
    { label: "Entity", items: ["instances"] },
];