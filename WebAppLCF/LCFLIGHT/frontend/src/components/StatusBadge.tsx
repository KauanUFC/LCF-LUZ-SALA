import type { ConnectionStatus } from '../types'

export default function StatusBadge({ status }: { status: ConnectionStatus }) {
  let cls: string
  let label: string

  switch (status) {
    case 'online':
      cls = 'badge-online'
      label = 'Online'
      break
    case 'offline':
      cls = 'badge-offline'
      label = 'Offline'
      break
    case 'needs-setup':
      cls = 'badge-needs-setup'
      label = 'Needs Setup'
      break
    default:
      cls = 'badge-offline'
      label = 'Unknown'
  }

  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" style={{ background: 'currentColor' }} />
      {label}
    </span>
  )
}

export function RelayBadge({ on }: { on: boolean }) {
  return (
    <span className={`badge ${on ? 'badge-on' : 'badge-off'}`}>
      <span className="badge-dot" style={{ background: on ? 'var(--success)' : 'var(--text-secondary)' }} />
      {on ? 'On' : 'Off'}
    </span>
  )
}