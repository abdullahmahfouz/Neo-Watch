import { ArrowsClockwise, ChartLine, Sparkle, Target } from '@phosphor-icons/react'

const NAV_LINKS = [
  { key: 'threats', label: 'Threats', icon: Target },
  { key: 'telemetry', label: 'Telemetry', icon: ChartLine },
  { key: 'trajectories', label: 'Trajectories', icon: Sparkle },
]

export function SideNav({ onIngest, status, activePanel, onChangePanel, panelsDisabled }) {
  const isIngesting = status === 'ingesting'

  return (
    <aside className="pointer-events-auto hidden w-[256px] shrink-0 flex-col justify-between border-r border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 py-5 backdrop-blur-md lg:flex">
      <div className="flex flex-col gap-6 px-5 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center border border-[var(--color-line-strong)] bg-[var(--color-void)]">
            <Target size={18} className="text-[var(--color-amber)]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-amber)]">
              Orbital CMD
            </div>
            <div className="tabular text-[11px] uppercase tracking-[0.1em] text-[var(--color-signal)]">
              Sector 7-G
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onIngest}
          disabled={isIngesting}
          className="flex items-center justify-center gap-2 border border-[var(--color-amber)] bg-[var(--color-amber)] py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#241705] transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowsClockwise size={13} weight="bold" className={isIngesting ? 'animate-spin' : ''} />
          {isIngesting ? 'Scanning' : 'Initiate Scan'}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_LINKS.map(({ key, label, icon: Icon }) => {
          const active = key === activePanel
          return (
            <button
              key={key}
              type="button"
              disabled={panelsDisabled}
              onClick={() => onChangePanel(key)}
              className={`flex items-center gap-3 border-l-2 py-2 pl-3.5 pr-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber-dim)] text-[var(--color-amber)]'
                  : 'border-transparent text-[var(--color-signal)] enabled:hover:text-[var(--color-bone)]'
              }`}
            >
              <Icon size={15} weight={active ? 'bold' : 'regular'} />
              <span className="text-[10px] font-bold uppercase tracking-[0.05em]">{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
