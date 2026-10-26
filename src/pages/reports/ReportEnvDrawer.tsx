// Every environment of every client, with the clicked one highlighted.
import { useState } from "react";
import Drawer from "@/components/shared/Drawer";
import { money } from "@/pages/history/format";
import { marginOf, summarize, type ReportRow } from "./reportData";
import DrawerFilter, { GroupTable, type GroupBy } from "./ReportFilter";

export default function ReportEnvDrawer({ client, env, data }: { client: string; env: string; data: ReportRow[] }) {
    const pairs = [...new Set(data.map((r) => `${r.client}|${r.env}`))].map((k) => {
        const [c, e] = k.split("|");
        const rows = data.filter((r) => r.client === c && r.env === e);
        return { c, e, products: new Set(rows.map((r) => r.product)).size, sales: summarize(rows.flatMap((r) => r.txns)).sales, margin: rows.reduce((n, r) => n + marginOf(r), 0) };
    });
    const totalSales = pairs.reduce((n, p) => n + p.sales, 0);
    const totalMargin = pairs.reduce((n, p) => n + p.margin, 0);
    const [q, setQ] = useState("");
    const [by, setBy] = useState<GroupBy>("env");
    const active = by === "env" ? `${client} · ${env}` : by === "client" ? client : "";

    return (
        <Drawer title="All environments" kicker={`${client} · ${env}`}>
            <DrawerFilter q={q} onQ={setQ} by={by} onBy={setBy} placeholder="Search client, environment, product…" />
            <div className="grid grid-cols-3 gap-3">
                {[["Environments", String(pairs.length)], ["Total sales", money(totalSales)], ["Total margin", money(totalMargin)]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-line bg-surfacealt p-3">
                        <p className="text-[11px] font-semibold text-muted">{k}</p>
                        <p className="mt-1 text-sm font-bold text-ink">{v}</p>
                    </div>
                ))}
            </div>
            <GroupTable rows={data} by={by} q={q} active={active} />
        </Drawer>
    );
}