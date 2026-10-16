import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/hooks/useApp";
import Tabs from "./Tabs";

interface Props {
    title: ReactNode;
    kicker: ReactNode;
    tabs?: [string, string][];
    tab?: string;
    onTab?: (k: string) => void;
    children: ReactNode;
    /** Pass a function to get a `close` that animates out before closing. */
    footer?: ReactNode | ((close: () => void, tryClose: () => void) => ReactNode);
    /** Return false to block closing */
    onBeforeClose?: () => boolean;
    /** Any CSS width. Default keeps the old size. */
    width?: string;
    hideNote?: boolean;
}

const DURATION = 500;

export default function Drawer({
    title, kicker, tabs, tab, onTab, children, footer, onBeforeClose,
    width = "min(930px, calc(100vw - 20px))", hideNote = false,
}: Props) {
    const { closeLayers } = useApp();
    const [shown, setShown] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => {
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
        return () => {
            cancelAnimationFrame(r1);
            cancelAnimationFrame(r2);
            window.clearTimeout(timer.current);
        };
    }, []);

    const close = () => {
        setShown(false);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(closeLayers, DURATION);
    };


    const attemptClose = () => {
        if (onBeforeClose && !onBeforeClose()) return;
        close();
    };
    const attemptRef = useRef(attemptClose);
    attemptRef.current = attemptClose;
    const guarded = !!onBeforeClose;

    useEffect(() => {
        if (!guarded) return;
        const h = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            if (document.querySelector('[role="alertdialog"]')) return;
            attemptRef.current();
        };
        document.addEventListener("keydown", h, true);
        return () => document.removeEventListener("keydown", h, true);
    }, [guarded]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-overlay/40 backdrop-blur-[2px] transition-opacity duration-500 ease-out print:hidden ${shown ? "opacity-100" : "opacity-0"}`}
                onClick={attemptClose}
            />
            <aside
                role="dialog"
                aria-modal="true"
                style={{ width }}
                className={`fixed inset-y-0 right-0 z-[41] flex max-w-[100vw] flex-col bg-white shadow-[-15px_0_60px_#071c342b] transition-transform duration-500 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}
            >
                <>
                    <div className="flex items-center justify-between gap-2.5 bg-sidebar-bg px-[26px] py-[18px] max-[850px]:p-[18px]">
                        <h2 className="text-[21px] font-bold tracking-[-0.25px] text-sidebar-text-active">{title}</h2>
                        <button
                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-sidebar-border px-3 py-[7px] font-semibold text-sidebar-text-active hover:bg-sidebar-hover"
                            onClick={attemptClose}
                            aria-label="Close details"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex flex-col gap-0.5 border-b border-line bg-surfacesoft px-[26px] py-3 max-[850px]:px-[18px]">
                        <small className="text-xs text-muted">{kicker}</small>
                        {!hideNote && <span className="text-xs text-muted">Presentation sample · no production mutation</span>}
                    </div>
                </>
                {tabs && <Tabs tabs={tabs} value={tab ?? ""} onChange={(k) => onTab?.(k)} label="Detail sections" />}
                <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[26px] py-[22px] max-[850px]:p-[18px]">{children}</div>
                <div className="flex justify-end gap-2 border-t border-line bg-surfacesoft px-[26px] py-[15px] max-[850px]:flex-wrap max-[850px]:px-[18px] max-[850px]:py-3">
                    {footer ? (
                        typeof footer === "function" ? footer(close, attemptClose) : footer
                    ) : (
                        <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={close}
                        >
                            Close
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}