export type DiscountType = "fixed" | "percent";

export const usd = (n: number | null | undefined) =>
    n == null ? "-" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
};

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

export const sellingPrice = (price: number, type: DiscountType | "", value: number) => {
    if (!type || !value) return price;
    const s = type === "percent" ? price - (price * value) / 100 : price - value;
    return Math.max(0, +s.toFixed(2));
};

export const discountShort = (type: DiscountType | "", value: number | null) =>
    type === "percent" ? `${value ?? 0}%` : usd(value ?? 0);

export const discountDetail = (type: DiscountType, value: number) =>
    type === "percent" ? `${value}% (Percentage)` : `${usd(value)} (Fixed)`;

export function calcMargin(wholesale: number, retail: number, markup: number, type: "flat" | "percent") {
    const markupAmt = type === "flat" ? markup : +((wholesale * markup) / 100).toFixed(2);
    const markupPct = wholesale > 0 ? +((markupAmt / wholesale) * 100).toFixed(2) : 0;
    const buy = +(wholesale + markupAmt).toFixed(2);
    const margin = +(retail - buy).toFixed(2);
    return { markupAmt, markupPct, buy, margin };
}

export const statusFilterOptions = [
    { value: "all", label: "Select status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
];
export const statusFormOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
];
export const discountTypeFormOptions = [
    { value: "fixed", label: "$ Fixed Amount" },
    { value: "percent", label: "% Percentage" },
];