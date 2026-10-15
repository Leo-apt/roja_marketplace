import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeftRight,
    BadgePercent,
    ChevronDown,
    ChevronLeft,
    FolderTree,
    Layers,
    LayoutDashboard,
    Package,
    PackageSearch,
    Receipt,
    Repeat,
    Scale,
    Server,
    SlidersHorizontal,
    TrendingUp,
} from "lucide-react";
import { viewInfo, type ViewKey } from "@/utils/views";
import { displayGroups } from "@/utils/navGroups";
import logo from "@/assets/logo.png";
import logoIcon from "@/assets/logo-icon.png";

const iconMap: Record<ViewKey, React.ComponentType<{ className?: string }>> = {
    overview: LayoutDashboard,
    products: PackageSearch,
    purchases: Receipt,
    subscriptions: Repeat,
    margin: TrendingUp,
    settlements: ArrowLeftRight,
    reconciliation: Scale,
    productCategories: FolderTree,
    bundles: Layers,
    catalogProducts: Package,
    margins: BadgePercent,
    instances: Server,
    engineConfig: SlidersHorizontal,
};

type Tip = { label: string; top: number; left: number };

const CLOSED_KEY = "sidebar-closed-groups";

function loadClosed(): string[] {
    try {
        const raw = localStorage.getItem(CLOSED_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
            ? parsed.filter((x) => typeof x === "string")
            : [];
    } catch {
        return [];
    }
}

function saveClosed(list: string[]) {
    try {
        localStorage.setItem(CLOSED_KEY, JSON.stringify(list));
    } catch {
        /* storage unavailable, ignore */
    }
}

const isActivePath = (pathname: string, path: string) =>
    pathname === path || pathname.startsWith(path + "/");

export default function Sidebar({
    open,
    onNavigate,
    collapsed,
    onToggle,
}: {
    open: boolean;
    onNavigate: () => void;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const [tip, setTip] = useState<Tip | null>(null);
    const [edges, setEdges] = useState({ top: false, bottom: false });
    const [closed, setClosed] = useState<string[]>(loadClosed);
    const scrollRef = useRef<HTMLDivElement>(null);

    const shortcut = useMemo(
        () =>
            typeof navigator !== "undefined" &&
                /Mac|iPhone|iPad/i.test(navigator.platform)
                ? "⌘B"
                : "Ctrl B",
        [],
    );

    /* ---- group folding ---- */
    const toggleGroup = (label: string) =>
        setClosed((prev) => {
            const next = prev.includes(label)
                ? prev.filter((l) => l !== label)
                : [...prev, label];
            saveClosed(next);
            return next;
        });

    // Navigating to a page re-opens the group that contains it
    useEffect(() => {
        const g = displayGroups.find((grp) =>
            grp.items.some((k) => isActivePath(pathname, viewInfo[k].path)),
        );
        if (g && closed.includes(g.label)) {
            setClosed((prev) => {
                const next = prev.filter((l) => l !== g.label);
                saveClosed(next);
                return next;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    /* ---- Ctrl/Cmd + B toggles the sidebar ---- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                const t = e.target as HTMLElement | null;
                if (t?.isContentEditable) return;
                e.preventDefault();
                onToggle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onToggle]);

    /* ---- show scroll fades only when there is more to scroll ---- */
    const updateEdges = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setEdges({
            top: el.scrollTop > 4,
            bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
        });
    }, []);

    useEffect(() => {
        updateEdges();
        window.addEventListener("resize", updateEdges);
        return () => window.removeEventListener("resize", updateEdges);
    }, [updateEdges, collapsed]);

    // fades must also update while a group animates open or closed
    useEffect(() => {
        const id = window.setTimeout(updateEdges, 320);
        return () => window.clearTimeout(id);
    }, [closed, updateEdges]);

    /* ---- tooltip helpers (only used when collapsed) ---- */
    const showTip = (e: React.SyntheticEvent<HTMLElement>, label: string) => {
        const el = e.currentTarget;
        if (!collapsed) {
            // expanded: show the tooltip only if the label is cut off ("...")
            const text = el.querySelector<HTMLElement>("[data-label]");
            if (!text || text.scrollWidth <= text.clientWidth) return;
        }
        const r = el.getBoundingClientRect();
        setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
    };
    const hideTip = () => setTip(null);

    /* ---- arrow-key navigation between headers and items ---- */
    const onNavKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
        const root = scrollRef.current;
        if (!root) return;
        const list = Array.from(
            root.querySelectorAll<HTMLElement>("[data-nav-item]"),
        ).filter((el) => el.tabIndex >= 0);
        if (!list.length) return;
        const i = list.indexOf(document.activeElement as HTMLElement);
        let next = i;
        if (e.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % list.length;
        if (e.key === "ArrowUp")
            next = i < 0 ? list.length - 1 : (i - 1 + list.length) % list.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = list.length - 1;
        e.preventDefault();
        list[next]?.focus();
    };

    // running index for the staggered entrance
    let n = 0;

    return (
        <>
            {/* Local keyframes so no tailwind.config change is needed */}
            <style>{`
                @keyframes sb-item-in {
                    from { opacity: 0; transform: translateX(-8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes sb-tip-in {
                    from { opacity: 0; transform: translate(-4px, -50%); }
                    to   { opacity: 1; transform: translate(0, -50%); }
                }
                .sb-item { animation: sb-item-in 350ms ease-out both; }
                .sb-tip  { animation: sb-tip-in 150ms ease-out both; }
                .sb-spot {
                    background: radial-gradient(
                        110px circle at var(--mx, 50%) var(--my, 50%),
                        color-mix(in srgb, var(--color-brand, #059669) 12%, transparent),
                        transparent 70%
                    );
                }
                @media (prefers-reduced-motion: reduce) {
                    .sb-item, .sb-tip { animation: none; }
                    .sb-root * { transition-duration: 0.01ms !important; }
                }
            `}</style>

            <aside
                aria-label="Marketplace navigation"
                className={`sb-root fixed inset-y-0 left-0 z-[15] flex w-[226px] flex-col overflow-x-hidden border-r border-sidebar-border bg-sidebar-bg px-4 py-6 text-sidebar-text shadow-[2px_0_8px_rgba(15,23,42,0.04)] transition-[width,transform] duration-300 ease-in-out max-[850px]:-translate-x-full print:hidden ${collapsed ? "min-[851px]:w-20" : "max-[1180px]:w-[198px]"
                    } ${open ? "max-[850px]:translate-x-0" : ""}`}
            >
                {/* Logo */}
                <div
                    className={`relative mt-1 shrink-0 transition-all duration-300 ${collapsed
                        ? "mb-5 h-14 min-[851px]:mb-4 min-[851px]:h-12"
                        : "mb-5 h-14"
                        }`}
                >
                    <div className="pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-2xl" />
                    <img
                        src={logo}
                        alt="Roja Marketplace"
                        className={`absolute inset-0 m-auto h-14 w-auto max-w-full object-contain transition-opacity duration-300 ${collapsed
                            ? "min-[851px]:pointer-events-none min-[851px]:opacity-0"
                            : "opacity-100"
                            }`}
                    />
                    <img
                        src={logoIcon}
                        alt="Roja"
                        className={`absolute inset-0 m-auto size-12 object-contain opacity-0 transition-opacity duration-300 ${collapsed ? "min-[851px]:opacity-100" : ""
                            }`}
                    />
                </div>

                {/* Navigation */}
                <div className="relative min-h-0 flex-1">
                    <div
                        ref={scrollRef}
                        onKeyDown={onNavKeyDown}
                        onScroll={() => {
                            updateEdges();
                            hideTip();
                        }}
                        className="thin-scrollbar h-full overflow-y-auto overflow-x-hidden"
                    >
                        {displayGroups.map((g, gi) => {
                            // when the sidebar is icon-only, every group stays open
                            const groupOpen = collapsed || !closed.includes(g.label);
                            const hasActive = g.items.some((k) =>
                                isActivePath(pathname, viewInfo[k].path),
                            );
                            const contentId = `sb-group-${gi}`;

                            return (
                                <div key={g.label}>
                                    {/* Group header (expanded sidebar) */}
                                    <button
                                        type="button"
                                        data-nav-item
                                        tabIndex={collapsed ? -1 : 0}
                                        aria-expanded={groupOpen}
                                        aria-controls={contentId}
                                        onClick={() => toggleGroup(g.label)}
                                        className={`group/head flex w-full items-center justify-between overflow-hidden whitespace-nowrap rounded-lg px-3 pb-[9px] pt-3.5 text-left text-[10px] font-semibold uppercase tracking-[1.6px] text-sidebar-group outline-none transition-all duration-300 hover:text-sidebar-text-active focus-visible:ring-2 focus-visible:ring-brand/40 ${collapsed
                                            ? "pointer-events-none min-[851px]:max-h-0 min-[851px]:py-0 min-[851px]:opacity-0"
                                            : "max-h-10 opacity-100"
                                            }`}
                                    >
                                        <span>{g.label}</span>
                                        <span className="flex items-center gap-1.5">
                                            {/* count, or a dot when a folded group holds the current page */}
                                            <span
                                                className={`rounded-full text-[10px] font-semibold normal-case tracking-normal transition-all duration-300 ${!groupOpen && hasActive
                                                    ? "size-1.5 bg-brand"
                                                    : groupOpen
                                                        ? "opacity-0"
                                                        : "px-1.5 opacity-70"
                                                    }`}
                                            >
                                                {!groupOpen && hasActive ? "" : g.items.length}
                                            </span>
                                            <ChevronDown
                                                className={`size-3.5 transition-transform duration-300 ease-out ${groupOpen ? "" : "-rotate-90"
                                                    }`}
                                            />
                                        </span>
                                    </button>

                                    {/* Divider replaces the label when collapsed */}
                                    {collapsed && gi > 0 && (
                                        <div className="mx-3 my-2 hidden h-px bg-sidebar-divider min-[851px]:block" />
                                    )}

                                    {/* Items: height animates via grid rows (0fr to 1fr) */}
                                    <div
                                        id={contentId}
                                        className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out ${groupOpen
                                            ? "visible grid-rows-[1fr] opacity-100"
                                            : "invisible grid-rows-[0fr] opacity-0"
                                            }`}
                                    >
                                        <div className="min-h-0 overflow-hidden">
                                            {g.items.map((k) => {
                                                const v = viewInfo[k];
                                                const Icon = iconMap[k];
                                                const active = isActivePath(pathname, v.path);
                                                const idx = n++;
                                                return (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        data-nav-item
                                                        tabIndex={groupOpen ? 0 : -1}
                                                        aria-current={active ? "page" : undefined}
                                                        aria-label={collapsed ? v.nav : undefined}
                                                        style={{ animationDelay: `${idx * 30}ms` }}
                                                        onMouseEnter={(e) => showTip(e, v.nav)}
                                                        onMouseLeave={hideTip}
                                                        onMouseMove={(e) => {
                                                            const r = e.currentTarget.getBoundingClientRect();
                                                            e.currentTarget.style.setProperty(
                                                                "--mx",
                                                                `${e.clientX - r.left}px`,
                                                            );
                                                            e.currentTarget.style.setProperty(
                                                                "--my",
                                                                `${e.clientY - r.top}px`,
                                                            );
                                                        }}
                                                        onFocus={(e) => showTip(e, v.nav)}
                                                        onBlur={hideTip}
                                                        onClick={() => {
                                                            hideTip();
                                                            navigate(v.path);
                                                            onNavigate();
                                                        }}
                                                        className={`sb-item group relative my-0.5 flex w-full items-center gap-3 overflow-hidden rounded-xl border px-2 py-1.5 text-left text-[13px] outline-none transition-all duration-300 hover:bg-sidebar-hover hover:text-sidebar-text-active focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.98] ${collapsed
                                                            ? "min-[851px]:justify-center min-[851px]:gap-0 min-[851px]:px-0"
                                                            : ""
                                                            } ${active
                                                                ? "border-sidebar-active-border bg-sidebar-active font-semibold text-sidebar-text-active shadow-sm"
                                                                : "border-transparent"
                                                            }`}
                                                    >
                                                        {/* Cursor spotlight */}
                                                        <span
                                                            aria-hidden="true"
                                                            className="sb-spot pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                                        />

                                                        {/* Active accent bar */}
                                                        <span
                                                            aria-hidden="true"
                                                            className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-all duration-300 ${active
                                                                ? "scale-y-100 opacity-100"
                                                                : "scale-y-0 opacity-0"
                                                                }`}
                                                        />

                                                        {/* Icon tile */}
                                                        <span
                                                            aria-hidden="true"
                                                            className={`relative grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-300 ${active
                                                                ? "bg-brand text-white shadow-sm"
                                                                : "bg-emerald-900/5 text-sidebar-icon group-hover:bg-white group-hover:text-brand"
                                                                }`}
                                                        >
                                                            <Icon className="size-[17px] transition-transform duration-300 group-hover:scale-110" />
                                                        </span>

                                                        <span
                                                            data-label
                                                            className={`relative truncate transition-all duration-300 ${collapsed
                                                                ? "min-[851px]:max-w-0 min-[851px]:opacity-0"
                                                                : "max-w-[170px] opacity-100"
                                                                }`}
                                                        >
                                                            {v.nav}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bottom line under every group (collapsed desktop already
                      shows a divider above each group, so hide it there) */}
                                    <div
                                        aria-hidden="true"
                                        className={`mx-3 mb-1 mt-2 h-px bg-gradient-to-r from-transparent via-sidebar-divider to-transparent ${collapsed ? "min-[851px]:hidden" : ""
                                            }`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Scroll fades */}
                    <div
                        className={`pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-sidebar-bg to-transparent transition-opacity duration-300 ${edges.top ? "opacity-100" : "opacity-0"
                            }`}
                    />
                    <div
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-sidebar-bg to-transparent transition-opacity duration-300 ${edges.bottom ? "opacity-100" : "opacity-0"
                            }`}
                    />
                </div>

                {/* Footer: collapse toggle (desktop only) */}
                <div className="relative hidden shrink-0 pt-3 min-[851px]:block">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sidebar-divider to-transparent" />
                    <button
                        type="button"
                        onClick={() => {
                            hideTip();
                            onToggle();
                        }}
                        onMouseEnter={(e) => showTip(e, `Expand sidebar (${shortcut})`)}
                        onMouseLeave={hideTip}
                        title={collapsed ? undefined : `Collapse sidebar (${shortcut})`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className={`group flex w-full items-center rounded-xl border border-sidebar-border bg-white py-2 text-sidebar-text outline-none transition-all duration-300 hover:border-emerald-200 hover:bg-white hover:text-sidebar-text-active hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-95 ${collapsed ? "justify-center px-0" : "justify-between px-3"
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <ChevronLeft
                                className={`size-5 transition-transform duration-300 group-hover:-translate-x-0.5 ${collapsed ? "rotate-180 group-hover:translate-x-0.5" : ""
                                    }`}
                            />
                            <span
                                className={`overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-300 ${collapsed ? "max-w-0 opacity-0" : "max-w-[100px] opacity-100"
                                    }`}
                            >
                                Collapse
                            </span>
                        </span>
                        <kbd
                            className={`overflow-hidden whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 font-sans text-[10px] font-semibold text-sidebar-icon transition-all duration-300 ${collapsed ? "hidden" : ""
                                }`}
                        >
                            {shortcut}
                        </kbd>
                    </button>
                </div>
            </aside>

            {/* Tooltip is portaled out so the sidebar's overflow can't clip it */}
            {tip &&
                createPortal(
                    <div
                        role="tooltip"
                        style={{ top: tip.top, left: tip.left }}
                        className="sb-tip pointer-events-none fixed z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg ring-1 ring-black/10 min-[851px]:block"
                    >
                        {tip.label}
                    </div>,
                    document.body,
                )}
        </>
    );
}
