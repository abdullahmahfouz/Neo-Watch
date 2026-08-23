import { WarningCircle } from '@phosphor-icons/react'

// Compact icon used wherever a row needs a hazard glyph (AsteroidTable,
// ThreatsPanel, TopNav's alert dropdown). The `pill` variant adds the
// "Hazardous" label in a bordered badge (FeaturedAsteroid's header).
export function HazardIndicator({ size = 12, pill = false }) {
  if (pill) {
    return (
      <span className="flex items-center gap-1 border border-[var(--color-amber)]/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-amber)]">
        <WarningCircle size={11} weight="fill" />
        Hazardous
      </span>
    )
  }
  return <WarningCircle size={size} weight="fill" className="shrink-0 text-[var(--color-amber)]" />
}
