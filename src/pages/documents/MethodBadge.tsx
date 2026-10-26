const cls: Record<string, string> = {
    GET: "bg-goodbg text-good", POST: "bg-infobg text-info", PUT: "bg-warnbg text-warn",
    PATCH: "bg-warnbg text-warn", DELETE: "bg-badbg text-bad",
};

export default function MethodBadge({ m }: { m: string }) {
    return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${cls[m] ?? "bg-surfacealt text-ink"}`}>{m}</span>;
}