import { useMemo, useState } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { ImpactEnergyGauge } from './ImpactEnergyGauge'
import { HazardIndicator } from './HazardIndicator'
import {
  formatAsteroidName,
  formatDate,
  formatDiameterRange,
  formatDistance,
  formatVelocity,
} from '../lib/format'

const COLUMNS = [
  { key: 'name', label: 'Designation', sortable: false },
  { key: 'diameter', label: 'Diameter (m)', sortable: true },
  { key: 'velocity', label: 'Velocity (km/s)', sortable: true },
  { key: 'distance', label: 'Distance (LD)', sortable: true },
  { key: 'approach', label: 'Approach', sortable: true },
  { key: 'energy', label: 'Energy (Mt)', sortable: true },
]

const GRID_TEMPLATE = '2fr 1fr 1fr 1fr 1fr 1.4fr'

function sortValue(row, key) {
  switch (key) {
    case 'diameter':
      return (
        ((row.asteroid.estimatedDiameterMinKm ?? 0) +
          (row.asteroid.estimatedDiameterMaxKm ?? 0)) /
        2
      )
    case 'velocity':
      return row.approach?.relativeVelocityKmh ?? 0
    case 'distance':
      return row.approach?.missDistanceKm ?? Infinity
    case 'approach':
      return row.approach?.approachDate ?? ''
    case 'energy':
      return row.impactEnergyMt
    default:
      return 0
  }
}

export function AsteroidTable({ rows, maxScore }) {
  const reduceMotion = useReducedMotion()
  const [sort, setSort] = useState({ key: 'energy', direction: 'desc' })

  const sortedRows = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = sortValue(a, sort.key)
      const bv = sortValue(b, sort.key)
      if (av < bv) return sort.direction === 'asc' ? -1 : 1
      if (av > bv) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sort])

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    )
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="min-w-[720px]">
      <div
        className="grid border-b border-[var(--color-line)] pb-2"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            type="button"
            disabled={!col.sortable}
            onClick={() => col.sortable && toggleSort(col.key)}
            className={`flex items-center gap-1 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-signal)] ${
              col.sortable ? 'cursor-pointer hover:text-[var(--color-bone)]' : ''
            }`}
          >
            {col.label}
            {col.sortable && sort.key === col.key && (
              <span className="text-[var(--color-amber)]">
                {sort.direction === 'asc' ? (
                  <CaretUp size={10} weight="bold" />
                ) : (
                  <CaretDown size={10} weight="bold" />
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {sortedRows.map((row, i) => {
        const { asteroid, approach, impactEnergyMt } = row
        return (
          <motion.div
            key={asteroid.id}
            className="grid items-center border-t border-[var(--color-line)] py-4"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.4),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="flex items-center gap-2 pr-4">
              {asteroid.isPotentiallyHazardous && <HazardIndicator size={14} />}
              <div className="min-w-0">
                <span className="block truncate text-sm text-[var(--color-bone)]">
                  {formatAsteroidName(asteroid.name)}
                </span>
                <span className="block truncate text-[11px] text-[var(--color-signal)]">
                  ID {asteroid.nasaId ?? asteroid.id}
                </span>
              </div>
            </div>
            <span className="tabular text-sm text-[var(--color-bone)]">
              {formatDiameterRange(
                asteroid.estimatedDiameterMinKm,
                asteroid.estimatedDiameterMaxKm,
              )}
            </span>
            <span className="tabular text-sm text-[var(--color-bone)]">
              {formatVelocity(approach?.relativeVelocityKmh)}
            </span>
            <span className="tabular text-sm text-[var(--color-bone)]">
              {formatDistance(approach?.missDistanceKm)}
            </span>
            <span className="tabular text-sm text-[var(--color-bone)]">
              {formatDate(approach?.approachDate)}
            </span>
            <div className="pr-2">
              <ImpactEnergyGauge
                score={impactEnergyMt}
                maxScore={maxScore}
                delay={reduceMotion ? 0 : Math.min(i * 0.08, 0.6)}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
