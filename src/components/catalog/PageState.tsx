import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { btn } from "./FormBits";
import PageSkeleton from "@/components/shared/SkeletonLoader";

export const LoadingBox = () => <PageSkeleton />;

export function ErrorBox({ message, onRetry, backTo }: { message: string; onRetry?: () => void; backTo?: string }) {
    const nav = useNavigate();
    return (
        <div className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <strong className="block text-bad">{message}</strong>
            <div className="mt-3 flex justify-center gap-2">
                {onRetry && <button className={btn.brand} onClick={onRetry}>Retry</button>}
                {backTo && <button className={btn.secondary} onClick={() => nav(backTo)}>Back to list</button>}
            </div>
        </div>
    );
}

export const useIsAdmin = () => useAuth().user?.user_role === "admin";

export const AdminNotice = () => (
    <div className="rounded-xl border border-line bg-white px-5 py-12 text-center">
        <strong className="block text-ink">Admin access required</strong>
        <p className="mt-1 text-sm text-muted">Your account does not have permission to manage categories.</p>
    </div>
);