import { useMemo } from 'react'
import { SidePanelShell } from './SidePanelShell'
import { formatAsteroidName, formatDate } from '../../lib/format'

export function TrajectoriesPanel({ rows, selectedId, onSelect, onLockNext }) {
  const sorted = useMemo(() => {
    // useAsteroidData falls back to an asteroid's most recent PAST approach
    // when it has no future one on record, so this list must filter those
    // out explicitly rather than trusting every row with an approach date.
    const todayIso = new Date().toISOString().slice(0, 10)
    return [...rows]
      .filter((r) => r.approach?.approachDate >= todayIso)
      .sort((a, b) => a.approach.approachDate.localeCompare(b.approach.approachDate))
  }, [rows])

  return (
    <SidePanelShell title="Upcoming Trajectories" count={sorted.length} onLockNext={onLockNext}>
      {sorted.length === 0 && (
        <p className="px-3.5 py-6 text-center text-xs text-[var(--color-signal)]">
          No scheduled approaches in this window
        </p>
      )}

      {sorted.map((row) => {
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
            <span
              className={`truncate text-xs ${
                isSelected ? 'text-[var(--color-amber)]' : 'text-[var(--color-bone)]'
              }`}
            >
              {formatAsteroidName(row.asteroid.name)}
            </span>
            <span className="tabular shrink-0 pl-2 text-xs text-[var(--color-signal)]">
              {formatDate(row.approach.approachDate)}
            </span>
          </button>
        )
      })}
    </SidePanelShell>
  )
}
