import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  FlaskConical,
  FolderTree,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Percent,
  Radio,
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

type Mode = "live" | "sandbox";

const MODE_LABEL: Record<Mode, string> = {
  sandbox: "Sandbox",
  live: "Live",
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

/* ------------------------------------------------------------------ */
/* Command palette types                                               */
/* ------------------------------------------------------------------ */

const COMMAND_GROUPS = ["Quick actions", "Go to", "Commands"] as const;
type CommandGroup = (typeof COMMAND_GROUPS)[number];

type Command = {
  id: string;
  group: CommandGroup;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
  keywords?: string;
  run: () => void;
};

/** Wraps the matching part of `text` in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-brand/15 px-px text-inherit">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: LucideIcon;
  tone: string;
};

// TODO: replace with real notifications from your API / state.
const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "Margin rules updated",
    body: "The default margin was changed for 3 categories.",
    time: "5m ago",
    icon: Percent,
    tone: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
  },
  {
    id: "n2",
    title: "Bundle published",
    body: "Your bundle is now visible to customers.",
    time: "1h ago",
    icon: PackagePlus,
    tone: "bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100",
  },
  {
    id: "n3",
    title: "Product sync finished",
    body: "All products were synced successfully.",
    time: "Yesterday",
    icon: Package,
    tone: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
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
      className={`relative grid size-11 place-items-center rounded-xl ${cardBase} ${
        active ? "bg-gray-50 text-brand" : "text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Sandbox / Live switch (presentational).
 *
 * The switch never changes the environment by itself. A click or an arrow key
 * only *requests* a switch (onRequest) and the parent shows its confirm dialog.
 * The parent plays the slide / stretch / beam / color-wash animation only
 * after the person confirms.
 *
 * Layout: a 2-column grid. The sliding pill is exactly one column wide
 * (calc(50% - 3px)) and moves by translateX(100%), so it always lines up with
 * the labels no matter the switch width.
 *
 * While the confirm dialog is open the pill "peeks" toward the target side
 * (data-pending) and springs back if the person cancels.
 */
function ModeSwitch({
  mode,
  pending,
  thumbRef,
  onRequest,
}: {
  mode: Mode;
  pending: boolean;
  thumbRef: RefObject<HTMLSpanElement | null>;
  onRequest: (next: Mode) => void;
}) {
  const isLive = mode === "live";
  const other: Mode = isLive ? "sandbox" : "live";

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowRight" && !isLive) {
      e.preventDefault();
      onRequest("live");
    } else if (e.key === "ArrowLeft" && isLive) {
      e.preventDefault();
      onRequest("sandbox");
    }
  };

  const accent = isLive ? "bg-good" : "bg-caution";

  return (
    <div className="relative hidden shrink-0 md:block">
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        aria-label={`Data environment: ${MODE_LABEL[mode]}. Switch to ${MODE_LABEL[other]}.`}
        data-mode={mode}
        data-pending={pending}
        onClick={() => onRequest(other)}
        onKeyDown={onKeyDown}
        className="tb-btn tb-switch relative grid h-11 w-[160px] grid-cols-2 items-stretch overflow-hidden rounded-full border border-gray-200/80 bg-gray-100 p-[3px] text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <span
          ref={thumbRef}
          aria-hidden
          className={`tb-switch-thumb absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full shadow-sm ${accent}`}
        />

        <span
          className={`tb-switch-label relative z-10 flex items-center justify-center gap-1.5 ${
            !isLive ? "text-white" : "text-muted"
          }`}
        >
          <span className="grid size-3.5 shrink-0 place-items-center">
            <FlaskConical className="tb-ic-flask size-3.5" />
          </span>
          <span className="leading-none">Sandbox</span>
        </span>
        <span
          className={`tb-switch-label relative z-10 flex items-center justify-center gap-1.5 ${
            isLive ? "text-white" : "text-muted"
          }`}
        >
          <span className="relative grid size-3.5 shrink-0 place-items-center">
            {isLive && (
              <span className="tb-live-ring absolute size-3.5 rounded-full bg-white/60" />
            )}
            <Radio className="tb-ic-radio relative size-3.5" />
          </span>
          <span className="leading-none">Live</span>
        </span>
      </button>
    </div>
  );
}

/** Bell button + notification center panel with unread badge and mark-as-read. */
function NotificationsMenu({ items }: { items: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const unread = items.filter((n) => !readIds.has(n.id)).length;
  const markAll = () => setReadIds(new Set(items.map((n) => n.id)));
  const markOne = (id: string) => setReadIds((prev) => new Set(prev).add(id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        title="Notifications"
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        className={`relative grid size-11 place-items-center rounded-xl text-ink ${cardBase} ${
          open ? "bg-gray-50" : ""
        }`}
      >
        <Bell className="tb-bell size-[18px]" />
        {unread > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 grid place-items-center">
            <span className="tb-ping absolute size-4 rounded-full bg-rose-500" />
            <span
              key={unread}
              className="tb-badge relative grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
            >
              {unread}
            </span>
          </span>
        )}
      </button>

      <div
        role="dialog"
        aria-label="Notifications"
        aria-hidden={!open}
        className={`${popoverClass(open)} w-[22rem] max-[480px]:w-[calc(100vw-2rem)]`}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white px-4 py-3.5">
          <p className="text-xs font-bold text-ink">Notifications</p>
          {unread > 0 && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-100">
              {unread} new
            </span>
          )}
          <button
            type="button"
            onClick={markAll}
            disabled={unread === 0}
            tabIndex={open ? 0 : -1}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-default disabled:text-muted disabled:hover:bg-transparent"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </button>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {items.map((n, i) => {
            const Icon = n.icon;
            const isUnread = !readIds.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                data-qa-item
                tabIndex={open ? 0 : -1}
                onClick={() => markOne(n.id)}
                style={{ "--i": i } as React.CSSProperties}
                className="tb-item relative flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <span
                  className={`tb-tile mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${n.tone}`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                  <span className="flex items-center gap-2">
                    <span
                      className={`truncate text-xs ${
                        isUnread
                          ? "font-bold text-ink"
                          : "font-semibold text-ink/80"
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted">
                      {n.time}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-[11px] text-muted">
                    {n.body}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`tb-unread mt-1.5 size-2 shrink-0 rounded-full bg-brand ${
                    isUnread ? "" : "tb-unread-off"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] text-muted">
          {unread === 0 ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              You&rsquo;re all caught up
            </>
          ) : (
            <>Click a notification to mark it as read</>
          )}
        </div>
      </div>
    </div>
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
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
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
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
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
    --tb-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
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
  @keyframes tb-badge-pop {
    0%   { transform: scale(0.4); }
    60%  { transform: scale(1.25); }
    100% { transform: none; }
  }
  @keyframes tb-flask {
    0%   { transform: rotate(0deg) translateY(0); }
    20%  { transform: rotate(-22deg) translateY(-1px); }
    45%  { transform: rotate(16deg); }
    70%  { transform: rotate(-8deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes tb-radio {
    0%   { transform: scale(0.7); }
    55%  { transform: scale(1.25); }
    100% { transform: scale(1); }
  }
  @keyframes tb-live-ring {
    0%        { transform: scale(0.8); opacity: 0.8; }
    80%, 100% { transform: scale(2.6); opacity: 0; }
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
  .tb-badge { animation: tb-badge-pop 420ms var(--tb-spring); }

  /* Notification unread dot shrinks away when read */
  .tb-unread { transition: transform 260ms var(--tb-spring), opacity 200ms var(--tb-ease); }
  .tb-unread.tb-unread-off { transform: scale(0); opacity: 0; }

  /* Sandbox / Live switch. The width/margin stretch is driven from JS (WAAPI). */
  .tb-switch-thumb {
    transform: translateX(0);
    transition:
      transform 560ms var(--tb-spring),
      scale 160ms var(--tb-ease),
      background-color 400ms var(--tb-ease);
    will-change: transform, width;
  }
  .tb-switch[data-mode="live"] .tb-switch-thumb {
    transform: translateX(100%);
  }
  /* Pending confirmation: the pill peeks toward the target, springs back on cancel */
  .tb-switch[data-pending="true"][data-mode="sandbox"] .tb-switch-thumb {
    transform: translateX(16%);
  }
  .tb-switch[data-pending="true"][data-mode="live"] .tb-switch-thumb {
    transform: translateX(84%);
  }
  /* Press squish: the pill squeezes a little while the mouse is held down */
  .tb-switch:active .tb-switch-thumb { scale: 0.94 0.9; }
  .tb-switch-label {
    transition: color 350ms var(--tb-ease);
  }
  .tb-ic-flask { transform-origin: 50% 85%; }
  .tb-switch[data-mode="sandbox"] .tb-ic-flask {
    animation: tb-flask 650ms var(--tb-ease) 120ms;
  }
  .tb-switch[data-mode="live"] .tb-ic-radio {
    animation: tb-radio 520ms var(--tb-spring) 120ms;
  }
  .tb-live-ring { animation: tb-live-ring 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; }

  /* Header mode line: a faint colored edge that follows the environment */
  .tb-mode-line {
    opacity: 0.55;
    transition: background-color 500ms var(--tb-ease);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  }
  .tb-beam {
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  }

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
  .tb-item:hover .tb-bar, .tb-item:focus-visible .tb-bar,
  .tb-item[data-active="true"] .tb-bar { height: 20px; }

  .tb-tile { transition: transform 260ms var(--tb-ease); }
  .tb-item:hover .tb-tile, .tb-item:focus-visible .tb-tile,
  .tb-item[data-active="true"] .tb-tile { transform: scale(1.06); }

  .tb-arrow {
    opacity: 0;
    transform: translate(-8px, 4px);
    transition: opacity 220ms var(--tb-ease), transform 260ms var(--tb-ease);
  }
  .tb-item:hover .tb-arrow, .tb-item:focus-visible .tb-arrow,
  .tb-item[data-active="true"] .tb-arrow {
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
    .tb-header, .tb-ping, .tb-badge, .tb-btn:hover .tb-bell, .tb-pop-open [data-qa-item],
    .tb-live-ring, .tb-switch .tb-ic-flask, .tb-switch .tb-ic-radio { animation: none; }
    .tb-btn, .tb-btn:active, .tb-spin, .tb-nudge, .tb-chev, .tb-zap, .tb-item, .tb-tile, .tb-arrow, .tb-bar,
    .tb-switch-thumb, .tb-switch-label, .tb-mode-line, .tb-unread { transition: none; }
    .tb-switch:active .tb-switch-thumb { scale: none; }
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
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Environment switch -------------------------------------------------
  // pendingMode: the mode the person asked for, while the confirm dialog is open.
  // shownMode:   what the UI displays; updated the moment they confirm so the
  //              animation never waits on the env context.
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [shownMode, setShownMode] = useState<Mode>(
    mode === "live" ? "live" : "sandbox",
  );
  const [announce, setAnnounce] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const beamRef = useRef<HTMLSpanElement>(null);
  const washRef = useRef<HTMLSpanElement>(null);

  // Keep the display in sync if the env context changes from somewhere else.
  useEffect(() => {
    setShownMode(mode === "live" ? "live" : "sandbox");
  }, [mode]);

  // Dialog text keeps its target while the dialog fades out.
  const dialogTarget: Mode =
    pendingMode ?? (shownMode === "live" ? "sandbox" : "live");

  const playSwitchAnimation = (goingLive: boolean) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const header = headerRef.current;
    const thumb = thumbRef.current;

    // 1) Gooey stretch. Going right, the trailing (left) edge lags behind;
    //    going left, the trailing (right) edge lags behind.
    thumb?.animate(
      goingLive
        ? [
            { width: "calc(50% - 3px)", marginLeft: "0%" },
            { width: "calc(75% - 3px)", marginLeft: "-25%", offset: 0.45 },
            { width: "calc(50% - 3px)", marginLeft: "0%" },
          ]
        : [
            { width: "calc(50% - 3px)", marginLeft: "0%" },
            { width: "calc(75% - 3px)", marginLeft: "0%", offset: 0.45 },
            { width: "calc(50% - 3px)", marginLeft: "0%" },
          ],
      { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );

    // 2) Scanner beam across the header's bottom edge.
    beamRef.current?.animate(
      goingLive
        ? [
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0 0 0)", offset: 0.5 },
            { clipPath: "inset(0 0 0 100%)" },
          ]
        : [
            { clipPath: "inset(0 0 0 100%)" },
            { clipPath: "inset(0 0 0 0)", offset: 0.5 },
            { clipPath: "inset(0 100% 0 0)" },
          ],
      { duration: 900, easing: "ease-in-out" },
    );

    // 3) Color wash: the new mode's color ripples out from the switch across the header.
    if (header && thumb && washRef.current) {
      const h = header.getBoundingClientRect();
      const t = thumb.getBoundingClientRect();
      const x = Math.round(t.left + t.width / 2 - h.left);
      const r = Math.ceil(h.width);
      washRef.current.animate(
        [
          { clipPath: `circle(0px at ${x}px 50%)`, opacity: 0.2 },
          {
            clipPath: `circle(${r}px at ${x}px 50%)`,
            opacity: 0.12,
            offset: 0.6,
          },
          { clipPath: `circle(${r}px at ${x}px 50%)`, opacity: 0 },
        ],
        { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  };

  /** Runs after the person presses "Switch" in the confirm dialog. */
  const confirmModeSwitch = () => {
    const next = dialogTarget;
    setPendingMode(null);
    if (next === shownMode) return;

    playSwitchAnimation(next === "live");
    setShownMode(next);
    setMode(next);
    setAnnounce(`Switched to ${MODE_LABEL[next]}`);
  };

  // --- Account / profile --------------------------------------------------
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

  const modeColor = shownMode === "live" ? "bg-good" : "bg-caution";

  const shortcut = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad/i.test(navigator.platform)
        ? "⌘K"
        : "Ctrl K",
    [],
  );

  // --- Command palette ----------------------------------------------------
  const commands = useMemo<Command[]>(() => {
    const target: Mode = shownMode === "live" ? "sandbox" : "live";
    return [
      ...QUICK_ACTIONS.map<Command>((a) => ({
        id: `qa-${a.path}`,
        group: "Quick actions",
        label: a.label,
        hint: a.hint,
        icon: a.icon,
        tone: a.tone,
        run: () => navigate(a.path),
      })),
      {
        id: "go-settings",
        group: "Go to",
        label: "Settings",
        hint: "Account and workspace preferences",
        icon: Settings,
        tone: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
        keywords: "preferences account profile",
        run: () => navigate("/settings"),
      },
      {
        id: "cmd-env",
        group: "Commands",
        label: `Switch to ${MODE_LABEL[target]}`,
        hint:
          target === "live"
            ? "See Live (real) data · you'll be asked to confirm"
            : "See Sandbox (test) data · you'll be asked to confirm",
        icon: target === "live" ? Radio : FlaskConical,
        tone:
          target === "live"
            ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100"
            : "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
        keywords: "environment sandbox live test real data mode",
        run: () => setPendingMode(target),
      },
      {
        id: "cmd-logout",
        group: "Commands",
        label: "Log out",
        hint: "Sign out of your account",
        icon: LogOut,
        tone: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100",
        keywords: "sign out logout exit",
        run: () => setConfirmOut(true),
      },
    ];
  }, [navigate, shownMode]);

  const { grouped, flat } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = commands.filter(
      (c) =>
        !q ||
        `${c.label} ${c.hint} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
    const grouped = COMMAND_GROUPS.map((g) => ({
      group: g,
      items: results.filter((c) => c.group === g),
    })).filter((g) => g.items.length > 0);
    return { grouped, flat: grouped.flatMap((g) => g.items) };
  }, [commands, query]);

  // Start at the top result whenever the query changes.
  useEffect(() => setActiveIdx(0), [query]);
  const activeIndex = Math.min(activeIdx, Math.max(flat.length - 1, 0));
  const activeCommand = flat[activeIndex];

  // Keep the active row visible while arrowing through a long list.
  useEffect(() => {
    if (!focused || !activeCommand) return;
    document
      .getElementById(`tb-cmd-${activeCommand.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeCommand, focused]);

  const runCommand = (c: Command) => {
    c.run();
    setQuery("");
    inputRef.current?.blur();
  };

  const onSearchKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && flat.length) {
      e.preventDefault();
      setActiveIdx((activeIndex + 1) % flat.length);
    } else if (e.key === "ArrowUp" && flat.length) {
      e.preventDefault();
      setActiveIdx((activeIndex - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter" && activeCommand) {
      e.preventDefault();
      runCommand(activeCommand);
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else inputRef.current?.blur();
    }
  };

  // Global shortcut: Cmd/Ctrl + K focuses the search / command palette
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
    <header
      ref={headerRef}
      className="tb-header sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-topbar-border bg-white/95 px-7 max-[1180px]:px-5 max-[850px]:px-4 print:hidden"
    >
      <style>{TOPBAR_STYLES}</style>

      {/* Color wash: plays after a switch, ripples out from the switch in the new mode's color */}
      <span
        ref={washRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${modeColor}`}
        style={{ opacity: 0 }}
      />

      {/* Environment edge: faint persistent line + scanner beam on switch */}
      <span
        aria-hidden
        className={`tb-mode-line pointer-events-none absolute inset-x-0 bottom-0 h-[2px] ${modeColor}`}
      />
      <span
        ref={beamRef}
        aria-hidden
        className={`tb-beam pointer-events-none absolute inset-x-0 bottom-0 h-[3px] ${modeColor}`}
        style={{ clipPath: "inset(0 100% 0 0)" }}
      />

      {/* Screen-reader only announcement after a switch (nothing is shown on screen) */}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>

      {/* Left: menu button + search / command palette */}
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
          className={`relative w-full rounded-xl transition-[max-width,box-shadow] duration-500 ${
            focused
              ? "max-w-[440px] shadow-[0_0_0_4px] shadow-brand/[0.08]"
              : "max-w-[340px]"
          }`}
          style={{ transitionTimingFunction: "var(--tb-ease)" }}
        >
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-300 ${
              focused ? "text-brand" : "text-muted"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={focused}
            aria-controls="tb-cmd-list"
            aria-autocomplete="list"
            aria-activedescendant={
              focused && activeCommand
                ? `tb-cmd-${activeCommand.id}`
                : undefined
            }
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onSearchKey}
            placeholder="Search or run a command…"
            aria-label="Search or run a command"
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
            className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted transition-opacity duration-200 max-[850px]:hidden ${
              query || focused ? "opacity-0" : "opacity-100"
            }`}
          >
            {shortcut}
          </kbd>

          {/* Command palette panel. mousedown is cancelled so the input keeps focus. */}
          <div
            aria-hidden={!focused}
            onMouseDown={(e) => e.preventDefault()}
            className={`tb-pop absolute left-0 top-[calc(100%+10px)] z-50 w-[30rem] max-w-[calc(100vw-2rem)] origin-top-left overflow-hidden rounded-2xl border border-gray-200/80 bg-white ring-1 ring-black/5 ${
              focused ? "tb-pop-open" : ""
            }`}
          >
            <div
              id="tb-cmd-list"
              role="listbox"
              aria-label="Results"
              className="max-h-[min(380px,60vh)] overflow-y-auto p-1.5"
            >
              {flat.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                  <span className="grid size-10 place-items-center rounded-xl bg-gray-100 text-muted">
                    <Search className="size-5" />
                  </span>
                  <p className="text-xs font-semibold text-ink">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted">
                    Try a different word, like &ldquo;margins&rdquo; or
                    &ldquo;settings&rdquo;.
                  </p>
                </div>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group} role="group" aria-label={group}>
                    <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {group}
                    </p>
                    {items.map((c) => {
                      const i = flat.indexOf(c);
                      const Icon = c.icon;
                      return (
                        <div
                          key={c.id}
                          id={`tb-cmd-${c.id}`}
                          role="option"
                          aria-selected={i === activeIndex}
                          data-qa-item
                          data-active={i === activeIndex}
                          style={
                            { "--i": Math.min(i, 8) } as React.CSSProperties
                          }
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => runCommand(c)}
                          className="tb-item relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left data-[active=true]:bg-gray-50"
                        >
                          <span className="tb-bar pointer-events-none absolute left-0 top-1/2 w-[3px] rounded-full bg-brand" />
                          <span
                            className={`tb-tile grid size-8 shrink-0 place-items-center rounded-lg ${c.tone}`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="text-xs font-semibold text-ink">
                              <Highlight text={c.label} query={query} />
                            </span>
                            <span className="truncate text-[11px] text-muted">
                              <Highlight text={c.hint} query={query} />
                            </span>
                          </span>
                          <ArrowUpRight className="tb-arrow size-4 shrink-0 text-muted" />
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[10px] text-muted">
              {[
                ["↑↓", "Navigate"],
                ["Enter", "Select"],
                ["Esc", "Close"],
              ].map(([key, text]) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <kbd className="rounded border border-gray-200 bg-white px-1 font-sans font-semibold">
                    {key}
                  </kbd>
                  {text}
                </span>
              ))}
              <span className="ml-auto" aria-live="polite">
                {flat.length} {flat.length === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ModeSwitch
        mode={shownMode}
        pending={pendingMode !== null}
        thumbRef={thumbRef}
        onRequest={setPendingMode}
      />

      {/* Right: actions, icon buttons, profile */}
      <div className="flex shrink-0 items-center gap-3 max-[850px]:gap-2">
        <QuickActions />

        <NotificationsMenu items={SAMPLE_NOTIFICATIONS} />

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
      <ConfirmDialog
        isOpen={pendingMode !== null}
        type="warning"
        title={`Switch to ${MODE_LABEL[dialogTarget]}?`}
        message={
          dialogTarget === "sandbox"
            ? "You will see Sandbox (test) data instead of Live data."
            : "You will see Live (real) data. Actions you take may affect real clients."
        }
        confirmText="Switch"
        cancelText="Stay"
        onClose={() => setPendingMode(null)}
        onConfirm={confirmModeSwitch}
      />
    </header>
  );
}
