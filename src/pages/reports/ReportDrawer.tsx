// Side drawer for one product in one environment: totals, then every transaction (click a row for details).
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Drawer from "@/components/shared/Drawer";
import type { DataMode } from "@/env/EnvContext";
import { money, td, th, when } from "@/pages/history/format";
import { summarize, type ReportRow, type TxnStatus } from "./reportData";
import DrawerFilter, { GroupTable, type GroupBy } from "./ReportFilter";

const pill: Record<TxnStatus, string> = { success: "bg-goodbg text-good", failed: "bg-badbg text-bad", refunded: "bg-warnbg text-warn" };
const word: Record<TxnStatus, string> = { success: "Success", failed: "Failed", refunded: "Refunded" };

export default function ReportDrawer({ row, mode, data }: { row: ReportRow; mode: DataMode; data: ReportRow[] }) {
    const [open, setOpen] = useState("");
    const [q, setQ] = useState("");
    const [by, setBy] = useState<GroupBy>("product"); // product = this product's transactions
    const s = summarize(row.txns);
    const t = q.trim().toLowerCase();
    const list = [...row.txns]
        .sort((a, b) => b.at.localeCompare(a.at))
        .filter((x) => !t || [x.id, x.customer, x.reference, x.status].some((v) => v.toLowerCase().includes(t)));

    return (
        <Drawer title={row.product} kicker={`${row.client} · ${row.env}`}>
            <DrawerFilter q={q} onQ={setQ} by={by} onBy={setBy} placeholder="Search transaction, customer, client, environment…" />
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-brandsoft px-2.5 py-1 font-semibold text-brand">{row.client}</span>
                <span className="rounded-full bg-surfacealt px-2.5 py-1 font-semibold text-ink">{row.env}</span>
                <span className={`rounded-full px-2.5 py-1 font-semibold ${mode === "live" ? "bg-goodbg text-good" : "bg-warnbg text-warn"}`}>
                    {mode === "live" ? "Live" : "Sandbox"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Sales", money(s.sales)], ["Fees", money(s.fees)], ["Refunds", money(s.refunds)], ["Amount to pay", money(s.payable)]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-line bg-surfacealt p-3">
                        <p className="text-[11px] font-semibold text-muted">{k}</p>
                        <p className="mt-1 text-sm font-bold text-ink">{v}</p>
                    </div>
                ))}
            </div>

            {by !== "product" ? (
                <GroupTable rows={data.filter((r) => r.product === row.product)} by={by} q={q} active={by === "client" ? row.client : `${row.client} · ${row.env}`} />
            ) : (
                <div className="overflow-hidden rounded-xl border border-line bg-white">
                    <div className="border-b border-line px-5 py-[17px]">
                        <h3 className="text-sm font-semibold">Transactions ({s.count})</h3>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr>
                                    <th className={`${th} w-8 pl-4`} /><th className={th}>Time</th><th className={th}>Transaction</th>
                                    <th className={th}>Customer</th><th className={th}>Amount</th><th className={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((t) => {
                                    const on = open === t.id;
                                    return (
                                        <Fragment key={t.id}>
                                            <tr onClick={() => setOpen(on ? "" : t.id)} className="cursor-pointer hover:bg-row-hover">
                                                <td className={`${td} pl-4`}>{on ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</td>
                                                <td className={td}>{when(t.at)}</td>
                                                <td className={`${td} font-semibold text-link`}>{t.id}</td>
                                                <td className={td}>{t.customer}</td>
                                                <td className={td}>{money(t.amount)}</td>
                                                <td className={td}>
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${pill[t.status]}`}>{word[t.status]}</span>
                                                </td>
                                            </tr>
                                            {on && (
                                                <tr>
                                                    <td colSpan={6} className="border-b border-linesoft bg-surfacealt px-5 py-4">
                                                        <dl className="grid gap-3 text-xs sm:grid-cols-3">
                                                            {[
                                                                ["Transaction ID", t.id], ["Reference", t.reference], ["Payment method", t.method],
                                                                ["Customer", t.customer], ["Amount", money(t.amount)], ["Fee", money(t.fee)],
                                                                ["Net to pay", t.status === "success" ? money(t.amount - t.fee) : "-"], ["Time", when(t.at)],
                                                            ].map(([k, v]) => (
                                                                <div key={k}><dt className="font-semibold text-muted">{k}</dt><dd className="mt-0.5 break-all text-ink">{v}</dd></div>
                                                            ))}
                                                        </dl>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Drawer>
    );
}