import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error')
})

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}

export async function initDatabase(): Promise<void> {
  const schemaPath = resolve(__dirname, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  try {
    await pool.query(schema)
    logger.info('Database schema applied successfully')
  } catch (err) {
    logger.error({ err }, 'Failed to apply database schema')
    throw err
  }

  try {
    const hash = await bcrypt.hash('lcfadmin', 10)
    await pool.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
      ['admin', hash]
    )
    logger.info('Default admin user seeded')
  } catch (err) {
    logger.warn({ err }, 'Failed to seed admin user (may already exist)')
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end()
}