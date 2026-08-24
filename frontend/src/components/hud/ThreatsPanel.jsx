import { SidePanelShell } from './SidePanelShell'
import { HazardIndicator } from '../HazardIndicator'
import { formatAsteroidName, formatDate, formatImpactEnergy } from '../../lib/format'

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line)] px-3.5 py-3.5">
      <div className="h-3 w-28 animate-pulse bg-[var(--color-line-strong)]" />
      <div className="h-3 w-10 animate-pulse bg-[var(--color-line-strong)]" />
    </div>
  )
}

export function ThreatsPanel({ rows, selectedId, onSelect, onLockNext, isLoading, hazardousOnly }) {
  return (
    <SidePanelShell
      title={hazardousOnly ? 'Hazardous Alerts' : 'Asteroids to Watch'}
      subtitle={!isLoading ? `${rows.length} object${rows.length === 1 ? '' : 's'} sorted by estimated impact energy` : undefined}
      count={rows.length}
      onLockNext={onLockNext}
    >
      {isLoading && (
        <p className="px-3.5 pb-1 pt-3 text-xs text-[var(--color-signal)]">Loading asteroid data…</p>
      )}
      {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

      {!isLoading && rows.length === 0 && (
        <p className="px-3.5 py-6 text-center text-xs text-[var(--color-signal)]">
          No asteroids to display in this window.
        </p>
      )}

      {!isLoading &&
        rows.map((row) => {
          const isSelected = row.asteroid.id === selectedId
          return (
            <button
              key={row.asteroid.id}
              type="button"
              onClick={() => onSelect(row.asteroid.id)}
              aria-current={isSelected ? 'true' : undefined}
              className={`flex w-full min-h-[52px] flex-col gap-1 border-b border-[var(--color-line)] px-3.5 py-3 text-left transition-colors ${
                isSelected ? 'bg-[var(--color-amber-dim)]' : 'hover:bg-[var(--color-void)]/40'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  {row.asteroid.isPotentiallyHazardous && <HazardIndicator />}
                  <span
                    className={`truncate text-xs font-medium ${
                      isSelected ? 'text-[var(--color-amber)]' : 'text-[var(--color-bone)]'
                    }`}
                  >
                    {formatAsteroidName(row.asteroid.name)}
                  </span>
                </span>
                <span className="tabular shrink-0 pl-2 text-xs text-[var(--color-amber)]">
                  {formatImpactEnergy(row.impactEnergyMt)} Mt
                </span>
              </span>
              <span className="text-[11px] text-[var(--color-signal)]">
                Closest approach {formatDate(row.approach?.approachDate)}
              </span>
            </button>
          )
        })}
    </SidePanelShell>
  )
}
