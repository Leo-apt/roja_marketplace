import { useLocation, useNavigate } from "react-router-dom";
import { navGroups, viewInfo } from "@/utils/views";
import logo from "@/assets/logo.png";
import logoIcon from "@/assets/logo-icon.png";
import { ChevronLeft } from "lucide-react";

export default function Sidebar({ open, onNavigate, collapsed, onToggle }: {
    open: boolean; onNavigate: () => void; collapsed: boolean; onToggle: () => void;
}) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <aside
                aria-label="Marketplace navigation"
                className={`fixed inset-y-0 left-0 z-[15] flex w-[226px] flex-col overflow-x-hidden border-r border-sidebar-border bg-sidebar-bg shadow-[2px_0_8px_rgba(15,23,42,0.04)] px-4 py-6 text-sidebar-text transition-[width,transform] duration-300 ease-in-out max-[850px]:-translate-x-full print:hidden ${collapsed ? "min-[851px]:w-20" : "max-[1180px]:w-[198px]"} ${open ? "max-[850px]:translate-x-0" : ""}`}
            >
                <div className={`relative mt-1 shrink-0 transition-all duration-300 ${collapsed ? "mb-5 h-14 min-[851px]:mb-4 min-[851px]:h-12" : "mb-5 h-14"}`}>
                    <img src={logo} alt="Roja Marketplace"
                        className={`absolute inset-0 m-auto h-14 w-auto max-w-full object-contain transition-opacity duration-300 ${collapsed ? "min-[851px]:pointer-events-none min-[851px]:opacity-0" : "opacity-100"}`} />
                    <img src={logoIcon} alt="Roja"
                        className={`absolute inset-0 m-auto size-12 object-contain opacity-0 transition-opacity duration-300 ${collapsed ? "min-[851px]:opacity-100" : ""}`} />
                </div>
                <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                    {navGroups.map((g) => (
                        <div key={g.label}>
                            <div className={`overflow-hidden whitespace-nowrap px-3 pb-[9px] pt-3.5 text-[10px] font-semibold uppercase tracking-[1.6px] text-sidebar-group transition-all duration-300 ${collapsed ? "min-[851px]:max-h-0 min-[851px]:py-0 min-[851px]:opacity-0" : "max-h-10 opacity-100"}`}>{g.label}</div>
                            {g.items.map((k) => {
                                const v = viewInfo[k];
                                const active = pathname === v.path || pathname.startsWith(v.path + "/");
                                return (
                                    <button
                                        key={k}
                                        title={collapsed ? v.nav : undefined}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => {
                                            navigate(v.path);
                                            onNavigate();
                                        }}
                                        className={`my-0.5 flex w-full items-center gap-3 rounded-lg border px-3 py-[11px] text-left text-[13px] transition-all duration-300 hover:bg-sidebar-hover hover:text-sidebar-text-active ${collapsed ? "min-[851px]:justify-center min-[851px]:gap-0 min-[851px]:px-0" : ""} ${active ? "border-sidebar-active-border bg-sidebar-active font-semibold text-sidebar-text-active shadow-sm" : "border-transparent"}`}
                                    >
                                        <span className="w-[18px] text-center text-[17px] text-sidebar-icon" aria-hidden="true">{v.icon}</span>
                                        <span className={`truncate transition-all duration-300 ${collapsed ? "min-[851px]:max-w-0 min-[851px]:opacity-0" : "max-w-[170px] opacity-100"}`}>{v.nav}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="shrink-0 hidden border-t border-sidebar-divider pt-3 min-[851px]:block">
                    <button
                        type="button"
                        onClick={onToggle}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/10 py-2 text-sidebar-text-active transition-all duration-300 hover:bg-white/20 active:scale-95"
                    >
                        <ChevronLeft className={`size-6 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </aside>
        </>
    );
}