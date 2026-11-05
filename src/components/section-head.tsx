import type { ReactNode } from 'react'

type LinkItem = { label: string; href: string }

export const sectionLink =
    'inline-flex items-center gap-1 text-[0.875rem] text-[var(--rd-text-2)] transition-colors hover:text-[var(--rd-text)]'

// SectionHead — serif section title on the left, quiet "→" links on the right.
export function SectionHead({
    eyebrow,
    title,
    links,
    children,
}: {
    eyebrow?: string
    title: string
    links?: LinkItem[]
    children?: ReactNode
}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="m-0 mb-1 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--rd-text-3)]">
                        {eyebrow}
                    </p>
                )}
                <h2 className="rd-h-sec m-0 text-[var(--rd-text)]">{title}</h2>
                {children}
            </div>
            {links && links.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {links.map((l) => (
                        <a key={l.href} href={l.href} className={sectionLink}>
                            {l.label}
                            <span aria-hidden>→</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SectionHead
