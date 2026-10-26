// Marketplace > Reports: sales and amount to pay per client, environment and product (sample data for now).
import { Fragment, useMemo, useState, type MouseEvent } from "react";
import { useApp } from "@/hooks/useApp";
import { useEnv } from "@/env/EnvContext";
import { SearchField } from "@/components/catalog/FormBits";
import EmptyState from "@/components/shared/EmptyState";
import { money, td, th } from "@/pages/history/format";
import { REPORT_DATA, marginOf, summarize, type ReportRow } from "./reportData";
import ReportDrawer from "./ReportDrawer";
import ReportClientDrawer from "./ReportClientDrawer";
import ReportEnvDrawer from "./ReportEnvDrawer";

const stop = (e: MouseEvent) => e.stopPropagation();

function Card({ label, value, note, tone = "text-ink" }: { label: string; value: string; note: string; tone?: string }) {
    return (
        <div className="rounded-xl border border-line bg-white px-[18px] py-[17px]">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
            <p className="mt-1 text-xs text-muted">{note}</p>
        </div>
    );
}

export default function Reports() {
    const { openDrawer } = useApp();
    const { mode } = useEnv();
    const [q, setQ] = useState("");

    const { rows, groups } = useMemo(() => {
        const t = q.trim().toLowerCase();
        const rows = REPORT_DATA[mode].filter((r) => !t || [r.client, r.env, r.product].some((x) => x.toLowerCase().includes(t)));
        const groups: { client: string; envs: { env: string; rows: ReportRow[] }[] }[] = [];
        for (const r of rows) {
            let g = groups.find((x) => x.client === r.client);
            if (!g) { g = { client: r.client, envs: [] }; groups.push(g); }
            let e = g.envs.find((x) => x.env === r.env);
            if (!e) { e = { env: r.env, rows: [] }; g.envs.push(e); }
            e.rows.push(r);
        }
        return { rows, groups };
    }, [mode, q]);

    const total = summarize(rows.flatMap((r) => r.txns));
    const isLive = mode === "live";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[240px] max-w-[360px] flex-1">
                    <SearchField value={q} onChange={setQ} placeholder="Search client, environment, product…" />
                </div>
                <span className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${isLive ? "bg-goodbg text-good ring-goodline" : "bg-warnbg text-warn ring-warnline"}`}>
                    <span className={`size-1.5 rounded-full ${isLive ? "bg-good" : "bg-caution"}`} />
                    Showing {isLive ? "Live" : "Sandbox"} data · sample
                </span>
            </div>

            <div className="grid grid-cols-4 gap-3.5 max-[1180px]:gap-2.5 max-[850px]:grid-cols-2">
                <Card label="Total sales" value={money(total.sales)} note={`${total.ok} successful transactions`} />
                <Card label="Transactions" value={String(total.count)} note="Across all products" />
                <Card label="Gateway fees" value={money(total.fees)} note="Charged on successful payments" />
                <Card label="Amount to pay" value={money(total.payable)} note="After fees and refunds" tone="text-brand" />
            </div>

            <section className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="w-full overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>Client</th><th className={th}>Environment</th><th className={th}>Product</th>
                                <th className={th}>Transactions</th><th className={th}>Sales</th><th className={th}>Margin</th><th className={th}>Fees</th>
                                <th className={th}>Amount to pay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((g) => {
                                const clientSpan = g.envs.reduce((n, e) => n + e.rows.length, 0);
                                return (
                                    <Fragment key={g.client}>
                                        {g.envs.flatMap((e, ei) => e.rows.map((r, ri) => {
                                            const s = summarize(r.txns);
                                            return (
                                                <tr key={`${g.client}|${e.env}|${r.product}`}
                                                    onClick={() => openDrawer(<ReportDrawer row={r} mode={mode} data={REPORT_DATA[mode]} />)}
                                                    className="cursor-pointer hover:bg-row-hover">
                                                    {ei === 0 && ri === 0 && (
                                                        <td rowSpan={clientSpan}
                                                            onClick={(e) => { stop(e); openDrawer(<ReportClientDrawer client={g.client} data={REPORT_DATA[mode]} />); }}
                                                            className={`${td} cursor-pointer bg-surfacealt pl-5 align-top font-bold text-link`}>{g.client}</td>
                                                    )}
                                                    {ri === 0 && (
                                                        <td rowSpan={e.rows.length}
                                                            onClick={(ev) => { stop(ev); openDrawer(<ReportEnvDrawer client={g.client} env={e.env} data={REPORT_DATA[mode]} />); }}
                                                            className={`${td} cursor-pointer align-top font-semibold text-link`}>{e.env}</td>
                                                    )}
                                                    <td className={`${td} font-semibold text-link`}>{r.product}</td>
                                                    <td className={td}>{s.count}</td>
                                                    <td className={td}>{money(s.sales)}</td>
                                                    <td className={td}>{money(marginOf(r))}</td>
                                                    <td className={td}>{money(s.fees)}</td>
                                                    <td className={`${td} font-semibold text-ink`}>{money(s.payable)}</td>
                                                </tr>
                                            );
                                        }))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {rows.length === 0 && <EmptyState title="No records found" message="Try a different search." />}
                </div>
            </section>
        </div>
    );
}