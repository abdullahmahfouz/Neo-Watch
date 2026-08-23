const LUNAR_DISTANCE_KM = 384400

export function formatDiameterRange(minKm, maxKm) {
  if (minKm == null || maxKm == null) return '—'
  const minM = Math.round(minKm * 1000)
  const maxM = Math.round(maxKm * 1000)
  return `${minM}-${maxM}`
}

export function kmhToKmS(kmh) {
  if (kmh == null) return null
  return kmh / 3600
}

export function formatVelocity(kmh) {
  const kms = kmhToKmS(kmh)
  if (kms == null) return '—'
  return kms.toFixed(1)
}

export function kmToLunarDistance(km) {
  if (km == null) return null
  return km / LUNAR_DISTANCE_KM
}

export function formatDistance(km) {
  const ld = kmToLunarDistance(km)
  if (ld == null) return '—'
  return ld.toFixed(2)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatRiskScore(score) {
  if (score == null || Number.isNaN(score)) return '—'
  if (score === 0) return '0.00'
  const magnitude = Math.abs(score)
  if (magnitude >= 100) return score.toFixed(0)
  if (magnitude >= 1) return score.toFixed(1)
  if (magnitude >= 0.0001) return score.toPrecision(2)
  return score.toExponential(1)
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const date = new Date(isoStr)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// NASA's feed wraps provisional designations in parens, e.g. "(2016 PP39)" —
// stripped everywhere an asteroid name is displayed.
export function formatAsteroidName(name) {
  return name.replace(/[()]/g, '')
}
