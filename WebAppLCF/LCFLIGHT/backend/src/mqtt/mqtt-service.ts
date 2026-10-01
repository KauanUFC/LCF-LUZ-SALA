import mqtt from 'mqtt'
import { env } from '../config/env.js'
import { eventBus } from '../lib/event-bus.js'
import { logger } from '../lib/logger.js'
import { parseTopic } from './topics.js'

let seqCounter = Math.floor(Math.random() * 1000000)

export class MqttService {
  private client: mqtt.MqttClient | null = null
  private connected = false

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(env.MQTT_BROKER_URL, {
        clientId: `lcflight-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      })

      this.client.on('connect', async () => {
        this.connected = true
        logger.info('MQTT connected to broker')

        await this.client!.subscribeAsync('state/+/+/+', { qos: 1 })
        await this.client!.subscribeAsync('health/+/+', { qos: 1 })
        await this.client!.subscribeAsync('availability/+/+', { qos: 1 })
        await this.client!.subscribeAsync('ack/+/+/+', { qos: 1 })

        logger.info('MQTT subscribed to all device topics')
        resolve()
      })

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload)
      })

      this.client.on('error', (err) => {
        logger.error({ err }, 'MQTT error')
      })

      this.client.on('close', () => {
        this.connected = false
        logger.warn('MQTT disconnected')
      })

      this.client.on('reconnect', () => {
        logger.info('MQTT reconnecting...')
      })

      ;(this.client as any).on('connackTimeout', () => {
        logger.warn('MQTT CONNACK timeout, continuing without broker')
      })

      setTimeout(() => {
        if (!this.connected) {
          logger.warn('MQTT connection timeout, continuing without broker')
          resolve()
        }
      }, 5000)
    })
  }

  isConnected(): boolean {
    return this.connected && this.client?.connected === true
  }

  async sendCommand(
    room: string,
    device: string,
    light: string,
    cmd: { state: boolean; brightness?: number; source?: string }
  ): Promise<boolean> {
    if (!this.isConnected()) {
      logger.warn('Cannot send command: MQTT not connected')
      return false
    }

    const topic = `command/${room}/${device}/${light}`
    seqCounter++

    const payload = JSON.stringify({
      source: cmd.source ?? 'web',
      state: cmd.state ? 'ON' : 'OFF',
      brightness: cmd.brightness ?? (cmd.state ? 100 : 0),
      seq: seqCounter,
      ts: Math.floor(Date.now() / 1000),
    })

    try {
      await this.client!.publishAsync(topic, payload, { qos: 1 })
      logger.debug({ topic, payload }, 'MQTT command sent')
      return true
    } catch (err) {
      logger.error({ err, topic }, 'Failed to send MQTT command')
      return false
    }
  }

  private handleMessage(topic: string, payload: Buffer) {
    const parsed = parseTopic(topic)
    if (parsed.type === 'unknown') return

    let data: any
    try {
      data = JSON.parse(payload.toString())
    } catch {
      logger.warn({ topic }, 'Failed to parse MQTT payload')
      return
    }

    switch (parsed.type) {
      case 'state':
        eventBus.emit('mqtt:state', {
          room: parsed.room,
          device: parsed.device,
          light: parsed.light!,
          state: data.state === 'ON',
          brightness: data.brightness ?? (data.state === 'ON' ? 100 : 0),
          seq: data.seq,
          source: data.source,
          ts: data.ts,
        })
        break

      case 'health':
        eventBus.emit('mqtt:health', {
          room: parsed.room,
          device: parsed.device,
          uptime_s: data.uptime_s,
          wifi_rssi: data.wifi_rssi,
          free_heap: data.free_heap,
          seq: data.seq,
          ts: data.ts,
        })
        break

      case 'availability':
        eventBus.emit('mqtt:availability', {
          room: parsed.room,
          device: parsed.device,
          status: data.status === 'online' ? 'online' : 'offline',
          fw_version: data.fw_version,
        })
        break

      case 'ack':
        eventBus.emit('mqtt:ack', {
          room: parsed.room,
          device: parsed.device,
          light: parsed.light!,
          msg_id: data.msg_id,
          seq: data.seq,
          status: data.status,
          state: data.state === 'ON',
          brightness: data.brightness,
          ts: data.ts,
        })
        break
    }
  }

  disconnect(): void {
    this.client?.end(true)
  }
}