import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { clearEmployee, getEmployee } from '../../../lib/workspace'
import '../../../workspace.css'

const LOGO = 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'

export default function WorkspaceLayout({ children, title, navItems, isAdmin = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const employee = getEmployee()

  const logout = () => {
    clearEmployee()
    navigate(isAdmin ? '/admin/login' : '/workspace/login')
  }

  const user = isAdmin
    ? { name: 'Admin', role: 'Super Admin', color: '#00C8FF' }
    : { name: employee?.full_name || employee?.username, role: employee?.role || 'Team Member', color: employee?.avatar_color || '#00C8FF' }

  const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="ws-layout">

      {/* MOBILE TOPBAR */}
      <div className="ws-mobile-topbar">
        <div className="ws-mobile-brand">MOB<span>TECH</span></div>
        <button className="ws-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      {/* OVERLAY */}
      {menuOpen && <div className="ws-overlay" onClick={closeMenu} />}

      {/* SIDEBAR */}
      <aside className={`ws-sidebar ${menuOpen ? 'ws-open' : ''}`}>
        <div className="ws-sidebar-head">
          <div className="ws-logo">
            <img src={LOGO} alt="Mobtech" />
            MOB<span>TECH</span>
          </div>
          <div className="ws-tagline">
            {isAdmin ? '// Admin Workspace' : '// Team Workspace'}
          </div>
          <div className="ws-user-chip">
            <div className="ws-avatar" style={{ background: user.color }}>
              {initials(user.name)}
            </div>
            <div>
              <div className="ws-user-name">{user.name}</div>
              <div className="ws-user-role">{user.role}</div>
            </div>
          </div>
        </div>

        <nav className="ws-nav">
          {navItems.map(section => (
            <div key={section.section}>
              <div className="ws-nav-section">{section.section}</div>
              {section.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`ws-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                  {item.badge != null && item.badge > 0 && (
                    <span className="ws-nav-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="ws-sidebar-foot">
          {isAdmin && (
            <a href="/" style={{ display: 'block', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,200,255,0.4)', textDecoration: 'none' }}>
              ← View Site
            </a>
          )}
          <button className="ws-logout" onClick={logout}>
            {isAdmin ? 'Exit Admin' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ws-main">
        <div className="ws-topbar">
          <div className="ws-page-title">{title}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: 'rgba(240,244,255,0.3)', letterSpacing: '0.12em' }}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div className="ws-content">
          {children}
        </div>
      </main>
    </div>
  )
}
