import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import staticFiles from '@fastify/static'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { initDatabase, closeDatabase } from './db/connection.js'
import { eventBus } from './lib/event-bus.js'
import { MqttService } from './mqtt/mqtt-service.js'
import { WebSocketService } from './ws/websocket-service.js'
import { authRoutes } from './routes/auth.js'
import { roomsRoutes } from './routes/rooms.js'
import { devicesRoutes } from './routes/devices.js'
import { lightsRoutes } from './routes/lights.js'
import { wsRoutes } from './routes/ws.js'
import * as roomsQueries from './db/queries/rooms.js'
import * as devicesQueries from './db/queries/devices.js'
import * as lightsQueries from './db/queries/lights.js'
import * as healthQueries from './db/queries/health.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function main() {
  await initDatabase()

  const mqttService = new MqttService()
  await mqttService.connect()

  const wsService = new WebSocketService()

  eventBus.on('mqtt:state', async (msg) => {
    try {
      const device = await devicesQueries.upsertDevice(msg.room, msg.device)
      if (!device) return

      const light = await lightsQueries.autoCreateLight(msg.room, msg.device, msg.light)
      if (!light) return

      await lightsQueries.upsertState(light.id, msg.state, msg.brightness, {
        seq: msg.seq,
        source: msg.source,
        ts: msg.ts,
      })

      wsService.broadcast('state', {
        light_id: light.id,
        light_name: msg.light,
        device_name: msg.device,
        room_name: msg.room,
        state: msg.state,
        brightness: msg.brightness,
        ts: msg.ts,
      })
    } catch (err) {
      logger.error({ err, msg }, 'Failed to process state event')
    }
  })

  eventBus.on('mqtt:health', async (msg) => {
    try {
      const device = await devicesQueries.upsertDevice(msg.room, msg.device)
      if (!device) return

      await healthQueries.insertHealthLog(device.id, {
        uptime_s: msg.uptime_s,
        wifi_rssi: msg.wifi_rssi,
        free_heap: msg.free_heap,
        seq: msg.seq,
        ts: msg.ts,
      })

      wsService.broadcast('health', {
        device_id: device.id,
        device_name: msg.device,
        room_name: msg.room,
        uptime_s: msg.uptime_s,
        wifi_rssi: msg.wifi_rssi,
        free_heap: msg.free_heap,
      })
    } catch (err) {
      logger.error({ err, msg }, 'Failed to process health event')
    }
  })

  eventBus.on('mqtt:availability', async (msg) => {
    try {
      if (msg.status === 'offline') {
        await devicesQueries.setDeviceOffline(msg.room, msg.device)
      } else {
        await devicesQueries.upsertDevice(msg.room, msg.device, {
          fw_version: msg.fw_version,
          online: true,
        })
      }
      wsService.broadcast('availability', {
        room: msg.room,
        device: msg.device,
        status: msg.status,
      })
    } catch (err) {
      logger.error({ err, msg }, 'Failed to process availability event')
    }
  })

  eventBus.on('mqtt:ack', (msg) => {
    wsService.broadcast('ack', {
      light_name: msg.light,
      device_name: msg.device,
      room_name: msg.room,
      status: msg.status,
      state: msg.state,
      brightness: msg.brightness,
    })
  })

  const app = Fastify({ loggerInstance: logger })

  app.addHook('onResponse', (request, reply, done) => {
    if (request.url.startsWith('/api')) {
      logger.info({ url: request.url, method: request.method, status: reply.statusCode }, 'API response')
    }
    done()
  })

  app.setErrorHandler((error: any, request, reply) => {
    const statusCode = error.statusCode || 500
    const message = error.message || 'Internal server error'
    logger.error({ err: error, url: request.url, statusCode }, 'API error')
    if (!reply.sent) {
      reply.code(statusCode).send({ error: message })
    }
  })

  await app.register(cors, { origin: true })
  await app.register(websocket)

  app.register(authRoutes)
  app.register(roomsRoutes)
  app.register(devicesRoutes)
  app.register(lightsRoutes, mqttService)
  app.register(wsRoutes, wsService)

  const frontendDir = resolve(__dirname, env.FRONTEND_DIR)
  try {
    await app.register(staticFiles, {
      root: frontendDir,
      prefix: '/',
      wildcard: false,
    })
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
        reply.code(404).send({ error: 'Not found' })
      } else {
        reply.sendFile('index.html')
      }
    })
    logger.info({ dir: frontendDir }, 'Serving frontend static files')
  } catch {
    logger.warn('Frontend dist not found, API-only mode')
    app.setNotFoundHandler((request, reply) => {
      reply.code(404).send({ error: 'Not found' })
    })
  }

  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' })
  logger.info(`Server listening at ${address}`)

  const shutdown = async () => {
    logger.info('Shutting down...')
    mqttService.disconnect()
    await closeDatabase()
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server')
  process.exit(1)
})