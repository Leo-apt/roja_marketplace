import type { Batch } from "@/types";

export const initialBatches: Batch[] = [
    {
        id: "SET-2026-0901", payee: "ARS", status: "Paid", created: "2026-09-20",
        period: "1–19 Sep 2026", entries: ["ORD-1013-0", "ORD-1014-0", "ORD-1019-0"],
        amount: 3200, preparedBy: "Archive finance", approvedBy: "Archive controller",
        reference: "BANK-DEMO-0901", paid: "2026-09-20",
        note: "Historical supplier payout; a later credit is carried forward.",
        timeline: [["2026-09-20", "Payout confirmed", "Bank reference BANK-DEMO-0901"]],
    },
    {
        id: "SET-2026-1002", payee: "ARS", status: "Approved", created: "2026-10-05",
        period: "2 Oct 2026", entries: ["ORD-1002-0"],
        amount: 1200, preparedBy: "Archive finance", approvedBy: "Archive controller",
        reference: "",
        note: "Approved sample batch, not yet paid.",
        timeline: [
            ["2026-10-05", "Prepared", "Archive finance"],
            ["2026-10-06", "Approved", "Archive controller"],
        ],
    },
];