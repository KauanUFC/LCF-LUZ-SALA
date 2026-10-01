const libraries = [
  { name: 'React', url: 'https://react.dev', license: 'MIT' },
  { name: 'React Router', url: 'https://reactrouter.com', license: 'MIT' },
  { name: 'Vite', url: 'https://vite.dev', license: 'MIT' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com', license: 'MIT' },
  { name: 'PostCSS', url: 'https://postcss.org', license: 'MIT' },
  { name: 'Fastify', url: 'https://fastify.dev', license: 'MIT' },
  { name: 'PostgreSQL', url: 'https://postgresql.org', license: 'PostgreSQL' },
  { name: 'Node.js', url: 'https://nodejs.org', license: 'MIT' },
]

const contributors = [
  { name: 'Hawkkauan', role: 'Project Lead & Firmware Developer' },
  { name: 'LCF Team', role: 'Laboratory of Physical Computing, UFC' },
]

export default function Credits() {
  return (
    <div>
      <div className="page-header">
        <h2>Credits</h2>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header"><h3>👥 Contributors</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contributors.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1rem' }}>👤</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header"><h3>📚 Open Source Libraries</h3></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            LCFLIGHT is built on the shoulders of these open-source projects:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {libraries.map(lib => (
              <div key={lib.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  <a href={lib.url} target="_blank" rel="noopener noreferrer">{lib.name}</a>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{lib.license}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>⚖️ License</h3></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            This project is provided for educational and research purposes as part of the LCF-LUZ-SALA initiative at the
            Universidade Federal do Ceará (UFC). External pull requests are not accepted for safety reasons.
          </p>
        </div>
      </div>
    </div>
  )
}