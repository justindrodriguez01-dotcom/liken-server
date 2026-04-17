export function getToken() {
  return localStorage.getItem('cm_token')
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return res.json()
}
