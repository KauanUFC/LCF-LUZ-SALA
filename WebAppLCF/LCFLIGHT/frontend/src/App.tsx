import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Rooms from './pages/Rooms'
import RoomDashboard from './pages/RoomDashboard'
import AddDevice from './pages/AddDevice'
import DeviceDetail from './pages/DeviceDetail'
import Settings from './pages/Settings'
import Credits from './pages/Credits'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room/:roomId" element={<RoomDashboard />} />
          <Route path="/add-device" element={<AddDevice />} />
          <Route path="/device/:deviceId" element={<DeviceDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/credits" element={<Credits />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}