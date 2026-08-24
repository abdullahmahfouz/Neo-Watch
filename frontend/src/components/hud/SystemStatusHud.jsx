const STATUS_LABEL = {
  ready: 'Operational',
  loading: 'Syncing',
  ingesting: 'Ingesting',
  error: 'Data Error',
}

export function SystemStatusHud({ status }) {
  return (
    <div className="pointer-events-auto mx-auto w-full max-w-3xl border border-l-2 border-[var(--color-amber)]/50 bg-[var(--color-panel)]/80 px-3.5 py-3 backdrop-blur-md lg:mx-0 lg:w-[256px] lg:max-w-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-signal)]">
          SYS_STAT
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`size-2 ${
              status === 'error' ? 'bg-[var(--color-signal)]' : 'bg-[var(--color-bone)]'
            } ${status === 'loading' || status === 'ingesting' ? 'animate-pulse' : ''}`}
          />
          <span className="tabular text-xs tracking-[0.1em] text-[var(--color-bone)]">
            {STATUS_LABEL[status] ?? 'Unknown'}
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-[var(--color-line)] pt-1.5">
        <span className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-signal)]">
          DATA_SRC
        </span>
        <span className="tabular text-xs tracking-[0.1em] text-[var(--color-signal)]">
          NASA NeoWs
        </span>
      </div>
    </div>
  )
}
