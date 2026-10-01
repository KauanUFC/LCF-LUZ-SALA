import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth.js'
import { getAllCurrentStates } from '../db/queries/lights.js'
import { MqttService } from '../mqtt/mqtt-service.js'

export async function lightsRoutes(app: FastifyInstance, mqttService: MqttService) {
  app.get('/api/lights', { preHandler: authMiddleware }, async () => {
    return getAllCurrentStates()
  })

  app.post('/api/command', { preHandler: authMiddleware }, async (request, reply) => {
    const { room, device, light, state, brightness } = request.body as {
      room?: string
      device?: string
      light?: string
      state?: boolean
      brightness?: number
    }

    if (!room || !device || light === undefined || state === undefined) {
      return reply.code(400).send({
        error: 'room, device, light, and state are required',
      })
    }

    if (!mqttService.isConnected()) {
      return reply.code(503).send({ error: 'MQTT broker not connected' })
    }

    const sent = await mqttService.sendCommand(room, device, light, {
      state,
      brightness,
      source: 'web',
    })

    if (!sent) {
      return reply.code(503).send({ error: 'Failed to send MQTT command' })
    }

    return { sent: true, room, device, light, state, brightness }
  })
}