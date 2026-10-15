import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

type QuickAction = { label: string; hint: string; onSelect: () => void };

// TODO: wire each onSelect to your real routes / modals
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "New invoice",
    hint: "Create and send an invoice",
    onSelect: () => {},
  },
  {
    label: "Add expense",
    hint: "Record a business expense",
    onSelect: () => {},
  },
  {
    label: "Upload receipt",
    hint: "Scan or attach a receipt",
    onSelect: () => {},
  },
  {
    label: "Generate report",
    hint: "P&L, balance sheet and more",
    onSelect: () => {},
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
  "border border-gray-200/80 bg-white shadow-sm outline-none transition-all duration-200 ease-out " +
  "hover:-translate-y-px hover:border-gray-300 hover:shadow-md active:translate-y-0 active:scale-[0.97] " +
  "focus-visible:ring-2 focus-visible:ring-brand/30";

/** Popover panel that animates in and out instead of mounting/unmounting. */
function popoverClass(open: boolean) {
  return (
    "absolute right-0 top-[calc(100%+10px)] z-50 origin-top-right overflow-hidden rounded-2xl " +
    "border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 " +
    "transition-[opacity,transform,visibility] duration-200 ease-out " +
    (open
      ? "visible translate-y-0 scale-100 opacity-100"
      : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0")
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
        <span className="grid size-9 place-items-center rounded-xl bg-topbar-avatar-bg text-topbar-avatar-text transition-transform duration-300 ease-out hover:rotate-6">
          <Zap className="size-[18px]" />
        </span>
        <span className="flex flex-col items-start leading-tight max-[850px]:hidden">
          <span className="text-xs font-bold text-ink">Quick Actions</span>
          <span className="text-[11px] text-muted">Shortcuts &amp; Tools</span>
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-300 ease-out max-[850px]:hidden ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`${popoverClass(open)} w-72 p-1.5`}
      >
        <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Quick actions
        </p>
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              a.onSelect();
            }}
            className="flex w-full flex-col rounded-xl px-2.5 py-2 text-left leading-tight transition-colors duration-150 hover:bg-gray-50"
          >
            <span className="text-xs font-semibold text-ink">{a.label}</span>
            <span className="text-[11px] text-muted">{a.hint}</span>
          </button>
        ))}
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
          className={`size-4 text-muted transition-transform duration-300 ease-out max-[850px]:hidden ${
            open ? "rotate-180" : ""
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
                @keyframes topbar-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    header { animation: none !important; }
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
          className={`relative w-full max-w-[340px] rounded-xl transition-all duration-300 ease-out ${
            focused ? "max-w-[440px] shadow-[0_0_0_4px] shadow-brand/10" : ""
          }`}
        >
          <Search
            className={`pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200 ${
              focused ? "text-brand" : "text-muted"
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
            placeholder="Search…"
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
            className={`absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted transition-all duration-200 hover:bg-gray-100 hover:text-ink ${
              query
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0"
            }`}
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

        <IconButton label="Settings" className="max-[640px]:hidden">
          <Settings className="size-[18px] transition-transform duration-500 group-hover:rotate-90" />
        </IconButton>

        <IconButton label="Log out" onClick={() => setConfirmOut(true)}>
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
