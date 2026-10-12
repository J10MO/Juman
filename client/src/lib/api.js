const TOKEN_KEY = 'juman-token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (t) => {
    try {
      t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('ماكو اتصال بالسيرفر. تأكد إنه شغّال وجرّب مرة ثانية', 0)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.set(null)
    throw new ApiError(data.error || 'صار خطأ، جرّب مرة ثانية', res.status)
  }
  return data
}
