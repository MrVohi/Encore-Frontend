export function isValidHttpUrl(v: unknown) {
  const s = String(v ?? '').trim()
  if (!s) return false
  if (s === 'None' || s === 'null' || s === 'undefined') return false
  return /^https?:\/\//i.test(s)
}

export function shortTitle(s: string, max = 30) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
