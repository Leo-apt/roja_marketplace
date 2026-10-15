import { AlertTriangle, LogOut, Loader2, X, ArrowRight, Trash2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: "delete" | "logout" | "warning" | "info";
    itemName?: string;
    itemType?: string;
    loading?: boolean;
    reasonRequired?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    reason?: string;
    onReasonChange?: (value: string) => void;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText = "Cancel",
    type = "delete",
    itemName = "",
    itemType = "item",
    loading = false,
    reasonRequired = false,
    reasonLabel,
    reasonPlaceholder,
    reason = "",
    onReasonChange,
}: ConfirmDialogProps) {
    // Two-stage mount so the exit can animate
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [reasonError, setReasonError] = useState("");
    const EXIT_DURATION = 200;

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const t = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(t);
        }
        setIsVisible(false);
        const t = setTimeout(() => setShouldRender(false), EXIT_DURATION);
        return () => clearTimeout(t);
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) setReasonError("");
    }, [isOpen]);

    if (!shouldRender) return null;

    const handleConfirmClick = () => {
        if (reasonRequired && !reason.trim()) {
            setReasonError("Reason is required");
            return;
        }
        setReasonError("");
        onConfirm();
    };

    const getContent = () => {
        switch (type) {
            case "logout":
                return {
                    title: title || "Confirm Logout",
                    message: message || "Are you sure you want to logout? You will be redirected to the login page.",
                    confirmText: confirmText || "Logout",
                    icon: LogOut,
                    confirmIcon: LogOut,
                    accent: "bg-btn-danger",
                    pingColor: "bg-danger-ping",
                    iconRing: "ring-danger-ring",
                    iconBg: "bg-danger-soft",
                    iconColor: "text-btn-danger",
                    confirmButtonClass: "bg-btn-danger hover:bg-btn-danger-hover focus-visible:ring-danger-ping",
                };
            case "delete":
                return {
                    title: title || `Delete ${itemType}`,
                    message:
                        message ||
                        `Are you sure you want to delete this ${itemType}${itemName ? ` "${itemName}"` : ""}? This action cannot be undone.`,
                    confirmText: confirmText || "Delete",
                    icon: Trash2,
                    confirmIcon: Trash2,
                    accent: "bg-btn-danger",
                    pingColor: "bg-danger-ping",
                    iconRing: "ring-danger-ring",
                    iconBg: "bg-danger-soft",
                    iconColor: "text-btn-danger",
                    confirmButtonClass: "bg-btn-danger hover:bg-btn-danger-hover focus-visible:ring-danger-ping",
                };
            case "warning":
                return {
                    title: title || "Warning",
                    message: message || "Are you sure you want to proceed?",
                    confirmText: confirmText || "Confirm",
                    icon: AlertTriangle,
                    confirmIcon: ArrowRight,
                    accent: "bg-caution",
                    pingColor: "bg-caution-ping",
                    iconRing: "ring-caution-ring",
                    iconBg: "bg-caution-soft",
                    iconColor: "text-caution",
                    confirmButtonClass: "bg-caution hover:bg-caution-hover focus-visible:ring-caution-ping",
                };
            case "info":
                return {
                    title: title || "Confirm Action",
                    message: message || "Are you sure you want to proceed?",
                    confirmText: confirmText || "Confirm",
                    icon: Info,
                    confirmIcon: ArrowRight,
                    accent: "bg-brand",
                    pingColor: "bg-brand/40",
                    iconRing: "ring-brandsoft",
                    iconBg: "bg-brandsoft",
                    iconColor: "text-brand",
                    confirmButtonClass: "bg-brand hover:bg-brandhover focus-visible:ring-brand/40",
                };
            default:
                return {
                    title: title || "Confirm",
                    message: message || "Are you sure?",
                    confirmText: confirmText || "Confirm",
                    icon: AlertTriangle,
                    confirmIcon: ArrowRight,
                    accent: "bg-gray-500",
                    pingColor: "bg-gray-400",
                    iconRing: "ring-gray-100",
                    iconBg: "bg-gray-100",
                    iconColor: "text-gray-500",
                    confirmButtonClass: "bg-gray-500 hover:bg-gray-600 focus-visible:ring-gray-300",
                };
        }
    };

    const content = getContent();
    const Icon = content.icon;
    const ConfirmIcon = content.confirmIcon;
    const isUrgent = type === "delete" || type === "logout" || type === "warning";

    const dialogContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
            >
                <div className={`h-1 ${content.accent}`} />

                <button
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close dialog"
                    className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 active:scale-95 disabled:opacity-40"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>

                <div className="p-6 pt-7">
                    <div className="mb-5 flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            {isUrgent && (
                                <span
                                    className={`absolute inset-0 rounded-full ${content.pingColor} opacity-75 motion-safe:animate-ping motion-reduce:hidden`}
                                    aria-hidden="true"
                                />
                            )}
                            <div className={`relative flex size-14 items-center justify-center rounded-full ring-8 ${content.iconBg} ${content.iconRing}`}>
                                <Icon className={`size-6 ${content.iconColor}`} aria-hidden="true" />
                            </div>
                        </div>
                        <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900">
                            {content.title}
                        </h3>
                        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">{content.message}</p>
                    </div>

                    {reasonRequired && (
                        <div className="mb-5 text-left">
                            {reasonLabel && (
                                <label className="mb-1.5 block text-xs font-semibold text-gray-600">{reasonLabel}</label>
                            )}
                            <textarea
                                value={reason}
                                onChange={(e) => {
                                    onReasonChange?.(e.target.value);
                                    if (reasonError) setReasonError("");
                                }}
                                rows={3}
                                placeholder={reasonPlaceholder || "Enter reason..."}
                                className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-hidden transition-all duration-200 focus:ring-2 ${reasonError
                                    ? "border-red-300 focus:ring-red-200"
                                    : "border-gray-200 hover:border-gray-300 focus:border-brand/40 focus:ring-brand/20"
                                    }`}
                            />
                            {reasonError && <p className="mt-1.5 text-xs text-red-500">{reasonError}</p>}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-150 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirmClick}
                            disabled={loading}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${content.confirmButtonClass}`}
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <ConfirmIcon className="size-4" aria-hidden="true" />
                            )}
                            {content.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}