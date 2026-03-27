import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    const correct = import.meta.env.VITE_ADMIN_PASSWORD || 'mobtech_admin_2024'
    if (password === correct) {
      sessionStorage.setItem('mobtech_admin', 'true')
      navigate('/admin')
    } else {
      setError('Invalid password. Access denied.')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.brand}>MOB<span>TECH</span></div>
        <div className={styles.title}>ADMIN ACCESS</div>
        <div className={styles.sub}>Enter your credentials to continue</div>
        <form onSubmit={handleLogin}>
          <label className="admin-label">Password</label>
          <input
            className="admin-input"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
            AUTHENTICATE
          </button>
        </form>
        <div className={styles.back}>
          <a href="/">← Back to site</a>
        </div>
      </div>
    </div>
  )
}
