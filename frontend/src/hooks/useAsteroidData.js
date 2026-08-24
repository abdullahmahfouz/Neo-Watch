import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

// A malformed impact energy estimate (bad upstream data) would otherwise hand
// the UI Infinity/NaN, which corrupts every gauge sharing the same maxScore
// (ratio = score / maxScore becomes NaN for the whole list, not just this
// row). Treat a non-finite value as unknown rather than propagating it.
function normalizeRow(row) {
  return {
    ...row,
    impactEnergyMt: Number.isFinite(row.impactEnergyMt) ? row.impactEnergyMt : 0,
  }
}

export function useAsteroidData() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const dashboard = await api.dashboard()
      const joined = dashboard.map(normalizeRow)
      joined.sort((a, b) => b.impactEnergyMt - a.impactEnergyMt)
      setRows(joined)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NEO data')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { rows, status, error, reload: load }
}
