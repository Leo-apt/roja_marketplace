import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { Status } from "@/data/catalog";
import { btn } from "./FormBits";

export const StatusBadge = ({ status }: { status: Status | "Draft" | "Scheduled" }) => (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${status === "Active" ? "bg-goodbg text-good" : status === "Inactive" ? "bg-badbg text-bad" : "bg-warnbg text-warn"}`}>
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
export function DetailHeader({ title, subtitle, status, highlight, editTo, children }: {
    title: ReactNode; subtitle?: ReactNode; status?: Status | "Draft" | "Scheduled";
    highlight?: { label: string; value: ReactNode }; editTo?: string; children?: ReactNode;
}) {
    const nav = useNavigate();
    return (
        <section className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brandsoft px-6 py-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-bold text-ink">{title}</h2>
                        {status && <StatusBadge status={status} />}
                    </div>
                    {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-5">
                    {highlight && (
                        <div className="text-right">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{highlight.label}</div>
                            <div className="text-xl font-bold text-brand">{highlight.value}</div>
                        </div>
                    )}
                    {editTo && (
                        <button className={btn.brand} onClick={() => nav(editTo)}><Pencil className="size-4" /> Edit</button>
                    )}
                </div>
            </div>
            {children && <div className="p-6">{children}</div>}
        </section>
    );
}

export const DSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="rounded-xl border border-line bg-white">
        <h3 className="border-b border-line px-6 py-4 text-xs font-bold uppercase tracking-wide text-ink">{title}</h3>
        <div className="p-6">{children}</div>
    </section>
);

export const DTiles = ({ children, four }: { children: ReactNode; four?: boolean }) => (
    <dl className={`grid gap-3 sm:grid-cols-2 ${four ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>{children}</dl>
);

export const DTile = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="min-w-0 rounded-lg border border-line bg-surfacealt px-4 py-3">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="mt-1 break-words text-sm font-semibold text-ink">{children}</dd>
    </div>
);

export const DRows = ({ children }: { children: ReactNode }) => <dl>{children}</dl>;

export const DRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="grid gap-1 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[190px_1fr] md:gap-4">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        <dd className="min-w-0 break-words text-sm text-cell-text">{children}</dd>
    </div>
);