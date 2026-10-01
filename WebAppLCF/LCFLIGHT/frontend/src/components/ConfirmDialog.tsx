export default function ConfirmDialog({
  title, message, confirmLabel, cancelLabel, onConfirm, onCancel, extraContent,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  extraContent?: React.ReactNode
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {message}
        </p>
        {extraContent}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel ?? 'Cancel'}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}