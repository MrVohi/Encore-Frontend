import { useId } from "react"

export function VinylDisc({
    visible,
    out,
    onToggle,
    fadeInDelayMs = 140,
    rimText = "PLAY ME ENCORE • PLAY ME ENCORE • PLAY ME ENCORE • PLAY ME ENCORE •",
}: {
    visible: boolean
    out: boolean
    onToggle: () => void
    fadeInDelayMs?: number
    rimText?: string
}) {
    const uid = useId().replace(/:/g, "")
    const peek = "20%"
    const pull = "55%"

    const x = !visible ? "0%" : out ? `calc(${peek} + ${pull})` : peek

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={out ? "Push vinyl back" : "Pull vinyl out"}
            className={[
                "absolute inset-0 z-[5] bg-transparent p-0 border-0 cursor-pointer",
                "focus-visible:outline-none",
                "transition-[transform,opacity] ease-out",
                visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            style={{
                transform: `translateX(${x})`,
                transitionDelay: visible ? `${fadeInDelayMs}ms` : "0ms",
                transitionDuration: out ? "520ms" : "240ms",
            }}
        >
            {/* Outer disc: crisp border + clip */}
            <div className="absolute inset-3 rounded-full border-[3px] border-border overflow-hidden bg-[#111]">
                {/* Rotating layer: grooves + light + text */}
                <div
                    className="absolute inset-0"
                    style={{
                        animation: "encore-spin 8.2s linear infinite",
                        willChange: "transform",
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden",
                        // grooves rotate (not the border)
                        backgroundImage:
                            "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0) 1px 12px)",
                    }}
                >
                    {/* Ray of light */}
                    <div
                        className="absolute inset-0 opacity-70"
                        style={{
                            backgroundImage:
                                "conic-gradient(from 25deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.16) 28deg, rgba(255,255,255,0) 70deg, rgba(255,255,255,0) 360deg)",
                        }}
                    />

                    {/* Rim text */}
                    <svg className="absolute inset-0" viewBox="0 0 200 200">
                        <defs>
                            <path
                                id={`${uid}-rim`}
                                d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
                            />
                        </defs>

                        <text fill="rgba(255,255,255,0.70)" fontSize="10" letterSpacing="2">
                            <textPath href={`#${uid}-rim`} startOffset="50%" textAnchor="middle">
                                {rimText}
                            </textPath>
                        </text>
                    </svg>

                    {/* Center label (spins with the layer) */}
                    <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-border bg-[var(--encore-accent-warm,#e07a5f)]" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70" />
                </div>
            </div>
        </button>
    )
}
