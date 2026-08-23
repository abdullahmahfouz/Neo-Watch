import { useMemo } from 'react'
import { SidePanelShell } from './SidePanelShell'
import { MetricStat } from '../MetricStat'
import { kmhToKmS, kmToLunarDistance } from '../../lib/format'

// Aggregate telemetry derived from the currently loaded/filtered rows.
// Nothing here is invented: min/max/avg over the real fetched fields.
export function TelemetryPanel({ rows, onLockNext }) {
  const stats = useMemo(() => {
    if (rows.length === 0) return null
    const velocities = rows
      .map((r) => kmhToKmS(r.approach?.relativeVelocityKmh))
      .filter((v) => v != null)
    const distances = rows
      .map((r) => kmToLunarDistance(r.approach?.missDistanceKm))
      .filter((v) => v != null)
    const diameters = rows
      .map((r) => {
        const { estimatedDiameterMinKm: min, estimatedDiameterMaxKm: max } = r.asteroid
        return min != null && max != null ? (min + max) / 2 : null
      })
      .filter((v) => v != null)

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)
    const avgDiameterKm = avg(diameters)

    return {
      count: rows.length,
      avgVelocity: avg(velocities),
      minVelocity: velocities.length ? Math.min(...velocities) : null,
      maxVelocity: velocities.length ? Math.max(...velocities) : null,
      avgDistance: avg(distances),
      closestDistance: distances.length ? Math.min(...distances) : null,
      avgDiameterM: avgDiameterKm != null ? Math.round(avgDiameterKm * 1000) : '—',
    }
  }, [rows])

  return (
    <SidePanelShell title="Telemetry" onLockNext={onLockNext}>
      {!stats && (
        <p className="px-3.5 py-6 text-center text-xs text-[var(--color-signal)]">
          No telemetry in this window
        </p>
      )}
      {stats && (
        <>
          <MetricStat size="md" bordered label="Objects in feed" value={stats.count} />
          <MetricStat
            size="md"
            bordered
            label="Avg. velocity"
            value={stats.avgVelocity != null ? stats.avgVelocity.toFixed(1) : '—'}
            unit="km/s"
          />
          <MetricStat
            size="md"
            bordered
            label="Velocity range"
            value={
              stats.minVelocity != null
                ? `${stats.minVelocity.toFixed(1)}-${stats.maxVelocity.toFixed(1)}`
                : '—'
            }
            unit="km/s"
          />
          <MetricStat
            size="md"
            bordered
            label="Avg. distance"
            value={stats.avgDistance != null ? stats.avgDistance.toFixed(1) : '—'}
            unit="LD"
          />
          <MetricStat
            size="md"
            bordered
            label="Closest approach"
            value={stats.closestDistance != null ? stats.closestDistance.toFixed(2) : '—'}
            unit="LD"
          />
          <MetricStat size="md" bordered label="Avg. diameter" value={stats.avgDiameterM} unit="m" />
        </>
      )}
    </SidePanelShell>
  )
}
