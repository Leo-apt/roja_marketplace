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
    BadgePercent, Server,
    SlidersHorizontal,
} from "lucide-react";
import { navGroups, viewInfo, type ViewKey } from "@/utils/views";

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

export default function Breadcrumb() {
    const { pathname } = useLocation();
    const nav = useNavigate();
    const key = (Object.keys(viewInfo) as ViewKey[]).find(
        (k) => pathname === viewInfo[k].path || pathname.startsWith(viewInfo[k].path + "/"),
    );
    if (!key) return null;

    const v = viewInfo[key];
    const group = navGroups.find((g) => g.items.includes(key));
    const PageIcon = iconMap[key];
    const rest = pathname.slice(v.path.length);
    const sub = rest === "" ? null : rest === "/new" ? "Create" : rest.endsWith("/edit") ? "Edit" : "Details";

    return (
        <div className="relative z-[25] rounded-2xl border border-crumb-border bg-crumb-bg/80  px-4 py-2 shadow-xs backdrop-blur-md transition-all duration-300">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                {/* Title section */}
                <div className="flex items-center gap-2.5">
                    {sub === "Details" && (
                        <button type="button" title="Back" aria-label="Back to list" onClick={() => nav(v.path)}
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg">
                            <ArrowLeft className="size-4" />
                        </button>
                    )}
                    <div className="rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 p-2 text-brand shadow-2xs ring-1 ring-brand/20">
                        <PageIcon className="size-[18px]" />
                    </div>
                    <h1 className="text-base font-bold tracking-tight text-crumb-title sm:text-lg">{v.title}</h1>
                    <span className="hidden text-xs text-crumb-text lg:inline sm:text-sm">- {v.subtitle}</span>
                </div>

                {/* Breadcrumb links */}
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                    <NavLink
                        to="/catalog/product-categories"
                        className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-crumb-text transition-all duration-200 hover:scale-105 hover:bg-crumb-hover hover:text-brand active:scale-95"
                    >
                        <Home className="size-3.5 transition-transform group-hover:scale-110" />
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
                        <span className="rounded-lg bg-brand/10 px-2.5 py-1 font-semibold text-brand shadow-2xs ring-1 ring-brand/20">
                            {v.nav}
                        </span>
                    </div>
                    {sub && (
                        <div className="flex items-center gap-1.5">
                            <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
                            <span className="rounded-lg px-2 py-1 font-semibold text-crumb-current">{sub}</span>
                        </div>
                    )}
                </nav>
            </div>
        </div>
    );
}