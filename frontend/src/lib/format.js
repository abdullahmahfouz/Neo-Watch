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

export function formatImpactEnergy(mt) {
  if (mt == null || Number.isNaN(mt)) return '—'
  if (mt === 0) return '0.00'
  const magnitude = Math.abs(mt)
  if (magnitude >= 100) return mt.toFixed(0)
  if (magnitude >= 1) return mt.toFixed(1)
  if (magnitude >= 0.0001) return mt.toPrecision(2)
  return mt.toExponential(1)
}

// Real-world reference points for turning a raw megaton figure into something an average
// person can picture. Ordered smallest first; formatEnergyComparison picks the largest one
// the given value still exceeds, so a value below all of them still compares against Hiroshima.
const ENERGY_REFERENCES = [
  { mt: 0.015, label: 'the Hiroshima bomb' },
  { mt: 12, label: 'the 1908 Tunguska explosion' },
  { mt: 1e8, label: 'the asteroid impact that ended the age of dinosaurs' },
]

export function formatEnergyComparison(mt) {
  if (mt == null || !Number.isFinite(mt) || mt <= 0) return null
  const reference = [...ENERGY_REFERENCES].reverse().find((ref) => mt >= ref.mt) ?? ENERGY_REFERENCES[0]
  const ratio = mt / reference.mt
  const ratioStr = ratio >= 10 ? Math.round(ratio).toLocaleString('en-US') : ratio.toFixed(ratio < 1 ? 2 : 1)
  return `About ${ratioStr}x ${reference.label}`
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
