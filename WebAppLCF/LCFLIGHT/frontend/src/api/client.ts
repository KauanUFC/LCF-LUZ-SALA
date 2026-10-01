const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('lcflight_token')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('lcflight_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return null as T
  }

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  login(username: string, password: string) {
    return request<{ token: string; user: { id: number; username: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    )
  },

  me() {
    return request<{ user: { userId: number; username: string } }>('/auth/me')
  },

  getRooms() {
    return request<Array<any>>('/rooms')
  },

  getDevices(roomId?: string) {
    const query = roomId ? `?room_id=${roomId}` : ''
    return request<Array<any>>(`/devices${query}`)
  },

  getDevice(id: string) {
    return request<any>(`/devices/${id}`)
  },

  getDeviceHealth(id: string, limit = 50) {
    return request<Array<any>>(`/devices/${id}/health?limit=${limit}`)
  },

  getLights() {
    return request<Array<any>>('/lights')
  },

  sendCommand(payload: {
    room: string
    device: string
    light: string
    state: boolean
    brightness?: number
  }) {
    return request<{ sent: boolean }>('/command', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}