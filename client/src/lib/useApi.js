import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'

const cache = new Map()

/** GET a resource with loading/error state and an in-memory cache. */
export function useApi(path, { cacheable = true } = {}) {
  const [state, setState] = useState(() => ({
    data: cacheable ? cache.get(path) ?? null : null,
    error: null,
    loading: !(cacheable && cache.has(path)),
  }))
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!path) return
    const ctrl = new AbortController()
    if (!(cacheable && cache.has(path) && nonce === 0)) setState((s) => ({ ...s, loading: true, error: null }))
    api(path, { signal: ctrl.signal })
      .then((data) => {
        if (cacheable) cache.set(path, data)
        setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ ...s, error, loading: false }))
      })
    return () => ctrl.abort()
  }, [path, nonce, cacheable])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
