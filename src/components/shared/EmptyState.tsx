import emptyImg from "@/assets/Empty-pana.svg";

export default function EmptyState({ title = "No records found", message, className = "", compact = false }: {
    title?: string; message?: string; className?: string; compact?: boolean;
}) {
    return (
        <div className={`flex flex-col items-center justify-center px-5 py-10 text-center ${className}`}>
            <img src={emptyImg} alt="" className={`mb-4 w-auto max-w-full ${compact ? "h-36" : "h-64"}`} />
            <strong className="text-sm text-ink">{title}</strong>
            {message && <p className="mt-1 text-sm text-muted">{message}</p>}
        </div>
    );
}