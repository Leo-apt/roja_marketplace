import type { Status } from "@/data/catalog";

export interface InstanceProduct {
    id: string; name: string; category: string; retail: number; discount: string; shortDescription: string; status: Status;
}
export interface Instance {
    id: string; name: string; description: string; imageUrl: string; status: Status; products: InstanceProduct[];
}

const prod = (id: string, name: string, category: string, retail: number, discount: string, shortDescription: string, status: Status = "Active"): InstanceProduct =>
    ({ id, name, category, retail, discount, shortDescription, status });

export const instances: Instance[] = [
    {
        id: "i1", name: "Roja Main", description: "Primary production instance.", imageUrl: "", status: "Active",
        products: [
            prod("p1", "Financial +", "Finance", 9.99, "10%", "Expert financial guidance."),
            prod("p2", "Auto Care Plus", "Auto", 12.99, "$1.00", "Roadside and mechanic support."),
            prod("p3", "Health Essentials", "Health", 14.99, "No discount", "Vitamins and 24-hour nurseline.", "Inactive"),
        ],
    },
    {
        id: "i2", name: "Partner Sandbox", description: "Testing instance for partners.", imageUrl: "", status: "Inactive",
        products: [prod("p4", "Travel Shield", "Travel", 8.99, "No discount", "Travel protection plan.")],
    },
    { id: "i3", name: "Demo Instance", description: "Empty demo instance.", imageUrl: "", status: "Active", products: [] },
];