import { CrosshairSimple } from '@phosphor-icons/react'

// Shared chrome for the right-hand HUD panel (Threats / Telemetry /
// Trajectories all render inside this). Target Lock stays visible across all
// three since it always operates on the current filtered list.
export function SidePanelShell({ title, count, onLockNext, children }) {
  return (
    <aside className="pointer-events-auto flex w-[320px] shrink-0 flex-col gap-4 py-6 pr-4 sm:pr-8">
      <button
        type="button"
        onClick={onLockNext}
        className="flex items-center justify-center gap-2 border border-[var(--color-amber)] bg-[var(--color-amber-dim)] py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-amber)] transition-transform active:translate-y-px"
      >
        <CrosshairSimple size={13} weight="bold" />
        Target Lock
      </button>

      <div className="flex flex-1 flex-col border border-[var(--color-line-strong)] bg-[var(--color-panel)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-void)]/40 px-3.5 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-signal)]">
            {title}
          </span>
          {count != null && (
            <span className="tabular text-[10px] text-[var(--color-signal)]">
              {String(count).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="max-h-[calc(100dvh-360px)] min-h-[160px] overflow-y-auto">
          {children}
        </div>
      </div>
    </aside>
  )
}
