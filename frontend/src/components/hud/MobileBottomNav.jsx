import { useEffect, useRef, useState } from 'react'
import { Bell, DotsThreeOutline, House, ListBullets, X } from '@phosphor-icons/react'
import { MoreMenu } from './MoreMenu'

const ITEMS = [
  { key: 'home', label: 'Home', icon: House },
  { key: 'asteroids', label: 'Asteroids', icon: ListBullets },
  { key: 'alerts', label: 'Alerts', icon: Bell },
]

// Primary mobile navigation, replacing the old hamburger-only pattern. Always
// visible at the bottom of the screen below `sm` — icons + text, ~56px tall
// rows so every target clears the 44px touch minimum. "More" opens a sheet
// with the same content the desktop overflow popover uses.
export function MobileBottomNav({
  active,
  onHome,
  onAsteroids,
  onAlerts,
  hazardousCount,
  onShowTechnicalDetails,
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!moreOpen) return
    function handlePointerDown(e) {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [moreOpen])

  const handlers = { home: onHome, asteroids: onAsteroids, alerts: onAlerts }

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-line-strong)] bg-[var(--color-panel)]/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary, mobile"
    >
      {moreOpen && (
        <div
          ref={sheetRef}
          className="absolute inset-x-0 bottom-full max-h-[70vh] overflow-y-auto border-t border-[var(--color-line-strong)] bg-[var(--color-panel)]/98 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-signal)]">
              More
            </span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
              className="flex size-9 items-center justify-center text-[var(--color-signal)]"
            >
              <X size={16} />
            </button>
          </div>
          <MoreMenu
            onShowTechnicalDetails={() => {
              onShowTechnicalDetails()
              setMoreOpen(false)
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-4">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={handlers[key]}
              aria-current={isActive ? 'page' : undefined}
              aria-label={key === 'alerts' && hazardousCount > 0 ? `${label}, ${hazardousCount} potentially hazardous` : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[var(--color-amber)]' : 'text-[var(--color-signal)]'
              }`}
            >
              <span className="relative">
                <Icon size={19} weight={isActive ? 'fill' : 'regular'} />
                {key === 'alerts' && hazardousCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-[var(--color-amber)] text-[8px] font-bold text-[#241705]">
                    {hazardousCount}
                  </span>
                )}
              </span>
              {label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
            moreOpen ? 'text-[var(--color-amber)]' : 'text-[var(--color-signal)]'
          }`}
        >
          <DotsThreeOutline size={19} weight={moreOpen ? 'fill' : 'regular'} />
          More
        </button>
      </div>
    </nav>
  )
}
