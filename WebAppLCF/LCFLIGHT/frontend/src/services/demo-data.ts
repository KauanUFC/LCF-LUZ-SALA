import type { DemoRoom, DemoDevice, Alert } from '../types'

const STORAGE_KEY_ROOMS = 'lcflight_demo_rooms'
const STORAGE_KEY_DEVICES = 'lcflight_demo_devices'
const STORAGE_KEY_ALERTS = 'lcflight_demo_alerts'
const DEMO_FLAG = 'lcflight_demo_active'

let seqId = 1000
function uid(): string {
  return `demo-${++seqId}-${Math.random().toString(36).slice(2, 8)}`
}

const DEFAULT_ROOMS: DemoRoom[] = [
  { id: uid(), name: 'Sala A', device_count: 2, created_at: new Date().toISOString() },
  { id: uid(), name: 'Lab Física', device_count: 3, created_at: new Date().toISOString() },
  { id: uid(), name: 'Sala de Reuniões', device_count: 1, created_at: new Date().toISOString() },
]

function randomHealth() {
  return {
    wifi_rssi: -35 - Math.floor(Math.random() * 35),
    uptime_s: Math.floor(Math.random() * 86400 * 7),
    free_heap: 140000 + Math.floor(Math.random() * 80000),
  }
}

const DEFAULT_DEVICES: DemoDevice[] = [
  {
    id: uid(), name: 'Luz Principal', room_id: DEFAULT_ROOMS[0].id, room_name: 'Sala A',
    status: 'online', relay_state: true, type: 'ESP32 Light Controller',
    description: 'Controle de iluminação principal da sala', fw_version: '1.0.0',
    wifi_ssid: 'UFC-LAB', wifi_rssi: -45, uptime_s: 259200, free_heap: 186240,
    last_seen: new Date().toISOString(), created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: 'broker.hivemq.com', mqtt_port: 8883,
    mqtt_user: '', mqtt_tls: true, topic_prefix: 'state/sala-A/luz-principal',
    rest_host: '', rest_endpoint: '', gpio_pin: 25, pairing_code: 'A3F9C2',
  },
  {
    id: uid(), name: 'Luz Fundo', room_id: DEFAULT_ROOMS[0].id, room_name: 'Sala A',
    status: 'online', relay_state: false, type: 'ESP32 Light Controller',
    description: 'Iluminação do fundo da sala', fw_version: '1.0.0',
    wifi_ssid: 'UFC-LAB', wifi_rssi: -52, uptime_s: 259200, free_heap: 178400,
    last_seen: new Date(Date.now() - 60000).toISOString(), created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: 'broker.hivemq.com', mqtt_port: 8883,
    mqtt_user: '', mqtt_tls: true, topic_prefix: 'state/sala-A/luz-fundo',
    rest_host: '', rest_endpoint: '', gpio_pin: 26, pairing_code: 'B7D2E1',
  },
  {
    id: uid(), name: 'Bancada 1', room_id: DEFAULT_ROOMS[1].id, room_name: 'Lab Física',
    status: 'online', relay_state: true, type: 'ESP32 Light Controller',
    description: 'Iluminação da bancada principal', fw_version: '1.0.0',
    wifi_ssid: 'UFC-LAB', wifi_rssi: -38, uptime_s: 604800, free_heap: 192000,
    last_seen: new Date().toISOString(), created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: 'broker.hivemq.com', mqtt_port: 8883,
    mqtt_user: '', mqtt_tls: true, topic_prefix: 'state/lab-fisica/bancada-1',
    rest_host: '', rest_endpoint: '', gpio_pin: 25, pairing_code: 'C4A7F3',
  },
  {
    id: uid(), name: 'Bancada 2', room_id: DEFAULT_ROOMS[1].id, room_name: 'Lab Física',
    status: 'offline', relay_state: false, type: 'ESP32 Light Controller',
    description: 'Iluminação da bancada secundária', fw_version: '1.0.0',
    wifi_ssid: '', wifi_rssi: 0, uptime_s: 0, free_heap: 0,
    last_seen: new Date(Date.now() - 7200000).toISOString(), created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: 'broker.hivemq.com', mqtt_port: 8883,
    mqtt_user: '', mqtt_tls: true, topic_prefix: 'state/lab-fisica/bancada-2',
    rest_host: '', rest_endpoint: '', gpio_pin: 26, pairing_code: 'D9E1B4',
  },
  {
    id: uid(), name: 'Exaustor', room_id: DEFAULT_ROOMS[1].id, room_name: 'Lab Física',
    status: 'needs-setup', relay_state: false, type: 'ESP32 Light Controller',
    description: 'Aguardando configuração inicial', fw_version: '',
    wifi_ssid: '', wifi_rssi: 0, uptime_s: 0, free_heap: 0,
    last_seen: '', created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: '', mqtt_port: 1883,
    mqtt_user: '', mqtt_tls: false, topic_prefix: '',
    rest_host: '', rest_endpoint: '', gpio_pin: 27, pairing_code: 'F2C6A8',
  },
  {
    id: uid(), name: 'Luz Mesa', room_id: DEFAULT_ROOMS[2].id, room_name: 'Sala de Reuniões',
    status: 'online', relay_state: false, type: 'ESP32 Light Controller',
    description: 'Iluminação da mesa de reuniões', fw_version: '1.0.0',
    wifi_ssid: 'UFC-LAB', wifi_rssi: -61, uptime_s: 172800, free_heap: 165200,
    last_seen: new Date(Date.now() - 300000).toISOString(), created_at: new Date().toISOString(),
    connection_method: 'mqtt', mqtt_broker: 'broker.hivemq.com', mqtt_port: 8883,
    mqtt_user: '', mqtt_tls: true, topic_prefix: 'state/reunioes/luz-mesa',
    rest_host: '', rest_endpoint: '', gpio_pin: 25, pairing_code: 'E3B7D9',
  },
]

function readFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return [...fallback]
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return [...fallback]
  } catch {
    return [...fallback]
  }
}

function writeToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function saveRooms(rooms: DemoRoom[]) {
  writeToStorage(STORAGE_KEY_ROOMS, rooms)
}
function loadRooms(): DemoRoom[] {
  return readFromStorage(STORAGE_KEY_ROOMS, DEFAULT_ROOMS)
}

function saveDevices(devices: DemoDevice[]) {
  writeToStorage(STORAGE_KEY_DEVICES, devices)
}
function loadDevices(): DemoDevice[] {
  return readFromStorage(STORAGE_KEY_DEVICES, DEFAULT_DEVICES)
}

function saveAlerts(alerts: Alert[]) {
  writeToStorage(STORAGE_KEY_ALERTS, alerts)
}
function loadAlerts(): Alert[] {
  return readFromStorage(STORAGE_KEY_ALERTS, generateAlerts(loadDevices()))
}

function generateAlerts(devices: DemoDevice[]): Alert[] {
  const alerts: Alert[] = []
  for (const d of devices) {
    if (d.status === 'offline') {
      alerts.push({
        id: `alert-offline-${d.id}`,
        type: 'error',
        message: `${d.name} está offline`,
        device_id: d.id,
        device_name: d.name,
        room_name: d.room_name,
        ts: Date.now(),
      })
    } else if (d.status === 'needs-setup') {
      alerts.push({
        id: `alert-setup-${d.id}`,
        type: 'warning',
        message: `${d.name} precisa de configuração`,
        device_id: d.id,
        device_name: d.name,
        room_name: d.room_name,
        ts: Date.now(),
      })
    }
  }
  return alerts
}

export const demoData = {
  markActive() {
    localStorage.setItem(DEMO_FLAG, 'true')
  },
  isActive(): boolean {
    return localStorage.getItem(DEMO_FLAG) === 'true'
  },
  clearActive() {
    localStorage.removeItem(DEMO_FLAG)
  },
  resetDemo() {
    localStorage.removeItem(STORAGE_KEY_ROOMS)
    localStorage.removeItem(STORAGE_KEY_DEVICES)
    localStorage.removeItem(STORAGE_KEY_ALERTS)
  },

  getRooms(): DemoRoom[] {
    return loadRooms()
  },
  addRoom(name: string): DemoRoom {
    const rooms = loadRooms()
    const room: DemoRoom = { id: uid(), name, device_count: 0, created_at: new Date().toISOString() }
    rooms.push(room)
    saveRooms(rooms)
    return room
  },
  renameRoom(id: string, name: string) {
    const rooms = loadRooms()
    const room = rooms.find(r => r.id === id)
    if (room) { room.name = name; saveRooms(rooms) }
  },
  deleteRoom(id: string, moveToRoomId?: string) {
    const rooms = loadRooms()
    const idx = rooms.findIndex(r => r.id === id)
    if (idx === -1) return
    rooms.splice(idx, 1)
    saveRooms(rooms)
    if (moveToRoomId) {
      const devices = loadDevices()
      const targetRoom = rooms.find(r => r.id === moveToRoomId)
      for (const d of devices) {
        if (d.room_id === id) {
          d.room_id = moveToRoomId
          d.room_name = targetRoom?.name ?? 'Unknown'
        }
      }
      saveDevices(devices)
    }
  },
  getRoomCount(): number {
    return loadRooms().length
  },
  getRoomDeviceCount(roomId: string): number {
    return loadDevices().filter(d => d.room_id === roomId).length
  },

  getDevices(): DemoDevice[] {
    return loadDevices()
  },
  getDevicesByRoom(roomId: string): DemoDevice[] {
    return loadDevices().filter(d => d.room_id === roomId)
  },
  getDevice(id: string): DemoDevice | undefined {
    return loadDevices().find(d => d.id === id)
  },
  addDevice(device: Omit<DemoDevice, 'id' | 'created_at'>): DemoDevice {
    const devices = loadDevices()
    const newDevice: DemoDevice = { ...device, id: uid(), created_at: new Date().toISOString() }
    devices.push(newDevice)
    saveDevices(devices)

    const rooms = loadRooms()
    const room = rooms.find(r => r.id === newDevice.room_id)
    if (room) { room.device_count = devices.filter(d => d.room_id === newDevice.room_id).length; saveRooms(rooms) }

    return newDevice
  },
  updateDevice(id: string, updates: Partial<DemoDevice>): DemoDevice | undefined {
    const devices = loadDevices()
    const idx = devices.findIndex(d => d.id === id)
    if (idx === -1) return undefined
    devices[idx] = { ...devices[idx], ...updates }
    saveDevices(devices)
    return devices[idx]
  },
  deleteDevice(id: string) {
    const devices = loadDevices()
    const idx = devices.findIndex(d => d.id === id)
    if (idx === -1) return
    const dev = devices[idx]
    devices.splice(idx, 1)
    saveDevices(devices)
    const rooms = loadRooms()
    const room = rooms.find(r => r.id === dev.room_id)
    if (room) {
      room.device_count = Math.max(0, room.device_count - 1)
      saveRooms(rooms)
    }
  },
  toggleRelay(id: string): boolean | undefined {
    const devices = loadDevices()
    const d = devices.find(dev => dev.id === id)
    if (!d || d.status !== 'online') return undefined
    d.relay_state = !d.relay_state
    d.last_seen = new Date().toISOString()
    saveDevices(devices)
    return d.relay_state
  },
  moveDevice(deviceId: string, targetRoomId: string) {
    const devices = loadDevices()
    const rooms = loadRooms()
    const device = devices.find(d => d.id === deviceId)
    const targetRoom = rooms.find(r => r.id === targetRoomId)
    if (!device || !targetRoom) return
    const oldRoomId = device.room_id
    device.room_id = targetRoomId
    device.room_name = targetRoom.name
    saveDevices(devices)
    const oldRoom = rooms.find(r => r.id === oldRoomId)
    if (oldRoom) {
      oldRoom.device_count = Math.max(0, oldRoom.device_count - 1)
    }
    targetRoom.device_count = devices.filter(d => d.room_id === targetRoomId).length
    saveRooms(rooms)
  },

  getAlerts(): Alert[] {
    return generateAlerts(loadDevices())
  },
  getSummary(): { online: number; offline: number; needsSetup: number; total: number } {
    const devices = loadDevices()
    return {
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      needsSetup: devices.filter(d => d.status === 'needs-setup').length,
      total: devices.length,
    }
  },

  createPairingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }
}