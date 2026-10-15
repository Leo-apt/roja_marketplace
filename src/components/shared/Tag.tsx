import { statusColor } from "@/utils/status";

const styles: Record<string, string> = {
    good: "bg-goodbg text-good",
    warn: "bg-warnbg text-warn",
    bad: "bg-badbg text-bad",
    blue: "bg-brandsoft text-brand",
    purple: "bg-purplebg text-purple",
    "": "bg-tag-neutral-bg text-tag-neutral-text",
};

export default function Tag({ s, c }: { s: string; c?: string }) {
    return (
        <span className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-md px-2 py-[3px] text-[10px] font-semibold ${styles[c ?? statusColor(s)] ?? styles[""]}`}>
            {s}
        </span>
    );
}