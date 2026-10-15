import {
  AlertTriangle,
  LogOut,
  Loader2,
  X,
  ArrowRight,
  Trash2,
  Info,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const EXIT_DURATION = 260; // keep in sync with the CSS below

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

  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      setShouldRender(true);
      const t = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setIsVisible(false);
    const t = setTimeout(() => {
      setShouldRender(false);
      lastFocused.current?.focus?.({ preventScroll: true });
    }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Move focus into the dialog (the safe button, or the reason box if there is one)
  useEffect(() => {
    if (!isVisible) return;
    const t = window.setTimeout(() => {
      (reasonRef.current ?? cancelRef.current)?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(t);
  }, [isVisible]);

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
      reasonRef.current?.focus();
      return;
    }
    setReasonError("");
    onConfirm();
  };

  // Keep Tab inside the dialog
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
      "button:not(:disabled), textarea:not(:disabled)",
    );
    if (!nodes || !nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const getContent = () => {
    switch (type) {
      case "logout":
        return {
          title: title || "Confirm Logout",
          message:
            message ||
            "Are you sure you want to logout? You will be redirected to the login page.",
          confirmText: confirmText || "Logout",
          icon: LogOut,
          confirmIcon: LogOut,
          glow: "from-danger-soft",
          pingColor: "bg-danger-ping",
          iconRing: "ring-danger-ring",
          iconBg: "bg-danger-soft",
          iconColor: "text-btn-danger",
          confirmButtonClass:
            "bg-btn-danger hover:bg-btn-danger-hover focus-visible:ring-danger-ping",
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
          glow: "from-danger-soft",
          pingColor: "bg-danger-ping",
          iconRing: "ring-danger-ring",
          iconBg: "bg-danger-soft",
          iconColor: "text-btn-danger",
          confirmButtonClass:
            "bg-btn-danger hover:bg-btn-danger-hover focus-visible:ring-danger-ping",
        };
      case "warning":
        return {
          title: title || "Warning",
          message: message || "Are you sure you want to proceed?",
          confirmText: confirmText || "Confirm",
          icon: AlertTriangle,
          confirmIcon: ArrowRight,
          glow: "from-caution-soft",
          pingColor: "bg-caution-ping",
          iconRing: "ring-caution-ring",
          iconBg: "bg-caution-soft",
          iconColor: "text-caution",
          confirmButtonClass:
            "bg-caution hover:bg-caution-hover focus-visible:ring-caution-ping",
        };
      case "info":
        return {
          title: title || "Confirm Action",
          message: message || "Are you sure you want to proceed?",
          confirmText: confirmText || "Confirm",
          icon: Info,
          confirmIcon: ArrowRight,
          glow: "from-brandsoft",
          pingColor: "bg-brand/40",
          iconRing: "ring-brandsoft",
          iconBg: "bg-brandsoft",
          iconColor: "text-brand",
          confirmButtonClass:
            "bg-brand hover:bg-brandhover focus-visible:ring-brand/40",
        };
      default:
        return {
          title: title || "Confirm",
          message: message || "Are you sure?",
          confirmText: confirmText || "Confirm",
          icon: AlertTriangle,
          confirmIcon: ArrowRight,
          glow: "from-gray-100",
          pingColor: "bg-gray-400",
          iconRing: "ring-gray-100",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-500",
          confirmButtonClass:
            "bg-gray-500 hover:bg-gray-600 focus-visible:ring-gray-300",
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;
  const ConfirmIcon = content.confirmIcon;
  const isUrgent = type === "delete" || type === "logout" || type === "warning";

  const dialogContent = (
    <div
      className={`cd-root fixed inset-0 z-[99999] flex items-center justify-center p-4 ${isVisible ? "cd-open" : ""}`}
    >
      {/* Local CSS so motion works without any tailwind.config change */}
      <style>{`
                :root { --cd-ease: cubic-bezier(0.22, 1, 0.36, 1); --cd-spring: cubic-bezier(0.34, 1.56, 0.64, 1); }
                .cd-ease.cd-ease { transition-timing-function: var(--cd-ease); }

                .cd-backdrop { opacity: 0; transition: opacity 260ms var(--cd-ease); }
                .cd-open .cd-backdrop { opacity: 1; }

                .cd-panel {
                    opacity: 0;
                    transform: translateY(14px) scale(0.96);
                    transition: opacity 260ms var(--cd-ease), transform 320ms var(--cd-ease);
                    will-change: opacity, transform;
                }
                .cd-open .cd-panel { opacity: 1; transform: translateY(0) scale(1); }

                @keyframes cd-pop  { from { opacity: 0; transform: scale(0.6) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
                @keyframes cd-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes cd-pulse { from { opacity: 0.45; transform: scale(1); } to { opacity: 0; transform: scale(1.75); } }
                @keyframes cd-err  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

                .cd-open .cd-icon  { animation: cd-pop 520ms var(--cd-spring) 120ms backwards; }
                .cd-open .cd-rise  { animation: cd-rise 420ms var(--cd-ease) backwards; animation-delay: calc(140ms + var(--i, 0) * 60ms); }
                .cd-open .cd-pulse { animation: cd-pulse 1.8s ease-out 450ms 2 both; }
                .cd-err { animation: cd-err 220ms var(--cd-ease) both; }

                @media (prefers-reduced-motion: reduce) {
                    .cd-panel { transform: none; transition: opacity 150ms linear; }
                    .cd-open .cd-icon, .cd-open .cd-rise, .cd-open .cd-pulse, .cd-err { animation: none; }
                    .cd-open .cd-pulse { opacity: 0; }
                }
            `}</style>

      {/* Backdrop */}
      <div
        className="cd-backdrop absolute inset-0 bg-slate-900/35 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        aria-busy={loading}
        onKeyDown={onPanelKeyDown}
        className="cd-panel relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_48px_-16px_rgba(16,24,40,0.18),0_4px_12px_-4px_rgba(16,24,40,0.06)] ring-1 ring-black/5"
      >
        {/* Soft tinted glow behind the icon */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${content.glow} to-transparent opacity-70`}
          aria-hidden="true"
        />

        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Close dialog"
          className="cd-ease absolute right-3.5 top-3.5 z-10 grid size-8 cursor-pointer place-items-center rounded-lg text-gray-400 outline-none transition-all duration-300 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-300 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="relative px-6 pb-5 pt-6">
          <div className="flex items-start gap-4 pr-6">
            {/* Icon tile */}
            <div className="relative shrink-0">
              {isUrgent && (
                <span
                  className={`cd-pulse absolute inset-0 rounded-2xl ${content.pingColor}`}
                  aria-hidden="true"
                />
              )}
              <div
                className={`cd-icon relative grid size-12 place-items-center rounded-2xl ring-4 ${content.iconBg} ${content.iconRing}`}
              >
                <Icon
                  className={`size-[22px] ${content.iconColor}`}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="min-w-0 pt-0.5">
              <h3
                id="confirm-dialog-title"
                style={{ "--i": 0 } as React.CSSProperties}
                className="cd-rise text-base font-bold tracking-tight text-gray-900"
              >
                {content.title}
              </h3>
              <p
                id="confirm-dialog-message"
                style={{ "--i": 1 } as React.CSSProperties}
                className="cd-rise mt-1.5 text-sm leading-relaxed text-gray-500"
              >
                {content.message}
              </p>
            </div>
          </div>

          {reasonRequired && (
            <div
              style={{ "--i": 2 } as React.CSSProperties}
              className="cd-rise mt-5 text-left"
            >
              {reasonLabel && (
                <label
                  htmlFor="confirm-dialog-reason"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  {reasonLabel}
                </label>
              )}
              <textarea
                id="confirm-dialog-reason"
                ref={reasonRef}
                value={reason}
                onChange={(e) => {
                  onReasonChange?.(e.target.value);
                  if (reasonError) setReasonError("");
                }}
                rows={3}
                aria-invalid={!!reasonError}
                placeholder={reasonPlaceholder || "Enter reason..."}
                className={`cd-ease w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition-all duration-300 placeholder:text-gray-400 focus:ring-[3px] ${
                  reasonError
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 hover:border-gray-300 focus:border-brand/40 focus:ring-brand/10"
                }`}
              />
              {reasonError && (
                <p
                  role="alert"
                  className="cd-err mt-1.5 text-xs font-medium text-red-500"
                >
                  {reasonError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-3.5">
          <span className="hidden items-center gap-1.5 text-[11px] text-gray-400 sm:inline-flex">
            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-gray-500">
              Esc
            </kbd>
            to cancel
          </span>

          <div className="flex w-full gap-2.5 sm:w-auto">
            <button
              ref={cancelRef}
              onClick={onClose}
              disabled={loading}
              className="cd-ease flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-300 hover:-translate-y-px hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirmClick}
              disabled={loading}
              className={`cd-ease flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,24,40,0.25)] outline-none transition-all duration-300 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${content.confirmButtonClass}`}
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
