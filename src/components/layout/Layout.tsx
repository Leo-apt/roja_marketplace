import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumb from "./Breadcrumb";
import PageSkeleton from "@/components/shared/SkeletonLoader";

export default function Layout() {
    const { drawer, dialog, closeDialog, closeLayers, setFilters, setSelected } = useApp();
    const { pathname } = useLocation();
    const [navOpen, setNavOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem("sidebar-collapsed") === "1"; } catch { return false; }
    });
    useEffect(() => {
        try { localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0"); } catch { /* ignore */ }
    }, [collapsed]);
    const [loadedPath, setLoadedPath] = useState("");
    const routeLoading = loadedPath !== pathname;

    useEffect(() => {
        setFilters({ q: "", status: "all", tab: "all", negative: false });
        setSelected(new Set());
        closeLayers();
        window.scrollTo(0, 0);
    }, [pathname, setFilters, setSelected, closeLayers]);

    useEffect(() => {
        const t = window.setTimeout(() => setLoadedPath(pathname), 800);
        return () => window.clearTimeout(t);
    }, [pathname]);

    return (
        <>
            <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            <main className={`min-w-0 transition-[margin] duration-300 ease-in-out max-[850px]:ml-0 print:ml-0 ${collapsed ? "ml-[250px] min-[851px]:ml-20" : "ml-[250px] max-[1180px]:ml-[220px]"}`}>
                <Topbar onMenu={() => setNavOpen((o) => !o)} />
                <div className="mx-auto max-w-[1650px] px-7 pb-8 pt-0 max-[1180px]:px-5 max-[850px]:px-4 max-[850px]:py-3 print:max-w-none print:p-0">
                    <div className="z-[25] mb-[14px] pb-2 min-[851px]:sticky min-[851px]:top-[70px] min-[851px]:-mx-5 min-[851px]:bg-white/40 min-[851px]:px-5 min-[851px]:pt-3 min-[851px]:backdrop-blur-md min-[1181px]:-mx-7 min-[1181px]:px-7 min-[1600px]:pt-4 print:hidden">
                        <Breadcrumb />
                    </div>
                    {routeLoading ? <PageSkeleton /> : <Outlet />}
                </div>
            </main>
            {dialog && (
                <div
                    className="fixed inset-0 z-40 bg-overlay/40 backdrop-blur-[2px] print:hidden"
                    onClick={closeDialog}
                />
            )}
            {drawer}
            {dialog}
        </>
    );
}