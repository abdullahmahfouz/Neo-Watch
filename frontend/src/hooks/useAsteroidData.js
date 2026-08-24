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

  // A 401 means the backend has an ingest key configured and this request
  // didn't supply the right one — that's not a real failure, it's a prompt
  // for the caller to collect a key and retry, so it's rethrown rather than
  // surfaced as a generic error banner.
  const runIngest = useCallback(
    async (ingestKey) => {
      setStatus('ingesting')
      try {
        await api.ingest(ingestKey)
        await load()
      } catch (err) {
        if (err?.status === 401) {
          setStatus('ready')
          throw err
        }
        setError(err instanceof Error ? err.message : 'Ingestion failed')
        setStatus('error')
      }
    },
    [load],
  )

  return { rows, status, error, reload: load, runIngest }
}
