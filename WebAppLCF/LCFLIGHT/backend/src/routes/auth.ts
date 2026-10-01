import { FastifyInstance } from 'fastify'
import { authMiddleware, generateToken } from '../middleware/auth.js'
import { findUser, verifyPassword } from '../db/queries/users.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string }

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' })
    }

    const user = await findUser(username)
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = generateToken({ userId: user.id, username: user.username })
    return { token, user: { id: user.id, username: user.username } }
  })

  app.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
    return { user: request.user }
  })
}