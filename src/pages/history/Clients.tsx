// History > clients: one row per client with sandbox/live call counts and total paid.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCards from "@/components/catalog/StatCards";
import { SearchField } from "@/components/catalog/FormBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import EmptyState from "@/components/shared/EmptyState";
import { historyService, type HistoryClient } from "@/services/history.service";
import { paidText, StatsCell, td, th, when } from "./format";
import { useEnv } from "@/env/EnvContext";

export default function HistoryClients() {
    const nav = useNavigate();
    const { mode } = useEnv();
    const [rows, setRows] = useState<HistoryClient[] | null>(null);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");

    const load = useCallback(async () => {
        setError("");
        try { setRows(await historyService.clients()); }
        catch (e) { setError(e instanceof Error ? e.message : "Failed to load history"); }
    }, []);
    useEffect(() => { void load(); }, [load]);

    const shown = useMemo(() => {
        const t = q.trim().toLowerCase();
        return (rows ?? []).filter((r) => !t || r.name.toLowerCase().includes(t));
    }, [rows, q]);

    if (error) return <ErrorBox message={error} onRetry={load} />;
    if (!rows) return <LoadingBox />;

    return (
        <div className="flex flex-col gap-4">
            <StatCards items={[
                { label: "Total Clients", value: rows.length },
                { label: mode === "live" ? "Live Calls" : "Sandbox Calls", value: rows.reduce((n, r) => n + r[mode].calls, 0) },
            ]} />
            <div className="max-w-[360px]"><SearchField value={q} onChange={setQ} placeholder="Search clients…" /></div>
            <section className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="w-full overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>S.No</th>
                                <th className={th}>Client</th><th className={th}>Environments</th>
                                <th className={th}>{mode === "live" ? "Live" : "Sandbox"}</th>
                                <th className={th}>Total Paid</th><th className={th}>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((r, i) => (
                                <tr key={r.id} className="hover:bg-row-hover">
                                    <td className={`${td} pl-5`}>{i + 1}</td>
                                    <td className={td}>
                                        <button type="button" onClick={() => nav(`/history/${r.id}`)} className="text-left font-semibold text-link hover:underline">{r.name}</button>
                                    </td>
                                    <td className={td}>{r.environmentsCount}</td>
                                    <td className={td}><StatsCell s={r[mode]} /></td>
                                    <td className={td}>{paidText(r[mode].paid)}</td>
                                    <td className={td}>{when(r[mode].lastAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {shown.length === 0 && <EmptyState title="No clients found" message="Clients with API activity will show up here." />}
                </div>
            </section>
        </div>
    );
}