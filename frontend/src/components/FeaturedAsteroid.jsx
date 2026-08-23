import { RiskGauge } from './RiskGauge'
import { HazardIndicator } from './HazardIndicator'
import { MetricStat } from './MetricStat'
import {
  formatAsteroidName,
  formatDate,
  formatDiameterRange,
  formatDistance,
  formatVelocity,
} from '../lib/format'

export function FeaturedAsteroid({ row, maxScore }) {
  if (!row) return null
  const { asteroid, approach, riskScore } = row

  return (
    <section className="grid grid-cols-1 gap-8 border-t border-[var(--color-line)] pt-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="mb-3 flex items-center gap-2">
          {asteroid.isPotentiallyHazardous && <HazardIndicator pill />}
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Featured — highest tracked risk
          </span>
        </div>
        <h2 className="mb-5 text-3xl font-semibold tracking-tight text-[var(--color-bone)]">
          {formatAsteroidName(asteroid.name)}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
          <MetricStat
            label="Distance"
            value={formatDistance(approach?.missDistanceKm)}
            unit="LD"
          />
          <MetricStat label="Approach" value={formatDate(approach?.approachDate)} />
        </div>
      </div>

      <div className="flex flex-col justify-center lg:col-span-7 lg:pl-8">
        <span className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Risk score
        </span>
        <RiskGauge score={riskScore} maxScore={maxScore} size="lg" delay={0} />
      </div>
    </section>
  )
}
