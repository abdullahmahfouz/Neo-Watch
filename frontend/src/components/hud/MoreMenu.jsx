import { ArrowsClockwise, ChartLine, GithubLogo, Info } from '@phosphor-icons/react'

// Secondary-options content shared between the mobile bottom-sheet ("More" tab)
// and the desktop overflow popover — one source of truth so the two layouts
// never drift into conflicting labels.
export function MoreMenu({ onRefresh, isRefreshing, onShowTechnicalDetails }) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex min-h-11 w-full items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left text-sm text-[var(--color-bone)] transition-colors hover:text-[var(--color-amber)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowsClockwise size={16} className={isRefreshing ? 'animate-spin' : ''} />
        {isRefreshing ? 'Refreshing…' : 'Refresh data'}
      </button>

      <button
        type="button"
        onClick={onShowTechnicalDetails}
        className="flex min-h-11 w-full items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left text-sm text-[var(--color-bone)] transition-colors hover:text-[var(--color-amber)]"
      >
        <ChartLine size={16} />
        Technical details
      </button>

      <a
        href="https://github.com/abdullahmahfouz/Neo-Watch"
        target="_blank"
        rel="noreferrer"
        className="flex min-h-11 w-full items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left text-sm text-[var(--color-bone)] transition-colors hover:text-[var(--color-amber)]"
      >
        <GithubLogo size={16} />
        View source on GitHub
      </a>

      <div className="flex items-start gap-3 px-4 py-3 text-xs leading-relaxed text-[var(--color-signal)]">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          NeoWatch tracks near-Earth objects from NASA&rsquo;s NeoWs feed and estimates the energy
          each could release on impact based on its size and speed. It does not predict whether or
          when an asteroid will hit Earth.
        </p>
      </div>
    </div>
  )
}
