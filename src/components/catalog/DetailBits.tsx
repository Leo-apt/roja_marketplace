import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { Status } from "@/data/catalog";
import { btn } from "./FormBits";

export const StatusBadge = ({ status }: { status: Status | "Draft" | "Scheduled" }) => (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${status === "Active" ? "bg-goodbg text-good" : status === "Inactive" ? "bg-badbg text-bad" : "bg-warnbg text-warn"}`}>
        {status}
    </span>
);

export function DetailShell({ editTo, children }: { backTo?: string; editTo?: string; children: ReactNode }) {
    const nav = useNavigate();
    return (
        <div className="flex flex-col gap-4">
            {editTo && (
                <div className="flex justify-end">
                    <button className={btn.brand} onClick={() => nav(editTo)}><Pencil className="size-4" /> Edit</button>
                </div>
            )}
            {children}
        </div>
    );
}

export function DCard({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <section className="rounded-xl border border-line bg-white p-6">
            {title && <h3 className="mb-4 border-b border-line pb-3 text-xs font-bold uppercase tracking-wide text-ink">{title}</h3>}
            {children}
        </section>
    );
}

export const Grid = ({ children, one }: { children: ReactNode; one?: boolean }) => (
    <dl className={`grid gap-x-4 gap-y-3 text-sm ${one ? "grid-cols-[170px_1fr]" : "grid-cols-[150px_1fr] md:grid-cols-[170px_1fr_170px_1fr]"}`}>{children}</dl>
);

export const KV = ({ k, children }: { k: string; children: ReactNode }) => (
    <>
        <dt className="font-semibold text-ink">{k}</dt>
        <dd className="min-w-0 break-words text-cell-text">{children}</dd>
    </>
);

export function NotFound({ backTo }: { backTo: string }) {
    const nav = useNavigate();
    return (
        <div className="rounded-xl border border-line bg-white px-5 py-12 text-center text-muted">
            <strong className="block text-ink">Record not found</strong>
            <button className={`${btn.secondary} mt-3`} onClick={() => nav(backTo)}>Back to list</button>
        </div>
    );
}