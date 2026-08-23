import { useEffect, useState } from 'react'
import { api } from '../api/client'

// Backs the Impact view: pulls full approach history and the risk-score
// trend for one asteroid on demand. Both endpoints exist on the backend
// (NeoController) but had no UI consumer until now.
export function useAsteroidDetail(asteroidId) {
  const [history, setHistory] = useState([])
  const [riskHistory, setRiskHistory] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (asteroidId == null) {
      setHistory([])
      setRiskHistory([])
      setStatus('idle')
      return
    }
    let cancelled = false
    setStatus('loading')
    Promise.all([api.history(asteroidId), api.riskHistory(asteroidId)])
      .then(([h, rh]) => {
        if (cancelled) return
        setHistory(h)
        setRiskHistory(rh)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [asteroidId])

  return { history, riskHistory, status }
}
