import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Dropdownbox from "@/components/shared/Dropdownbox";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
    const { role, setRole } = useApp();
    const { user, logout } = useAuth();
    const [confirmOut, setConfirmOut] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const initials = (user?.user_email ?? "U").slice(0, 2).toUpperCase();
    return (
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-line bg-white pl-7 pr-9 max-[1180px]:px-5 max-[850px]:h-auto max-[850px]:min-h-[65px] max-[850px]:px-4 max-[850px]:py-2.5 print:hidden">
            <div className="flex items-center gap-2.5">
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50 min-[851px]:hidden"
                    onClick={onMenu}
                    aria-label="Toggle navigation"
                >
                    ☰
                </button>
            </div>
            <div className="flex items-center gap-5 max-[850px]:gap-3">
                <span className="inline-flex shrink-0 items-center rounded-md bg-brandsoft px-3 py-1 text-[11px] font-semibold text-brand">ROJA · US</span>
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
                <div className="ml-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#e9efff] text-[11px] font-bold text-[#2758ae]" title={user?.user_email}>{initials}</div>
                <span className="max-w-[170px] truncate text-xs text-muted max-[1180px]:hidden">{user?.user_email}</span>
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] text-xs font-semibold text-ink hover:border-[#bfd0ec] hover:bg-[#f4f7fe]"
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