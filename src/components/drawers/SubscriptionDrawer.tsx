import { subscriptions } from "@/data/subscriptions";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import SubscriptionBody from "./SubscriptionBody";
import OrderDrawer from "./OrderDrawer";
import { btn } from "@/components/catalog/FormBits";

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
                        className={btn.secondary}
                        onClick={() => openDrawer(<OrderDrawer id={s.order} />)}
                    >
                        View original order
                    </button>
                    <button
                        className={btn.secondary}
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