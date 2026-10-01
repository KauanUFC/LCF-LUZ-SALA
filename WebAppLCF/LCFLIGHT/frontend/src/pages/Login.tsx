import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>💡</span>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: '0.5rem',
            }}
          >
            LCFLIGHT
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Painel de Controle de Iluminação
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.15)',
                color: 'var(--danger)',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.375rem', display: 'block' }}
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.375rem', display: 'block' }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="lcfadmin"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--text-secondary)' : 'var(--accent)',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              marginTop: '0.5rem',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}