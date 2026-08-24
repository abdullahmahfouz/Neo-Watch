import { ArrowRight, X } from '@phosphor-icons/react'
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
export function SelectedAsteroidCard({ row, maxScore, onClose, onViewDetails }) {
  if (!row) return null
  const { asteroid, approach, impactEnergyMt } = row

  return (
    <div className="pointer-events-auto relative w-full max-w-3xl border border-[var(--color-line-strong)] bg-[var(--color-panel)]/90 p-4 backdrop-blur-md sm:p-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close asteroid details"
          className="absolute right-2 top-2 flex size-9 items-center justify-center text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
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
        <span className="flex items-center gap-1 text-[11px] text-[var(--color-signal)]">
          Closest approach · <span className="text-[var(--color-bone)]">{formatDate(approach?.approachDate)}</span>
          <InfoTooltip title="Closest approach">
            The date this asteroid passes closest to Earth. It does not mean an impact.
          </InfoTooltip>
        </span>
      </div>

      {/* This card lives beside a fixed-width sidebar and watchlist panel at lg+, so its
          available width actually shrinks right when `sm:grid-cols-5` would kick in — the
          5-column layout only gets enough room again once the viewport is wide enough to
          give it back (xl). Between those, 3 columns keeps labels from wrapping onto each
          other. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 sm:items-end xl:grid-cols-5">
        <MetricStat
          label="Estimated size"
          value={formatDiameterRange(
            asteroid.estimatedDiameterMinKm,
            asteroid.estimatedDiameterMaxKm,
          )}
          unit="m"
        />
        <MetricStat
          label="Speed"
          value={formatVelocity(approach?.relativeVelocityKmh)}
          unit="km/s"
        />
        <MetricStat label="Distance from Earth" value={formatDistance(approach?.missDistanceKm)} unit="LD" />
        <MetricStat label="Orbits" value={approach?.orbitingBody ?? '—'} />
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Estimated impact energy
            <InfoTooltip title="What is impact energy?" align="right">
              <EnergyExplainer compact />
            </InfoTooltip>
          </span>
          <ImpactEnergyGauge
            score={impactEnergyMt}
            maxScore={maxScore}
            size="md"
            delay={0}
            showComparison
            showCategory
          />
        </div>
      </div>

      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--color-line-strong)] bg-[var(--color-void)]/40 text-xs font-semibold text-[var(--color-bone)] transition-colors hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] sm:w-auto sm:px-5"
        >
          View asteroid details
          <ArrowRight size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}
