import { useEffect, useRef, useState } from 'react'
import { DotsThreeOutline, X } from '@phosphor-icons/react'
import { MoreMenu } from './MoreMenu'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatTimestamp(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} / ${hh}:${mm} UTC`
}

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'asteroids', label: 'Asteroids' },
  { key: 'alerts', label: 'Alerts' },
]

export function TopNav({
  activeTab,
  onHome,
  onAsteroids,
  onAlerts,
  hazardousRows,
  onRefresh,
  refreshStatus,
  onShowTechnicalDetails,
}) {
  const now = useClock()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)
  const hazardousCount = hazardousRows.length

  useEffect(() => {
    if (!moreOpen) return
    function handlePointerDown(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [moreOpen])

  const handlers = { home: onHome, asteroids: onAsteroids, alerts: onAlerts }

  return (
    <header className="pointer-events-auto relative flex h-16 items-center justify-between border-b border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="rgb(232 163 61 / 0.1)" stroke="var(--color-amber)" strokeWidth="1" />
          <circle cx="16" cy="16" r="9" stroke="var(--color-amber)" strokeWidth="1.2" />
          <ellipse cx="16" cy="16" rx="12" ry="4.4" stroke="var(--color-amber)" strokeWidth="1.2" transform="rotate(-28 16 16)" />
          <circle cx="16" cy="16" r="1.5" fill="var(--color-amber)" />
        </svg>
        <span className="text-xl font-bold tracking-tight text-[var(--color-amber)]">
          NeoWatch
        </span>
      </div>

      <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
        {TABS.map((tab) => {
          const active = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={handlers[tab.key]}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-b-2 border-[var(--color-amber)] text-[var(--color-amber)]'
                  : 'border-b-2 border-transparent text-[var(--color-signal)] hover:text-[var(--color-bone)]'
              }`}
            >
              {tab.label}
              {tab.key === 'alerts' && hazardousCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-[var(--color-amber)] text-[9px] font-bold text-[#241705]">
                  {hazardousCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-1 sm:gap-2">
        <time
          className="tabular mr-2 hidden border border-[var(--color-line-strong)] bg-[var(--color-void)]/60 px-3 py-1.5 text-[11px] text-[var(--color-signal)] lg:block"
          dateTime={now.toISOString()}
        >
          {formatTimestamp(now)}
        </time>

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More options"
            aria-expanded={moreOpen}
            className="flex size-11 items-center justify-center text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
          >
            {moreOpen ? <X size={19} /> : <DotsThreeOutline size={19} />}
          </button>

          {moreOpen && (
            <div className="absolute right-0 top-full z-[100] mt-2 w-72 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/95 backdrop-blur-md">
              <div className="border-b border-[var(--color-line)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]">
                More
              </div>
              <MoreMenu
                onRefresh={() => {
                  onRefresh()
                  setMoreOpen(false)
                }}
                isRefreshing={refreshStatus === 'ingesting'}
                onShowTechnicalDetails={() => {
                  onShowTechnicalDetails()
                  setMoreOpen(false)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
