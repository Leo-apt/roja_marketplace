import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { Search, X } from "lucide-react";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
    const { role, setRole } = useApp();
    const { user, logout } = useAuth();
    const [confirmOut, setConfirmOut] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [query, setQuery] = useState("");
    const initials = (user?.user_email ?? "U").slice(0, 2).toUpperCase();
    return (
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-topbar-border bg-topbar-bg pl-7 pr-9 max-[1180px]:px-5 max-[850px]:h-auto max-[850px]:min-h-[65px] max-[850px]:px-4 max-[850px]:py-2.5 print:hidden">
            <div className="flex items-center gap-3">
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50 min-[851px]:hidden"
                    onClick={onMenu}
                    aria-label="Toggle navigation"
                >
                    ☰
                </button>
                <div className="relative w-[340px] max-w-full max-[1180px]:w-[260px] max-[850px]:w-[180px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search…"
                        aria-label="Search"
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-xs text-ink shadow-sm placeholder:text-muted outline-none transition hover:border-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    {query && (
                        <button type="button" aria-label="Clear search" onClick={() => setQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-5 max-[850px]:gap-3">
                <Dropdownbox
                    name="role"
                    value={role}
                    options={[
                        { value: "preparer", label: "Alex · Finance preparer" },
                        { value: "approver", label: "Taylor · Finance approver" },
                        { value: "operations", label: "Morgan · Operations" },
                    ]}
                    onChange={(e) => setRole(e.target.value as Role)}
                    rounded="rounded-lg"
                    compact
                    className="w-[240px] max-[850px]:w-[167px]"
                />
                <div className="ml-1 grid size-9 shrink-0 place-items-center rounded-full bg-topbar-avatar-bg text-[11px] font-bold text-topbar-avatar-text" title={user?.user_email}>{initials}</div>

                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] text-xs font-semibold text-ink hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg"
                    onClick={() => setConfirmOut(true)}
                >
                    Logout
                </button>
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