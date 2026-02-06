import React, { createContext, useContext, useMemo, useState } from 'react'

type AvatarContextValue = {
  hasImage: boolean
  setHasImage: (value: boolean) => void
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

export function Avatar({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [hasImage, setHasImage] = useState(false)
  const value = useMemo(() => ({ hasImage, setHasImage }), [hasImage])

  return (
    <AvatarContext.Provider value={value}>
      <div
        className={`relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  )
}

export function AvatarImage({
  className = '',
  src,
  alt,
}: {
  className?: string
  src?: string
  alt?: string
}) {
  const ctx = useContext(AvatarContext)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return null
  }

  return (
    <img
      className={`h-full w-full object-cover ${className}`}
      src={src}
      alt={alt || ''}
      referrerPolicy="no-referrer"
      style={{ opacity: loaded ? 1 : 0 }}
      onLoad={() => {
        setLoaded(true)
        ctx?.setHasImage(true)
      }}
      onError={() => {
        setErrored(true)
        ctx?.setHasImage(false)
      }}
    />
  )
}

export function AvatarFallback({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = useContext(AvatarContext)

  if (ctx?.hasImage) return null

  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white ${className}`}
    >
      {children}
    </span>
  )
}
