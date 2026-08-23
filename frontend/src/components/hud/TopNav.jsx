import { useEffect, useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  Bell,
  FunnelSimple,
  List,
  X,
} from '@phosphor-icons/react'
import { formatAsteroidName, formatRiskScore } from '../../lib/format'
import { HazardIndicator } from '../HazardIndicator'

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
  { key: 'orbit', label: 'Orbit' },
  { key: 'impact', label: 'Impact' },
  { key: 'archive', label: 'Archive' },
]

export function TopNav({
  activeView,
  onChangeView,
  hazardousOnly,
  onToggleHazardous,
  onReset,
  hazardousRows,
  onSelectAlert,
}) {
  const now = useClock()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const alertsRef = useRef(null)
  const menuRef = useRef(null)
  const hazardousCount = hazardousRows.length

  useEffect(() => {
    if (!alertsOpen) return
    function handlePointerDown(e) {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [alertsOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  return (
    <header className="pointer-events-auto relative flex h-16 items-center justify-between border-b border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <div className="relative md:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="text-[var(--color-bone)] transition-colors hover:text-[var(--color-amber)]"
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>

          {menuOpen && (
            // Fixed + a very high z-index rather than absolute+z-50: the
            // Threats/Telemetry panels below also create their own stacking
            // contexts (backdrop-blur), and this menu needs to reliably
            // paint above them regardless of DOM nesting.
            <nav className="fixed left-4 top-16 z-[100] w-48 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/95 backdrop-blur-md">
              {TABS.map((tab) => {
                const active = tab.key === activeView
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      onChangeView(tab.key)
                      setMenuOpen(false)
                    }}
                    className={`block w-full border-b border-[var(--color-line)] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.1em] transition-colors last:border-b-0 ${
                      active
                        ? 'bg-[var(--color-amber-dim)] text-[var(--color-amber)]'
                        : 'text-[var(--color-signal)] hover:text-[var(--color-bone)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          )}
        </div>

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

      <nav className="hidden items-center gap-8 md:flex">
        {TABS.map((tab) => {
          const active = tab.key === activeView
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeView(tab.key)}
              className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? 'border-b-2 border-[var(--color-amber)] pb-1.5 text-[var(--color-amber)]'
                  : 'border-b-2 border-transparent pb-1.5 text-[var(--color-signal)] hover:text-[var(--color-bone)]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleHazardous}
          className={`hidden items-center gap-2 border px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors sm:flex ${
            hazardousOnly
              ? 'border-[var(--color-amber)] bg-[var(--color-amber-dim)] text-[var(--color-amber)]'
              : 'border-[var(--color-line-strong)] bg-[var(--color-void)]/60 text-[var(--color-signal)]'
          }`}
        >
          <FunnelSimple size={12} weight="bold" />
          Risk: {hazardousOnly ? `Hazardous (${hazardousCount})` : 'All'}
        </button>

        <time
          className="tabular hidden border border-[var(--color-line-strong)] bg-[var(--color-void)]/60 px-3 py-1.5 text-[11px] text-[var(--color-signal)] lg:block"
          dateTime={now.toISOString()}
        >
          {formatTimestamp(now)}
        </time>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset filters"
          title="Reset filters"
          className="hidden text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)] sm:block"
        >
          <ArrowCounterClockwise size={18} />
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            type="button"
            onClick={() => setAlertsOpen((v) => !v)}
            aria-label="Alerts"
            title="Alerts"
            className="relative text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
          >
            <Bell size={18} weight={hazardousCount > 0 ? 'fill' : 'regular'} />
            {hazardousCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center bg-[var(--color-amber)] text-[8px] font-bold text-[#241705]">
                {hazardousCount}
              </span>
            )}
          </button>

          {alertsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/95 backdrop-blur-md">
                <div className="border-b border-[var(--color-line)] px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-signal)]">
                  Hazardous alerts
                </div>
                {hazardousRows.length === 0 && (
                  <p className="px-3.5 py-4 text-xs text-[var(--color-signal)]">
                    No hazardous objects in the current feed.
                  </p>
                )}
                {hazardousRows.map((row) => (
                  <button
                    key={row.asteroid.id}
                    type="button"
                    onClick={() => {
                      onSelectAlert(row.asteroid.id)
                      setAlertsOpen(false)
                    }}
                    className="flex w-full items-center justify-between border-b border-[var(--color-line)] px-3.5 py-2.5 text-left last:border-b-0 hover:bg-[var(--color-void)]/40"
                  >
                    <span className="flex items-center gap-2 text-xs text-[var(--color-bone)]">
                      <HazardIndicator />
                      {formatAsteroidName(row.asteroid.name)}
                    </span>
                    <span className="tabular text-xs text-[var(--color-amber)]">
                      {formatRiskScore(row.riskScore)}
                    </span>
                  </button>
                ))}
              </div>
          )}
        </div>
      </div>
    </header>
  )
}
