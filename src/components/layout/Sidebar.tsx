import { useLocation, useNavigate } from "react-router-dom";
import { navGroups, viewInfo } from "@/utils/views";

export default function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <aside
            aria-label="Marketplace navigation"
            className={`fixed inset-y-0 left-0 z-[15] flex w-[226px] flex-col bg-nav px-4 py-6 text-navmuted transition-transform duration-150 max-[1180px]:w-[198px] max-[850px]:-translate-x-full print:hidden ${open ? "max-[850px]:translate-x-0" : ""
                }`}
        >
            <div className="flex items-center gap-[11px] px-[9px] pb-6 pt-0.5 text-white">
                <div className="grid size-[37px] place-items-center rounded-[9px] bg-white text-[22px] font-extrabold text-[#235fce]">R</div>
                <div>
                    <strong className="text-lg tracking-[1.5px]">ROJA</strong>
                    <small className="block text-[10px] tracking-[0.8px] text-[#9badc8]">BUSINESS CONSOLE</small>
                </div>
            </div>
            {navGroups.map((g) => (
                <div key={g.label}>
                    <div className="px-3 pb-[9px] pt-3.5 text-[10px] font-semibold uppercase tracking-[1.6px] text-[#7e91ae]">{g.label}</div>
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
                                className={`my-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-[11px] text-left text-[13px] hover:bg-navhover hover:text-white ${active ? "bg-navactive font-semibold text-white" : ""
                                    }`}
                            >
                                <span className="w-[18px] text-center text-[17px] opacity-85" aria-hidden="true">{v.icon}</span>
                                {v.nav}
                            </button>
                        );
                    })}
                </div>
            ))}
            <div className="mt-auto border-t border-[#2b3e58] px-3 pt-[17px] text-[11px]">
                <strong className="block text-[#dce5f4]">ROJA · US marketplace</strong>
                USD · Reporting timezone: UTC
                <br />
                Sample data only. No live payments.
            </div>
        </aside>
    );
}