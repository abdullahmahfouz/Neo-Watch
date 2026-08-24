import { buildApiUrl } from './config'

// Thin fetch wrapper over the Spring Boot backend using VITE_API_BASE_URL.

async function request(path, options = {}) {
  const res = await fetch(buildApiUrl(path), options)
  if (!res.ok) {
    const err = new Error(`${path} failed: ${res.status} ${res.statusText}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const api = {
  // One call for everything the dashboard needs (asteroid + next approach +
  // risk score per row) instead of upcoming() + hazardous() + a history()/
  // risk() round trip per asteroid.
  dashboard: () => request('/api/neo/dashboard'),
  upcoming: () => request('/api/neo/upcoming'),
  hazardous: () => request('/api/neo/hazardous'),
  history: (asteroidId) => request(`/api/neo/${asteroidId}/history`),
  risk: (asteroidId) => request(`/api/neo/${asteroidId}/risk`),
  riskHistory: (asteroidId) => request(`/api/neo/${asteroidId}/risk-history`),
  // The backend only enforces X-Ingest-Key when INGEST_KEY is configured
  // server-side, so this call works with no key at all in local dev.
  ingest: (ingestKey) =>
    request('/ingest', {
      headers: ingestKey ? { 'X-Ingest-Key': ingestKey } : {},
    }),
}
