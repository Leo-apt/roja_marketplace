import {
  useCallback,
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
import { useLocation, useNavigate } from "react-router-dom";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useEnv } from "@/env/EnvContext";

type QuickAction = {
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  path: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Categories",
    hint: "Create and manage product categories",
    icon: FolderTree,
    tone: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100",
    path: "/catalog/product-categories",
  },
  {
    label: "Add Bundles",
    hint: "Create and manage product bundles",
    icon: PackagePlus,
    tone: "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100",
    path: "/catalog/bundles",
  },
  {
    label: "Create Product",
    hint: "Add new products and manage details",
    icon: Package,
    tone: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
    path: "/catalog/products",
  },
  {
    label: "Margins",
    hint: "Configure product profit margins",
    icon: Percent,
    tone: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
    path: "/catalog/margins",
  },
  {
    label: "Engine Configuration",
    hint: "Configure engines and business rules",
    icon: SlidersHorizontal,
    tone: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100",
    path: "/catalog/engine-configuration",
  },
];

/** Closes a popover on outside click or Escape. Listeners stay stable across renders. */
function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeRef.current();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open]);
}

/**
 * Static look only. All motion (hover, press, icon turns) is plain CSS in
 * TOPBAR_STYLES under .tb-btn, so it works the same in Tailwind v3 and v4.
 */
const cardBase =
  "tb-btn border border-gray-200/80 bg-white shadow-sm outline-none " +
  "focus-visible:ring-2 focus-visible:ring-brand/30";

function popoverClass(open: boolean) {
  return (
    "tb-pop absolute right-0 top-[calc(100%+12px)] z-50 origin-top-right overflow-hidden rounded-2xl " +
    "border border-gray-200/80 bg-white ring-1 ring-black/5 " +
    (open ? "tb-pop-open" : "")
  );
}

function IconButton({
  label,
  onClick,
  active = false,
  children,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      onClick={onClick}
      className={`relative grid size-11 place-items-center rounded-xl ${cardBase} ${active ? "bg-gray-50 text-brand" : "text-ink"
        } ${className}`}
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
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

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
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        className={`inline-flex h-12 items-center gap-3 rounded-2xl pl-1.5 pr-3 ${cardBase}`}
      >
        <span className="tb-zap grid size-9 place-items-center rounded-xl bg-topbar-avatar-bg text-topbar-avatar-text">
          <Zap className="size-[18px]" />
        </span>
        <span className="flex flex-col items-start leading-tight max-[850px]:hidden">
          <span className="text-xs font-bold text-ink">Quick Actions</span>
          <span className="text-[11px] text-muted">Shortcuts &amp; Tools</span>
        </span>
        <ChevronDown className="tb-chev size-4 text-muted max-[850px]:hidden" />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        onKeyDown={onMenuKey}
        className={`${popoverClass(open)} w-[22rem]`}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white px-4 py-3.5">
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
                className="tb-item relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <span className="tb-bar pointer-events-none absolute left-0 top-1/2 w-[3px] rounded-full bg-brand" />
                <span
                  className={`tb-tile grid size-9 shrink-0 place-items-center rounded-lg ${a.tone}`}
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
                <ArrowUpRight className="tb-arrow size-4 shrink-0 text-muted" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[10px] text-muted max-[850px]:hidden">
          {[
            ["↑↓", "Navigate"],
            ["Enter", "Open"],
            ["Esc", "Close"],
          ].map(([key, text]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-gray-200 bg-white px-1 font-sans font-semibold">
                {key}
              </kbd>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({
  email,
  displayName,
  initials,
  imageUrl,
  onSettings,
  onLogout,
}: {
  email?: string;
  displayName: string;
  initials: string;
  imageUrl?: string | null;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const onMenuKey = (e: ReactKeyboardEvent) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const current = items.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(current + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(current <= 0 ? items.length : current) - 1]?.focus();
    } else if (e.key === "Escape") {
      triggerRef.current?.focus();
    }
  };

  const itemBase =
    "tb-item flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none " +
    "focus-visible:ring-2 focus-visible:ring-brand/30";

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-12 items-center gap-3 rounded-2xl pl-1.5 pr-3 ${cardBase}`}
      >
        <span
          className="grid size-9 place-items-center overflow-hidden rounded-xl bg-topbar-avatar-bg text-[11px] font-bold text-topbar-avatar-text ring-2 ring-white"
          title={email}
        >
          {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initials}
        </span>
        <span className="max-w-[140px] truncate text-xs font-semibold text-ink max-[850px]:hidden">
          {displayName}
        </span>
        <ChevronDown className="tb-chev size-4 text-muted max-[850px]:hidden" />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        onKeyDown={onMenuKey}
        className={`${popoverClass(open)} w-64`}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white px-3.5 py-3">
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-topbar-avatar-bg text-[11px] font-bold text-topbar-avatar-text">
            {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initials}
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
            ref={(el) => {
              itemRefs.current[0] = el;
            }}
            type="button"
            role="menuitem"
            data-qa-item
            style={{ "--i": 0 } as React.CSSProperties}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              onSettings();
            }}
            className={`${itemBase} text-ink hover:bg-gray-50 focus-visible:bg-gray-50`}
          >
            <Settings className="size-4 text-muted" />
            Settings
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button
            ref={(el) => {
              itemRefs.current[1] = el;
            }}
            type="button"
            role="menuitem"
            data-qa-item
            style={{ "--i": 1 } as React.CSSProperties}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={`${itemBase} text-red-600 hover:bg-red-50 focus-visible:bg-red-50`}
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * All topbar motion lives here as plain CSS. Tailwind v4 animates scale, rotate
 * and translate as separate properties, which `transition-[transform]` ignores,
 * so doing it here keeps behaviour identical on v3 and v4.
 */
const TOPBAR_STYLES = `
  :root {
    --tb-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes topbar-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes qa-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes tb-ping {
    0%        { transform: scale(1);   opacity: 0.5; }
    75%, 100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes tb-ring {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(12deg); }
    40%  { transform: rotate(-9deg); }
    60%  { transform: rotate(5deg); }
    80%  { transform: rotate(-2deg); }
    100% { transform: rotate(0deg); }
  }

  .tb-header { animation: topbar-in 400ms ease-out backwards; }

  /* Buttons: hover = border + shadow, press = quick scale, release = relaxed */
  .tb-btn {
    transition:
      transform 220ms var(--tb-ease),
      box-shadow 220ms var(--tb-ease),
      border-color 220ms var(--tb-ease),
      background-color 220ms var(--tb-ease),
      color 220ms var(--tb-ease);
  }
  .tb-btn:hover {
    border-color: #d1d5db;
    box-shadow: 0 6px 16px -8px rgba(16, 24, 40, 0.2);
  }
  .tb-btn:active {
    transform: scale(0.96);
    transition-duration: 90ms;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
  }

  /* Danger variant (Log out): red tint on hover */
  .tb-btn.tb-danger:hover,
  .tb-btn.tb-danger:focus-visible {
    border-color: #fecaca;
    background-color: #fef2f2;
    color: #dc2626;
  }

  /* Icon motion */
  .tb-bell { transform-origin: 50% 10%; }
  .tb-btn:hover .tb-bell { animation: tb-ring 700ms var(--tb-ease); }
  .tb-spin { transition: transform 500ms var(--tb-ease); }
  .tb-btn:hover .tb-spin { transform: rotate(60deg); }
  .tb-nudge { transition: transform 300ms var(--tb-ease); }
  .tb-btn:hover .tb-nudge { transform: translateX(2px); }

  .tb-chev { transition: transform 350ms var(--tb-ease); }
  [data-open="true"] .tb-chev { transform: rotate(180deg); }

  .tb-zap { transition: transform 350ms var(--tb-ease); }
  .tb-btn:hover .tb-zap { transform: rotate(8deg); }
  [data-open="true"] .tb-zap { transform: rotate(8deg) scale(1.06); }

  .tb-ping { animation: tb-ping 1.8s cubic-bezier(0, 0, 0.2, 1) 3; }

  /* Popover */
  .tb-pop {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-6px) scale(0.97);
    box-shadow: 0 24px 48px -16px rgba(16, 24, 40, 0.18), 0 2px 8px -4px rgba(16, 24, 40, 0.06);
    transition:
      opacity 220ms var(--tb-ease),
      transform 220ms var(--tb-ease),
      visibility 0s linear 220ms;
  }
  .tb-pop.tb-pop-open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    transition:
      opacity 220ms var(--tb-ease),
      transform 220ms var(--tb-ease),
      visibility 0s;
  }
  .tb-pop-open [data-qa-item] {
    animation: qa-in 320ms var(--tb-ease) backwards;
    animation-delay: calc(40ms + var(--i, 0) * 35ms);
  }

  /* Menu items */
  .tb-item {
    transition: background-color 160ms var(--tb-ease), transform 160ms var(--tb-ease);
  }
  .tb-item:active { transform: scale(0.985); transition-duration: 80ms; }

  .tb-bar {
    height: 0;
    transform: translateY(-50%);
    transition: height 260ms var(--tb-ease);
  }
  .tb-item:hover .tb-bar, .tb-item:focus-visible .tb-bar { height: 20px; }

  .tb-tile { transition: transform 260ms var(--tb-ease); }
  .tb-item:hover .tb-tile, .tb-item:focus-visible .tb-tile { transform: scale(1.06); }

  .tb-arrow {
    opacity: 0;
    transform: translate(-8px, 4px);
    transition: opacity 220ms var(--tb-ease), transform 260ms var(--tb-ease);
  }
  .tb-item:hover .tb-arrow, .tb-item:focus-visible .tb-arrow {
    opacity: 1;
    transform: none;
  }

  /* Search clear button */
  .tb-clear {
    opacity: 0;
    transform: translateY(-50%) scale(0.75);
    pointer-events: none;
    transition: opacity 180ms var(--tb-ease), transform 180ms var(--tb-ease), background-color 150ms, color 150ms;
  }
  .tb-clear[data-show="true"] {
    opacity: 1;
    transform: translateY(-50%) scale(1);
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .tb-header, .tb-ping, .tb-btn:hover .tb-bell, .tb-pop-open [data-qa-item] { animation: none; }
    .tb-btn, .tb-btn:active, .tb-spin, .tb-nudge, .tb-chev, .tb-zap, .tb-item, .tb-tile, .tb-arrow, .tb-bar { transition: none; }
    .tb-btn:active, .tb-item:active { transform: none; }
    .tb-pop { transform: none; transition: opacity 150ms linear, visibility 0s linear 150ms; }
    .tb-pop.tb-pop-open { transition: opacity 150ms linear, visibility 0s; }
  }
`;

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, setMode } = useEnv();
  const { pathname } = useLocation();
  const [confirmOut, setConfirmOut] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const email = user?.user_email;
  const initials = (email ?? "U").slice(0, 2).toUpperCase();
  const onSettingsPage = pathname.startsWith("/settings");
  const imageUrl = useProfileImage();
  const displayName =
    user?.user_name?.trim() ||
    (email
      ? email
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
      : "Account");

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
    // No backdrop-blur here on purpose: it forces a re-blur on every animated frame.
    <header className="tb-header sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-topbar-border bg-white/95 px-7 max-[1180px]:px-5 max-[850px]:px-4 print:hidden">
      <style>{TOPBAR_STYLES}</style>

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
          className={`relative w-full rounded-xl transition-[max-width,box-shadow] duration-500 ${focused
            ? "max-w-[440px] shadow-[0_0_0_4px] shadow-brand/[0.08]"
            : "max-w-[340px]"
            }`}
          style={{ transitionTimingFunction: "var(--tb-ease)" }}
        >
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-300 ${focused ? "text-brand" : "text-muted"
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
            className="h-11 w-full rounded-xl border border-gray-200/80 bg-white pl-10 pr-16 text-xs text-ink shadow-sm outline-none transition-[border-color,background-color] duration-200 placeholder:text-muted hover:border-gray-300 focus:border-brand"
          />
          <button
            type="button"
            aria-label="Clear search"
            tabIndex={query ? 0 : -1}
            data-show={!!query}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="tb-clear absolute right-2.5 top-1/2 grid size-6 place-items-center rounded-md text-muted hover:bg-gray-100 hover:text-ink"
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

      <button
        type="button"
        role="switch"
        aria-checked={mode === "live"}
        aria-label="Data environment"
        title="Switch between Sandbox and Live"
        onClick={() => setMode(mode === "live" ? "sandbox" : "live")}
        className="tb-btn relative hidden h-9 w-[132px] shrink-0 items-center rounded-full border border-gray-200/80 bg-gray-100 p-0.5 text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-brand/30 md:inline-flex"
      >
        <span
          className={`absolute top-0.5 h-[30px] w-[62px] rounded-full shadow-sm transition-all duration-300 ${mode === "live" ? "left-[66px] bg-good" : "left-0.5 bg-caution"
            }`}
        />
        <span className={`relative z-10 w-1/2 text-center transition-colors ${mode === "sandbox" ? "text-white" : "text-muted"}`}>
          Sandbox
        </span>
        <span className={`relative z-10 w-1/2 text-center transition-colors ${mode === "live" ? "text-white" : "text-muted"}`}>
          Live
        </span>
      </button>

      {/* Right: actions, icon buttons, profile */}
      <div className="flex shrink-0 items-center gap-3 max-[850px]:gap-2">
        <QuickActions />

        <IconButton label="Notifications">
          <Bell className="tb-bell size-[18px]" />
          {hasUnread && (
            <span className="absolute right-2.5 top-2.5 grid size-2 place-items-center">
              <span className="tb-ping absolute size-2 rounded-full bg-rose-500" />
              <span className="relative size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </span>
          )}
        </IconButton>

        <IconButton
          label="Settings"
          active={onSettingsPage}
          onClick={() => navigate("/settings")}
          className="hover:bg-gray-50 hover:text-brand max-[640px]:hidden"
        >
          <Settings className="tb-spin size-[18px]" />
        </IconButton>

        <IconButton
          label="Log out"
          onClick={() => setConfirmOut(true)}
          className="tb-danger"
        >
          <LogOut className="tb-nudge size-[18px]" />
        </IconButton>

        <ProfileMenu
          email={email}
          displayName={displayName}
          initials={initials}
          imageUrl={imageUrl}
          onSettings={() => navigate("/settings")}
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
