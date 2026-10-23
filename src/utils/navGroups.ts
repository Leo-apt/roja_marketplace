import { navGroups, type ViewKey } from "@/utils/views";

export type DisplayGroup = { label: string; items: ViewKey[] };

// Rename groups here (keys are lowercase versions of the original labels)
const RENAMES: Record<string, string> = {
    catalog: "Marketplace",
    entity: "Business",
    entities: "Business",
};

// Display order. Any group not listed goes after these, in its original order.
const ORDER = ["General", "Business", "Marketplace", "Tools"];

const rank = (label: string) => {
    const i = ORDER.indexOf(label);
    return i === -1 ? ORDER.length : i;
};

const built: DisplayGroup[] = [
    { label: "General", items: ["overview"] },

    ...navGroups
        .map((g) => ({
            label: RENAMES[g.label.toLowerCase()] ?? g.label,
            // Dashboard lives under General
            items: (g.items as ViewKey[]).filter((k) => k !== "overview"),
        }))
        .filter((g) => g.items.length > 0),
];

// Array.prototype.sort is stable, so unlisted groups keep their original order
export const displayGroups: DisplayGroup[] = [...built].sort((a, b) => rank(a.label) - rank(b.label));