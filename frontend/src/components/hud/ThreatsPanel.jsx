import { SidePanelShell } from './SidePanelShell'
import { HazardIndicator } from '../HazardIndicator'
import { formatAsteroidName, formatRiskScore } from '../../lib/format'

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line)] px-3.5 py-3">
      <div className="h-3 w-28 animate-pulse bg-[var(--color-line-strong)]" />
      <div className="h-3 w-10 animate-pulse bg-[var(--color-line-strong)]" />
    </div>
  )
}

export function ThreatsPanel({ rows, selectedId, onSelect, onLockNext, isLoading }) {
  return (
    <SidePanelShell title="Active Threats" count={rows.length} onLockNext={onLockNext}>
      {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

      {!isLoading && rows.length === 0 && (
        <p className="px-3.5 py-6 text-center text-xs text-[var(--color-signal)]">
          No close approaches in this window
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
              className={`flex w-full items-center justify-between border-b border-[var(--color-line)] px-3.5 py-3 text-left transition-colors ${
                isSelected ? 'bg-[var(--color-amber-dim)]' : 'hover:bg-[var(--color-void)]/40'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {row.asteroid.isPotentiallyHazardous && <HazardIndicator />}
                <span
                  className={`truncate text-xs ${
                    isSelected ? 'text-[var(--color-amber)]' : 'text-[var(--color-bone)]'
                  }`}
                >
                  {formatAsteroidName(row.asteroid.name)}
                </span>
              </span>
              <span className="tabular shrink-0 pl-2 text-xs text-[var(--color-amber)]">
                {formatRiskScore(row.riskScore)}
              </span>
            </button>
          )
        })}
    </SidePanelShell>
  )
}
