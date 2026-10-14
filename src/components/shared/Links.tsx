import type { ReactNode } from "react";
import { useApp } from "@/hooks/useApp";
import OrderDrawer from "@/components/drawers/OrderDrawer";
import ProductDrawer from "@/components/drawers/ProductDrawer";
import SubscriptionDrawer from "@/components/drawers/SubscriptionDrawer";
import BatchDrawer from "@/components/drawers/BatchDrawer";

export function OrderLink({ id }: { id: string }) {
    const { openDrawer } = useApp();
    return (
        <button className="border-0 bg-transparent p-0 text-left font-mono text-xs font-semibold text-brand" onClick={() => openDrawer(<OrderDrawer id={id} />)}>
            {id}
        </button>
    );
}

export function ProductLink({ id, children }: { id: string; children: ReactNode }) {
    const { openDrawer } = useApp();
    return (
        <button className="border-0 bg-transparent p-0 text-left font-semibold text-brand" onClick={() => openDrawer(<ProductDrawer id={id} />)}>
            {children}
        </button>
    );
}

export function SubLink({ id, children, mono }: { id: string; children: ReactNode; mono?: boolean }) {
    const { openDrawer } = useApp();
    return (
        <button
            className={`border-0 bg-transparent p-0 text-left font-semibold text-brand ${mono ? "font-mono text-xs" : ""}`}
            onClick={() => openDrawer(<SubscriptionDrawer id={id} />)}
        >
            {children}
        </button>
    );
}

export function BatchLink({ id, children, mono }: { id: string; children: ReactNode; mono?: boolean }) {
    const { openDrawer } = useApp();
    return (
        <button
            className={`border-0 bg-transparent p-0 text-left font-semibold text-brand ${mono ? "font-mono text-xs" : ""}`}
            onClick={() => openDrawer(<BatchDrawer id={id} />)}
        >
            {children}
        </button>
    );
}