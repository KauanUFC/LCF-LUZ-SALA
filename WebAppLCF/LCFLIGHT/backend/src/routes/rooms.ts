import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth.js'
import { listRooms, getRoom, createRoom } from '../db/queries/rooms.js'

export async function roomsRoutes(app: FastifyInstance) {
  app.get('/api/rooms', { preHandler: authMiddleware }, async () => {
    return listRooms()
  })

  app.get('/api/rooms/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const room = await getRoom(id)
    if (!room) return reply.code(404).send({ error: 'Room not found' })
    return room
  })

  app.post('/api/rooms', { preHandler: authMiddleware }, async (request, reply) => {
    const { name } = request.body as { name: string }
    if (!name) return reply.code(400).send({ error: 'Room name is required' })
    const room = await createRoom(name)
    return reply.code(201).send(room)
  })
}