// Shared label+value stat block. Three call sites (ImpactEnergySummaryCard, FeaturedAsteroid,
// TelemetryPanel) each had a near-identical local component with slightly different
// sizing — this preserves each one's exact existing look via `size`, rather than forcing
// them to a single unified style.
const VARIANTS = {
  // ImpactEnergySummaryCard's original "Stat"
  lg: {
    label: 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]',
    value: 'tabular text-2xl font-medium text-[var(--color-bone)]',
    unit: 'ml-1 text-[var(--color-signal)]',
  },
  // TelemetryPanel's original "Stat" — bordered list row
  md: {
    label: 'text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]',
    value: 'tabular text-lg text-[var(--color-bone)]',
    unit: 'ml-1 text-sm text-[var(--color-signal)]',
  },
  // FeaturedAsteroid's original "Metric"
  sm: {
    label: 'text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]',
    value: 'tabular text-sm text-[var(--color-bone)]',
    unit: 'ml-1 text-[var(--color-signal)]',
  },
}

export function MetricStat({ label, value, unit, size = 'sm', bordered = false }) {
  const variant = VARIANTS[size]
  return (
    <div
      className={`flex flex-col gap-1 ${
        bordered ? 'border-b border-[var(--color-line)] px-3.5 py-3' : ''
      }`}
    >
      <span className={variant.label}>{label}</span>
      <span className={variant.value}>
        {value}
        {unit && <span className={variant.unit}>{unit}</span>}
      </span>
    </div>
  )
}
