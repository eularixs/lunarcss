// Parse CSS length value to RN-compatible number (density-independent points).
// Supported units: px (1:1), rem (× 16), em (× 16), pt (× 1.333), unitless number.
// Returns null on parse failure.

const REM_BASE = 16

export function parseLength(raw: string): number | null {
  const value = raw.trim()
  if (!value) return null

  if (value === '0') return 0

  const match = value.match(/^(-?\d*\.?\d+)\s*(px|rem|em|pt|%)?$/i)
  if (!match) return null

  const numStr = match[1]
  const unit = (match[2] ?? '').toLowerCase()
  if (numStr === undefined) return null
  const n = Number.parseFloat(numStr)
  if (!Number.isFinite(n)) return null

  switch (unit) {
    case 'px':
    case '':
      return n
    case 'rem':
    case 'em':
      return n * REM_BASE
    case 'pt':
      return n * 1.333
    case '%':
      // RN supports percent strings on some props. Caller decides whether to keep.
      return null
    default:
      return null
  }
}

export function parseLengthOrPercent(raw: string): number | string | null {
  const value = raw.trim()
  if (value.endsWith('%')) {
    const num = Number.parseFloat(value)
    if (Number.isFinite(num)) return value
    return null
  }
  return parseLength(value)
}
