import type { ReactNode } from "react";
import { money } from "@/utils/money";

export function Kv({ items }: { items: [string, ReactNode][] }) {
    return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-[17px] max-[850px]:gap-[14px]">
            {items.map(([l, v]) => (
                <div key={l}>
                    <small className="mb-1 block text-xs text-muted">{l}</small>
                    <strong className="text-[13px] font-semibold">{v}</strong>
                </div>
            ))}
        </div>
    );
}

export function MoneyRows({ rows }: { rows: [string, number][] }) {
    return (
        <div className="flex flex-col gap-2.5 rounded-[9px] border border-line bg-surfacesoft p-4">
            {rows.map(([l, n], i) => (
                <div
                    key={l}
                    className={`flex items-center justify-between gap-2.5 text-xs ${i === rows.length - 1 ? "border-t border-line pt-2.5 font-bold" : ""}`}
                >
                    <span>{l}</span>
                    <strong className={`font-semibold tabular-nums ${n < 0 ? "text-bad" : ""}`}>{money(n === 0 ? 0 : n)}</strong>
                </div>
            ))}
        </div>
    );
}

export function DetailTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
    return (
        <div className="w-full overflow-auto">
            <table className="w-full border-collapse text-left text-xs">
                <thead>
                    <tr>
                        {head.map((h) => (
                            <th key={h} className="border-b border-linesoft bg-surfacealt px-3 py-3 font-semibold text-th-text">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="hover:bg-row-hover">
                            {r.map((c, j) => (
                                <td key={j} className="border-b border-linesoft px-3 py-3 align-middle text-cell-text">{c}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}