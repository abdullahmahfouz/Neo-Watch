import { useRef } from 'react'
import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { HazardIndicator } from '../HazardIndicator'
import { formatAsteroidName, formatImpactEnergy } from '../../lib/format'

// A horizontal drag/flick past this many px counts as a swipe (cycle to the
// next/previous asteroid) rather than a tap (open the detail page) — same
// idea as SystemScene's CLICK_DRAG_THRESHOLD, just for the opposite call:
// there, a small move still counts as a click: here, only a small move does.
const SWIPE_THRESHOLD_PX = 48

// Mobile-only stand-in for the full SelectedAsteroidCard. On a phone there's no
// room to show the globe AND a full metrics card AND the asteroid list without
// burying the globe, so this collapses the selection down to one tappable row —
// tapping it opens the same full detail page the card's "View asteroid details"
// button does. Desktop keeps the full card since it has room for both.
//
// Swiping left/right (or tapping the caret arrows) cycles to the next/previous
// tracked asteroid without leaving the Home tab — the mobile equivalent of the
// desktop sidebar's "Next asteroid" button, since there's no room for that
// sidebar here and tapping tiny markers on the globe is fiddly on a touchscreen.
export function SelectedAsteroidChip({ row, onViewDetails, onNext, onPrevious, canCycle = true }) {
  const { asteroid, impactEnergyMt } = row
  const startRef = useRef(null)
  const swipedRef = useRef(false)

  function handlePointerDown(e) {
    startRef.current = { x: e.clientX, y: e.clientY }
    swipedRef.current = false
  }

  function handlePointerMove(e) {
    if (!startRef.current || !canCycle) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true
    }
  }

  function handlePointerUp(e) {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    startRef.current = null
    if (canCycle && Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true
      if (dx < 0) onNext?.()
      else onPrevious?.()
    }
  }

  function handleClick() {
    // A real swipe already changed the selection — don't also open the
    // detail page for whatever asteroid the pointer happened to land on.
    if (swipedRef.current) {
      swipedRef.current = false
      return
    }
    onViewDetails?.()
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canCycle}
        aria-label="Previous asteroid"
        className="flex size-11 shrink-0 items-center justify-center text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)] disabled:pointer-events-none disabled:opacity-0"
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="pointer-events-auto flex min-h-[56px] min-w-0 flex-1 touch-pan-y items-center gap-3 border border-[var(--color-line-strong)] bg-[var(--color-panel)]/90 px-4 py-3 text-left backdrop-blur-md transition-colors active:scale-[0.99] hover:border-[var(--color-amber)]/60"
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

      <button
        type="button"
        onClick={onNext}
        disabled={!canCycle}
        aria-label="Next asteroid"
        className="flex size-11 shrink-0 items-center justify-center text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)] disabled:pointer-events-none disabled:opacity-0"
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </div>
  )
}
