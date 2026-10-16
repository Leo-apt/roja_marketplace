import type { DiscountType } from "@/utils/catalog";

export type Status = "Active" | "Inactive";

const BY = "Herberts Mccarthy";
const at = (day: number, h: number, m = 0) =>
    `07/${String(day).padStart(2, "0")}/2026 ${h}:${String(m).padStart(2, "0")} AM (EDT)`;

/* ---------- Categories ---------- */
export interface Category {
    id: string; name: string; bgColor: string; status: Status;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
const catSeed: [string, string][] = [
    ["Auto", "#2363da"], ["Finance", "#116846"], ["Health", "#a22c36"], ["Travel", "#6941ab"],
    ["Shopping", "#e8a239"], ["Insurance", "#0e7490"], ["Education", "#7c3aed"], ["Utilities", "#475569"],
    ["Entertainment", "#db2777"], ["Home Services", "#65a30d"], ["Dining", "#ea580c"],
];
export const categories: Category[] = catSeed.map(([name, bgColor], i) => ({
    id: `c${i + 1}`, name, bgColor, status: i % 5 === 4 ? "Inactive" : "Active",
    createdBy: BY, createdOn: at(10 + i, 11, 20),
    updatedBy: i % 3 === 0 ? "N/A" : BY, updatedOn: at(10 + i, 11, 20),
}));

/* ---------- Bundles ---------- */
export interface Bundle {
    id: string; name: string; shortCode: string; iconFamily: string; appIcon: string; webIcon: string; bgColor: string;
    pricingType: "Add On" | "Bundle"; status: Status; price: number | null;
    discountOn: boolean; discountWhen: "" | "forever" | "first"; discountType: DiscountType; discountValue: number | null;
    longDescription: string; benefits: string[]; phone: string; portalUrl: string; promoCode: string; promoNote: string;
    disclosure: string; disclaimer: string; additionalInfo: string; insuranceInstructions: string;
    title: string; shortDescription: string; tIconFamily: string; tAppIcon: string; tWebIcon: string; cardBg: string; iconBg: string;
    bgImage?: string;
    createdBy: string; updatedBy: string; createdOn: string; updatedOn: string;
}
type BundleSeed = Partial<Bundle> & Pick<Bundle, "id" | "name" | "pricingType" | "price">;
const mkBundle = (p: BundleSeed): Bundle => ({
    shortCode: p.name.split(" ")[0], iconFamily: "fa-solid", appIcon: "shield", webIcon: "shield", bgColor: "#2363da",
    status: "Active", discountOn: false, discountWhen: "", discountType: "fixed", discountValue: null,
    longDescription: "", benefits: [], phone: "", portalUrl: "", promoCode: "", promoNote: "",
    disclosure: "", disclaimer: "", additionalInfo: "", insuranceInstructions: "",
    title: p.name, shortDescription: `${p.name} for ROJA members.`, tIconFamily: "fa-solid", tAppIcon: "shield", tWebIcon: "shield",
    cardBg: "#ffffff", iconBg: "#2363da",
    createdBy: BY, updatedBy: "N/A", createdOn: at(16, 11, 48), updatedOn: at(16, 11, 48),
    ...p,
});

const financialLong =
    "<p>Financial issues can arise at any time, from dealing with debt to saving for college. In good times and bad, everyone could use some help managing their finances. It is not enough to read good advice in a book or magazine – to achieve your financial objectives, you may need individual assistance from a financial professional.</p>" +
    "<p><strong>Financial Concerns Addressed:</strong></p><ul><li>Getting out of debt</li><li>Credit card or loan problems</li><li>Saving for the future</li><li>Tax questions</li><li>Financial aid questions</li></ul>" +
    "<p><strong>Financial Professionals Available:</strong></p><ul><li>Certified Public Accountants (CPAs)</li><li>Certified Financial Planners (CFPs)</li><li>Other financial professionals</li></ul>" +
    "<p>FinancialConnect professionals have been trained to be sensitive to the emotional needs that accompany financial issues. A staff of experts, including Certified Public Accountants (CPAs), Certified Financial Planners (CFPs), and other professionals are exclusively dedicated to providing telephonic information. For individualized investment advice you can be referred to a CFP in your local community.</p>";

export const bundles: Bundle[] = [
    mkBundle({
        id: "b1", name: "Financial Connect", shortCode: "Financial", pricingType: "Bundle", price: null,
        shortDescription: "Financial issues can arise at any time, from dealing with debt to saving for college. In good times and bad, everyone could use some help managing their finance",
        longDescription: financialLong, phone: "+18665942374", insuranceInstructions: "Getting out of debt",
    }),
    mkBundle({ id: "b2", name: "Vitamins & Supplements", shortCode: "Vitamins", pricingType: "Add On", price: 4.99, discountOn: true, discountWhen: "first", discountType: "percent", discountValue: 10, benefits: ["Monthly savings on vitamins", "Free shipping"] }),
    mkBundle({ id: "b3", name: "Roadside Assistance", shortCode: "Roadside", pricingType: "Add On", price: 3.99, discountOn: true, discountWhen: "forever", discountType: "fixed", discountValue: 1 }),
    mkBundle({ id: "b4", name: "24-Hour Nurseline", shortCode: "Nurseline", pricingType: "Bundle", price: null }),
    mkBundle({ id: "b5", name: "Mechanic Hotline", shortCode: "Mechanic", pricingType: "Bundle", price: null }),
    mkBundle({ id: "b6", name: "Vision Savings", shortCode: "Vision", pricingType: "Add On", price: 2.49 }),
    mkBundle({ id: "b7", name: "Tax Hotline", shortCode: "Tax", pricingType: "Bundle", price: null }),
    mkBundle({ id: "b8", name: "Legal Access", shortCode: "Legal", pricingType: "Add On", price: 5.99, status: "Inactive" }),
    mkBundle({ id: "b9", name: "Identity Protection", shortCode: "Identity", pricingType: "Add On", price: 6.99, discountOn: true, discountWhen: "forever", discountType: "percent", discountValue: 15 }),
    mkBundle({ id: "b10", name: "Telehealth", shortCode: "Telehealth", pricingType: "Add On", price: 7.49 }),
];
export const bundleOptions = bundles.map((b) => b.name);

/* ---------- Products ---------- */
export interface Product {
    id: string; categoryId: string; name: string; providerId: string; status: Status;
    wholesale: number; markup: number; retail: number; discountType: DiscountType; discountValue: number; bundles: string[];
    imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    audience: "everyone" | "provider"; productConfig: string; placements: string[]; freqCap: number;
    publish: "now" | "later"; availableFrom: string; expiresOn: string;
    minLimit: number; maxLimit: number; serviceFee: number; repaymentDays: number; provider: string;
    createdBy: string; updatedBy: string; createdOn: string; updatedOn: string;
}
export const productTemplates = ["Standard card", "Highlight banner", "Compact tile"];
export const productConfigs = ["High-engagement users", "Recent transaction signals", "Low-balance alerts"];
export const placementOptions = ["Marketplace", "Dashboard recommendation", "Offer carousel", "Post-advance screen"];

const prodSeed: [string, string, number, number, number, DiscountType, number, string[]][] = [
    ["Financial +", "c2", 3.95, 9.99, 2, "percent", 0, ["Financial Connect"]],
    ["Auto Care Plus", "c1", 4.5, 12.99, 2.5, "fixed", 1, ["Roadside Assistance", "Mechanic Hotline"]],
    ["Health Essentials", "c3", 5.2, 14.99, 3, "percent", 10, ["Vitamins & Supplements", "24-Hour Nurseline"]],
    ["Travel Shield", "c4", 2.8, 8.99, 1.5, "percent", 0, ["Roadside Assistance"]],
    ["Vision Saver", "c3", 1.9, 6.99, 1.2, "fixed", 0.5, ["Vision Savings"]],
    ["Tax Helper", "c2", 3.1, 9.49, 2, "percent", 5, ["Tax Hotline", "Financial Connect"]],
    ["Shopper Rewards", "c5", 1.2, 4.99, 0.8, "percent", 0, []],
    ["Home Protect", "c10", 6.0, 15.99, 3.5, "fixed", 2, ["Legal Access"]],
    ["Identity Guard", "c6", 4.2, 11.99, 2.2, "percent", 15, ["Identity Protection"]],
];
export const products: Product[] = prodSeed.map(([name, categoryId, wholesale, retail, markup, discountType, discountValue, bs], i) => ({
    id: `p${i + 1}`, categoryId, name, providerId: `PRV-${1000 + i}`, status: i % 4 === 3 ? "Inactive" : "Active",
    wholesale, markup, retail, discountType, discountValue, bundles: bs,
    imageBg: "#eaf1ff",
    shortDescription: `Get ${name} benefits and expert guidance to reach your goals.`,
    longDescription: `<p>Your <strong>${name}</strong> plan is now active. Get expert guidance and member savings.</p>`,
    pricingContent: "Billed monthly. Renews automatically until cancelled.",
    template: productTemplates[i % 3], dashTitle: name, cta: "Get started", featureTitle: `${name} benefits`, dashShort: `Save more with ${name}.`,
    audience: i % 3 === 2 ? "provider" : "everyone", productConfig: i % 3 === 2 ? productConfigs[0] : "",
    placements: ["Marketplace", "Offer carousel"], freqCap: 3, publish: "now", availableFrom: "", expiresOn: "",
    minLimit: 20, maxLimit: 30, serviceFee: 10, repaymentDays: 30, provider: "-",
    createdBy: BY, updatedBy: i % 2 ? BY : "N/A", createdOn: at(16, 11, 48), updatedOn: at(16, 11, 48),
}));

/* ---------- Margins (derived from products) ---------- */
export interface MarginRec {
    id: string; product: string; features: string[]; wholesale: number; retail: number;
    markup: number; markupType: "flat" | "percent"; status: Status;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export const margins: MarginRec[] = products.map((p, i) => ({
    id: `m${i + 1}`, product: p.name, features: p.bundles, wholesale: p.wholesale, retail: p.retail,
    markup: p.markup, markupType: "flat", status: p.status,
    createdBy: BY, createdOn: at(16, 12, 7), updatedBy: "N/A", updatedOn: at(16, 12, 7),
}));