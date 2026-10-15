import { useLocation, useNavigate } from "react-router-dom";
import { navGroups, viewInfo } from "@/utils/views";
import logo from "@/assets/logo.png";

export default function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <aside
            aria-label="Marketplace navigation"
            className={`fixed inset-y-0 left-0 z-[15] flex w-[226px] flex-col border-r border-sidebar-border bg-sidebar-bg shadow-[2px_0_8px_rgba(15,23,42,0.04)] px-4 py-6 text-sidebar-text transition-transform duration-150 max-[1180px]:w-[198px] max-[850px]:-translate-x-full print:hidden ${open ? "max-[850px]:translate-x-0" : ""
                }`}
        >
            <div className="flex items-center justify-center px-1 pb-5 pt-1">
                <img src={logo} alt="Roja Marketplace" className="h-14 w-auto max-w-full object-contain" />
            </div>
            {navGroups.map((g) => (
                <div key={g.label}>
                    <div className="px-3 pb-[9px] pt-3.5 text-[10px] font-semibold uppercase tracking-[1.6px] text-sidebar-group">{g.label}</div>
                    {g.items.map((k) => {
                        const v = viewInfo[k];
                        const active = pathname === v.path || pathname.startsWith(v.path + "/");
                        return (
                            <button
                                key={k}
                                aria-current={active ? "page" : undefined}
                                onClick={() => {
                                    navigate(v.path);
                                    onNavigate();
                                }}
                                className={`my-0.5 flex w-full items-center gap-3 rounded-lg border px-3 py-[11px] text-left text-[13px] hover:bg-sidebar-hover hover:text-sidebar-text-active ${active ? "border-sidebar-active-border bg-sidebar-active font-semibold text-sidebar-text-active shadow-sm" : "border-transparent"}`}
                            >
                                <span className="w-[18px] text-center text-[17px] text-sidebar-icon" aria-hidden="true">{v.icon}</span>
                                {v.nav}
                            </button>
                        );
                    })}
                </div>
            ))}
            <div className="mt-auto border-t border-sidebar-divider px-3 pt-[17px] text-[11px] text-sidebar-group">
                <strong className="block text-sidebar-text-active">ROJA · US marketplace</strong>
                USD · Reporting timezone: UTC
                <br />
                Sample data only. No live payments.
            </div>
        </aside>
    );
}