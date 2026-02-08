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
    const [isMounted, setIsMounted] = useState(open)
    const [isVisible, setIsVisible] = useState(open)

    const [name, setName] = useState(filters.name)
    const [genre, setGenre] = useState(filters.genre)
    const [order, setOrder] = useState<ArtistOrder>(filters.order)

    useEffect(() => {
        if (open) {
            setIsMounted(true)
            const id = requestAnimationFrame(() => setIsVisible(true))
            return () => cancelAnimationFrame(id)
        }
        setIsVisible(false)
        const t = setTimeout(() => setIsMounted(false), 360)
        return () => clearTimeout(t)
    }, [open])

    useEffect(() => {
        setName(filters.name)
        setGenre(filters.genre)
        setOrder(filters.order)
    }, [filters])

    const hasChanges = useMemo(() => {
        return name !== filters.name || genre !== filters.genre || order !== filters.order
    }, [name, genre, order, filters])

    if (!open && !isMounted) return null

    const sectionTitle = "artists-filter-kicker"

    const panelShell =
        "artists-filter-panel fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-[min(92vw,320px)] " +
        "transition-transform duration-300 ease-out will-change-transform " +
        (isVisible ? "translate-x-0" : "translate-x-4 pointer-events-none")

    const brutalCard =
        "artists-filter-card"

    const chipBase =
        "artists-filter-chip"

    const chipActive = "artists-filter-chip-active"
    const chipIdle = "artists-filter-chip-idle"

    return (
        <>
            {/* Backdrop */}
            <button
                className={[
                    "artists-filter-backdrop fixed inset-0 top-16 z-40 transition-opacity duration-200",
                    isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
                ].join(" ")}
                onClick={onClose}
                aria-label="Close filters"
            />

            {/* Panel */}
            <aside className={panelShell}>
                <div className="artists-filter-head">
                    <div className="artists-filter-title">Filters</div>

                    <button
                        onClick={onClose}
                        className="artists-filter-close"
                    >
                        Close
                    </button>
                </div>

                <div className="artists-filter-body">
                    {/* Name */}
                    <section className={brutalCard}>
                        <div className={sectionTitle}>Name</div>
                        <div className="relative">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Search by name…"
                                className="artists-filter-input"
                            />
                        </div>
                    </section>

                    {/* Genre chips (like sample) */}
                    <section className={brutalCard}>
                        <div className={sectionTitle}>Genre</div>
                        <div className="artists-filter-chips">
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
                    <section className={brutalCard}>
                        <div className={sectionTitle}>Order</div>

                        <div className="artists-filter-rows">
                            {ORDERS.map((o) => {
                                const selected = order === o.value
                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => setOrder(o.value)}
                                        className="artists-filter-row"
                                    >
                                        <div
                                            className={[
                                                "artists-filter-dot",
                                                selected ? "artists-filter-dot-active" : "artists-filter-dot-idle",
                                            ].join(" ")}
                                        >
                                            {selected ? <div className="artists-filter-dot-inner" /> : null}
                                        </div>

                                        <div className="artists-filter-row-text">{o.label}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="artists-filter-actions">
                        <button
                            type="button"
                            disabled={!hasChanges}
                            onClick={() => {
                                setFilters({ name, genre, order })
                            }}
                            className={[
                                hasChanges
                                    ? "artists-filter-apply"
                                    : "artists-filter-apply artists-filter-apply-disabled",
                            ].join(" ")}
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                resetFilters()
                            }}
                            className="artists-filter-clear"
                        >
                            Clear
                        </button>
                    </section>
                </div>
            </aside>
        </>
    )
}
