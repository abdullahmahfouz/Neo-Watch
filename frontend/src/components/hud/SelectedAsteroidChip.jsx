import { ArrowRight } from '@phosphor-icons/react'
import { HazardIndicator } from '../HazardIndicator'
import { formatAsteroidName, formatImpactEnergy } from '../../lib/format'

// Mobile-only stand-in for the full SelectedAsteroidCard. On a phone there's no
// room to show the globe AND a full metrics card AND the asteroid list without
// burying the globe, so this collapses the selection down to one tappable row —
// tapping it opens the same full detail page the card's "View asteroid details"
// button does. Desktop keeps the full card since it has room for both.
export function SelectedAsteroidChip({ row, onViewDetails }) {
  const { asteroid, impactEnergyMt } = row

  return (
    <button
      type="button"
      onClick={onViewDetails}
      className="pointer-events-auto flex min-h-[56px] w-full items-center gap-3 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/90 px-4 py-3 text-left backdrop-blur-md transition-colors hover:border-[var(--color-amber)]/60"
    >
      {asteroid.isPotentiallyHazardous && <HazardIndicator size={14} />}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-bone)]">
        {formatAsteroidName(asteroid.name)}
      </span>
      <span className="tabular shrink-0 text-sm text-[var(--color-amber)]">
        {formatImpactEnergy(impactEnergyMt)} Mt
      </span>
      <ArrowRight size={15} className="shrink-0 text-[var(--color-signal)]" />
    </button>
  )
}
