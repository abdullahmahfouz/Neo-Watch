import { ChartLine, ListBullets } from '@phosphor-icons/react'

const NAV_LINKS = [
  { key: 'threats', label: 'Asteroids to Watch', icon: ListBullets },
  { key: 'telemetry', label: 'Technical Details', icon: ChartLine },
]

// The lg+ column shown alongside the 3D scene. This is context-local to the
// Orbit view (switching between the watchlist and the technical-stats
// readout), separate from primary Home/Asteroids/Alerts navigation, which
// lives in TopNav.
export function SideNav({ activePanel, onChangePanel, panelsDisabled }) {
  return (
    <aside className="pointer-events-auto hidden w-[256px] shrink-0 flex-col border-r border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 py-5 backdrop-blur-md lg:flex">
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-8" aria-label="Orbit view panels">
        {NAV_LINKS.map(({ key, label, icon: Icon }) => {
          const active = key === activePanel
          return (
            <button
              key={key}
              type="button"
              disabled={panelsDisabled}
              onClick={() => onChangePanel(key)}
              aria-current={active ? 'true' : undefined}
              className={`flex min-h-11 items-center gap-3 border-l-2 py-2.5 pl-3.5 pr-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber-dim)] text-[var(--color-amber)]'
                  : 'border-transparent text-[var(--color-signal)] enabled:hover:text-[var(--color-bone)]'
              }`}
            >
              <Icon size={16} weight={active ? 'bold' : 'regular'} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
