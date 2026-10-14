import type { Product } from "@/types";

export const products: Product[] = [
    { id: "PRD-001", sku: "ARS-RA-M", name: "Roadside Assistance", category: "Assistance service", type: "Subscription", provider: "ARS", price: 1499, cost: 900, status: "Active", version: "P3 / C2", components: [] },
    { id: "PRD-002", sku: "ARS-BEN-M", name: "Benefit Membership", category: "Discount benefits", type: "Subscription", provider: "ARS", price: 1999, cost: 1200, status: "Active", version: "P2 / C1", components: [] },
    { id: "PRD-003", sku: "WEL-CAP-60", name: "Wellness Capsules · 60 caps", category: "Physical supplement", type: "One-time", provider: "Wellness supplier (sample)", price: 2400, cost: 1400, status: "Active", version: "P1 / C1", components: [] },
    {
        id: "PRD-004", sku: "ARS-FAM-M", name: "Family Assist Bundle", category: "Service bundle", type: "Subscription", provider: "ARS", price: 2999, cost: 2000, status: "Active", version: "B2 / P2 / C1",
        components: [["Roadside Assistance", 1499, 900], ["Benefit Membership", 1500, 1100]],
    },
    { id: "PRD-005", sku: "ARS-LEGAL-1", name: "Legal Assistance", category: "Assistance service", type: "One-time", provider: "ARS", price: 4900, cost: 3000, status: "Active", version: "P1 / C1", components: [] },
    { id: "PRD-006", sku: "ARS-DENT-M", name: "Dental Savings", category: "Discount benefits", type: "Subscription", provider: "ARS", price: 1200, cost: 700, status: "Draft", version: "Draft P1", components: [] },
    { id: "PRD-007", sku: "ARS-EMG-M", name: "Emergency Assistance", category: "Assistance service", type: "Subscription", provider: "ARS", price: 999, cost: 700, status: "Archived", version: "P1 / C1", components: [] },
    {
        id: "PRD-008", sku: "WEL-START-2", name: "Wellness Starter Bundle", category: "Physical bundle", type: "One-time", provider: "Wellness supplier (sample)", price: 4200, cost: 2600, status: "Active", version: "B1 / P1 / C1",
        components: [["Wellness Capsules · bottle A", 2100, 1300], ["Wellness Capsules · bottle B", 2100, 1300]],
    },
];

export const getProduct = (id: string): Product => {
    const p = products.find((x) => x.id === id);
    if (!p) throw new Error(`Unknown product ${id}`);
    return p;
};