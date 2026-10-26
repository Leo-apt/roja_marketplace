// History > one client's environments, with sandbox and live stats. Clicking a cell opens that call log.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import EmptyState from "@/components/shared/EmptyState";
import { entityService } from "@/services/entity.service";
import { historyService, type HistoryEnv } from "@/services/history.service";
import { paidText, StatsCell, td, th, when } from "./format";
import { useEnv } from "@/env/EnvContext";

export default function HistoryEnvironments() {
    const { entityId = "" } = useParams();
    const nav = useNavigate();
    const { mode } = useEnv();
    const label = mode === "live" ? "Live" : "Sandbox";
    const [rows, setRows] = useState<HistoryEnv[] | null>(null);
    const [client, setClient] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try { setRows(await historyService.environments(entityId)); }
        catch (e) { setError(e instanceof Error ? e.message : "Failed to load environments"); }
    }, [entityId]);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { entityService.get(entityId).then((c) => setClient(c.name)).catch(() => { /* name is optional */ }); }, [entityId]);

    if (error) return <ErrorBox message={error} onRetry={load} backTo="/history" />;
    if (!rows) return <LoadingBox />;

    const go = (id: string, env: "sandbox" | "live") => nav(`/history/${entityId}/${id}?env=${env}`);
    const link = "text-left font-semibold text-link hover:underline";

    return (
        <div className="flex flex-col gap-4">
            {client && <h2 className="text-base font-bold text-ink">{client}</h2>}
            <section className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="w-full overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>S.No</th>
                                <th className={th}>Environment</th>
                                <th className={th}>{label}</th><th className={th}>Paid ({label})</th>
                                <th className={th}>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={r.id} className="hover:bg-row-hover">
                                    <td className={`${td} pl-5`}>{i + 1}</td>
                                    <td className={td}><button type="button" onClick={() => go(r.id, mode)} className={link}>{r.name}</button></td>
                                    <td className={td}><button type="button" onClick={() => go(r.id, mode)} className="text-left"><StatsCell s={r[mode]} /></button></td>
                                    <td className={td}>{paidText(r[mode].paid)}</td>
                                    <td className={td}>{when(r[mode].lastAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && <EmptyState title="No environments" message="This client has no environments yet." />}
                </div>
            </section>
        </div>
    );
}