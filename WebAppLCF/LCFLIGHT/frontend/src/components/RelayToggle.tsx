export default function RelayToggle({
  on, disabled, onToggle, label,
}: {
  on: boolean
  disabled?: boolean
  onToggle: () => void
  label?: string
}) {
  return (
    <label className="toggle-switch" onClick={e => e.stopPropagation()} style={disabled ? { opacity: 0.4 } : undefined}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={onToggle} />
      <span className={`toggle-track${on ? ' on' : ''}`}>
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label ?? (on ? 'On' : 'Off')}</span>
    </label>
  )
}