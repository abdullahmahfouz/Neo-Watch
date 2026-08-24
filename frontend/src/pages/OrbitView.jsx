import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { TopNav } from '../components/hud/TopNav'
import { SideNav } from '../components/hud/SideNav'
import { MobileBottomNav } from '../components/hud/MobileBottomNav'
import { SystemStatusHud } from '../components/hud/SystemStatusHud'
import { SelectedAsteroidCard } from '../components/hud/SelectedAsteroidCard'
import { SelectedAsteroidChip } from '../components/hud/SelectedAsteroidChip'
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
  const [previousView, setPreviousView] = useState('orbit')
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

  // Shared step for both the desktop "Next asteroid" button and the mobile
  // chip's swipe/arrow gestures — one asteroid list, one notion of "next".
  function cycleSelection(step) {
    if (filteredRows.length === 0) return
    const idx = filteredRows.findIndex((r) => r.asteroid.id === selectedId)
    const nextIdx = (idx + step + filteredRows.length) % filteredRows.length
    setSelectedId(filteredRows[nextIdx].asteroid.id)
  }

  function lockNext() {
    cycleSelection(1)
  }

  function lockPrevious() {
    cycleSelection(-1)
  }

  // The three primary destinations (Home / Asteroids / Alerts), reachable
  // identically from the desktop top bar and the mobile bottom nav. Alerts is
  // not a separate page — it's the existing hazardous-only filter combined
  // with the Asteroids list, so there's exactly one hazardous-filtering
  // control instead of a nav item duplicating a filter pill.
  function goHome() {
    setHazardousOnly(false)
    setActiveView('orbit')
  }

  function goAsteroids() {
    setHazardousOnly(false)
    setActiveView('archive')
  }

  function goAlerts() {
    setHazardousOnly(true)
    setActiveView('archive')
  }

  function viewDetails(id) {
    setPreviousView(activeView === 'archive' ? 'archive' : 'orbit')
    setSelectedId(id)
    setActiveView('impact')
  }

  function backFromDetails() {
    setActiveView(previousView)
  }

  function showTechnicalDetails() {
    setRightPanel('telemetry')
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

  const activeTab =
    activeView === 'orbit' ? 'home' : activeView === 'archive' ? (hazardousOnly ? 'alerts' : 'asteroids') : null

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
            activeTab={activeTab}
            onHome={goHome}
            onAsteroids={goAsteroids}
            onAlerts={goAlerts}
            hazardousRows={hazardousRows}
            onRefresh={() => attemptIngest(getStoredIngestKey())}
            refreshStatus={status}
            onShowTechnicalDetails={showTechnicalDetails}
          />

          <div className="flex flex-1 flex-col overflow-y-auto pb-16 sm:pb-0 lg:flex-row lg:overflow-hidden">
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
                    <div className="pointer-events-auto mx-auto flex flex-wrap items-center gap-3 border border-[var(--color-amber)]/50 bg-[var(--color-panel)]/90 px-4 py-3 backdrop-blur-md">
                      <WarningCircle size={16} className="shrink-0 text-[var(--color-amber)]" />
                      <span className="text-xs text-[var(--color-bone)]">
                        Asteroid data couldn&rsquo;t be loaded.
                      </span>
                      <button
                        type="button"
                        onClick={reload}
                        className="min-h-9 border border-[var(--color-line-strong)] px-3 text-xs font-semibold text-[var(--color-bone)] transition-colors hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {selectedRow && (
                    <div className="relative z-20 mx-auto w-full max-w-3xl px-4">
                      {/* Mobile: a one-line tappable summary so the globe stays the main
                          event. Desktop: the full metrics card, which there's room for. */}
                      <div className="lg:hidden">
                        <SelectedAsteroidChip
                          row={selectedRow}
                          onViewDetails={() => viewDetails(selectedRow.asteroid.id)}
                          onNext={lockNext}
                          onPrevious={lockPrevious}
                          canCycle={filteredRows.length > 1}
                        />
                      </div>
                      <div className="hidden lg:block">
                        <SelectedAsteroidCard
                          row={selectedRow}
                          maxScore={maxScore}
                          onClose={() => setSelectedId(null)}
                          onViewDetails={() => viewDetails(selectedRow.asteroid.id)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status chrome, not essential to the globe experience — desktop only */}
                  <div className="hidden lg:block">
                    <SystemStatusHud status={status} />
                  </div>
                </div>

                {/* The Threats list duplicates the "Asteroids" bottom-nav tab on mobile,
                    where there's no room to show it alongside the globe anyway */}
                <div className="hidden lg:block">
                  {rightPanel === 'threats' && (
                    <ThreatsPanel
                      rows={filteredRows}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onLockNext={lockNext}
                      isLoading={isLoading}
                      hazardousOnly={hazardousOnly}
                    />
                  )}
                </div>
                {/* Telemetry only ever renders when explicitly requested (MoreMenu's
                    "Technical details"), so it's fine on any viewport including mobile */}
                {rightPanel === 'telemetry' && (
                  <TelemetryPanel rows={filteredRows} onLockNext={lockNext} />
                )}
              </>
            )}

            {activeView === 'impact' && (
              <ImpactView selectedRow={selectedRow} maxScore={maxScore} onBack={backFromDetails} />
            )}
            {activeView === 'archive' && (
              <ArchiveView
                rows={filteredRows}
                maxScore={maxScore}
                status={status}
                hazardousOnly={hazardousOnly}
                onViewDetails={viewDetails}
              />
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav
        active={activeTab}
        onHome={goHome}
        onAsteroids={goAsteroids}
        onAlerts={goAlerts}
        hazardousCount={hazardousRows.length}
        onRefresh={() => attemptIngest(getStoredIngestKey())}
        isRefreshing={status === 'ingesting'}
        onShowTechnicalDetails={showTechnicalDetails}
      />

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
