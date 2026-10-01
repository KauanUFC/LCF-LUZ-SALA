import { query } from '../connection.js'

export async function getAllCurrentStates() {
  return (
    await query(`
      SELECT cs.*, l.name AS light_name, l.type AS light_type,
             d.name AS device_name, r.name AS room_name,
             d.id AS device_id, r.id AS room_id
      FROM current_states cs
      JOIN lights l ON l.id = cs.light_id
      JOIN devices d ON d.id = l.device_id
      JOIN rooms r ON r.id = d.room_id
      ORDER BY r.name, d.name, l.name
    `)
  ).rows
}

export async function autoCreateLight(room: string, device: string, light: string) {
  const deviceRecord = await query(
    `SELECT d.id FROM devices d JOIN rooms r ON r.id = d.room_id
     WHERE d.name = $1 AND r.name = $2`,
    [device, room]
  )
  if (!deviceRecord.rows.length) return null

  const result = await query(
    `INSERT INTO lights (device_id, name, type)
     VALUES ($1, $2, 'pwm')
     ON CONFLICT (device_id, name) DO NOTHING
     RETURNING *`,
    [deviceRecord.rows[0].id, light]
  )
  return result.rows[0] || null
}

export async function getLightByDeviceAndName(room: string, device: string, light: string) {
  return (
    await query(
      `SELECT l.* FROM lights l
       JOIN devices d ON d.id = l.device_id
       JOIN rooms r ON r.id = d.room_id
       WHERE l.name = $1 AND d.name = $2 AND r.name = $3`,
      [light, device, room]
    )
  ).rows[0] || null
}

export async function upsertState(
  lightId: string,
  state: boolean,
  brightness: number,
  extra?: { seq?: number; source?: string; ts?: number }
) {
  await query(
    `INSERT INTO current_states (light_id, state, brightness, seq, source, ts, updated_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6), now())
     ON CONFLICT (light_id) DO UPDATE SET
       state = EXCLUDED.state,
       brightness = EXCLUDED.brightness,
       seq = COALESCE(EXCLUDED.seq, current_states.seq),
       source = EXCLUDED.source,
       ts = EXCLUDED.ts,
       updated_at = now()`,
    [
      lightId,
      state,
      brightness,
      extra?.seq ?? null,
      extra?.source ?? 'mqtt',
      extra?.ts ?? Math.floor(Date.now() / 1000),
    ]
  )

  await query(
    `INSERT INTO state_history (light_id, state, brightness, seq, source, ts)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
    [
      lightId,
      state,
      brightness,
      extra?.seq ?? null,
      extra?.source ?? 'mqtt',
      extra?.ts ?? Math.floor(Date.now() / 1000),
    ]
  )
}

export async function getLightHistory(lightId: string, limit = 50) {
  return (
    await query(
      `SELECT * FROM state_history WHERE light_id = $1 ORDER BY ts DESC LIMIT $2`,
      [lightId, limit]
    )
  ).rows
}