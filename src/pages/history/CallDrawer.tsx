// Side drawer for one API call: a plain-English summary, the request, and the response (collapsible).
import { useEffect, useState } from "react";
import Drawer from "@/components/shared/Drawer";
import { historyService, type HistoryDetail } from "@/services/history.service";
import { CallStatus, money, when } from "./format";

const words = (a: string) => { const s = a.replace(/-/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };
const json = (v: unknown) => JSON.stringify(v, null, 2);

export default function CallDrawer({ id }: { id: string }) {
    const [d, setD] = useState<HistoryDetail | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        historyService.get(id)
            .then((r) => { if (live) setD(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    const summary = d
        ? `${words(d.action)}${d.amount != null ? ` of ${money(d.amount, d.currency)}` : ""} ${d.status === "success" ? "succeeded" : "failed"} on ${when(d.createdAt)}`
        : "";

    return (
        <Drawer title="Call details" kicker={d ? `${d.environment} · ${d.action}` : "API call"} width="min(720px, calc(100vw - 20px))">
            {error && <p className="text-sm text-bad" role="alert">{error}</p>}
            {!d && !error && <p className="text-sm text-muted">Loading…</p>}
            {d && (
                <>
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surfacealt p-4">
                        <CallStatus status={d.status} />
                        <p className="text-sm font-semibold text-ink">{summary}</p>
                    </div>
                    {d.status === "failed" && d.errorMessage && (
                        <p className="rounded-md bg-badbg px-3 py-2 text-sm text-bad">{d.errorMessage}{d.statusCode ? ` (${d.statusCode})` : ""}</p>
                    )}
                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        {[["Object id", d.stripeObjectId], ["Customer", d.customerId], ["Type", d.entityType]].map(([k, v]) => (
                            <div key={k}><dt className="font-semibold text-muted">{k}</dt><dd className="mt-0.5 break-all text-ink">{v || "-"}</dd></div>
                        ))}
                    </dl>
                    <div>
                        <h3 className="mb-1.5 text-sm font-bold text-ink">Request</h3>
                        <pre className="thin-scrollbar max-h-72 overflow-auto rounded-lg border border-line bg-surfacealt p-3 text-xs text-ink">{json(d.requestBody)}</pre>
                    </div>
                    <details className="rounded-lg border border-line">
                        <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-ink">Response</summary>
                        <pre className="thin-scrollbar max-h-96 overflow-auto border-t border-line bg-surfacealt p-3 text-xs text-ink">{json(d.responseBody)}</pre>
                    </details>
                </>
            )}
        </Drawer>
    );
}