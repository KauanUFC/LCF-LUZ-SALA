import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'
import type { DemoDevice } from '../types'
import SummaryCards from '../components/SummaryCards'
import AlertsList from '../components/AlertsList'
import StatusBadge, { RelayBadge } from '../components/StatusBadge'
import RelayToggle from '../components/RelayToggle'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data] = useState(() => {
    demoData.markActive()
    return {
      summary: demoData.getSummary(),
      devices: demoData.getDevices(),
      rooms: demoData.getRooms(),
      alerts: demoData.getAlerts(),
    }
  })

  const handleToggle = (device: DemoDevice) => {
    const result = demoData.toggleRelay(device.id)
    if (result !== undefined) {
      const newState = result
      const devIdx = data.devices.findIndex(d => d.id === device.id)
      if (devIdx !== -1) {
        data.devices[devIdx].relay_state = newState
        data.devices[devIdx].last_seen = new Date().toISOString()
      }
    }
  }

  const recentDevices = data.devices
    .sort((a, b) => (b.last_seen || b.created_at).localeCompare(a.last_seen || a.created_at))
    .slice(0, 8)

  return (
    <div>
      {demoData.isActive() && (
        <div className="demo-banner">
          <span>🟡</span>
          <span>Running in demo mode — no real ESP32 devices connected. Data is stored locally.</span>
        </div>
      )}
      <div className="page-header">
        <h2>Dashboard</h2>
        <div className="header-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            {data.summary.total} device{data.summary.total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <SummaryCards online={data.summary.online} offline={data.summary.offline} needsSetup={data.summary.needsSetup} total={data.summary.total} />

      <AlertsList alerts={data.alerts} />

      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
        Recent Devices
      </h3>

      {recentDevices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <h3>No devices found</h3>
          <p>Add your first device to start controlling your lights.</p>
          <button className="btn btn-primary" onClick={() => navigate('/add-device')}>
            Add Device
          </button>
        </div>
      )}

      <div className="device-grid">
        {recentDevices.map(device => (
          <div
            key={device.id}
            className="device-card"
            onClick={() => navigate(`/device/${device.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="device-card-header">
              <span className="dev-icon">{device.status === 'online' ? '💡' : device.status === 'needs-setup' ? '🔌' : '⚡'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{device.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{device.room_name}</div>
              </div>
            </div>
            <div className="device-card-body">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={device.status} />
                <RelayBadge on={device.relay_state} />
              </div>
              {device.status === 'online' && (
                <div>
                  📶 {device.wifi_rssi}dBm · ⏱ {formatUptime(device.uptime_s)}
                </div>
              )}
              <div style={{ color: 'var(--text-muted)' }}>
                Last seen: {device.last_seen ? timeAgo(device.last_seen) : 'Never'}
              </div>
            </div>
            <div className="device-card-footer">
              {device.status === 'online' && (
                <RelayToggle
                  on={device.relay_state}
                  onToggle={() => handleToggle(device)}
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