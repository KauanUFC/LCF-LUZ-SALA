import { query } from '../connection.js'

export async function insertHealthLog(
  deviceId: string,
  data: { uptime_s: number; wifi_rssi: number; free_heap: number; seq: number; ts?: number }
) {
  await query(
    `INSERT INTO health_log (device_id, uptime_s, wifi_rssi, free_heap, seq, ts)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
    [
      deviceId,
      data.uptime_s,
      data.wifi_rssi,
      data.free_heap,
      data.seq,
      data.ts ?? Math.floor(Date.now() / 1000),
    ]
  )
}

export async function getRecentHealth(deviceId: string, limit = 100) {
  return (
    await query(
      `SELECT * FROM health_log WHERE device_id = $1 ORDER BY ts DESC LIMIT $2`,
      [deviceId, limit]
    )
  ).rows
}

export async function getLatestHealth(deviceId: string) {
  return (
    await query(
      `SELECT * FROM health_log WHERE device_id = $1 ORDER BY ts DESC LIMIT 1`,
      [deviceId]
    )
  ).rows[0] || null
}