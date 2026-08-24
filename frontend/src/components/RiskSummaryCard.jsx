import { MetricStat } from './MetricStat'

export function RiskSummaryCard({ total, hazardousCount, highestImpactEnergy }) {
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
      <MetricStat
        size="lg"
        label="Highest impact energy (Mt)"
        value={highestImpactEnergy != null ? highestImpactEnergy : '—'}
      />
    </div>
  )
}
