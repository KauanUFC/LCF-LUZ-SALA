import { query } from '../connection.js'

export async function listDevices(roomId?: string) {
  if (roomId) {
    return (
      await query(
        `SELECT * FROM devices WHERE room_id = $1 ORDER BY name`,
        [roomId]
      )
    ).rows
  }
  return (await query(`SELECT * FROM devices ORDER BY name`)).rows
}

export async function getDevice(id: string) {
  const result = await query(
    `SELECT d.*, r.name AS room_name
     FROM devices d
     JOIN rooms r ON r.id = d.room_id
     WHERE d.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function upsertDevice(room: string, device: string, extra?: {
  fw_version?: string
  online?: boolean
}) {
  const roomResult = await query(
    `INSERT INTO rooms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
    [room]
  )
  let roomId = roomResult.rows[0]?.id
  if (!roomId) {
    const existing = await query(`SELECT id FROM rooms WHERE name = $1`, [room])
    roomId = existing.rows[0]?.id
  }
  if (!roomId) throw new Error(`Failed to resolve room: ${room}`)

  const result = await query(
    `INSERT INTO devices (room_id, name, fw_version, online, last_seen)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (room_id, name) DO UPDATE SET
       online = COALESCE($4, devices.online),
       last_seen = CASE WHEN $4 = true OR $4 IS NULL THEN now() ELSE devices.last_seen END,
       fw_version = COALESCE($3, devices.fw_version)
     RETURNING *`,
    [roomId, device, extra?.fw_version ?? null, extra?.online ?? true]
  )
  return result.rows[0]
}

export async function setDeviceOffline(room: string, device: string) {
  const result = await query(
    `UPDATE devices SET online = false
     WHERE name = $1 AND room_id = (SELECT id FROM rooms WHERE name = $2)
     RETURNING *`,
    [device, room]
  )
  return result.rows[0] || null
}

export async function getDeviceHealthHistory(deviceId: string, limit = 100) {
  return (
    await query(
      `SELECT * FROM health_log WHERE device_id = $1 ORDER BY ts DESC LIMIT $2`,
      [deviceId, limit]
    )
  ).rows
}