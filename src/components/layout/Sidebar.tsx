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
import logo from "@/assets/roja-logo.png";
import logoIcon from "@/assets/roja-logo.png";

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

// Menu items to hide. Add or remove keys here to show or hide them.
const HIDDEN: ViewKey[] = ["margins"];
const visibleGroups = displayGroups
  .map((g) => ({ ...g, items: g.items.filter((k) => !HIDDEN.includes(k)) }))
  .filter((g) => g.items.length > 0);

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

/*
  Alignment grid (all columns share the same 12px gutter + 8px item padding):
    sidebar padding ........ 12px  (px-3)
    item / header padding .. 8px   (px-2)  -> icon tile and group label start at x = 20px
    icon tile .............. 32px  (size-8) -> centre at x = 36px (collapsed: centre of the 80px rail)
    icon-to-label gap ...... 12px  (gap-3)  -> label starts at x = 64px
  The footer button uses the same numbers (1px border + 7px padding = 8px).
*/

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
    const g = visibleGroups.find((grp) =>
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

  /* ---- tooltip helpers (hover intent: small open delay, instant when moving between items) ---- */
  const tipTimer = useRef<number | undefined>(undefined);
  const tipVisible = useRef(false);

  useEffect(() => () => window.clearTimeout(tipTimer.current), []);

  const showTip = (e: React.SyntheticEvent<HTMLElement>, label: string) => {
    const el = e.currentTarget;
    if (!collapsed) {
      // expanded: show the tooltip only if the label is cut off ("...")
      const text = el.querySelector<HTMLElement>("[data-label]");
      if (!text || text.scrollWidth <= text.clientWidth) return;
    }
    const r = el.getBoundingClientRect();
    const next: Tip = { label, top: r.top + r.height / 2, left: r.right + 12 };
    window.clearTimeout(tipTimer.current);
    if (tipVisible.current) {
      setTip(next);
    } else {
      tipTimer.current = window.setTimeout(() => {
        tipVisible.current = true;
        setTip(next);
      }, 110);
    }
  };
  const hideTip = (now = false) => {
    window.clearTimeout(tipTimer.current);
    const close = () => {
      tipVisible.current = false;
      setTip(null);
    };
    if (now) close();
    else tipTimer.current = window.setTimeout(close, 80);
  };

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

  // running index so items can fade in one after another on first load
  let itemIndex = 0;

  return (
    <>
      <style>{`
                @keyframes sb-tip-in {
                    from { opacity: 0; translate: -4px -50%; }
                    to   { opacity: 1; translate: 0 -50%; }
                }
                @keyframes sb-underline-in {
                    from { transform: scaleX(0); opacity: 0; }
                    to   { transform: scaleX(1); opacity: 1; }
                }
                @keyframes sb-item-in {
                    from { opacity: 0; translate: -8px 0; }
                    to   { opacity: 1; translate: 0 0; }
                }
                .sb-tip { animation: sb-tip-in 150ms ease-out both; }
                /* the orchestrated moment: the logo underline draws in, then the menu items follow */
                .sb-underline { animation: sb-underline-in 700ms 150ms cubic-bezier(.2,.8,.2,1) both; }
                .sb-item { animation: sb-item-in 360ms cubic-bezier(.2,.8,.2,1) backwards; }
                @media (prefers-reduced-motion: reduce) {
                    .sb-tip, .sb-underline, .sb-item { animation: none; }
                    .sb-root * { transition-duration: 0.01ms !important; }
                }
            `}</style>

      <aside
        aria-label="Marketplace navigation"
        className={`sb-root fixed inset-y-0 left-0 z-[15] flex w-[250px] flex-col overflow-x-hidden border-r border-sidebar-border bg-sidebar-bg px-3 pb-4 pt-0 text-sidebar-text shadow-[2px_0_12px_rgba(15,23,42,0.04)] transition-[width,transform] duration-[380ms] ease-smooth max-[850px]:-translate-x-full print:hidden ${
          collapsed ? "min-[851px]:w-20" : "max-[1180px]:w-[220px]"
        } ${open ? "max-[850px]:translate-x-0" : ""}`}
      >
        {/* ───────── Logo header with underline ───────── */}
        <header className="relative h-[var(--topbar-h,76px)] shrink-0">
          <div className="absolute inset-x-0 bottom-px top-0 flex items-center justify-center">
            {/* full logo */}
            <img
              src={logo}
              alt="Roja Marketplace"
              className={`absolute inset-0 m-auto h-12 w-auto max-w-[85%] object-contain transition-opacity duration-300 ease-smooth ${
                collapsed
                  ? "min-[851px]:pointer-events-none min-[851px]:opacity-0"
                  : "opacity-100"
              }`}
            />
            {/* icon logo (collapsed) */}
            <img
              src={logoIcon}
              alt="Roja"
              className={`absolute inset-0 m-auto size-10 object-contain opacity-0 transition-opacity duration-300 ease-smooth ${
                collapsed ? "min-[851px]:opacity-100" : ""
              }`}
            />
          </div>

          {/* Line sits on the last pixel row of the header, the same row as the topbar's
              bottom border, and runs edge to edge so the two lines read as one. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-3 bottom-0 h-px bg-topbar-border"
          />
          {/* brand accent, centred on that line */}
          <div
            aria-hidden="true"
            className={`sb-underline pointer-events-none absolute bottom-[-1px] left-1/2 h-[3px] -translate-x-1/2 origin-center rounded-full bg-brand transition-[width] duration-[380ms] ease-smooth ${
              collapsed ? "w-6" : "w-14"
            }`}
          />
        </header>

        {/* ───────── Navigation ───────── */}
        <div className="relative mt-3 min-h-0 flex-1">
          <div
            ref={scrollRef}
            onKeyDown={onNavKeyDown}
            onScroll={() => {
              updateEdges();
              hideTip(true);
            }}
            className="thin-scrollbar h-full overflow-y-auto overflow-x-hidden"
          >
            {visibleGroups.map((g, gi) => {
              // when the sidebar is icon-only, every group stays open
              const groupOpen = collapsed || !closed.includes(g.label);
              const hasActive = g.items.some((k) =>
                isActivePath(pathname, viewInfo[k].path),
              );
              const contentId = `sb-group-${gi}`;

              return (
                <div key={g.label}>
                  {/* Group header: label starts at the same x as the icon tiles (px-2) */}
                  <button
                    type="button"
                    data-nav-item
                    tabIndex={collapsed ? -1 : 0}
                    aria-expanded={groupOpen}
                    aria-controls={contentId}
                    onClick={() => toggleGroup(g.label)}
                    className={`group/head flex w-full items-center justify-between overflow-hidden whitespace-nowrap rounded-lg px-2 pb-1.5 pt-3 text-left text-[11px] font-semibold uppercase tracking-wider text-sidebar-group outline-none transition-[max-height,opacity,padding,color] duration-[380ms] ease-smooth hover:text-sidebar-text-active focus-visible:ring-2 focus-visible:ring-brand/30 ${
                      collapsed
                        ? "pointer-events-none min-[851px]:max-h-0 min-[851px]:py-0 min-[851px]:opacity-0"
                        : "max-h-10 opacity-100"
                    }`}
                  >
                    <span>{g.label}</span>
                    <span className="flex items-center gap-1.5">
                      {/* folded group: show how many pages it holds, plus a dot if the current page is inside */}
                      {!groupOpen && (
                        <span className="flex items-center gap-1">
                          {hasActive && (
                            <span className="size-1.5 rounded-full bg-brand" />
                          )}
                          <span className="rounded-full bg-sidebar-hover px-1.5 text-[10px] font-semibold leading-4 tracking-normal text-sidebar-icon">
                            {g.items.length}
                          </span>
                        </span>
                      )}
                      <ChevronDown
                        className={`size-3.5 transition-transform duration-[380ms] ease-smooth ${
                          groupOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </span>
                  </button>

                  {/* Divider replaces the label when collapsed */}
                  {collapsed && gi > 0 && (
                    <div className="mx-2 my-2.5 hidden h-px bg-sidebar-divider min-[851px]:block" />
                  )}

                  {/* Items: height animates via grid rows (0fr to 1fr) */}
                  <div
                    id={contentId}
                    className={`grid transition-[grid-template-rows,opacity,visibility] duration-[380ms] ease-smooth ${
                      groupOpen
                        ? "visible grid-rows-[1fr] opacity-100"
                        : "invisible grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      {g.items.map((k) => {
                        const v = viewInfo[k];
                        const Icon = iconMap[k];
                        const active = isActivePath(pathname, v.path);
                        const delay = Math.min(itemIndex++ * 28, 420);
                        return (
                          <button
                            key={k}
                            type="button"
                            data-nav-item
                            style={{ animationDelay: `${delay}ms` }}
                            tabIndex={groupOpen ? 0 : -1}
                            aria-current={active ? "page" : undefined}
                            aria-label={collapsed ? v.nav : undefined}
                            onMouseEnter={(e) => showTip(e, v.nav)}
                            onMouseLeave={() => hideTip()}
                            onFocus={(e) => showTip(e, v.nav)}
                            onBlur={() => hideTip()}
                            onClick={() => {
                              hideTip(true);
                              navigate(v.path);
                              onNavigate();
                            }}
                            className={`sb-item group relative my-0.5 flex w-full items-center gap-3 overflow-hidden rounded-xl px-2 py-1.5 text-left text-[13px] font-medium outline-none transition-[background-color,color,box-shadow,scale] duration-200 ease-smooth hover:bg-sidebar-hover hover:text-sidebar-text-active focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.98] ${
                              collapsed
                                ? "min-[851px]:justify-center min-[851px]:gap-0 min-[851px]:px-0"
                                : ""
                            } ${
                              active
                                ? "bg-sidebar-active font-semibold text-sidebar-text-active ring-1 ring-inset ring-sidebar-active-border"
                                : ""
                            }`}
                          >
                            {/* Active accent bar, vertically centred on the row */}
                            <span
                              aria-hidden="true"
                              className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-[scale,opacity] duration-300 ease-smooth ${
                                active
                                  ? "scale-y-100 opacity-100"
                                  : "scale-y-0 opacity-0"
                              }`}
                            />

                            {/* Icon tile: 32px square, same column in every row */}
                            <span
                              aria-hidden="true"
                              className={`relative grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ease-smooth ${
                                active
                                  ? "bg-brand text-white shadow-sm shadow-brand/30"
                                  : "bg-sidebar-hover text-sidebar-icon group-hover:bg-card group-hover:text-brand group-hover:shadow-soft"
                              }`}
                            >
                              <Icon className="size-[17px] transition-transform duration-200 group-hover:scale-110" />
                            </span>

                            <span
                              data-label
                              className={`relative truncate transition-[max-width,opacity] ease-smooth ${
                                collapsed
                                  ? "duration-150 min-[851px]:max-w-0 min-[851px]:opacity-0"
                                  : "max-w-[194px] opacity-100 duration-300 delay-100"
                              }`}
                            >
                              {v.nav}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Line between groups (not after the last one) */}
                  {gi < visibleGroups.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`mx-2 mb-0 mt-3 h-px bg-gradient-to-r from-transparent via-sidebar-divider to-transparent ${
                        collapsed ? "min-[851px]:hidden" : ""
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Scroll fades */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-sidebar-bg to-transparent transition-opacity duration-300 ${
              edges.top ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-sidebar-bg to-transparent transition-opacity duration-300 ${
              edges.bottom ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Footer: collapse toggle (desktop only) */}
        <div className="relative hidden shrink-0 pt-3 min-[851px]:block">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sidebar-divider to-transparent" />
          {/* 1px border + 7px padding = the same 8px inset as the menu items,
              so the chevron sits in the same 32px column as every icon tile */}
          <button
            type="button"
            onClick={() => {
              hideTip(true);
              onToggle();
            }}
            onMouseEnter={(e) => showTip(e, `Expand sidebar (${shortcut})`)}
            onMouseLeave={() => hideTip()}
            title={collapsed ? undefined : `Collapse sidebar (${shortcut})`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`group flex w-full items-center rounded-xl border border-sidebar-border bg-card py-1 text-sidebar-text outline-none transition-all duration-300 ease-smooth hover:border-brand-200 hover:bg-brandsoft hover:text-sidebar-text-active hover:shadow-soft focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.98] ${
              collapsed ? "justify-center px-0" : "justify-between px-[7px]"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center">
                <ChevronLeft
                  className={`size-[18px] transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5 ${
                    collapsed ? "rotate-180 group-hover:translate-x-0.5" : ""
                  }`}
                />
              </span>
              <span
                className={`overflow-hidden whitespace-nowrap text-xs font-semibold transition-[max-width,opacity] ease-smooth ${
                  collapsed
                    ? "max-w-0 opacity-0 duration-150"
                    : "max-w-[100px] opacity-100 duration-300 delay-100"
                }`}
              >
                Collapse
              </span>
            </span>
            <kbd
              className={`overflow-hidden whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 font-sans text-[10px] font-semibold text-sidebar-icon transition-all duration-300 ${
                collapsed ? "hidden" : ""
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
            className="sb-tip pointer-events-none fixed z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-tooltip px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-pop min-[851px]:block"
          >
            <span
              aria-hidden="true"
              className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-tooltip"
            />
            <span className="relative">{tip.label}</span>
          </div>,
          document.body,
        )}
    </>
  );
}
