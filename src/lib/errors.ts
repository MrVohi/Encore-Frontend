export function getApiErrorMessage(data: unknown, fallback?: string): string | undefined {
  const pickFirst = (...values: Array<unknown>) => {
    for (const v of values) {
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return undefined
  }

  if (typeof data === 'string') return data.trim() || fallback

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const direct = pickFirst(record.message, record.error, record.detail, record.title)
    if (direct) return direct

    const errors = record.errors
    if (Array.isArray(errors)) {
      const msg = errors.map((e) => (typeof e === 'string' ? e.trim() : '')).filter(Boolean)[0]
      if (msg) return msg
    }

    if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          const msg = value.find((v) => typeof v === 'string' && v.trim())
          if (typeof msg === 'string') return msg.trim()
        } else if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }
    }
  }

  return fallback
}
