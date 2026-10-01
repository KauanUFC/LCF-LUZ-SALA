import { WebSocket } from 'ws'
import { logger } from '../lib/logger.js'
import { getAllCurrentStates } from '../db/queries/lights.js'
import type { JwtPayload } from '../middleware/auth.js'

export class WebSocketService {
  private clients = new Map<WebSocket, JwtPayload>()

  handleConnection(ws: WebSocket, payload: JwtPayload) {
    this.clients.set(ws, payload)
    logger.info(`WebSocket client connected: ${payload.username}`)

    this.sendSnapshot(ws)

    ws.on('close', () => {
      this.clients.delete(ws)
      logger.info('WebSocket client disconnected')
    })

    ws.on('error', (err) => {
      logger.error({ err }, 'WebSocket error')
      this.clients.delete(ws)
    })
  }

  private async sendSnapshot(ws: WebSocket) {
    try {
      const states = await getAllCurrentStates()
      ws.send(
        JSON.stringify({
          event: 'snapshot',
          data: states,
          ts: Date.now(),
        })
      )
    } catch (err) {
      logger.error({ err }, 'Failed to send snapshot')
    }
  }

  broadcast(event: string, data: unknown) {
    const msg = JSON.stringify({ event, data, ts: Date.now() })
    for (const [ws] of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg)
      }
    }
  }

  getClientCount(): number {
    return this.clients.size
  }
}