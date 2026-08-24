import { X } from '@phosphor-icons/react'
import { HazardIndicator } from '../HazardIndicator'
import { MetricStat } from '../MetricStat'
import { ImpactEnergyGauge } from '../ImpactEnergyGauge'
import { InfoTooltip } from '../InfoTooltip'
import { EnergyExplainer } from '../EnergyExplainer'
import {
  formatAsteroidName,
  formatDate,
  formatDiameterRange,
  formatDistance,
  formatVelocity,
} from '../../lib/format'

// Sits over the bottom of the Orbit view's 3D scene, updating in place as
// the user clicks different markers — the "info about it" panel from the
// old separate 3D-view page, folded into the same screen as the globe.
export function SelectedAsteroidCard({ row, maxScore, onClose }) {
  if (!row) return null
  const { asteroid, approach, impactEnergyMt } = row

  return (
    <div className="pointer-events-auto relative w-full max-w-3xl border border-[var(--color-line-strong)] bg-[var(--color-panel)]/90 p-4 backdrop-blur-md sm:p-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
        >
          <X size={16} />
        </button>
      )}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pr-6">
        <div>
          <div className="flex items-center gap-2.5">
            {asteroid.isPotentiallyHazardous && <HazardIndicator pill />}
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-bone)] sm:text-lg">
              {formatAsteroidName(asteroid.name)}
            </h2>
          </div>
          <span className="mt-1 block text-[11px] text-[var(--color-signal)]">
            Asteroid ID · {asteroid.nasaId ?? asteroid.id}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Closest approach · {formatDate(approach?.approachDate)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5 sm:items-end">
        <MetricStat
          label="Diameter"
          value={formatDiameterRange(
            asteroid.estimatedDiameterMinKm,
            asteroid.estimatedDiameterMaxKm,
          )}
          unit="m"
        />
        <MetricStat
          label="Velocity"
          value={formatVelocity(approach?.relativeVelocityKmh)}
          unit="km/s"
        />
        <MetricStat label="Distance" value={formatDistance(approach?.missDistanceKm)} unit="LD" />
        <MetricStat label="Orbiting body" value={approach?.orbitingBody ?? '—'} />
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Energy (Mt)
            <InfoTooltip title="What is impact energy?">
              <EnergyExplainer compact />
            </InfoTooltip>
          </span>
          <ImpactEnergyGauge score={impactEnergyMt} maxScore={maxScore} size="md" delay={0} showComparison />
        </div>
      </div>
    </div>
  )
}
