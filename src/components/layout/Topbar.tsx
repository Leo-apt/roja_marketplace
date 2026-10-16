import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  FolderTree,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Percent,
  Search,
  Settings,
  SlidersHorizontal,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

type QuickAction = {
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string; // tailwind classes for the icon tile
  path: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Categories",
    hint: "Create and manage product categories",
    icon: FolderTree,
    tone: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 group-hover/item:bg-blue-100",
    path: "/catalog/product-categories",
  },
  {
    label: "Add Bundles",
    hint: "Create and manage product bundles",
    icon: PackagePlus,
    tone: "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 group-hover/item:bg-violet-100",
    path: "/catalog/bundles",
  },
  {
    label: "Create Product",
    hint: "Add new products and manage details",
    icon: Package,
    tone: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 group-hover/item:bg-emerald-100",
    path: "/catalog/products",
  },
  {
    label: "Margins",
    hint: "Configure product profit margins",
    icon: Percent,
    tone: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 group-hover/item:bg-amber-100",
    path: "/catalog/margins",
  },
  {
    label: "Engine Configuration",
    hint: "Configure engines and business rules",
    icon: SlidersHorizontal,
    tone: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100 group-hover/item:bg-rose-100",
    path: "/catalog/engine-configuration",
  },
];

/** Closes a popover on outside click or Escape. */
function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}

/** Shared card-like surface used by buttons in the bar. */
const cardBase =
  "border border-gray-200/80 bg-white shadow-sm outline-none transition-all duration-300 tb-ease " +
  "hover:-translate-y-px hover:border-gray-300 hover:shadow-[0_6px_14px_-6px_rgba(16,24,40,0.12)] active:translate-y-0 active:scale-[0.97] " +
  "focus-visible:ring-2 focus-visible:ring-brand/30";

/** Popover panel. Open/close motion lives in the <style> block (tb-pop). */
function popoverClass(open: boolean) {
  return (
    "tb-pop absolute right-0 top-[calc(100%+12px)] z-50 origin-top-right overflow-hidden rounded-2xl " +
    "border border-gray-200/80 bg-white/95 backdrop-blur-xl " +
    "shadow-[0_20px_40px_-16px_rgba(16,24,40,0.12),0_2px_8px_-4px_rgba(16,24,40,0.05)] ring-1 ring-black/5 " +
    (open ? "tb-pop-open" : "")
  );
}

function IconButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`group relative grid size-11 place-items-center rounded-xl text-ink ${cardBase} ${className}`}
    >
      {children}
    </button>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useDismiss(ref, open, () => setOpen(false));

  const focusItem = (i: number) => {
    const n = QUICK_ACTIONS.length;
    itemRefs.current[((i % n) + n) % n]?.focus();
  };

  const onTriggerKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      window.setTimeout(() => focusItem(0), 40);
    }
  };

  const onMenuKey = (e: ReactKeyboardEvent) => {
    const current = itemRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(current + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(current <= 0 ? -1 : current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(-1);
    } else if (e.key === "Escape") {
      triggerRef.current?.focus();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        className={`group/trigger inline-flex h-12 items-center gap-3 rounded-2xl pl-1.5 pr-3 ${cardBase}`}
      >
        <span
          className={`grid size-9 place-items-center rounded-xl bg-topbar-avatar-bg text-topbar-avatar-text transition-transform duration-500 tb-spring group-hover/trigger:rotate-6 ${open ? "rotate-12 scale-110" : ""
            }`}
        >
          <Zap className="size-[18px]" />
        </span>
        <span className="flex flex-col items-start leading-tight max-[850px]:hidden">
          <span className="text-xs font-bold text-ink">Quick Actions</span>
          <span className="text-[11px] text-muted">Shortcuts &amp; Tools</span>
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-500 tb-ease max-[850px]:hidden ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        onKeyDown={onMenuKey}
        className={`${popoverClass(open)} w-[22rem]`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white/60 px-4 py-3.5">
          <span className="grid size-8 place-items-center rounded-xl bg-topbar-avatar-bg text-topbar-avatar-text shadow-sm">
            <Zap className="size-4" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xs font-bold text-ink">Quick Actions</p>
            <p className="text-[11px] text-muted">
              Jump straight to common tasks
            </p>
          </div>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-muted">
            {QUICK_ACTIONS.length} tools
          </span>
        </div>

        {/* Items */}
        <div className="p-1.5">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                data-qa-item
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  navigate(a.path);
                }}
                style={{ "--i": i } as React.CSSProperties}
                className={`group/item relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-[background-color,transform] duration-200 tb-ease hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.985]`}
              >
                {/* Accent bar grows in on hover / focus */}
                <span className="pointer-events-none absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-[height] duration-300 tb-ease group-hover/item:h-5 group-focus-visible/item:h-5" />
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg transition-[transform,background-color] duration-300 tb-spring group-hover/item:-rotate-3 group-hover/item:scale-110 group-focus-visible/item:scale-110 ${a.tone}`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="text-xs font-semibold text-ink">
                    {a.label}
                  </span>
                  <span className="truncate text-[11px] text-muted">
                    {a.hint}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 -translate-x-2 translate-y-1 text-muted opacity-0 transition-[transform,opacity,color] duration-300 tb-ease group-hover/item:translate-x-0 group-hover/item:translate-y-0 group-hover/item:text-ink group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:translate-y-0 group-focus-visible/item:opacity-100" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[10px] text-muted max-[850px]:hidden">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-gray-200 bg-white px-1 font-sans font-semibold">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-gray-200 bg-white px-1 font-sans font-semibold">
              Enter
            </kbd>
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-gray-200 bg-white px-1 font-sans font-semibold">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({
  email,
  displayName,
  initials,
  onLogout,
}: {
  email?: string;
  displayName: string;
  initials: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-12 items-center gap-3 rounded-2xl pl-1.5 pr-3 ${cardBase}`}
      >
        <span
          className="grid size-9 place-items-center rounded-xl bg-topbar-avatar-bg text-[11px] font-bold text-topbar-avatar-text ring-2 ring-white"
          title={email}
        >
          {initials}
        </span>
        <span className="max-w-[140px] truncate text-xs font-semibold text-ink max-[850px]:hidden">
          {displayName}
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-300 ease-out max-[850px]:hidden ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`${popoverClass(open)} w-64`}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-3.5 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-topbar-avatar-bg text-[11px] font-bold text-topbar-avatar-text">
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-ink">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-muted" title={email}>
              {email ?? "Signed in"}
            </p>
          </div>
        </div>
        <div className="p-1.5">
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const [confirmOut, setConfirmOut] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const email = user?.user_email;
  const initials = (email ?? "U").slice(0, 2).toUpperCase();

  // No display-name field is known here, so derive one from the email.
  // Replace with user.name (or similar) if you have it.
  const displayName = email
    ? email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
    : "Account";

  // TODO: drive this from your notifications state
  const hasUnread = true;

  const shortcut = useMemo(
    () =>
      typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad/i.test(navigator.platform)
        ? "⌘K"
        : "Ctrl K",
    [],
  );

  // Global shortcut: Cmd/Ctrl + K focuses the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[76px] animate-[topbar-in_400ms_ease-out_both] items-center justify-between gap-3 border-b border-topbar-border bg-white/70 px-7 backdrop-blur-xl max-[1180px]:px-5 max-[850px]:px-4 print:hidden">
      {/* Local keyframes so no tailwind.config change is needed */}
      <style>{`
                :root {
                    --tb-ease: cubic-bezier(0.22, 1, 0.36, 1);
                    --tb-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .tb-ease.tb-ease { transition-timing-function: var(--tb-ease); }
                .tb-spring.tb-spring { transition-timing-function: var(--tb-spring); }

                @keyframes topbar-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes qa-in {
                    from { opacity: 0; transform: translateY(10px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Popover: closed state, delays 'visibility' until fade-out ends */
                .tb-pop {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transform: translateY(-8px) scale(0.95);
                    transition:
                        opacity 320ms var(--tb-ease),
                        transform 320ms var(--tb-ease),
                        visibility 0s linear 320ms;
                    will-change: opacity, transform;
                }
                .tb-pop.tb-pop-open {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                    transform: translateY(0) scale(1);
                    transition:
                        opacity 320ms var(--tb-ease),
                        transform 320ms var(--tb-ease),
                        visibility 0s;
                }

                /* Staggered items on open */
                .tb-pop-open [data-qa-item] {
                    animation: qa-in 420ms var(--tb-ease) backwards;
                    animation-delay: calc(70ms + var(--i, 0) * 50ms);
                }

                /* Reduced motion: keep a gentle fade, drop movement */
                @media (prefers-reduced-motion: reduce) {
                    header { animation: none !important; }
                    .tb-pop { transform: none; transition: opacity 150ms linear, visibility 0s linear 150ms; }
                    .tb-pop.tb-pop-open { transition: opacity 150ms linear, visibility 0s; }
                    .tb-pop-open [data-qa-item] { animation: none; }
                }
            `}</style>

      {/* Left: menu button + search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Toggle navigation"
          className={`grid size-11 shrink-0 place-items-center rounded-xl text-ink min-[851px]:hidden ${cardBase}`}
        >
          <Menu className="size-5" />
        </button>

        <div
          className={`relative w-full max-w-[340px] rounded-xl transition-[max-width,box-shadow] duration-500 tb-ease ${focused
            ? "max-w-[440px] shadow-[0_0_0_3px] shadow-brand/[0.06]"
            : ""
            }`}
        >
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200 ${focused ? "text-brand" : "text-muted"
              }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (query) setQuery("");
                else inputRef.current?.blur();
              }
            }}
            placeholder="Search products, categories…"
            aria-label="Search"
            className="h-11 w-full rounded-xl border border-gray-200/80 bg-white pl-10 pr-16 text-xs text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-muted hover:border-gray-300 focus:border-brand"
          />
          <button
            type="button"
            aria-label="Clear search"
            tabIndex={query ? 0 : -1}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className={`absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted transition-all duration-200 hover:bg-gray-100 hover:text-ink ${query
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
              }`}
          >
            <X className="size-4" />
          </button>
          <kbd
            className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted transition-opacity duration-200 max-[850px]:hidden ${query || focused ? "opacity-0" : "opacity-100"
              }`}
          >
            {shortcut}
          </kbd>
        </div>
      </div>

      {/* Right: actions, icon buttons, profile */}
      <div className="flex shrink-0 items-center gap-3 max-[850px]:gap-2">
        <QuickActions />

        <IconButton label="Notifications">
          <Bell className="size-[18px] transition-transform duration-300 group-hover:rotate-[14deg]" />
          {hasUnread && (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </IconButton>

        <IconButton
          label="Settings"
          className="hover:!border-brand/30 hover:bg-brand/5 hover:text-brand max-[640px]:hidden"
        >
          <Settings className="size-[18px] transition-transform duration-500 group-hover:rotate-90" />
        </IconButton>

        <IconButton
          label="Log out"
          onClick={() => setConfirmOut(true)}
          className="hover:!border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
        </IconButton>

        <ProfileMenu
          email={email}
          displayName={displayName}
          initials={initials}
          onLogout={() => setConfirmOut(true)}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmOut}
        type="logout"
        loading={loggingOut}
        onClose={() => setConfirmOut(false)}
        onConfirm={async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
            setConfirmOut(false);
          }
        }}
      />
    </header>
  );
}
