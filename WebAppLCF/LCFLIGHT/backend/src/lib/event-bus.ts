import { EventEmitter } from 'events'

export type MqttStateEvent = {
  room: string
  device: string
  light: string
  state: boolean
  brightness: number
  seq?: number
  source?: string
  ts?: number
}

export type MqttHealthEvent = {
  room: string
  device: string
  uptime_s: number
  wifi_rssi: number
  free_heap: number
  seq: number
  ts?: number
}

export type MqttAvailabilityEvent = {
  room: string
  device: string
  status: 'online' | 'offline'
  fw_version?: string
}

export type MqttAckEvent = {
  room: string
  device: string
  light: string
  msg_id?: string
  seq: number
  status: string
  state: boolean
  brightness: number
  ts?: number
}

declare class LcEventBus extends EventEmitter {
  on(event: 'mqtt:state', listener: (data: MqttStateEvent) => void): this
  on(event: 'mqtt:health', listener: (data: MqttHealthEvent) => void): this
  on(event: 'mqtt:availability', listener: (data: MqttAvailabilityEvent) => void): this
  on(event: 'mqtt:ack', listener: (data: MqttAckEvent) => void): this
  emit(event: 'mqtt:state', data: MqttStateEvent): boolean
  emit(event: 'mqtt:health', data: MqttHealthEvent): boolean
  emit(event: 'mqtt:availability', data: MqttAvailabilityEvent): boolean
  emit(event: 'mqtt:ack', data: MqttAckEvent): boolean
}

export const eventBus = new EventEmitter() as LcEventBus