import { MetricStat } from './MetricStat'
import { InfoTooltip } from './InfoTooltip'
import { EnergyExplainer } from './EnergyExplainer'

export function ImpactEnergySummaryCard({ total, hazardousCount, highestImpactEnergy }) {
  return (
    <div
      className="grid grid-cols-3 gap-6 border border-[var(--color-line)] bg-[var(--color-panel)] p-6"
      style={{ borderRadius: '4px' }}
    >
      <div className="col-span-3 mb-1 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-[var(--color-bone)]">
          Today&rsquo;s Impact Energy Summary
        </h1>
      </div>
      <MetricStat size="lg" label="Objects tracked" value={total} />
      <MetricStat size="lg" label="Hazardous" value={hazardousCount} />
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]">
          Highest impact energy (Mt)
          <InfoTooltip title="What is impact energy?" align="right">
            <EnergyExplainer compact />
          </InfoTooltip>
        </span>
        <span className="tabular text-2xl font-medium text-[var(--color-bone)]">
          {highestImpactEnergy != null ? highestImpactEnergy : '—'}
        </span>
      </div>
    </div>
  )
}
