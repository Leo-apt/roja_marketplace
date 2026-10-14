import type { Column } from "@/types/table";
import type { Filters } from "@/domain/filters";
import type { FinanceRow } from "@/domain/finance";
import { ASOF, INSTANCE } from "./constants";

export interface ExportCol<T> {
    label: string;
    value: (r: T) => string | number | null | undefined;
}

export function colsToExport<T>(cols: Column<T>[]): ExportCol<T>[] {
    return cols
        .filter((c) => c.key !== "action")
        .map((c) => ({
            label: c.label,
            value: (r: T) =>
                c.value ? c.value(r) : String((r as unknown as Record<string, unknown>)[c.key] ?? ""),
        }));
}

const fk = [
    "orderId", "product", "provider", "units", "capturedSales", "refund", "chargeback",
    "sales", "cost", "credit", "netCost", "gross", "fees", "contribution", "version",
] as const;

export const financeExportCols: ExportCol<FinanceRow>[] = fk.map((k) => ({
    label: k,
    value: (r: FinanceRow) => r[k],
}));

const safe = (x: unknown): string => {
    let s = String(x ?? "");
    if (typeof x !== "number" && /^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
};

export function exportCsv<T>(a: {
    view: string;
    filters: Filters;
    rows: T[];
    cols: ExportCol<T>[];
    raw?: boolean;
}): void {
    const f = a.filters;
    const meta: [string, string][] = [
        ["ROJA instance", INSTANCE], ["Report", a.view], ["Currency", "USD"],
        ["Financial amount units", a.raw ? "Integer USD cents" : "Formatted USD values"],
        ["Reporting timezone", "UTC"], ["From", f.from], ["To", f.to], ["As of", ASOF],
        ["Supplier / payee", f.provider], ["Search", f.q], ["Purchase model", f.type],
        ["Primary status", f.status], ["List tab", f.tab], ["Current EWA stage", f.stage],
        ["Channel", f.channel], ["Negative contribution only", String(f.negative)],
        ["Data", "Synthetic presentation sample"],
    ];
    const csv =
        meta.map((r) => r.map(safe).join(",")).join("\r\n") +
        "\r\n\r\n" +
        a.cols.map((c) => safe(c.label)).join(",") +
        "\r\n" +
        a.rows.map((r) => a.cols.map((c) => safe(c.value(r))).join(",")).join("\r\n");

    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = `ROJA_ARS_${a.view}_${f.from}_${f.to}.csv`;
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}