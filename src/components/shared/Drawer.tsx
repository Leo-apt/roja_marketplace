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
    footer?: ReactNode | ((close: () => void) => ReactNode);
    /** Any CSS width. Default keeps the old size. */
    width?: string;
}

const DURATION = 500;

export default function Drawer({
    title, kicker, tabs, tab, onTab, children, footer,
    width = "min(930px, calc(100vw - 20px))",
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

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-[#10243f]/40 backdrop-blur-[2px] transition-opacity duration-500 ease-out print:hidden ${shown ? "opacity-100" : "opacity-0"}`}
                onClick={close}
            />
            <aside
                role="dialog"
                aria-modal="true"
                style={{ width }}
                className={`fixed inset-y-0 right-0 z-[41] flex max-w-[100vw] flex-col bg-white shadow-[-15px_0_60px_#071c342b] transition-transform duration-500 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex items-start justify-between gap-2.5 border-b border-line px-[26px] py-[22px] max-[850px]:p-[18px]">
                    <div>
                        <small className="text-xs text-muted">{kicker}</small>
                        <h2 className="my-1 text-[21px] font-bold tracking-[-0.25px]">{title}</h2>
                        <span className="text-xs text-muted">Presentation sample · no production mutation</span>
                    </div>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={close}
                        aria-label="Close details"
                    >
                        ×
                    </button>
                </div>
                {tabs && <Tabs tabs={tabs} value={tab ?? ""} onChange={(k) => onTab?.(k)} label="Detail sections" />}
                <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[26px] py-[22px] max-[850px]:p-[18px]">{children}</div>
                <div className="flex justify-end gap-2 border-t border-line bg-[#f9fafc] px-[26px] py-[15px] max-[850px]:flex-wrap max-[850px]:px-[18px] max-[850px]:py-3">
                    {footer ? (
                        typeof footer === "function" ? footer(close) : footer
                    ) : (
                        <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
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