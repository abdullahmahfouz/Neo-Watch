import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { TopNav } from '../components/hud/TopNav'
import { SideNav } from '../components/hud/SideNav'
import { SystemStatusHud } from '../components/hud/SystemStatusHud'
import { SelectedAsteroidCard } from '../components/hud/SelectedAsteroidCard'
import { ThreatsPanel } from '../components/hud/ThreatsPanel'
import { TelemetryPanel } from '../components/hud/TelemetryPanel'
import { SceneErrorBoundary } from '../three/SceneErrorBoundary'
import { ImpactView } from './ImpactView'
import { ArchiveView } from './ArchiveView'
import { Footer } from '../components/Footer'
import { IngestKeyModal } from '../components/hud/IngestKeyModal'
import { useAsteroidData } from '../hooks/useAsteroidData'
import { getStoredIngestKey, setStoredIngestKey } from '../lib/ingestKey'

// Three.js (~600kB) is split into its own chunk so it doesn't block the
// first paint, even though the Orbit view now needs it right away.
const SystemScene = lazy(() =>
  import('../three/SystemScene').then((m) => ({ default: m.SystemScene })),
)

export function OrbitView() {
  const { rows, status, error, reload, runIngest } = useAsteroidData()
  const [hazardousOnly, setHazardousOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [activeView, setActiveView] = useState('orbit')
  const [rightPanel, setRightPanel] = useState('threats')
  const [ingestKeyPrompt, setIngestKeyPrompt] = useState(null)
  const [sceneUnavailable, setSceneUnavailable] = useState(false)

  const filteredRows = useMemo(() => {
    if (!hazardousOnly) return rows
    return rows.filter((r) => r.asteroid.isPotentiallyHazardous)
  }, [rows, hazardousOnly])

  const hazardousRows = useMemo(
    () => rows.filter((r) => r.asteroid.isPotentiallyHazardous),
    [rows],
  )

  // Auto-picks the first row on initial load only — after that, an explicit
  // deselect (clicking empty space in the 3D scene, or the info card's close
  // button) sets selectedId to null and it's meant to stay that way. It's
  // still corrected back to a real row if the current selection gets
  // filtered out from under it (e.g. the "Hazardous only" toggle), since
  // that's a side effect of filtering, not a deliberate deselect.
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId == null) {
      if (!didAutoSelect.current) {
        didAutoSelect.current = true
        setSelectedId(filteredRows[0].asteroid.id)
      }
      return
    }
    if (!filteredRows.some((r) => r.asteroid.id === selectedId)) {
      setSelectedId(filteredRows[0].asteroid.id)
    }
  }, [filteredRows, selectedId])

  function lockNext() {
    if (filteredRows.length === 0) return
    const idx = filteredRows.findIndex((r) => r.asteroid.id === selectedId)
    const next = filteredRows[(idx + 1) % filteredRows.length]
    setSelectedId(next.asteroid.id)
  }

  function resetFilters() {
    setHazardousOnly(false)
    if (rows.length > 0) setSelectedId(rows[0].asteroid.id)
  }

  function selectFromAlert(id) {
    setSelectedId(id)
    setActiveView('orbit')
  }

  // Shared by the initial "Initiate Scan" click (no key yet, tries the stored
  // one silently) and the key-modal's submit (an explicit retry) — a 401 on
  // the very first attempt just opens the modal, a 401 while it's already
  // open means the key they typed was wrong.
  async function attemptIngest(key) {
    try {
      await runIngest(key)
      if (key) setStoredIngestKey(key)
      setIngestKeyPrompt(null)
    } catch (err) {
      if (err?.status === 401) {
        setIngestKeyPrompt((prev) => ({ error: prev ? 'Incorrect key.' : null }))
      } else {
        setIngestKeyPrompt(null)
      }
    }
  }

  const isLoading = status === 'loading' && rows.length === 0
  const maxScore = useMemo(
    () => Math.max(...filteredRows.map((r) => r.impactEnergyMt), 0.0001),
    [filteredRows],
  )
  const selectedRow = filteredRows.find((r) => r.asteroid.id === selectedId) ?? null

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[var(--color-void)]">
      <div className="relative flex h-dvh w-full shrink-0 flex-col overflow-hidden">
        {activeView === 'orbit' && (
          <div className="absolute inset-0">
            {sceneUnavailable ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <WarningCircle size={28} className="text-[var(--color-signal)]" />
                <p className="max-w-xs text-xs text-[var(--color-signal)]">
                  3D rendering isn't available in this browser — try enabling hardware
                  acceleration. The lists on the right still work.
                </p>
              </div>
            ) : (
              <Suspense fallback={null}>
                <SceneErrorBoundary onError={() => setSceneUnavailable(true)}>
                  <SystemScene
                    rows={filteredRows}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onUnavailable={() => setSceneUnavailable(true)}
                  />
                </SceneErrorBoundary>
              </Suspense>
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgb(14 15 18 / 0.6) 100%)',
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex h-full flex-col">
          <TopNav
            activeView={activeView}
            onChangeView={setActiveView}
            hazardousOnly={hazardousOnly}
            onToggleHazardous={() => setHazardousOnly((v) => !v)}
            onReset={resetFilters}
            hazardousRows={hazardousRows}
            onSelectAlert={selectFromAlert}
            activePanel={rightPanel}
            onChangePanel={setRightPanel}
            onIngest={() => attemptIngest(getStoredIngestKey())}
            ingestStatus={status}
          />

          <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            <SideNav
              onIngest={() => attemptIngest(getStoredIngestKey())}
              status={status}
              activePanel={rightPanel}
              onChangePanel={setRightPanel}
              panelsDisabled={activeView !== 'orbit'}
            />

            {activeView === 'orbit' && (
              <>
                <div className="flex flex-1 flex-col gap-4 bg-transparent pt-4 lg:justify-between lg:overflow-hidden lg:pt-0">
                  {/* This spacer only matters on lg+, where the 3D scene fills the screen
                      behind an absolutely-sized column and justify-between pins the card/HUD
                      to the bottom. On mobile the column is a normal scrolling flow instead, so
                      an empty flex-1 here would just fight the scroll container for height. */}
                  <div className="hidden lg:block lg:flex-1" />

                  {status === 'error' && (
                    <div className="pointer-events-auto mx-auto flex items-center gap-3 border border-[var(--color-amber)]/50 bg-[var(--color-panel)]/90 px-4 py-3 backdrop-blur-md">
                      <WarningCircle size={16} className="text-[var(--color-amber)]" />
                      <span className="text-xs text-[var(--color-bone)]">
                        Could not reach the NeoWatch API
                      </span>
                      <button
                        type="button"
                        onClick={reload}
                        className="border border-[var(--color-line-strong)] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-bone)]"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {selectedRow && (
                    <div className="mx-auto w-full max-w-3xl px-4">
                      <SelectedAsteroidCard
                        row={selectedRow}
                        maxScore={maxScore}
                        onClose={() => setSelectedId(null)}
                      />
                    </div>
                  )}

                  <div className="px-4 lg:px-0">
                    <SystemStatusHud status={status} />
                  </div>
                </div>

                {rightPanel === 'threats' && (
                  <ThreatsPanel
                    rows={filteredRows}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onLockNext={lockNext}
                    isLoading={isLoading}
                  />
                )}
                {rightPanel === 'telemetry' && (
                  <TelemetryPanel rows={filteredRows} onLockNext={lockNext} />
                )}
              </>
            )}

            {activeView === 'impact' && (
              <ImpactView selectedRow={selectedRow} maxScore={maxScore} />
            )}
            {activeView === 'archive' && (
              <ArchiveView rows={filteredRows} maxScore={maxScore} />
            )}
          </div>
        </div>
      </div>

      <Footer />

      {ingestKeyPrompt && (
        <IngestKeyModal
          error={ingestKeyPrompt.error}
          onSubmit={attemptIngest}
          onCancel={() => setIngestKeyPrompt(null)}
        />
      )}
    </div>
  )
}
