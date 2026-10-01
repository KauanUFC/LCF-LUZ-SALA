import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth.js'
import {
  listDevices,
  getDevice,
  getDeviceHealthHistory,
} from '../db/queries/devices.js'
import { getLatestHealth } from '../db/queries/health.js'

export async function devicesRoutes(app: FastifyInstance) {
  app.get('/api/devices', { preHandler: authMiddleware }, async (request) => {
    const { room_id } = request.query as { room_id?: string }
    return listDevices(room_id)
  })

  app.get('/api/devices/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const device = await getDevice(id)
    if (!device) return reply.code(404).send({ error: 'Device not found' })
    const health = await getLatestHealth(id)
    return { ...device, latest_health: health }
  })

  app.get('/api/devices/:id/health', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as { id: string }
    const { limit } = request.query as { limit?: string }
    return getDeviceHealthHistory(id, limit ? parseInt(limit) : 100)
  })
}