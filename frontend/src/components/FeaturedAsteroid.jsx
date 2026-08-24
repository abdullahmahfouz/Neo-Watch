import { ArrowRight } from '@phosphor-icons/react'
import { ImpactEnergyGauge } from './ImpactEnergyGauge'
import { HazardIndicator } from './HazardIndicator'
import { MetricStat } from './MetricStat'
import { InfoTooltip } from './InfoTooltip'
import { EnergyExplainer } from './EnergyExplainer'
import {
  formatAsteroidName,
  formatDate,
  formatDiameterRange,
  formatDistance,
  formatVelocity,
} from '../lib/format'

export function FeaturedAsteroid({ row, maxScore, onViewDetails }) {
  if (!row) return null
  const { asteroid, approach, impactEnergyMt } = row

  return (
    <section className="grid grid-cols-1 gap-8 border-t border-[var(--color-line)] pt-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="mb-3 flex items-center gap-2">
          {asteroid.isPotentiallyHazardous && <HazardIndicator pill />}
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Featured — highest estimated impact energy
          </span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-bone)]">
          {formatAsteroidName(asteroid.name)}
        </h2>
        <span className="mb-5 mt-1 block text-xs text-[var(--color-signal)]">
          Asteroid ID · {asteroid.nasaId ?? asteroid.id}
        </span>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <MetricStat label="Closest approach" value={formatDate(approach?.approachDate)} />
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
          <MetricStat
            label="Distance from Earth"
            value={formatDistance(approach?.missDistanceKm)}
            unit="lunar distances"
          />
        </div>

        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--color-line-strong)] bg-[var(--color-void)]/40 text-xs font-semibold text-[var(--color-bone)] transition-colors hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] sm:w-auto sm:px-5"
          >
            View asteroid details
            <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </div>

      <div className="flex flex-col justify-center lg:col-span-7 lg:pl-8">
        <span className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Estimated impact energy
          <InfoTooltip title="What is impact energy?">
            <EnergyExplainer compact />
          </InfoTooltip>
        </span>
        <ImpactEnergyGauge
          score={impactEnergyMt}
          maxScore={maxScore}
          size="lg"
          delay={0}
          showComparison
          showCategory
        />
      </div>
    </section>
  )
}
