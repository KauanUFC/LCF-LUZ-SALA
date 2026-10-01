import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}