import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { demoData } from '../services/demo-data'

export default function Settings() {
  const { user, login, logout } = useAuth()
  const [tab, setTab] = useState<'preferences' | 'security' | 'notifications' | 'about'>('preferences')
  const [theme, setTheme] = useState('dark')
  const [saved, setSaved] = useState(false)

  const [newUser, setNewUser] = useState(user?.username || '')
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)

  const [notifOffline, setNotifOffline] = useState(true)
  const [notifRestored, setNotifRestored] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = () => {
    setPassError('')
    if (curPass !== 'lcfadmin') {
      setPassError('Current password is incorrect')
      return
    }
    if (newPass.length < 4) {
      setPassError('New password must be at least 4 characters')
      return
    }
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match')
      return
    }
    setPassSaved(true)
    setCurPass('')
    setNewPass('')
    setConfirmPass('')
    setTimeout(() => setPassSaved(false), 2000)
  }

  const tabs = [
    { key: 'preferences', label: 'Preferences' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'about', label: 'About' },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="filter-bar">
        {tabs.map(t => (
          <button key={t.key} className={`filter-tab${tab === t.key ? ' active' : ''}`} onClick={() => { setTab(t.key as typeof tab); setSaved(false); setPassSaved(false) }}>
            {t.label}
          </button>
        ))}
      </div>

      {demoData.isActive() && (
        <div className="demo-banner">
          <span>🟡</span>
          <span>Settings are demo/local-only. Changes are stored in your browser and will reset if you clear localStorage.</span>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="card">
          <div className="card-header"><h3>Preferences</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light (not implemented)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select">
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Screen</label>
              <select className="form-select">
                <option value="dashboard">Dashboard</option>
                <option value="devices">Devices</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
            {saved && <span style={{ color: 'var(--success)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>Saved</span>}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h3>Change Login</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={newUser} onChange={e => setNewUser(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>Save Username</button>
            {saved && <span style={{ color: 'var(--success)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>Saved</span>}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h3>Change Password</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={curPass} onChange={e => setCurPass(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>
            {passError && <div className="form-error">{passError}</div>}
            <button className="btn btn-primary" onClick={handleChangePassword}>Change Password</button>
            {passSaved && <span style={{ color: 'var(--success)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>Password changed</span>}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-header"><h3>⚠ Danger Zone</h3></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              Reset all demo data. This will clear rooms, devices, and alerts.
            </p>
            <button className="btn btn-danger" onClick={() => { demoData.resetDemo(); logout(); window.location.href = '/login' }}>
              Reset Demo Data
            </button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header"><h3>Notification Preferences</h3></div>
          <div className="card-body">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              Notifications are not connected to a backend. These settings are stored locally for demo purposes only.
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={notifOffline} onChange={e => setNotifOffline(e.target.checked)} />
              Alert when a device goes offline
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={notifRestored} onChange={e => setNotifRestored(e.target.checked)} />
              Alert when connection is restored
            </label>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card">
          <div className="card-header"><h3>ℹ️ About LCFLIGHT</h3></div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Version</span><span className="info-value">1.0.0</span></div>
              <div className="info-item"><span className="info-label">Backend</span><span className="info-value">Fastify + PostgreSQL</span></div>
              <div className="info-item"><span className="info-label">Frontend</span><span className="info-value">React + Vite + Tailwind</span></div>
              <div className="info-item"><span className="info-label">Project</span><span className="info-value">LCF-LUZ-SALA</span></div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '1rem' }}>
              This is a demo/local-only application. Real MQTT and ESP32 integration is available when connected to a live backend.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              For support, contact the project maintainers or open an issue on GitHub.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}