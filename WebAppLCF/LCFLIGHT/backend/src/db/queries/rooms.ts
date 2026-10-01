import { query } from '../connection.js'

export async function listRooms() {
  const result = await query(`
    SELECT r.*, COUNT(d.id)::int AS device_count
    FROM rooms r
    LEFT JOIN devices d ON d.room_id = r.id
    GROUP BY r.id
    ORDER BY r.name
  `)
  return result.rows
}

export async function getRoom(id: string) {
  const result = await query(`SELECT * FROM rooms WHERE id = $1`, [id])
  return result.rows[0] || null
}

export async function createRoom(name: string) {
  const result = await query(
    `INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
    [name]
  )
  return result.rows[0]
}