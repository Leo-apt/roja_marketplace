export default function Tabs({ tabs, value, onChange, label, large = false }: { tabs: [string, string][]; value: string; onChange: (k: string) => void; label: string; large?: boolean }) {
    return (
        <div role="tablist" aria-label={label} className="flex shrink-0 overflow-auto border-b border-line px-3">
            {tabs.map(([k, t]) => (
                <button
                    key={k}
                    role="tab"
                    aria-selected={value === k}
                    onClick={() => onChange(k)}
                    className={`whitespace-nowrap border-b-2 ${large ? "px-5 py-4 text-sm" : "px-[13px] py-3.5 text-xs"} ${value === k
                        ? `border-brand text-brand ${large ? "font-bold" : "font-semibold"}`
                        : `border-transparent text-muted ${large ? "font-semibold hover:text-ink" : ""}`
                        }`}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}