import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
    value: string;
    label: string;
    sublabel?: string;
    title?: string;
    disabled?: boolean;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    searchable?: boolean;
    error?: string;
    className?: string;
    required?: boolean;
    name?: string;
    rounded?: string;
    buttonClassName?: string;
    footerAction?: { label: string; onClick: () => void };
    compact?: boolean;
    onOpen?: () => void;
    loading?: boolean;
}

const Dropdownbox: React.FC<DropdownProps> = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    label,
    disabled = false,
    searchable = false,
    error = "",
    className = "",
    required = false,
    name = "",
    rounded = "rounded-xl",
    buttonClassName = "",
    footerAction,
    compact = false,
    onOpen,
    loading = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = searchable
        ? options.filter((opt) =>
            `${opt.label} ${opt.sublabel ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        : options;

    const closeMenu = () => {
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleSelect = (option: DropdownOption) => {
        onChange({ target: { name, value: option.value } });
        closeMenu();
        buttonRef.current?.focus();
    };

    const findEnabledIndex = (start: number, step: 1 | -1) => {
        const n = filteredOptions.length;
        if (n === 0) return -1;
        const from = start < 0 && step === -1 ? 0 : start;
        for (let k = 1; k <= n; k++) {
            const idx = (((from + step * k) % n) + n) % n;
            if (!filteredOptions[idx].disabled) return idx;
        }
        return -1;
    };

    // Keyboard handling (always points at the latest render)
    const handleKeyRef = useRef<(e: KeyboardEvent) => void>(() => { });
    handleKeyRef.current = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                e.stopPropagation();
                setHighlightedIndex((i) => findEnabledIndex(i, 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                e.stopPropagation();
                setHighlightedIndex((i) => findEnabledIndex(i, -1));
                break;
            case "Enter": {
                e.preventDefault();
                e.stopPropagation();
                const option = filteredOptions[highlightedIndex];
                if (option && !option.disabled) handleSelect(option);
                break;
            }
            case "Escape":
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                buttonRef.current?.focus();
                break;
            case "Tab":
                closeMenu();
                break;
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const listener = (e: KeyboardEvent) => handleKeyRef.current(e);
        document.addEventListener("keydown", listener, true);
        return () => document.removeEventListener("keydown", listener, true);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const firstEnabled = filteredOptions.findIndex((o) => !o.disabled);
        if (searchTerm.trim()) {
            setHighlightedIndex(firstEnabled);
        } else {
            const current = filteredOptions.findIndex((o) => o.value === value && !o.disabled);
            setHighlightedIndex(current !== -1 ? current : firstEnabled);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, searchTerm]);

    useEffect(() => {
        if (!isOpen || !menuPos || highlightedIndex < 0) return;
        const list = listRef.current;
        const el = list?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
        if (!list || !el) return;
        const listRect = list.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        if (elRect.top < listRect.top) list.scrollTop -= listRect.top - elRect.top;
        else if (elRect.bottom > listRect.bottom) list.scrollTop += elRect.bottom - listRect.bottom;
    }, [highlightedIndex, isOpen, !!menuPos]);

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled || isOpen) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    // Tell the parent when the menu opens (click or arrow key)
    useEffect(() => {
        if (isOpen) onOpen?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedTrigger = dropdownRef.current && dropdownRef.current.contains(target);
            const clickedMenu = menuRef.current && menuRef.current.contains(target);
            if (!clickedTrigger && !clickedMenu) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Position the portaled menu under the button; close on page scroll
    useLayoutEffect(() => {
        if (!isOpen || !buttonRef.current) return;
        const updatePosition = () => {
            const rect = buttonRef.current!.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        };
        updatePosition();

        const handleScroll = (event: Event) => {
            if (menuRef.current && menuRef.current.contains(event.target as Node)) return;
            setIsOpen(false);
            setSearchTerm("");
        };

        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    // Flip upward if the menu doesn't fit below
    useLayoutEffect(() => {
        if (!isOpen || !menuRef.current || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current.getBoundingClientRect().height;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            setMenuPos({ top: rect.top - menuHeight - 4, left: rect.left, width: rect.width });
        }
    }, [isOpen, menuPos?.top, filteredOptions.length]);

    return (
        <div ref={dropdownRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-xs font-semibold text-label">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleTriggerKeyDown}
                disabled={disabled}
                className={`
                    flex w-full items-center justify-between gap-2 text-left
                    transition-all duration-200 ease-in-out
                    focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20
                    ${compact ? "min-h-9 px-2.5 py-[7px] text-xs" : "px-4 py-2.5 text-sm"}
                    ${disabled
                        ? `cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 ${rounded}`
                        : error
                            ? `cursor-pointer border-2 border-red-400 bg-white hover:border-red-500 focus:border-red-500! focus:ring-4! focus:ring-red-200! ${rounded}`
                            : `cursor-pointer border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 ${rounded}`
                    }
                    ${buttonClassName}
                `}
            >
                <span
                    title={selectedOption?.title}
                    className={`truncate ${!selectedOption ? "text-gray-500" : "text-gray-700"}`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && menuPos && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[100000] min-w-max overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                    style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width }}
                >
                    {searchable && (
                        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <ul ref={listRef} role="listbox" className="thin-scrollbar max-h-48 overflow-y-auto py-1">
                        {loading ? (
                            [0, 1, 2].map((i) => (
                                <li key={i} className="px-4 py-2.5" aria-hidden="true">
                                    <div className="h-4 animate-pulse rounded bg-gray-200" style={{ width: `${75 - i * 15}%` }} />
                                </li>
                            ))
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isSelected = option.value === value;
                                const isHighlighted = index === highlightedIndex;
                                return (
                                    <li
                                        key={option.value}
                                        data-index={index}
                                        title={option.title}
                                        onClick={() => !option.disabled && handleSelect(option)}
                                        onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                                        className={`
                                            flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150
                                            ${option.disabled
                                                ? "cursor-not-allowed bg-gray-50 text-gray-300"
                                                : isSelected
                                                    ? `font-medium text-brand ${isHighlighted ? "bg-brand/20" : "bg-brand/10"}`
                                                    : `text-gray-700 ${isHighlighted ? "bg-gray-100" : ""}`
                                            }
                                        `}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate">{option.label}</span>
                                            {option.sublabel && (
                                                <span className="mt-0.5 truncate text-[11px] font-normal leading-tight text-gray-400">
                                                    {option.sublabel}
                                                </span>
                                            )}
                                        </span>
                                        {isSelected && (
                                            <svg className="ml-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-3 text-center text-sm text-gray-400">No options found</li>
                        )}
                    </ul>

                    {footerAction && (
                        <button
                            type="button"
                            onClick={() => {
                                closeMenu();
                                footerAction.onClick();
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 border-t border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-gray-50"
                        >
                            <span className="text-base leading-none">+</span>
                            {footerAction.label}
                        </button>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
};

export default Dropdownbox;