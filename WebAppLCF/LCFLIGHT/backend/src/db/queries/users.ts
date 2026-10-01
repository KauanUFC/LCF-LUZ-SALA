import { query } from '../connection.js'
import bcrypt from 'bcryptjs'

export async function findUser(username: string) {
  const result = await query(`SELECT * FROM users WHERE username = $1`, [username])
  return result.rows[0] || null
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(username: string, password: string) {
  const hash = await bcrypt.hash(password, 10)
  const result = await query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`,
    [username, hash]
  )
  return result.rows[0]
}