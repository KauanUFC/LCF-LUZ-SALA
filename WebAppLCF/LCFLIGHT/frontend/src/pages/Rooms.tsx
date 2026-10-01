import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'
import type { DemoRoom, DemoDevice } from '../types'
import StatusBadge, { RelayBadge } from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Rooms() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState(() => demoData.getRooms())
  const [devices, setDevices] = useState(() => demoData.getDevices())
  const [adding, setAdding] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ room: DemoRoom; moveToId?: string } | null>(null)
  const [moveId, setMoveId] = useState<string | null>(null)

  const refresh = () => {
    setRooms([...demoData.getRooms()])
    setDevices([...demoData.getDevices()])
  }

  const handleAddRoom = () => {
    const name = newRoomName.trim()
    if (!name) return
    demoData.addRoom(name)
    setNewRoomName('')
    setAdding(false)
    refresh()
  }

  const handleRename = (id: string) => {
    const name = renameValue.trim()
    if (!name) return
    demoData.renameRoom(id, name)
    setRenamingId(null)
    setRenameValue('')
    refresh()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    demoData.deleteRoom(deleteTarget.room.id, deleteTarget.moveToId)
    setDeleteTarget(null)
    refresh()
  }

  const handleMoveDevice = (deviceId: string, targetRoomId: string) => {
    demoData.moveDevice(deviceId, targetRoomId)
    refresh()
  }

  const roomDevices = (roomId: string) => devices.filter(d => d.room_id === roomId)
  const otherRooms = (currentId: string) => rooms.filter(r => r.id !== currentId)

  return (
    <div>
      <div className="page-header">
        <h2>Rooms</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setAdding(true); setNewRoomName('') }}>
            + Add Room
          </button>
        </div>
      </div>

      {adding && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Room Name</label>
              <input className="form-input" placeholder="e.g. Sala B" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddRoom(); if (e.key === 'Escape') setAdding(false) }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleAddRoom}>Save</button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No rooms yet</h3>
          <p>Create a room to organize your devices.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {rooms.map(room => (
          <div key={room.id} className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem' }}>🏠</span>
                {renamingId === room.id ? (
                  <input
                    className="form-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(room.id); if (e.key === 'Escape') setRenamingId(null) }}
                    onBlur={() => setRenamingId(null)}
                    style={{ width: '200px', display: 'inline' }}
                  />
                ) : (
                  <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/room/${room.id}`)}>
                    {room.name}
                  </h3>
                )}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  · {roomDevices(room.id).length} device{roomDevices(room.id).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => { setRenamingId(room.id); setRenameValue(room.name) }}>Rename</button>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/room/${room.id}`)}>Open</button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget({ room })}>Delete</button>
              </div>
            </div>
            {roomDevices(room.id).length > 0 && (
              <div className="card-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                {roomDevices(room.id).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/device/${d.id}`)}>{d.name}</span>
                    <StatusBadge status={d.status} />
                    <RelayBadge on={d.relay_state} />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {moveId === d.id ? (
                        <select
                          className="form-select"
                          style={{ width: '140px', fontSize: '0.75rem' }}
                          onChange={e => { if (e.target.value) { handleMoveDevice(d.id, e.target.value); setMoveId(null) } }}
                          onBlur={() => setMoveId(null)}
                        >
                          <option value="">Move to...</option>
                          {otherRooms(room.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        <button className="btn btn-sm btn-ghost" onClick={() => setMoveId(d.id)}>Move</button>
                      )}
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/device/${d.id}`)}>Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {roomDevices(room.id).length === 0 && (
              <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
                No devices in this room
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.room.name}"?`}
          message={`This room contains ${roomDevices(deleteTarget.room.id).length} device(s).`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          extraContent={
            roomDevices(deleteTarget.room.id).length > 0 ? (
              <div className="form-group">
                <label className="form-label">Move devices to (optional):</label>
                <select
                  className="form-select"
                  onChange={e => setDeleteTarget({ ...deleteTarget, moveToId: e.target.value })}
                >
                  <option value="">Delete devices too</option>
                  {otherRooms(deleteTarget.room.id).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            ) : null
          }
        />
      )}
    </div>
  )
}