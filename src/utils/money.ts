const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Format integer cents as USD, e.g. 1499 -> "$14.99" */
export const money = (cents: number): string => usd.format(cents / 100);

/** Percentage of n over d, or an em dash when d <= 0 */
export const pct = (n: number, d: number): string =>
    d > 0 ? ((100 * n) / d).toFixed(1) + "%" : "—";

/** Sum an array by key or by accessor function */
export function sum<T>(arr: T[], k: keyof T | ((x: T) => number)): number {
    return arr.reduce((s, x) => {
        const v = typeof k === "function" ? k(x) : (x[k] as unknown as number);
        return s + (v || 0);
    }, 0);
}