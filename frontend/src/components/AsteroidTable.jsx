import { useMemo, useState } from 'react'
import { ArrowRight, CaretDown, CaretUp } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { ImpactEnergyGauge } from './ImpactEnergyGauge'
import { HazardIndicator } from './HazardIndicator'
import {
  formatAsteroidName,
  formatDate,
  formatDiameterRange,
  formatDistance,
  formatImpactEnergy,
  formatVelocity,
} from '../lib/format'

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: false },
  { key: 'approach', label: 'Closest approach', sortable: true },
  { key: 'diameter', label: 'Estimated size (m)', sortable: true },
  { key: 'velocity', label: 'Speed (km/s)', sortable: true },
  { key: 'distance', label: 'Distance from Earth (LD)', sortable: true },
  { key: 'energy', label: 'Estimated impact energy', sortable: true },
]

const GRID_TEMPLATE = '1.8fr 1.1fr 1fr 1fr 1.1fr 1.4fr'

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

// Renders the same sorted rows two ways via responsive classes rather than as
// separate components: a tappable card grid below `lg` (single column on
// phones, two columns on tablets — avoids the horizontal-scrolling table that
// small screens can't show comfortably), and a full data table at `lg` and up
// where there's room for every column at once.
export function AsteroidTable({ rows, maxScore, onViewDetails }) {
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
    <div>
      {/* Mobile + tablet: compact cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:hidden">
        {sortedRows.map((row) => {
          const { asteroid, approach, impactEnergyMt } = row
          return (
            <button
              key={asteroid.id}
              type="button"
              onClick={() => onViewDetails?.(asteroid.id)}
              className="flex min-h-[44px] flex-col gap-2 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/60 p-4 text-left transition-colors hover:border-[var(--color-amber)]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {asteroid.isPotentiallyHazardous && <HazardIndicator size={13} />}
                  <span className="truncate text-sm font-medium text-[var(--color-bone)]">
                    {formatAsteroidName(asteroid.name)}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-[var(--color-signal)]" />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                  Estimated impact energy
                </span>
                <span className="tabular text-sm text-[var(--color-amber)]">
                  {formatImpactEnergy(impactEnergyMt)} Mt
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                  Closest approach
                </span>
                <span className="tabular text-sm text-[var(--color-bone)]">
                  {formatDate(approach?.approachDate)}
                </span>
              </div>

              <div className="mt-1 grid grid-cols-2 gap-2 border-t border-[var(--color-line)] pt-2 text-xs text-[var(--color-signal)]">
                <span>
                  Size{' '}
                  <span className="tabular text-[var(--color-bone)]">
                    {formatDiameterRange(asteroid.estimatedDiameterMinKm, asteroid.estimatedDiameterMaxKm)} m
                  </span>
                </span>
                <span>
                  Speed{' '}
                  <span className="tabular text-[var(--color-bone)]">
                    {formatVelocity(approach?.relativeVelocityKmh)} km/s
                  </span>
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Desktop: full table */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[820px]">
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
                className={`flex items-center gap-1 text-left text-[11px] font-semibold text-[var(--color-signal)] ${
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
              <motion.button
                key={asteroid.id}
                type="button"
                onClick={() => onViewDetails?.(asteroid.id)}
                className="group grid w-full items-center border-t border-[var(--color-line)] py-4 text-left transition-colors hover:bg-[var(--color-void)]/30"
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
                  {formatDate(approach?.approachDate)}
                </span>
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
                <div className="flex items-center gap-3 pr-2">
                  <div className="flex-1">
                    <ImpactEnergyGauge
                      score={impactEnergyMt}
                      maxScore={maxScore}
                      delay={reduceMotion ? 0 : Math.min(i * 0.08, 0.6)}
                    />
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-signal)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    View details
                    <ArrowRight size={12} weight="bold" />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
