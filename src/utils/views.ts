export type ViewKey =
    | "overview"
    | "products"
    | "purchases"
    | "subscriptions"
    | "margin"
    | "settlements"
    | "reconciliation"
    | "providers"
    | "productCategories"
    | "bundles"
    | "catalogProducts"
    | "margins"
    | "instances"
    | "engineConfig"
    | "productTemplates"
    | "engineSignals"
    | "history"
    | "documents"
    | "settings"
    | "documentsManage"

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

const defaultScope =
    "Current status as of 7 Oct; date range selects the purchase origin.";
const orderSearch = "order / customer / product";

export const viewInfo: Record<ViewKey, ViewInfo> = {
    overview: {
        title: "Marketplace overview",
        nav: "Overview & reports",
        path: "/overview",
        icon: "▦",
        subtitle:
            "Track sales, conversion, fulfillment, margin, and supplier payables in one place.",
        dateLabel: "Purchase created date",
        search: orderSearch,
        statuses: [],
        statusLabel: "Primary status",
        scope: "Finance by event date; purchase metrics by created/captured date.",
    },
    products: {
        title: "Products & bundles",
        nav: "Products & bundles",
        path: "/products",
        icon: "▤",
        subtitle:
            "Review published products, price and cost versions, bundle components, and indicative catalog margins.",
        dateLabel: "Sales metrics period",
        search: "product / SKU",
        statuses: ["all", "Active", "Draft", "Archived"],
        statusLabel: "Primary status",
        scope:
            "Catalog shown regardless of sales activity. Date range applies to sales metrics only.",
    },
    purchases: {
        title: "Marketplace purchases",
        nav: "Purchase list",
        path: "/purchases",
        icon: "▣",
        subtitle:
            "One row per customer order. Open an order for line items, payment attempts, fulfillment, and margin.",
        dateLabel: "Purchase created date",
        search: orderSearch,
        statuses: ["all", "Captured", "Authorized", "Failed", "No charge"],
        statusLabel: "Payment status",
        scope: defaultScope,
    },
    subscriptions: {
        title: "Marketplace subscriptions",
        nav: "Marketplace subscriptions",
        path: "/subscriptions",
        icon: "↻",
        subtitle:
            "Track marketplace plans, trials, renewals, grace periods, and cancellations. Separate from EWA membership.",
        dateLabel: "Purchase created date",
        search: orderSearch,
        statuses: [
            "all",
            "Active",
            "Trialing",
            "Past due",
            "Cancel scheduled",
            "Suspended",
            "Cancelled",
        ],
        statusLabel: "Primary status",
        scope: defaultScope,
    },
    margin: {
        title: "Margin reports",
        nav: "Margin reports",
        path: "/margin",
        icon: "↗",
        subtitle:
            "Financial-event reporting with historical price/cost snapshots, confirmed supplier credits, and payment fees.",
        dateLabel: "Financial event date",
        search: orderSearch,
        statuses: ["all", "Negative contribution", "Unrecovered cost"],
        statusLabel: "Primary status",
        scope:
            "Financial events within this range; refunds and credits may relate to older purchases.",
    },
    settlements: {
        title: "Supplier settlements",
        nav: "Supplier settlements",
        path: "/settlements",
        icon: "⇄",
        subtitle:
            "Prepare and approve supplier payouts from eligible payables. Gateway deposits are tracked separately.",
        dateLabel: "Payable-origin date",
        search: "order / invoice / payee",
        statuses: [
            "all",
            "Ready",
            "Held",
            "Awaiting funds",
            "Draft",
            "Pending approval",
            "Approved",
            "Payment submitted",
            "Paid",
            "Recovered",
        ],
        statusLabel: "Primary status",
        scope:
            "As-of payable balances at 7 Oct. Date range selects original payable or credit date.",
    },
    reconciliation: {
        title: "Reconciliation & exceptions",
        nav: "Reconciliation",
        path: "/reconciliation",
        icon: "≋",
        subtitle:
            "Compare the ROJA payment ledger with gateway transactions and deposits, and review fulfillment or credit exceptions.",
        dateLabel: "Purchase created date",
        search: orderSearch,
        statuses: [
            "all",
            "Matched",
            "Mismatch",
            "Awaiting deposit",
            "Action required",
        ],
        statusLabel: "Primary status",
        scope: defaultScope,
    },
    providers: {
        title: "Providers",
        nav: "Providers",
        path: "/catalog/providers",
        icon: "▦",
        subtitle: "Manage providers, their contact details and logos.",
        dateLabel: "Created on",
        search: "company name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All providers.",
    },
    productCategories: {
        title: "Product categories",
        nav: "Product categories",
        path: "/catalog/product-categories",
        icon: "▦",
        subtitle: "Manage the categories products are grouped under.",
        dateLabel: "Created on",
        search: "category name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All product categories.",
    },
    bundles: {
        title: "Bundles",
        nav: "Bundles & Add-ons",
        path: "/catalog/bundles",
        icon: "▤",
        subtitle: "Manage add-on and bundle features, their pricing and content.",
        dateLabel: "Created on",
        search: "bundle name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All bundles and add-ons.",
    },
    catalogProducts: {
        title: "Products",
        nav: "Products",
        path: "/catalog/products",
        icon: "▣",
        subtitle: "Manage products, pricing, audience and placement.",
        dateLabel: "Created on",
        search: "product name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All products.",
    },
    margins: {
        title: "Margins",
        nav: "Margins",
        path: "/catalog/margins",
        icon: "↗",
        subtitle: "Wholesale, retail, Roja markup and margin per product.",
        dateLabel: "Created on",
        search: "product name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All margin records.",
    },
    instances: {
        title: "clients",
        nav: "clients",
        path: "/instances",
        icon: "▥",
        subtitle: "Manage clients, their products and access tokens.",
        dateLabel: "Created on",
        search: "clients name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All entities.",
    },
    engineConfig: {
        title: "Engine configuration",
        nav: "Engine configuration",
        path: "/catalog/engine-configuration",
        icon: "⚙",
        subtitle:
            "Scoring configs, decision thresholds and signals per provider and offer type.",
        dateLabel: "Created on",
        search: "config name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All engine configurations.",
    },

    engineSignals: {
        title: "Product engine signals",
        nav: "Engine signals",
        path: "/catalog/engine-signals",
        icon: "⚙",
        subtitle: "Signals used by the engine to score transactions.",
        dateLabel: "Created on",
        search: "signal id / label",
        statuses: ["all"],
        statusLabel: "Status",
        scope: "All engine signals.",
    },

    productTemplates: {
        title: "Product templates",
        nav: "Product templates",
        path: "/catalog/product-templates",
        icon: "▤",
        subtitle: "Manage the look of product cards: images, colors and text styles.",
        dateLabel: "Created on",
        search: "template name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All product templates.",
    },

    history: {
        title: "History",
        nav: "History",
        path: "/history",
        icon: "◷",
        subtitle: "Every Stripe API call made with your clients' tokens.",
        dateLabel: "Called on",
        search: "action / object id",
        statuses: ["all", "success", "failed"],
        statusLabel: "Status",
        scope: "All recorded API calls.",
    },

    documents: {
        title: "Documents",
        nav: "Documents",
        path: "/tools/Documents",
        icon: "⚙",
        subtitle: "Track the Documents running in the system.",
        dateLabel: "Started on",
        search: "documents name",
        statuses: ["all"],
        statusLabel: "Status",
        scope: "All Documents.",
    },

    settings: {
        title: "Settings",
        nav: "Settings",
        path: "/settings",
        icon: "⚙",
        subtitle:
            "Manage your profile, preferences and notifications.",
        dateLabel: "Created on",
        search: "config name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All engine configurations.",
    },
    documentsManage: {
        title: "API documentation",
        nav: "Documents setup",
        path: "/tools/documents-manage",
        icon: "⚙",
        subtitle: "Create and edit the API documentation shown on the Documents page.",
        dateLabel: "Created on",
        search: "api name",
        statuses: ["all", "Active", "Inactive"],
        statusLabel: "Status",
        scope: "All API documentation.",
    },
};

export const navGroups: { label: string; items: ViewKey[] }[] = [
    // { label: "ARS Marketplace", items: ["overview", "products", "purchases", "subscriptions"] },
    // { label: "Finance & control", items: ["margin", "settlements", "reconciliation"] },
    {
        label: "Catalog",
        items: [
            "providers",
            "productCategories",
            "bundles",
            "catalogProducts",
            "margins",
            "engineConfig",
            "productTemplates",
            "engineSignals",
        ],
    },
    { label: "Business", items: ["instances", "history"] },
    { label: "Tools", items: ["documents"] },
];
