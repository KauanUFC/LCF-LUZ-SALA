import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/devices',   label: 'Devices',   icon: '📡' },
  { path: '/rooms',     label: 'Rooms',     icon: '🏠' },
  { path: '/add-device',label: 'Add Device',icon: '➕' },
  { path: '/settings',  label: 'Settings',  icon: '⚙️' },
  { path: '/credits',   label: 'Credits',   icon: '📝' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen_] = useState(false)

  const setOpen = (v: boolean) => setOpen_(v)
  const toggle = () => setOpen_(!open)
  const isActive = (path: string) => location.pathname === path || (
    path !== '/dashboard' && location.pathname.startsWith(path + '/')
  )

  const go = (path: string) => {
    navigate(path)
    if (window.innerWidth < 768) setOpen(false)
  }

  const goToDashboard = () => go('/dashboard')

  const close = () => setOpen(false)

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <nav className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo" onClick={goToDashboard}>
          <span>💡</span>
          <h1>LCFLIGHT</h1>
        </div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => go(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className="user-name">{user?.username || 'guest'}</span>
          <button className="btn btn-sm btn-danger" onClick={logout}>Sair</button>
        </div>
      </nav>
      <div className="hamburger" onClick={toggle}>
        <span>{open ? '✕' : '☰'}</span>
      </div>
    </>
  )
}