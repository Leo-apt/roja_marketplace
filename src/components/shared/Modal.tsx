import type { ReactNode } from "react";
import { useApp } from "@/hooks/useApp";

export default function Modal({ title, children, footer, error }: { title: string; children: ReactNode; footer?: ReactNode; error?: string }) {
    const { closeDialog } = useApp();
    return (
        <section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed left-1/2 top-1/2 z-[45] max-h-[90vh] w-[min(600px,calc(100vw-28px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[14px] bg-white shadow-[0_10px_32px_#132d4710]"
        >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <h2 className="text-lg font-bold tracking-[-0.25px]">{title}</h2>
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={closeDialog}
                    aria-label="Close dialog"
                >
                    ×
                </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-[22px]">
                {children}
                <div className="text-xs text-bad" role="alert">{error}</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-6 py-[15px]">
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={closeDialog}
                >
                    Cancel
                </button>
                {footer}
            </div>
        </section>
    );
}