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
  UserStar,
  SlidersHorizontal,
  LayoutTemplate,
  Settings, Building2, Activity, History as HistoryIcon, Workflow, FileText, BarChart3
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
  providers: Building2,
  productCategories: FolderTree,
  bundles: Layers,
  catalogProducts: Package,
  margins: BadgePercent,
  instances: UserStar,
  engineConfig: SlidersHorizontal,
  productTemplates: LayoutTemplate,
  engineSignals: Activity,
  history: HistoryIcon,
  documents: Workflow,
  settings: Settings,
  documentsManage: FileText,
  reports: BarChart3,
};

type SubLabel = "Create" | "Edit" | "Details";

/** Pages that now live under Settings → Marketplace. */
const MARKET_KEYS: ViewKey[] = [
  "providers",
  "productCategories",
  "bundles",
  "catalogProducts",
  "engineConfig",
  "productTemplates",
  "engineSignals",
];

const subStyles: Record<SubLabel, string> = {
  Create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Edit: "bg-amber-50 text-amber-700 ring-amber-200",
  Details: "bg-sky-50 text-sky-700 ring-sky-200",
};

/** Same hover treatment as the topbar buttons: light brand tint + brand text. */
const linkHover =
  "hover:bg-brand/5 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30";

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const key = (Object.keys(viewInfo) as ViewKey[]).find(
    (k) =>
      pathname === viewInfo[k].path ||
      pathname.startsWith(viewInfo[k].path + "/"),
  );
  if (!key) return null;

  const v = viewInfo[key];
  const inSettings = MARKET_KEYS.includes(key);
  const group = inSettings
    ? null
    : displayGroups.find((g) => g.items.includes(key));
  const PageIcon = iconMap[key];
  const rest = pathname.slice(v.path.length);
  const sub: SubLabel | null =
    rest === ""
      ? null
      : rest === "/new"
        ? "Create"
        : rest.endsWith("/edit")
          ? "Edit"
          : "Details";

  return (
    <div className="crumb-root relative z-[25] rounded-2xl border border-crumb-border bg-crumb-bg/70 px-4 py-2.5 shadow-[0_2px_8px_-4px_rgba(16,24,40,0.08)] backdrop-blur-xl">
      {/* Local keyframes so no tailwind.config change is needed */}
      <style>{`
                :root { --crumb-ease: cubic-bezier(0.22, 1, 0.36, 1); }
                .crumb-ease.crumb-ease { transition-timing-function: var(--crumb-ease); }

                @keyframes crumb-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .crumb-anim { animation: crumb-in 400ms var(--crumb-ease) both; }

                @media (prefers-reduced-motion: reduce) {
                    .crumb-anim { animation: none; }
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
              className="crumb-ease group grid size-9 shrink-0 place-items-center rounded-xl border border-gray-200/80 bg-white text-ink shadow-sm outline-none transition-all duration-300 hover:-translate-y-px hover:!border-brand/30 hover:bg-brand/5 hover:text-brand hover:shadow-[0_6px_14px_-6px_rgba(16,24,40,0.12)] focus-visible:ring-2 focus-visible:ring-brand/30 active:translate-y-0 active:scale-95"
            >
              <ArrowLeft className="crumb-ease size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
          )}
          <div className="rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 p-2 text-brand ring-1 ring-brand/20">
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
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-medium"
        >
          <NavLink
            to="/catalog/product-categories"
            className={`crumb-ease group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-crumb-text outline-none transition-all duration-300 hover:-translate-y-px active:translate-y-0 active:scale-95 ${linkHover}`}
          >
            <Home className="crumb-ease size-3.5 transition-transform duration-300 group-hover:scale-110" />
            <span className="hidden sm:inline">Home</span>
          </NavLink>

          {inSettings && (
            <div className="flex items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
              <NavLink
                to={viewInfo.settings.path}
                className={`crumb-ease rounded-lg px-2.5 py-1 text-crumb-text outline-none transition-all duration-300 ${linkHover}`}
              >
                {viewInfo.settings.nav}
              </NavLink>
            </div>
          )}

          {group && (
            <div className="flex items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
              <span className="rounded-lg px-2 py-1 text-crumb-text">
                {group.label}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <ChevronRight className="size-3 shrink-0 text-crumb-sep" />
            {sub ? (
              <NavLink
                to={v.path}
                className={`crumb-ease rounded-lg px-2.5 py-1 text-crumb-text outline-none transition-all duration-300 ${linkHover}`}
              >
                {v.nav}
              </NavLink>
            ) : (
              <span
                aria-current="page"
                className="rounded-lg bg-brand/10 px-2.5 py-1 font-semibold text-brand ring-1 ring-brand/20"
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
