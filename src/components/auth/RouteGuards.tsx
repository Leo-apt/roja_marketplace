import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Loading = () => <div className="grid min-h-screen place-items-center text-sm text-muted">Loading…</div>;

export function RequireAuth() {
    const { user, ready } = useAuth();
    if (!ready) return <Loading />;
    return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnly() {
    const { user, ready } = useAuth();
    if (!ready) return <Loading />;
    return user ? <Navigate to="/catalog/product-categories" replace /> : <Outlet />;
}