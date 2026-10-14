import type { ReactNode } from "react";

export function Metric({ label, value, detail, cls = "" }: { label: string; value: ReactNode; detail: string; cls?: string }) {
    return (
        <div className="rounded-xl border border-line bg-white px-[18px] py-[17px] max-[1180px]:p-[15px]">
            <label className="block text-xs text-muted">{label}</label>
            <strong className={`mb-[3px] mt-1.5 block text-[28px] font-bold leading-tight tracking-[-0.8px] tabular-nums max-[1180px]:text-2xl ${cls === "negative" ? "text-bad" : ""}`}>
                {value}
            </strong>
            <small className="block text-xs text-muted">{detail}</small>
        </div>
    );
}

export function Cards({ children }: { children: ReactNode }) {
    return (
        <section aria-label="Key performance indicators" className="grid grid-cols-4 gap-3.5 max-[1180px]:gap-2.5 max-[850px]:grid-cols-2 min-[1600px]:gap-[18px]">
            {children}
        </section>
    );
}