import { useMemo } from 'react'
import TacticalGlobe from './TacticalGlobe'
import { formatAsteroidName } from '../lib/format'

// Deterministic integer avalanche hash seeded by asteroid id, so each
// object's position on the globe stays stable across re-renders instead of
// reshuffling. Asteroids don't have literal lat/lng of course — this only
// gives each one a stable, evenly-scattered spot to render as a marker.
// Our asteroid ids are small sequential integers (1, 2, 3...), and a naive
// char-code hash barely disperses those — consecutive ids landed almost on
// top of each other. This bit-mixing hash gives good spread even for
// consecutive small integers.
function hashId(id) {
  let x = Number(id) | 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = x ^ (x >>> 16)
  return Math.abs(x)
}

const MAP_STYLE = {
  oceanColor: '#0e0f12',
  landFill: '#1d2025',
  landStroke: 'rgba(232, 163, 61, 0.28)',
  strokeWidth: 0.6,
  hoverColor: '#3a2f1f',
  disabledColor: '#141519',
}

const TOOLTIP = {
  show: true,
  background: 'rgba(23, 25, 29, 0.95)',
  textColor: '#ededec',
  borderColor: 'rgba(255, 255, 255, 0.16)',
}

const GRID = {
  show: true,
  color: 'rgba(255, 255, 255, 0.5)',
  opacity: 0.08,
}

const LAYOUT = {
  cornerRadius: 0,
  padding: 0,
  showBorder: false,
  borderColor: 'transparent',
}

const INTERACTION = {
  autoRotate: true,
  autoRotateSpeed: 3,
  rotateX: 0,
  rotateY: -15,
  rotateZ: 0,
  enableDrag: true,
  dragSensitivity: 0.4,
  glowColor: '#e8a33d',
  glowIntensity: 0.25,
  showStars: false,
  showLabels: false,
}

export function Globe({ rows, selectedId, onSelect }) {
  const markers = useMemo(() => {
    return rows.slice(0, 40).map((row) => {
      const seed = hashId(row.asteroid.id)
      const lat = ((seed % 1000) / 1000) * 140 - 70
      const lng = (((seed >> 8) % 1000) / 1000) * 360 - 180
      const isSelected = row.asteroid.id === selectedId
      const color = isSelected
        ? '#e8a33d'
        : row.asteroid.isPotentiallyHazardous
          ? '#c98a3a'
          : '#8a8d93'
      return {
        label: formatAsteroidName(row.asteroid.name),
        description: `Risk ${row.riskScore.toPrecision(2)}${
          row.asteroid.isPotentiallyHazardous ? ' · Hazardous' : ''
        }`,
        latitude: lat,
        longitude: lng,
        color,
        onClick: () => onSelect?.(row.asteroid.id),
      }
    })
  }, [rows, selectedId, onSelect])

  return (
    <TacticalGlobe
      markers={markers}
      mapStyle={MAP_STYLE}
      tooltip={TOOLTIP}
      grid={GRID}
      layout={LAYOUT}
      interaction={INTERACTION}
    />
  )
}
