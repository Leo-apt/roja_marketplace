interface PaginationProps {
    currentPage: number;
    totalPages: number;
    start: number;
    end: number;
    total: number;
    itemLabel?: string;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, start, end, total, itemLabel = "items", onPageChange }: PaginationProps) {
    if (total === 0) return null;

    const getPaginationRange = () => {
        const range: (number | string)[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                range.push(i);
            } else if (range[range.length - 1] !== "...") {
                range.push("...");
            }
        }
        return range;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-line">
            <p className="text-xs text-muted">
                Showing <strong>{start + 1}</strong>-<strong>{end}</strong> of <strong>{total}</strong> {itemLabel}
            </p>
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border border-line hover:bg-surfacealt disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        «
                    </button>
                    {getPaginationRange().map((page, idx) =>
                        page === "..." ? (
                            <span key={idx} className="px-2 text-muted">...</span>
                        ) : (
                            <button
                                key={idx}
                                onClick={() => onPageChange(page as number)}
                                className={`size-9 rounded-lg text-sm font-medium cursor-pointer ${currentPage === page
                                    ? "bg-action text-white"
                                    : "border border-line hover:bg-surfacealt text-ink"
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-lg border border-line text-[#9ca3af] hover:bg-surfacealt disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        »
                    </button>
                </div>
            )}
        </div>
    );
}