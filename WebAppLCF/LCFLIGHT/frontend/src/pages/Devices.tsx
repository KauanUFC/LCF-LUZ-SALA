import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'
import type { DemoDevice, ConnectionStatus } from '../types'
import StatusBadge, { RelayBadge } from '../components/StatusBadge'
import RelayToggle from '../components/RelayToggle'

type Filter = 'all' | 'online' | 'offline' | 'needs-setup'

export default function Devices() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState(() => demoData.getDevices())

  const filtered = devices.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleToggle = (device: DemoDevice) => {
    const result = demoData.toggleRelay(device.id)
    if (result !== undefined) {
      const updated = devices.map(d =>
        d.id === device.id
          ? { ...d, relay_state: result, last_seen: new Date().toISOString() }
          : d
      )
      setDevices(updated)
    }
  }

  const counts = {
    all: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    needsSetup: devices.filter(d => d.status === 'needs-setup').length,
  }

  const filters: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'online', label: 'Online', count: counts.online },
    { key: 'offline', label: 'Offline', count: counts.offline },
    { key: 'needs-setup', label: 'Needs Setup', count: counts.needsSetup },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Devices</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/add-device')}>
            + Add Device
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f.key}
            className={`filter-tab${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
        <input
          className="filter-search"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto' }}
        />
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            {filter === 'all' ? '📡' : filter === 'online' ? '✅' : filter === 'offline' ? '⚡' : '🔌'}
          </div>
          <h3>No {filter !== 'all' ? filter + ' ' : ''}devices</h3>
          <p>
            {filter !== 'all'
              ? `No devices match the "${filter}" filter.`
              : 'No devices registered yet. Add your first device to get started.'}
          </p>
          {filter === 'all' && (
            <button className="btn btn-primary" onClick={() => navigate('/add-device')}>
              Add Device
            </button>
          )}
        </div>
      )}

      <div className="device-grid">
        {filtered.map(device => (
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
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <StatusBadge status={device.status} />
                <RelayBadge on={device.relay_state} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {device.last_seen ? `Last seen: ${timeAgo(device.last_seen)}` : 'Never seen'}
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