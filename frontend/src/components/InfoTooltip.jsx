import { useEffect, useRef, useState } from 'react'
import { Info, X } from '@phosphor-icons/react'

// Small "(i)" affordance used next to jargon-y labels (Energy, Asteroid ID, ...) to explain
// them in plain language without permanently taking up page space. Click-outside-to-close
// mirrors TopNav's alerts/menu dropdowns.
export function InfoTooltip({ title, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`About ${title}`}
        aria-expanded={open}
        className="-m-2.5 flex size-9 items-center justify-center text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
      >
        <Info size={13} />
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-2 w-72 max-w-[80vw] border border-[var(--color-line-strong)] bg-[var(--color-panel)]/95 p-3.5 text-left normal-case tracking-normal backdrop-blur-md ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-amber)]">
              {title}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-[var(--color-signal)] transition-colors hover:text-[var(--color-bone)]"
            >
              <X size={13} />
            </button>
          </div>
          <div className="text-xs leading-relaxed text-[var(--color-signal)]">{children}</div>
        </div>
      )}
    </span>
  )
}
