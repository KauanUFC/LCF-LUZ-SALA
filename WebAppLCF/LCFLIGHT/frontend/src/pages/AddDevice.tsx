import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoData } from '../services/demo-data'

type Step = 'info' | 'connection' | 'test'

const STEP_LABELS = ['Device Info', 'Connection', 'Test & Save']

export default function AddDevice() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [description, setDescription] = useState('')
  const [deviceType, setDeviceType] = useState('ESP32 Light Controller')
  const [createNewRoom, setCreateNewRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const [connMethod, setConnMethod] = useState<'mqtt' | 'rest'>('mqtt')
  const [mqttBroker, setMqttBroker] = useState('broker.hivemq.com')
  const [mqttPort, setMqttPort] = useState('8883')
  const [mqttUser, setMqttUser] = useState('')
  const [mqttPass, setMqttPass] = useState('')
  const [mqttTls, setMqttTls] = useState(true)
  const [topicPrefix, setTopicPrefix] = useState('')
  const [restHost, setRestHost] = useState('')
  const [restEndpoint, setRestEndpoint] = useState('/api')
  const [restAuth, setRestAuth] = useState('')
  const [gpioPin, setGpioPin] = useState('25')

  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const rooms = demoData.getRooms()
  const stepIndex: Record<Step, number> = { info: 0, connection: 1, test: 2 }
  const currentIdx = stepIndex[step]

  const stepOrder: Step[] = ['info', 'connection', 'test']

  const goTo = (s: Step) => setStep(s)

  const validateInfo = (): boolean => {
    const e: Record<string, string> = {}
    const finalRoom = createNewRoom ? newRoomName.trim() : rooms.find(r => r.id === roomId)?.name
    if (!name.trim()) e.name = 'Device name is required'
    if (!finalRoom) e.room = 'Room is required'
    if (createNewRoom && !newRoomName.trim()) e.newRoom = 'New room name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateConnection = (): boolean => {
    const e: Record<string, string> = {}
    if (connMethod === 'mqtt') {
      if (!mqttBroker.trim()) e.broker = 'Broker address is required'
      if (!mqttPort.trim() || Number(mqttPort) < 1 || Number(mqttPort) > 65535) e.port = 'Valid port (1-65535) required'
    } else {
      if (!restHost.trim()) e.host = 'Hostname or IP is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    const idx = stepIndex[step]
    if (idx < 2) {
      if (step === 'info' && !validateInfo()) return
      if (step === 'connection' && !validateConnection()) return
      goTo(stepOrder[idx + 1])
    }
  }

  const handleBack = () => {
    const idx = stepIndex[step]
    if (idx > 0) goTo(stepOrder[idx - 1])
  }

  const handleTestConnection = () => {
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      setTestResult(Math.random() > 0.3 ? 'success' : 'failure')
      setTesting(false)
    }, 1500)
  }

  const handleSave = () => {
    const finalRoom = createNewRoom ? newRoomName.trim() : rooms.find(r => r.id === roomId)?.name || ''
    let finalRoomId = roomId
    if (createNewRoom && newRoomName.trim()) {
      const newRoom = demoData.addRoom(newRoomName.trim())
      finalRoomId = newRoom.id
    }

    const topicPre = topicPrefix.trim() ||
      `state/${(finalRoom || 'unknown').toLowerCase().replace(/\s+/g, '-')}/${name.toLowerCase().replace(/\s+/g, '-')}`

    demoData.addDevice({
      name: name.trim(),
      room_id: finalRoomId,
      room_name: finalRoom,
      status: 'online',
      relay_state: false,
      type: deviceType,
      description: description.trim(),
      fw_version: '1.0.0',
      wifi_ssid: '',
      wifi_rssi: 0,
      uptime_s: 0,
      free_heap: 0,
      last_seen: new Date().toISOString(),
      connection_method: connMethod,
      mqtt_broker: connMethod === 'mqtt' ? mqttBroker.trim() : '',
      mqtt_port: connMethod === 'mqtt' ? Number(mqttPort) : 1883,
      mqtt_user: mqttUser,
      mqtt_tls: connMethod === 'mqtt' ? mqttTls : false,
      topic_prefix: topicPre,
      rest_host: connMethod === 'rest' ? restHost.trim() : '',
      rest_endpoint: connMethod === 'rest' ? restEndpoint.trim() : '',
      gpio_pin: Number(gpioPin),
      pairing_code: demoData.createPairingCode(),
    })

    navigate('/devices')
  }

  return (
    <div>
      <div className="page-header">
        <h2>Add Device</h2>
      </div>

      <div className="wizard-steps">
        {stepOrder.map((s, i) => (
          <div key={s} className={`wizard-step${i === currentIdx ? ' active' : ''}${i < currentIdx ? ' done' : ''}`}>
            <span className="wizard-step-num">{i < currentIdx ? '✓' : (i + 1).toString()}</span>
            <span>{STEP_LABELS[i]}</span>
          </div>
        ))}
      </div>

      {step === 'info' && (
        <div className="card">
          <div className="card-header"><h3>📝 Device Information</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Device Name *</label>
              <input className="form-input" placeholder="e.g. Luz Principal" value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select className="form-select" value={deviceType} onChange={e => setDeviceType(e.target.value)}>
                <option>ESP32 Light Controller</option>
                <option>ESP32 Relay Module</option>
                <option>ESP32 PWM Dimmer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room *</label>
              {!createNewRoom && (
                <select className="form-select" value={roomId} onChange={e => setRoomId(e.target.value)}>
                  <option value="">Select a room...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              {createNewRoom && (
                <input className="form-input" placeholder="New room name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
              )}
              {errors.room && <div className="form-error">{errors.room}</div>}
              {errors.newRoom && <div className="form-error">{errors.newRoom}</div>}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                <input type="checkbox" checked={createNewRoom} onChange={e => setCreateNewRoom(e.target.checked)} />
                Create new room
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} placeholder="Optional description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 'connection' && (
        <div className="card">
          <div className="card-header"><h3>🔗 Connection Method</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="radio" checked={connMethod === 'mqtt'} onChange={() => setConnMethod('mqtt')} />
                MQTT
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="radio" checked={connMethod === 'rest'} onChange={() => setConnMethod('rest')} />
                REST API
              </label>
            </div>

            {connMethod === 'mqtt' && (
              <>
                <div className="form-group">
                  <label className="form-label">Broker Address *</label>
                  <input className="form-input" placeholder="broker.hivemq.com" value={mqttBroker} onChange={e => setMqttBroker(e.target.value)} />
                  {errors.broker && <div className="form-error">{errors.broker}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Port *</label>
                  <input className="form-input" placeholder="8883" value={mqttPort} onChange={e => setMqttPort(e.target.value)} />
                  {errors.port && <div className="form-error">{errors.port}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Username (optional)</label>
                  <input className="form-input" placeholder="MQTT username" value={mqttUser} onChange={e => setMqttUser(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (optional)</label>
                  <input className="form-input" type="password" placeholder="MQTT password" value={mqttPass} onChange={e => setMqttPass(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={mqttTls} onChange={e => setMqttTls(e.target.checked)} />
                  Use TLS / SSL
                </label>
                <div className="form-group">
                  <label className="form-label">Topic Prefix</label>
                  <input className="form-input" placeholder="Auto-generated if empty" value={topicPrefix} onChange={e => setTopicPrefix(e.target.value)} />
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Auto: state/{name.toLowerCase().replace(/\s+/g, '-') || 'device'}/+
                  </div>
                </div>
              </>
            )}

            {connMethod === 'rest' && (
              <>
                <div className="form-group">
                  <label className="form-label">ESP32 Hostname or IP *</label>
                  <input className="form-input" placeholder="192.168.1.100 or esp32-1.local" value={restHost} onChange={e => setRestHost(e.target.value)} />
                  {errors.host && <div className="form-error">{errors.host}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">API Endpoint</label>
                  <input className="form-input" placeholder="/api" value={restEndpoint} onChange={e => setRestEndpoint(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Auth Token (optional)</label>
                  <input className="form-input" type="password" placeholder="API token" value={restAuth} onChange={e => setRestAuth(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">GPIO Pin</label>
              <input className="form-input" placeholder="25" value={gpioPin} onChange={e => setGpioPin(e.target.value)} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Relay or PWM output pin on the ESP32
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'test' && (
        <div className="card">
          <div className="card-header"><h3>✅ Test & Save</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: '1rem' }}>
              <SummaryItems
                items={[
                  ['Name', name],
                  ['Room', createNewRoom ? newRoomName : rooms.find(r => r.id === roomId)?.name || ''],
                  ['Type', deviceType],
                  ['Connection', connMethod === 'mqtt' ? `MQTT (${mqttBroker}:${mqttPort})` : `REST (${restHost})`],
                  ['GPIO Pin', gpioPin],
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={handleTestConnection} disabled={testing}>
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testResult && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', marginBottom: '1rem', background: testResult === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: testResult === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                {testResult === 'success' ? '✅ Connection successful — device is reachable.' : '❌ Connection failed — check the address and credentials.'}
              </div>
            )}

            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              ⚠ Demo mode: connection test is simulated. Real MQTT/REST control is not active.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button className="btn btn-ghost" onClick={currentIdx === 0 ? () => navigate('/devices') : handleBack}>
          {currentIdx === 0 ? 'Cancel' : 'Back'}
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step === 'test' && (
            <button className="btn btn-primary" onClick={handleSave}>
              Save Device
            </button>
          )}
          {step !== 'test' && (
            <button className="btn btn-primary" onClick={handleNext}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryItems({ items }: { items: Array<[string, string]> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
      {items.map(([label, value]) => (
        <div key={label}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
        </div>
      ))}
    </div>
  )
}