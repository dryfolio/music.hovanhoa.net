// Loading placeholders — same card/row geometry as the real sections so
// nothing jumps when Spotify data streams in.

const block =
    'animate-pulse bg-[var(--rd-surface-2)] motion-reduce:animate-none'

export const card =
    'overflow-hidden rounded-[var(--rd-r-lg)] border border-[var(--rd-border)] bg-[var(--rd-surface)]'

function Row() {
    return (
        <div className="flex items-center gap-3 border-b border-[var(--rd-line)] px-[1.15rem] py-3 last:border-b-0">
            <div className={`${block} h-11 w-11 shrink-0 rounded-[8px]`} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className={`${block} h-3 w-1/2 rounded-full`} />
                <div className={`${block} h-2.5 w-1/3 rounded-full`} />
            </div>
        </div>
    )
}

export function SkeletonInline() {
    return (
        <div className="flex items-center gap-3">
            <div className={`${block} h-10 w-10 rounded-full`} />
            <div className="flex flex-col gap-2">
                <div className={`${block} h-3 w-28 rounded-full`} />
                <div className={`${block} h-2.5 w-20 rounded-full`} />
            </div>
        </div>
    )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
    return (
        <div className={card}>
            {Array.from({ length: rows }, (_, i) => (
                <Row key={i} />
            ))}
        </div>
    )
}

export function SkeletonFeatured() {
    return (
        <div className="grid items-start gap-x-8 gap-y-4 min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <div
                className={`${card} flex gap-5 p-[1.15rem] max-[560px]:flex-col`}
            >
                <div
                    className={`${block} aspect-square w-[clamp(8rem,22vw,13.5rem)] shrink-0 rounded-[var(--rd-r)]`}
                />
                <div className="flex flex-1 flex-col gap-3 pt-2">
                    <div className={`${block} h-2.5 w-24 rounded-full`} />
                    <div className={`${block} h-5 w-3/4 rounded-full`} />
                    <div className={`${block} h-3 w-1/2 rounded-full`} />
                </div>
            </div>
            <SkeletonList rows={4} />
        </div>
    )
}

export function SkeletonGrid({ items = 6 }: { items?: number }) {
    return (
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: items }, (_, i) => (
                <div key={i} className="flex flex-col gap-2.5">
                    <div
                        className={`${block} aspect-square w-full rounded-[var(--rd-r)]`}
                    />
                    <div className={`${block} h-3 w-2/3 rounded-full`} />
                </div>
            ))}
        </div>
    )
}

export function EmptyState() {
    return (
        <div
            className={`${card} px-[1.15rem] py-8 text-[0.9rem] text-[var(--rd-text-3)]`}
        >
            Couldn&apos;t load this right now. Try refreshing in a minute.
        </div>
    )
}
