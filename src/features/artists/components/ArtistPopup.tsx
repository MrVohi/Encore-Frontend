import { useEffect, useRef, useState } from "react"
import type { Artist } from "@/types/artist"
import ArtistCard from "./ArtistCard"
import ArtistBackCard from "./ArtistBackCard"
import { VinylDisc } from "@/components/ui/vinyl"
import Arrow38 from "@/components/ui/Arrow38"

import useArtistAlbums from "../hooks/useArtistAlbums"
import useArtistConcerts from "../hooks/useArtistConcerts"
import { resolveAssetUrl } from "@/lib/api"

export default function ArtistPopup({
  artist,
  open,
  onClose,
}: {
  artist: Artist | null
  open: boolean
  onClose: () => void
}) {
  const [returned, setReturned] = useState(false)
  const [vinylOut, setVinylOut] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(false)
  const [renderArtist, setRenderArtist] = useState<Artist | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioAltRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  const loopJumpedRef = useRef(false)
  const loopFadeRef = useRef<number | null>(null)
  const crossfadeTimerRef = useRef<number | null>(null)
  const activeAudioRef = useRef<"a" | "b">("a")

  // keep snapshot for close animation
  useEffect(() => {
    if (open && artist) setRenderArtist(artist)
  }, [open, artist])

  useEffect(() => {
    if (open && artist) {
      setMounted(true)
      setReturned(false)
      setVinylOut(false)
      requestAnimationFrame(() => setShow(true))
      return
    }

    setShow(false)
    const t = setTimeout(() => {
      setMounted(false)
      setRenderArtist(null)
    }, 200)
    return () => clearTimeout(t)
  }, [open, artist])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mounted, onClose])

  useEffect(() => {
    const url = resolveAssetUrl(renderArtist?.preview_url)
    const shouldPlay = open && !!url && vinylOut
    const stopAllAudio = (immediate = false) => {
      loopJumpedRef.current = false
      if (loopFadeRef.current) {
        window.clearInterval(loopFadeRef.current)
        loopFadeRef.current = null
      }
      if (crossfadeTimerRef.current) {
        window.clearTimeout(crossfadeTimerRef.current)
        crossfadeTimerRef.current = null
      }
      const main = audioRef.current
      const alt = audioAltRef.current
      const stopOne = (audio?: HTMLAudioElement | null) => {
        if (!audio) return
        if (immediate) {
          audio.pause()
          audio.currentTime = 0
          audio.volume = 0
          return
        }
        const start = audio.volume
        const steps = 6
        let step = 0
        if (fadeRef.current) window.clearInterval(fadeRef.current)
        fadeRef.current = window.setInterval(() => {
          step += 1
          const t = step / steps
          audio.volume = Math.max(0, start * (1 - t))
          if (step >= steps) {
            audio.pause()
            audio.currentTime = 0
            audio.volume = 0
            if (fadeRef.current) window.clearInterval(fadeRef.current)
            fadeRef.current = null
          }
        }, 20)
      }
      stopOne(main)
      stopOne(alt)
    }

    if (!shouldPlay) {
      const immediate = !open || !vinylOut
      stopAllAudio(immediate)
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    if (!audioAltRef.current) {
      audioAltRef.current = new Audio()
    }

    const audio = audioRef.current
    const alt = audioAltRef.current

    audio.src = url
    audio.currentTime = 0.02
    audio.volume = 0
    audio.loop = false

    alt.src = url
    alt.currentTime = 0.02
    alt.volume = 0
    alt.loop = false

    loopJumpedRef.current = false
    activeAudioRef.current = "a"
    const playPromise = audio.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Autoplay might be blocked; ignore silently
      })
    }
    if (fadeRef.current) window.clearInterval(fadeRef.current)
    fadeRef.current = window.setInterval(() => {
      if (audio.volume >= 0.95) {
        audio.volume = 1
        if (fadeRef.current) window.clearInterval(fadeRef.current)
        fadeRef.current = null
        return
      }
      audio.volume = Math.min(1, audio.volume + 0.05)
    }, 50)

    const clearCrossfadeTimer = () => {
      if (crossfadeTimerRef.current) {
        window.clearTimeout(crossfadeTimerRef.current)
        crossfadeTimerRef.current = null
      }
    }

    const startCrossfade = () => {
      const from = activeAudioRef.current === "a" ? audio : alt
      const to = activeAudioRef.current === "a" ? alt : audio
      activeAudioRef.current = activeAudioRef.current === "a" ? "b" : "a"

      to.currentTime = 0.02
      to.volume = 0
      const p = to.play()
      if (p?.catch) p.catch(() => {})

      const fadeDuration = 220
      const steps = 12
      let step = 0
      if (loopFadeRef.current) window.clearInterval(loopFadeRef.current)
      loopFadeRef.current = window.setInterval(() => {
        step += 1
        const t = step / steps
        to.volume = Math.min(1, t)
        from.volume = Math.max(0, 1 - t)
        if (step >= steps) {
          if (loopFadeRef.current) window.clearInterval(loopFadeRef.current)
          loopFadeRef.current = null
          from.pause()
          from.currentTime = 0
          from.volume = 0
        }
      }, Math.max(16, Math.floor(fadeDuration / steps)))
    }

    const scheduleCrossfade = () => {
      clearCrossfadeTimer()
      const current = activeAudioRef.current === "a" ? audio : alt
      const duration = current.duration
      if (!duration || Number.isNaN(duration)) return
      const lead = 0.22
      const timeout = Math.max(0, (duration - lead - current.currentTime) * 1000)
      crossfadeTimerRef.current = window.setTimeout(() => {
        if (!shouldPlay) return
        startCrossfade()
        scheduleCrossfade()
      }, timeout)
    }

    const handleLoaded = () => {
      scheduleCrossfade()
    }

    audio.addEventListener("loadedmetadata", handleLoaded)
    alt.addEventListener("loadedmetadata", handleLoaded)

    return () => {
      const audio = audioRef.current
      const alt = audioAltRef.current
      if (audio) audio.removeEventListener("loadedmetadata", handleLoaded)
      if (alt) alt.removeEventListener("loadedmetadata", handleLoaded)
      stopAllAudio(true)
    }
  }, [open, renderArtist?.preview_url, vinylOut])

  const artistId = renderArtist?.id ?? null

  // albums
  const { albums, loading: albumsLoading, error: albumsError } = useArtistAlbums(artistId)

  // concerts
  const concertsEnabled = open && returned && !!artistId
  const {
    concerts,
    loading: concertsLoading,
    error: concertsError,
  } = useArtistConcerts(artistId, concertsEnabled)

  const showVinyl = !!resolveAssetUrl(renderArtist?.preview_url)

  if (!mounted || !renderArtist) return null

  const tab =
    "bg-secondary text-foreground border-[3px] border-border px-3 py-1.5 text-sm font-extrabold " +
    "[box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        className={[
          "absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out",
          show ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className={[
          "relative z-10 transition-all duration-200 ease-out",
          show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-[min(92vw,420px)] aspect-square">
          <button
            className={`${tab} absolute -top-5 left-5 rounded-b-md rounded-t-md -rotate-1`}
            onClick={() => {
              setVinylOut(false)
              setReturned((v) => !v)
            }}
          >
            {returned ? "FRONT" : "BACK"}
          </button>

          <button className={`${tab} absolute -top-5 right-5 rounded-b-md rounded-t-md rotate-1`} onClick={onClose}>
            CLOSE
          </button>

          <div className="h-full w-full pt-3">
            <div className="relative w-full h-full overflow-visible">
              {showVinyl && (
                <VinylDisc
                  visible={returned}
                  out={returned ? vinylOut : false}
                  onToggle={() => setVinylOut((v) => !v)}
                />
              )}

              {resolveAssetUrl(renderArtist.preview_url) && returned ? (
                <div
                  className={[
                    "absolute -right-64 -top-32 z-30 flex items-center gap-2 text-[14px] font-semibold text-[var(--encore-accent-warm)] rotate-2 pointer-events-none transition-opacity ease-out",
                    vinylOut ? "opacity-0 duration-200 delay-0" : "opacity-100 duration-700 delay-300",
                  ].join(" ")}
                >
                  <span className='font-["Bradley_Hand","Segoe_Script","Comic_Sans_MS",cursive] tracking-wide text-[21px] translate-x-[144px] translate-y-[114px]'>
                    Play me!
                  </span>
                  <Arrow38 className="h-16 w-auto text-[var(--encore-accent-warm)] -rotate-12 -translate-x-[80px] translate-y-[140px]" />
                </div>
              ) : null}

              {/* BACK (with notch mask) */}
              <div
                className={[
                  "absolute inset-0 z-10",
                  returned ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle 34px at calc(100% + 18px) 50%, rgba(0,0,0,0) 0 34px, rgba(0,0,0,1) 35px)",
                  maskImage:
                    "radial-gradient(circle 34px at calc(100% + 18px) 50%, rgba(0,0,0,0) 0 34px, rgba(0,0,0,1) 35px)",
                }}
              >
                <ArtistBackCard
                  artist={renderArtist}
                  albums={albums}
                  albumsLoading={albumsLoading}
                  albumsError={albumsError}
                  concerts={concerts}
                  concertsLoading={concertsLoading}
                  concertsError={concertsError}
                />
              </div>

              {/* FRONT */}
              <div
                className={[
                  "absolute inset-0 z-20 transition-opacity ease-out duration-200",
                  returned ? "opacity-0 pointer-events-none" : "opacity-100",
                ].join(" ")}
                style={{ transitionDelay: returned ? "0ms" : "180ms" }}
              >
                <ArtistCard artist={renderArtist} index={0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
