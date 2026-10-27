import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface DatePickerProps {
    label?: ReactNode;
    name?: string;
    value: string; // "YYYY-MM-DD"
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parseValue = (value: string): Date | null => {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const formatValue = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// 7 Oct 2026
const formatDisplay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

export default function DatePicker({
    label, name, value, onChange, className = "", placeholder = "Select date", minDate, maxDate,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const selected = parseValue(value);
    const [viewDate, setViewDate] = useState(() => selected ?? new Date());
    const wrapperRef = useRef<HTMLDivElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const toggle = () => {
        if (!open && wrapperRef.current) {
            const r = wrapperRef.current.getBoundingClientRect();
            const H = 380, W = 288; // calendar height and width
            setPos({
                top: r.bottom + 8 + H > window.innerHeight ? Math.max(8, r.top - H - 8) : r.bottom + 8, // opens upward near the bottom
                left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)),
            });
        }
        setOpen((o) => !o);
    };

    useEffect(() => {
        if (selected) setViewDate(selected);
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener("scroll", close, true); // true = also catches the drawer scroll
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [open]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (wrapperRef.current?.contains(t) || popRef.current?.contains(t)) return;
            setOpen(false);
        };
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const min = minDate ? parseValue(minDate) : null;
    const max = maxDate ? parseValue(maxDate) : null;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = toDateOnly(new Date());

    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
        cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date;
        cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }

    const isDisabled = (d: Date) => !!((min && d < min) || (max && d > max));
    const todayDisabled = isDisabled(today);

    const handleSelect = (d: Date) => {
        if (isDisabled(d)) return;
        onChange(formatValue(d));
        setOpen(false);
    };

    const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>}

            {/* The whole field is the button, so a click anywhere opens the calendar */}
            <button
                type="button"
                name={name}
                onClick={toggle}
                className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-[7px] text-start text-xs transition-colors hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
                <Calendar className="size-4 shrink-0 text-brand" />
                <span className={`flex-1 truncate ${selected ? "text-ink" : "text-gray-400"}`}>
                    {selected ? formatDisplay(selected) : placeholder}
                </span>
                <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && createPortal(
                <div ref={popRef} style={{ top: pos.top, left: pos.left }} className="fixed z-[100] w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <button type="button" onClick={() => goMonth(-1)} className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900">{MONTHS[month]} {year}</span>
                        <button type="button" onClick={() => goMonth(1)} className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>

                    <div className="mb-1 grid grid-cols-7">
                        {WEEKDAYS.map((w) => (
                            <div key={w} className="py-1 text-center text-[10px] font-semibold text-gray-400">{w}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map(({ date, inMonth }, idx) => {
                            const isSelected = !!selected && toDateOnly(date).getTime() === toDateOnly(selected).getTime();
                            const isToday = toDateOnly(date).getTime() === today.getTime();
                            const disabled = isDisabled(date);
                            return (
                                <button
                                    type="button"
                                    key={idx}
                                    disabled={disabled}
                                    onClick={() => handleSelect(date)}
                                    className={[
                                        "mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-xs transition-colors",
                                        !inMonth ? "text-gray-300" : "text-gray-700",
                                        disabled ? "cursor-not-allowed opacity-30" : "hover:bg-brand/10",
                                        isSelected ? "bg-brand font-semibold text-white hover:bg-brand" : "",
                                        isToday && !isSelected ? "border border-brand font-semibold" : "",
                                    ].join(" ")}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            disabled={todayDisabled}
                            onClick={() => handleSelect(new Date())}
                            className="cursor-pointer text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                        >
                            Today
                        </button>
                        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-xs font-semibold text-gray-400 hover:text-gray-600">
                            Close
                        </button>
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}