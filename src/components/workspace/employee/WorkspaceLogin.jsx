import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeLogin, setEmployee } from '../../lib/workspace'
import '../../../workspace.css'

const LOGO = 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'

export default function WorkspaceLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return setError('Enter your username and password')
    setLoading(true); setError('')
    const { employee, error: err } = await employeeLogin(username, password)
    setLoading(false)
    if (err) return setError(err)
    setEmployee(employee)
    navigate('/workspace')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060E18', padding: 20, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#0B1E2D', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 4, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO} alt="Mobtech" style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(0,200,255,0.2)', objectFit: 'cover', marginBottom: 16 }} />
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.06em', color: '#F0F4FF' }}>
            MOB<span style={{ color: '#00C8FF' }}>TECH</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.4)', marginTop: 4 }}>
            Team Workspace
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label className="ws-label">Username</label>
            <input className="ws-input" placeholder="your.username" value={username}
              onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="ws-label">Password</label>
            <input className="ws-input" type="password" placeholder="••••••••••" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <div className="ws-err" style={{ marginBottom: 16 }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Enter Workspace'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.2)', letterSpacing: '0.1em' }}>
          Contact your admin if you need access
        </div>
      </div>
    </div>
  )
}
