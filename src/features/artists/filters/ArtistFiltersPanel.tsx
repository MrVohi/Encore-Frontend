import { useEffect, useMemo, useState } from "react"
import type { ArtistFilters, ArtistOrder } from "./types"
import useArtistFilters from "./useArtistFilters"

type Props = {
    open: boolean
    onClose: () => void
}

const GENRES = ["all", "rock", "pop", "jazz"] as const

const ORDERS: Array<{ value: ArtistOrder; label: string }> = [
    { value: "created_at_desc", label: "Newest" },
    { value: "created_at_asc", label: "Oldest" },
    { value: "name_asc", label: "Name A→Z" },
    { value: "name_desc", label: "Name Z→A" },
]

export default function ArtistFiltersPanel({
    open,
    onClose,
    filters,
    setFilters,
    resetFilters,
  }: {
    open: boolean
    onClose: () => void
    filters: ArtistFilters
    setFilters: (next: Partial<ArtistFilters>) => void
    resetFilters: () => void
  }) {

    const [name, setName] = useState(filters.name)
    const [genre, setGenre] = useState(filters.genre)
    const [order, setOrder] = useState<ArtistOrder>(filters.order)

    useEffect(() => {
        setName(filters.name)
        setGenre(filters.genre)
        setOrder(filters.order)
    }, [filters])

    const hasChanges = useMemo(() => {
        return name !== filters.name || genre !== filters.genre || order !== filters.order
    }, [name, genre, order, filters])

    if (!open) return null

    const sectionTitle =
        "text-[0.85rem] font-extrabold text-foreground uppercase tracking-wide mb-3"

    const panelShell =
        "fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-[min(92vw,320px)] " +
        "bg-card text-card-foreground border-l-[3px] border-border shadow-2xl"

    const brutalCard =
        "border-[3px] border-border rounded-xl bg-card " +
        "[box-shadow:4px_4px_0_var(--border)]"

    const chipBase =
        "px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-border transition-colors"

    const chipActive = "bg-foreground text-background"
    const chipIdle = "bg-transparent text-foreground hover:bg-muted"

    return (
        <>
            {/* Backdrop */}
            <button
                className="fixed inset-0 top-16 z-40 bg-black/25"
                onClick={onClose}
                aria-label="Close filters"
            />

            {/* Panel */}
            <aside className={panelShell}>
                <div className="p-5 flex items-center justify-between border-b-[3px] border-border">
                    <div className="font-extrabold text-lg">Filters</div>

                    <button
                        onClick={onClose}
                        className="h-9 px-3 rounded-full border-[3px] border-border bg-secondary text-foreground font-extrabold
                       [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                    >
                        Close
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-auto h-full">
                    {/* Name */}
                    <section className={brutalCard + " p-4"}>
                        <div className={sectionTitle}>Name</div>
                        <div className="relative">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Search by name…"
                                className="w-full h-10 rounded-full bg-background border-[3px] border-border px-4 text-sm font-semibold
                           focus-visible:outline-none focus-visible:ring-0"
                            />
                        </div>
                    </section>

                    {/* Genre chips (like sample) */}
                    <section className={brutalCard + " p-4"}>
                        <div className={sectionTitle}>Genre</div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGenre(g)}
                                    className={[
                                        chipBase,
                                        genre === g ? chipActive : chipIdle,
                                    ].join(" ")}
                                >
                                    {g === "all" ? "All" : g[0].toUpperCase() + g.slice(1)}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Order radio (like sample radio dots) */}
                    <section className={brutalCard + " p-4"}>
                        <div className={sectionTitle}>Order</div>

                        <div className="space-y-3">
                            {ORDERS.map((o) => {
                                const selected = order === o.value
                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => setOrder(o.value)}
                                        className="w-full flex items-center gap-3 text-left"
                                    >
                                        <div
                                            className={[
                                                "h-5 w-5 rounded-full border-[3px] flex items-center justify-center transition-colors",
                                                selected ? "border-[var(--encore-accent-warm)] bg-[var(--encore-accent-warm)]" : "border-border bg-transparent",
                                            ].join(" ")}
                                        >
                                            {selected ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                                        </div>

                                        <div className="font-semibold">{o.label}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="flex gap-2">
                        <button
                            type="button"
                            disabled={!hasChanges}
                            onClick={() => {
                                setFilters({ name, genre, order })
                                onClose()
                            }}
                            className={[
                                "flex-1 h-10 rounded-full border-[3px] border-border font-extrabold",
                                "[box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform",
                                hasChanges
                                    ? "bg-[var(--encore-accent-warm)] text-white"
                                    : "bg-muted text-muted-foreground cursor-not-allowed",
                            ].join(" ")}
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                resetFilters()
                                onClose()
                            }}
                            className="flex-1 h-10 rounded-full border-[3px] border-border bg-secondary text-foreground font-extrabold
                         [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"
                        >
                            Clear
                        </button>
                    </section>
                </div>
            </aside>
        </>
    )
}
