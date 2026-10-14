import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumb from "./Breadcrumb";
import PageSkeleton from "@/components/shared/SkeletonLoader";

export default function Layout() {
    const { drawer, dialog, closeDialog, closeLayers, setFilters, setSelected, toastMsg } = useApp();
    const { pathname } = useLocation();
    const [navOpen, setNavOpen] = useState(false);
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
            <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
            <main className="ml-[226px] min-w-0 max-[1180px]:ml-[198px] max-[850px]:ml-0 print:ml-0">
                <Topbar onMenu={() => setNavOpen((o) => !o)} />
                <div className="mx-auto max-w-[1650px] px-7 pb-8 pt-3 max-[1180px]:px-5 max-[850px]:px-4 max-[850px]:py-3 min-[1600px]:pt-4 print:max-w-none print:p-0">
                    <div className="z-[25] mb-[14px] bg-page pb-2 pt-0 min-[851px]:sticky min-[851px]:top-[70px] print:hidden">
                        <Breadcrumb />
                    </div>
                    {routeLoading ? <PageSkeleton /> : <Outlet />}
                </div>
            </main>
            {dialog && (
                <div
                    className="fixed inset-0 z-40 bg-[#10243f]/40 backdrop-blur-[2px] print:hidden"
                    onClick={closeDialog}
                />
            )}
            {drawer}
            {dialog}
            {toastMsg && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-[22px] left-1/2 z-[60] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[10px] bg-[#172e4d] px-[18px] py-3 text-xs text-white shadow-[0_10px_32px_#132d4710]"
                >
                    {toastMsg}
                </div>
            )}
        </>
    );
}