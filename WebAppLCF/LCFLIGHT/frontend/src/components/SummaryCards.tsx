export default function SummaryCards(data: { online: number; offline: number; needsSetup: number; total: number }) {
  const items = [
    { count: data.online, label: 'Online', cls: 'online' },
    { count: data.offline, label: 'Offline', cls: 'offline' },
    { count: data.needsSetup, label: 'Needs Setup', cls: 'needs-setup' },
    { count: data.total, label: 'Total', cls: 'total' },
  ]

  return (
    <div className="stat-grid">
      {items.map(item => (
        <div key={item.label} className={`stat-card${item.cls ? ' ' + item.cls : ''}`}>
          <div className="stat-count">{item.count}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}