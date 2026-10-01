import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'
import type { DemoDevice } from '../types'
import StatusBadge, { RelayBadge } from '../components/StatusBadge'
import RelayToggle from '../components/RelayToggle'
import ConfirmDialog from '../components/ConfirmDialog'

export default function DeviceDetail() {
  const params = useParams<{ deviceId: string }>()
  const navigate = useNavigate()
  const deviceId = params.deviceId

  const [device, setDevice] = useState<DemoDevice | undefined>(() => deviceId ? demoData.getDevice(deviceId) : undefined)
  const [editing, setEditing] = useState<'device' | 'connection' | null>(null)
  const [editName, setEditName] = useState('')
  const [editRoomId, setEditRoomId] = useState('')
  const [editNewRoom, setEditNewRoom] = useState(false)
  const [editNewRoomName, setEditNewRoomName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const rooms = demoData.getRooms()

  if (!device) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <h3>Device not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/devices')}>Back to Devices</button>
      </div>
    )
  }

  const handleToggle = () => {
    const result = demoData.toggleRelay(device.id)
    if (result !== undefined) {
      setDevice({ ...device, relay_state: result, last_seen: new Date().toISOString() })
    }
  }

  const handleEditDevice = () => {
    const name = editName.trim()
    if (!name) return
    let targetRoomId = editRoomId
    let targetRoomName = rooms.find(r => r.id === editRoomId)?.name || ''
    if (editNewRoom && editNewRoomName.trim()) {
      const newRoom = demoData.addRoom(editNewRoomName.trim())
      targetRoomId = newRoom.id
      targetRoomName = newRoom.name
    }
    if (!targetRoomId) return

    demoData.updateDevice(device.id, { name, room_id: targetRoomId, room_name: targetRoomName })
    setDevice({ ...device, name, room_id: targetRoomId, room_name: targetRoomName })
    setEditing(null)
  }

  const handleEditConnection = (updates: Partial<DemoDevice>) => {
    demoData.updateDevice(device.id, updates)
    setDevice({ ...device, ...updates })
    setEditing(null)
  }

  const handleDelete = () => {
    demoData.deleteDevice(device.id)
    navigate('/devices')
  }

  const handleRestart = () => {
    demoData.updateDevice(device.id, { last_seen: new Date().toISOString() })
    setDevice({ ...device, last_seen: new Date().toISOString() })
  }

  const openEdit = () => {
    setEditName(device.name)
    setEditRoomId(device.room_id)
    setEditNewRoom(false)
    setEditNewRoomName('')
    setEditing('device')
  }

  return (
    <div>
      <button className="btn btn-sm btn-ghost" onClick={() => navigate('/devices')} style={{ marginBottom: '1rem' }}>
        ← Back to Devices
      </button>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{device.status === 'online' ? '💡' : device.status === 'needs-setup' ? '🔌' : '⚡'}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{device.name}</h2>
            <StatusBadge status={device.status} />
            <RelayBadge on={device.relay_state} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {device.status === 'online' && (
              <RelayToggle on={device.relay_state} onToggle={handleToggle} />
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item"><span className="info-label">Device ID</span><span className="info-value">{device.id}</span></div>
            <div className="info-item"><span className="info-label">Room</span><span className="info-value">{device.room_name}</span></div>
            <div className="info-item"><span className="info-label">Type</span><span className="info-value">{device.type}</span></div>
            <div className="info-item"><span className="info-label">Firmware</span><span className="info-value">{device.fw_version || '—'}</span></div>
            <div className="info-item"><span className="info-label">GPIO Pin</span><span className="info-value">{device.gpio_pin}</span></div>
            <div className="info-item"><span className="info-label">Pairing Code</span><span className="info-value">{device.pairing_code}</span></div>
            <div className="info-item"><span className="info-label">Last Seen</span><span className="info-value">{device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}</span></div>
            <div className="info-item"><span className="info-label">Connection</span><span className="info-value">
              {device.connection_method === 'mqtt'
                ? `MQTT (${device.mqtt_broker}:${device.mqtt_port})`
                : `REST (${device.rest_host})`}
            </span></div>
          </div>
        </div>
      </div>

      {device.status === 'online' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h3>📶 Telemetry</h3></div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Wi-Fi Network</span><span className="info-value">{device.wifi_ssid || '—'}</span></div>
              <div className="info-item"><span className="info-label">Signal Strength</span><span className="info-value" style={{ color: device.wifi_rssi < -70 ? 'var(--warning)' : 'var(--success)' }}>{device.wifi_rssi ? `${device.wifi_rssi} dBm` : '—'}</span></div>
              <div className="info-item"><span className="info-label">Uptime</span><span className="info-value">{device.uptime_s ? formatDuration(device.uptime_s) : '—'}</span></div>
              <div className="info-item"><span className="info-label">Free Heap</span><span className="info-value">{device.free_heap ? `${(device.free_heap / 1024).toFixed(1)} KB` : '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {editing === 'device' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Edit Device</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditing(null) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Room</label>
              {!editNewRoom && (
                <select className="form-select" value={editRoomId} onChange={e => setEditRoomId(e.target.value)}>
                  <option value="">Select a room...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              {editNewRoom && (
                <input className="form-input" placeholder="New room name" value={editNewRoomName} onChange={e => setEditNewRoomName(e.target.value)} />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                <input type="checkbox" checked={editNewRoom} onChange={e => setEditNewRoom(e.target.checked)} />
                Create new room
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditDevice}>Save</button>
            </div>
          </div>
        </div>
      )}

      {editing === 'connection' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Edit Connection</h3>
            <div className="form-group">
              <label className="form-label">Broker / Host</label>
              <input className="form-input" value={device.connection_method === 'mqtt' ? device.mqtt_broker : device.rest_host}
                onChange={e => {
                  if (device.connection_method === 'mqtt') handleEditConnection({ mqtt_broker: e.target.value })
                  else handleEditConnection({ rest_host: e.target.value })
                }} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3>⚙️ Actions</h3></div>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={openEdit}>Edit</button>
          <button className="btn btn-ghost" onClick={() => setEditing('connection')}>Edit Connection</button>
          <button className="btn btn-ghost" onClick={handleRestart} disabled={device.status !== 'online'}>Restart Device</button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Remove Device</button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Remove "${device.name}"?`}
          message="This action cannot be undone. The device will be permanently removed."
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

function formatDuration(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}