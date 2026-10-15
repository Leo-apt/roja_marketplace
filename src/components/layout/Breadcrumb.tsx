import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    Home,
    ArrowLeft,
    ChevronRight,
    LayoutDashboard,
    PackageSearch,
    Receipt,
    Repeat,
    TrendingUp,
    ArrowLeftRight,
    Scale,
    FolderTree,
    Layers,
    Package,
    BadgePercent,
    Server,
    SlidersHorizontal,
} from "lucide-react";
import { viewInfo, type ViewKey } from "@/utils/views";
import { displayGroups } from "@/utils/navGroups";

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

type SubLabel = "Create" | "Edit" | "Details";

const subStyles: Record<SubLabel, string> = {
    Create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Edit: "bg-amber-50 text-amber-700 ring-amber-200",
    Details: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function Breadcrumb() {
    const { pathname } = useLocation();
    const nav = useNavigate();
    const key = (Object.keys(viewInfo) as ViewKey[]).find(
        (k) => pathname === viewInfo[k].path || pathname.startsWith(viewInfo[k].path + "/"),
    );
    if (!key) return null;

    const v = viewInfo[key];
    const group = displayGroups.find((g) => g.items.includes(key));
    const PageIcon = iconMap[key];
    const rest = pathname.slice(v.path.length);
    const sub: SubLabel | null =
        rest === "" ? null : rest === "/new" ? "Create" : rest.endsWith("/edit") ? "Edit" : "Details";

    return (
        <div className="crumb-root relative z-[25] rounded-2xl border border-crumb-border bg-crumb-bg/70 px-4 py-2.5 shadow-sm backdrop-blur-xl transition-all duration-300">
            {/* Local keyframes so no tailwind.config change is needed */}
            <style>{`
                @keyframes crumb-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .crumb-anim { animation: crumb-in 350ms ease-out both; }
                @media (prefers-reduced-motion: reduce) {
                    .crumb-anim { animation: none; }
                    .crumb-root * { transition-duration: 0.01ms !important; }
                }
            `}</style>

            {/* subtle brand hairline along the bottom edge */}
            <div className="pointer-events-none absolute inset-x-6 -bottom-px h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

            {/* key forces the entrance animation to replay on every route change */}
            <div
                key={pathname}
                className="crumb-anim flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
            >
                {/* Title section */}
                <div className="flex min-w-0 items-center gap-2.5">
                    {sub && (
                        <button
                            type="button"
                            title="Back"
                            aria-label="Back to list"
                            onClick={() => nav(v.path)}
                            className="group grid size-9 shrink-0 place-items-center rounded-xl border border-gray-200/80 bg-white text-ink shadow-sm outline-none transition-all duration-200 hover:-translate-y-px hover:border-gray-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/30 active:translate-y-0 active:scale-95"
                        >
                            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        </button>
                    )}
                    <div className="rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 p-2 text-brand shadow-2xs ring-1 ring-brand/20">
                        <PageIcon className="size-[18px]" />
                    </div>
                    <h1 className="truncate text-base font-bold tracking-tight text-crumb-title sm:text-lg">
                        {v.title}
                    </h1>
                    <span className="hidden truncate text-xs text-crumb-text lg:inline sm:text-sm">
                        - {v.subtitle}
                    </span>
                </div>

                {/* Breadcrumb links */}
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                    <NavLink
                        to="/catalog/product-categories"
                        className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-crumb-text outline-none transition-all duration-200 hover:-translate-y-px hover:bg-crumb-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30 active:translate-y-0 active:scale-95"
                    >
                        <Home className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
                        <span className="hidden sm:inline">Home</span>
                    </NavLink>

                    {group && (
                        <div className="flex items-center gap-1.5">
                            <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
                            <span className="rounded-lg px-2 py-1 text-crumb-text">{group.label}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5">
                        <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
                        {sub ? (
                            <NavLink
                                to={v.path}
                                className="rounded-lg px-2.5 py-1 text-crumb-text outline-none transition-all duration-200 hover:bg-crumb-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                            >
                                {v.nav}
                            </NavLink>
                        ) : (
                            <span
                                aria-current="page"
                                className="rounded-lg bg-brand/10 px-2.5 py-1 font-semibold text-brand shadow-2xs ring-1 ring-brand/20"
                            >
                                {v.nav}
                            </span>
                        )}
                    </div>

                    {sub && (
                        <div className="flex items-center gap-1.5">
                            <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
                            <span
                                aria-current="page"
                                className={`rounded-lg px-2.5 py-1 font-semibold ring-1 ${subStyles[sub]}`}
                            >
                                {sub}
                            </span>
                        </div>
                    )}
                </nav>
            </div>
        </div>
    );
}