export default function Tabs({ tabs, value, onChange, label }: { tabs: [string, string][]; value: string; onChange: (k: string) => void; label: string }) {
    return (
        <div role="tablist" aria-label={label} className="flex shrink-0 overflow-auto border-b border-line px-3">
            {tabs.map(([k, t]) => (
                <button
                    key={k}
                    role="tab"
                    aria-selected={value === k}
                    onClick={() => onChange(k)}
                    className={`whitespace-nowrap border-b-2 px-[13px] py-3.5 text-xs ${value === k ? "border-brand font-semibold text-brand" : "border-transparent text-muted"
                        }`}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}