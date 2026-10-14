import { subscriptions } from "@/data/subscriptions";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import SubscriptionBody from "./SubscriptionBody";
import OrderDrawer from "./OrderDrawer";

export default function SubscriptionDrawer({ id }: { id: string }) {
    const { openDrawer, closeLayers } = useApp();
    const s = subscriptions.find((x) => x.id === id);
    if (!s) return null;
    return (
        <Drawer
            title={id}
            kicker={s.customer}
            footer={
                <>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => openDrawer(<OrderDrawer id={s.order} />)}
                    >
                        View original order
                    </button>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={closeLayers}
                    >
                        Close
                    </button>
                </>
            }
        >
            <SubscriptionBody s={s} />
        </Drawer>
    );
}