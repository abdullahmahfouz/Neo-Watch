import { ArrowRight } from '@phosphor-icons/react'

// Shared chrome for the right-hand HUD panel (the asteroid watchlist and the
// technical-details panel both render inside this). "Next asteroid" stays
// visible across both since it always operates on the current filtered list,
// stepping the 3D scene's selection forward by one.
export function SidePanelShell({ title, subtitle, count, onLockNext, children }) {
  return (
    <aside className="pointer-events-auto flex w-full shrink-0 flex-col gap-4 px-4 py-6 sm:px-8 lg:w-[320px] lg:px-0 lg:pr-8">
      <button
        type="button"
        onClick={onLockNext}
        aria-label="Jump to the next asteroid in this list"
        className="flex min-h-11 items-center justify-center gap-2 border border-[var(--color-amber)] bg-[var(--color-amber-dim)] py-2.5 text-xs font-semibold text-[var(--color-amber)] transition-transform active:translate-y-px"
      >
        Next asteroid
        <ArrowRight size={14} weight="bold" />
      </button>

      <div className="flex flex-1 flex-col border border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 backdrop-blur-md">
        <div className="flex flex-col gap-0.5 border-b border-[var(--color-line)] bg-[var(--color-void)]/40 px-3.5 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]">
              {title}
            </span>
            {count != null && (
              <span className="tabular text-[10px] text-[var(--color-signal)]">
                {String(count).padStart(2, '0')}
              </span>
            )}
          </div>
          {subtitle && <span className="text-[11px] text-[var(--color-signal)]">{subtitle}</span>}
        </div>

        <div className="max-h-[50vh] min-h-[160px] overflow-y-auto lg:max-h-[calc(100dvh-360px)]">
          {children}
        </div>
      </div>
    </aside>
  )
}
