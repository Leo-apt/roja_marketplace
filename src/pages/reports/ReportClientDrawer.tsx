// Client summary: environments, products, margin and total sales.
import { useState } from "react";
import Drawer from "@/components/shared/Drawer";
import { money } from "@/pages/history/format";
import { marginOf, summarize, type ReportRow } from "./reportData";
import DrawerFilter, { GroupTable, type GroupBy } from "./ReportFilter";

export default function ReportClientDrawer({ client, data }: { client: string; data: ReportRow[] }) {
    const rows = data.filter((r) => r.client === client);
    const envs = [...new Set(rows.map((r) => r.env))];
    const products = new Set(rows.map((r) => r.product));
    const sales = summarize(rows.flatMap((r) => r.txns)).sales;
    const margin = rows.reduce((n, r) => n + marginOf(r), 0);
    const [q, setQ] = useState("");
    const [by, setBy] = useState<GroupBy>("env");

    return (
        <Drawer title={client} kicker="Client summary">
            <DrawerFilter q={q} onQ={setQ} by={by} onBy={setBy} placeholder="Search environment, product…" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Environments", String(envs.length)], ["Products", String(products.size)], ["Margin", money(margin)], ["Total sales", money(sales)]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-line bg-surfacealt p-3">
                        <p className="text-[11px] font-semibold text-muted">{k}</p>
                        <p className="mt-1 text-sm font-bold text-ink">{v}</p>
                    </div>
                ))}
            </div>
            <GroupTable rows={rows} by={by} q={q} />
        </Drawer>
    );
}