export const LoadingShimmer: React.FC<{ count?: number }> = ({ count = 2 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={`shimmer-${i}`}
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="h-3 bg-white/20 rounded animate-pulse w-24" />
                    <div className="h-3 bg-white/10 rounded animate-pulse w-16" />
                </div>
                <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
            </div>
        ))}
    </>
);

