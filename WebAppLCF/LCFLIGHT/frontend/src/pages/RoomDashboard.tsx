import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'
import type { DemoDevice } from '../types'
import StatusBadge, { RelayBadge } from '../components/StatusBadge'
import RelayToggle from '../components/RelayToggle'

export default function RoomDashboard() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId
  const navigate = useNavigate()

  const rooms = demoData.getRooms()
  const room = rooms.find(r => r.id === roomId)

  const [devices, setDevices] = useState(() => roomId ? demoData.getDevicesByRoom(roomId) : [])

  const handleToggle = (device: DemoDevice) => {
    demoData.toggleRelay(device.id)
    setDevices([...demoData.getDevicesByRoom(roomId!)])
  }

  if (!room) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏠</div>
        <h3>Room not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/rooms')}>Back to Rooms</button>
      </div>
    )
  }

  const onlineCount = devices.filter(d => d.status === 'online').length
  const relayOnCount = devices.filter(d => d.relay_state).length

  return (
    <div>
      <button className="btn btn-sm btn-ghost" onClick={() => navigate('/rooms')} style={{ marginBottom: '1rem' }}>
        ← Back to Rooms
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          <h2>{room.name}</h2>
        </div>
        <div className="header-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            {onlineCount}/{devices.length} online · {relayOnCount} on
          </span>
        </div>
      </div>

      <SummaryBar online={onlineCount} total={devices.length} relayOn={relayOnCount} />

      {devices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h3>No devices in this room</h3>
          <p>Add devices to this room from the Devices page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/add-device')}>Add Device</button>
        </div>
      )}

      <div className="device-grid">
        {devices.map(device => (
          <div key={device.id} className="device-card" onClick={() => navigate(`/device/${device.id}`)} style={{ cursor: 'pointer' }}>
            <div className="device-card-header">
              <span className="dev-icon">{device.status === 'online' ? '💡' : '⚡'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{device.name}</div>
              </div>
            </div>
            <div className="device-card-body">
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <StatusBadge status={device.status} />
                <RelayBadge on={device.relay_state} />
              </div>
              {device.status === 'online' && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  📶 {device.wifi_rssi}dBm · ⏱ {formatUptime(device.uptime_s)} · 💾 {(device.free_heap / 1024).toFixed(0)}KB
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {device.last_seen ? `Last update: ${timeAgo(device.last_seen)}` : 'No data'}
              </div>
            </div>
            <div className="device-card-footer">
              {device.status === 'online' && (
                <RelayToggle
                  on={device.relay_state}
                  onToggle={() => { handleToggle(device) }}
                />
              )}
              <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); navigate(`/device/${device.id}`) }}>
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryBar({ online, total, relayOn }: { online: number; total: number; relayOn: number }) {
  return (
    <div className="stat-grid" style={{ marginBottom: '1rem' }}>
      <div className="stat-card online">
        <div className="stat-count">{online}</div>
        <div className="stat-label">Online</div>
      </div>
      <div className="stat-card offline">
        <div className="stat-count">{total - online}</div>
        <div className="stat-label">Offline</div>
      </div>
      <div className="stat-card" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
        <div className="stat-count" style={{ color: 'var(--success)' }}>{relayOn}</div>
        <div className="stat-label">Relays On</div>
      </div>
      <div className="stat-card total">
        <div className="stat-count">{total}</div>
        <div className="stat-label">Total</div>
      </div>
    </div>
  )
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}