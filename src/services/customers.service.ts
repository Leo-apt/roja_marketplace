import { apiCall } from "@/services/auth.service";

export interface CustomerRec {
    id: string; stripeId: string; name: string; email: string; phone: string;
    live: boolean; // true = Live, false = Sandbox
}
interface ApiCustomer {
    _id: string; stripeId: string; name?: string | null; email?: string | null; phone?: string | null; livemode: boolean;
}

export const customersService = {
    listPage: async (page: number, limit: number, search = "", mode = "all") => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) qs.set("search", search);
        if (mode !== "all") qs.set("mode", mode);
        type Page = ApiCustomer[] | { items?: ApiCustomer[]; total?: number };
        const r = await apiCall<Page>(`/customers?${qs}`);
        const d = r.data;
        const items = Array.isArray(d) ? d : (d?.items ?? []);
        const total = Array.isArray(d) ? (r.meta?.total ?? items.length) : (d?.total ?? r.meta?.total ?? items.length);
        return {
            rows: items.map((c): CustomerRec => ({
                id: c._id, stripeId: c.stripeId, name: c.name ?? "", email: c.email ?? "", phone: c.phone ?? "", live: c.livemode,
            })),
            total,
        };
    },
};