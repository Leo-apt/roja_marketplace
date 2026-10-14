import type { Subscription } from "@/types";
import { Kv } from "@/components/shared/Kv";
import Tag from "@/components/shared/Tag";
import { money } from "@/utils/money";

export default function SubscriptionBody({ s }: { s: Subscription }) {
    return (
        <>
            <Kv
                items={[
                    ["Marketplace subscription", s.id],
                    ["Product / supplier", `${s.product} · ${s.provider}`],
                    ["Status", <Tag s={s.status} />],
                    ["Billing amount / interval", money(s.amount) + " / month"],
                    ["Next charge", s.status === "Cancelled" ? "None" : s.next],
                    ["Current term end", s.termEnd],
                    ["Trial end", s.status === "Trialing" ? "2026-10-21" : "Not trialing"],
                    ["Payment retries / grace", s.attempts ? `${s.attempts} attempts · Grace ends 10 Oct` : "No overdue renewal"],
                    ["Provider deactivation", /Cancel|Suspend/.test(s.status) ? "Tracked independently; verify provider response" : "Not requested"],
                    ["Current EWA stage", "Stage " + s.stage],
                ]}
            />
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">
                Billing, service entitlement, and EWA stage are independent. Cancellation may be immediate or term-end according to the approved product contract.
            </div>
        </>
    );
}