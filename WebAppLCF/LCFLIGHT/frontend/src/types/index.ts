export interface User {
  id: number
  username: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface DemoRoom {
  id: string
  name: string
  device_count: number
  created_at: string
}

export type ConnectionStatus = 'online' | 'offline' | 'needs-setup'

export interface DemoDevice {
  id: string
  name: string
  room_id: string
  room_name: string
  status: ConnectionStatus
  relay_state: boolean
  type: string
  description: string
  fw_version: string
  wifi_ssid: string
  wifi_rssi: number
  uptime_s: number
  free_heap: number
  last_seen: string
  created_at: string
  connection_method: 'mqtt' | 'rest'
  mqtt_broker: string
  mqtt_port: number
  mqtt_user: string
  mqtt_tls: boolean
  topic_prefix: string
  rest_host: string
  rest_endpoint: string
  gpio_pin: number
  pairing_code: string
}

export interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  device_id?: string
  device_name?: string
  room_name?: string
  ts: number
}

export interface WsMessage {
  event: 'snapshot' | 'state' | 'health' | 'availability' | 'ack'
  data: any
  ts: number
}

export interface HealthData {
  id: number
  device_id: string
  uptime_s: number
  wifi_rssi: number
  free_heap: number
  seq: number
  ts: string
  received_at: string
}