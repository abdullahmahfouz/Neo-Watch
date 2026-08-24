// Central place for backend origin configuration.
// Set VITE_API_BASE_URL to your backend origin, e.g. http://localhost:8080.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '')
}

export const API_BASE_URL = rawBaseUrl
  ? stripTrailingSlash(rawBaseUrl)
  : 'http://localhost:8080'

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}