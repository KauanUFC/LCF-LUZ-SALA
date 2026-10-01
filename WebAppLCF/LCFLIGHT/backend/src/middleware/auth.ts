import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface JwtPayload {
  userId: number
  username: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

export function generateToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any }
  return jwt.sign(payload as object, env.JWT_SECRET, options)
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header')
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    throw new AuthError('Invalid or expired token')
  }

  request.user = payload
}