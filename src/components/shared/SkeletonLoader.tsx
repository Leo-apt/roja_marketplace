const shimmer = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]";

export function SkeletonCards({ cards = 4 }: { cards?: number }) {
    return (
        <div className="grid grid-cols-4 gap-3.5 max-[1180px]:gap-2.5 max-[850px]:grid-cols-2">
            {[...Array(cards)].map((_, i) => (
                <div key={i} className="rounded-xl border border-line bg-white px-[18px] py-[17px]">
                    <div className={`h-3 w-28 rounded-full ${shimmer}`} />
                    <div className={`mt-3 h-7 w-24 rounded-lg ${shimmer}`} />
                    <div className={`mt-3 h-3 w-36 rounded-full ${shimmer}`} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
    return (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="border-b border-linesoft bg-surfacealt px-4 py-3">
                <div className="flex gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`h-4 rounded ${shimmer} ${i === 0 ? "w-8" : "flex-1"}`} />
                    ))}
                </div>
            </div>
            {[...Array(rows)].map((_, r) => (
                <div key={r} className="border-b border-linesoft px-4 py-3">
                    <div className="flex gap-4">
                        <div className={`h-4 w-8 rounded ${shimmer}`} />
                        <div className={`h-4 flex-1 rounded ${shimmer}`} />
                        <div className={`h-4 flex-1 rounded ${shimmer}`} />
                        <div className={`h-4 flex-1 rounded ${shimmer}`} />
                        <div className={`h-4 flex-1 rounded ${shimmer}`} />
                        <div className={`h-4 w-16 rounded ${shimmer}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonDrawer() {
    return (
        <div role="status" aria-busy="true" aria-label="Loading call details" className="flex flex-col gap-4">
            {/* summary box */}
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surfacealt p-4">
                <div className={`h-6 w-20 rounded-full ${shimmer}`} />
                <div className={`h-4 w-2/3 rounded ${shimmer}`} />
            </div>
            {/* object id / customer / type */}
            <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className={`h-3 w-16 rounded-full ${shimmer}`} />
                        <div className={`h-4 w-4/5 rounded ${shimmer}`} />
                    </div>
                ))}
            </div>
            {/* request */}
            <div>
                <div className={`mb-2 h-4 w-20 rounded ${shimmer}`} />
                <div className={`h-40 w-full rounded-lg ${shimmer}`} />
            </div>
            {/* response */}
            <div className={`h-10 w-full rounded-lg ${shimmer}`} />
        </div>
    );
}

export default function PageSkeleton() {
    return (
        <div role="status" aria-busy="true" aria-label="Loading page" className="flex flex-col gap-[18px]">
            {/* filter bar */}
            <div className="flex flex-wrap items-end gap-3">
                <div className={`h-9 min-w-[230px] flex-[2] rounded-lg ${shimmer}`} />
                <div className={`h-9 min-w-[150px] flex-1 rounded-lg ${shimmer}`} />
                <div className={`h-9 min-w-[150px] flex-1 rounded-lg ${shimmer}`} />
                <div className={`h-9 min-w-[134px] flex-1 rounded-lg ${shimmer}`} />
            </div>
            <SkeletonCards cards={4} />
            <SkeletonTable rows={8} />
        </div>
    );
}