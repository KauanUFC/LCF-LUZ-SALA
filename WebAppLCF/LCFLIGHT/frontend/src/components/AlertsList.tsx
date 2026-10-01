import type { Alert } from '../types'

export default function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
      <div className="card-header">
        <h3 style={{ color: 'var(--danger)' }}>⚠ Alerts</h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{alerts.length}</span>
      </div>
      <div className="card-body">
        <div className="alerts-list">
          {alerts.map(a => (
            <div key={a.id} className={`alert-item ${a.type}`}>
              <span>{a.type === 'error' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}</span>
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}