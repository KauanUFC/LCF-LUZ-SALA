import { FastifyInstance } from 'fastify'
import { WebSocketService } from '../ws/websocket-service.js'
import { verifyToken } from '../middleware/auth.js'

export async function wsRoutes(app: FastifyInstance, wsService: WebSocketService) {
  app.get('/ws', { websocket: true }, (socket, request) => {
    const urlParams = new URLSearchParams(request.url?.split('?')[1] || '')
    const token = urlParams.get('token')
    const payload = token ? verifyToken(token) : null
    if (!payload) {
      socket.close(4001, 'Unauthorized')
      return
    }
    wsService.handleConnection(socket, payload)
  })
}