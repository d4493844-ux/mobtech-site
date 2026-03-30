import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { clearEmployee, getEmployee } from '../../../lib/workspace'
import NotificationBell from './NotificationBell'
import ChatPanel from './ChatPanel'
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

  const toggleMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(o => !o)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060E18', color: '#F0F4FF', fontFamily: 'Barlow, sans-serif', position: 'relative' }}>

      {/* MOBILE TOPBAR */}
      <div style={{
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56,
        background: '#0B1E2D',
        borderBottom: '1px solid rgba(0,200,255,0.08)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      }} id="ws-topbar-mobile">
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.06em', color: '#F0F4FF' }}>
          MOB<span style={{ color: '#00C8FF' }}>TECH</span>
        </div>
        <button
          onClick={toggleMenu}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 201 }}
          aria-label="Toggle menu"
        >
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.25s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.25s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.25s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* OVERLAY */}
      <div
        id="ws-overlay"
        onClick={closeMenu}
        style={{
          display: 'none',
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 149,
          pointerEvents: menuOpen ? 'all' : 'none',
          opacity: menuOpen ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />

      {/* SIDEBAR */}
      <aside id="ws-sidebar" style={{
        width: 240, flexShrink: 0,
        background: '#0B1E2D',
        borderRight: '1px solid rgba(0,200,255,0.08)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
        zIndex: 150,
        transition: 'transform 0.3s ease',
      }}>
        {/* HEAD */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.06em', color: '#F0F4FF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={LOGO} alt="Mobtech" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            MOB<span style={{ color: '#00C8FF' }}>TECH</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.35)', marginTop: 3 }}>
            {isAdmin ? '// Admin Workspace' : '// Team Workspace'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '10px 12px', background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.1)', borderRadius: 3 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#060E18', flexShrink: 0 }}>
              {initials(user.name)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF' }}>{user.name}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{user.role}</div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(section => (
            <div key={section.section}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.3)', padding: '12px 20px 6px' }}>
                {section.section}
              </div>
              {section.items.map(item => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 20px', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500,
                      color: active ? '#00C8FF' : 'rgba(240,244,255,0.5)',
                      background: active ? 'rgba(0,200,255,0.05)' : 'transparent',
                      borderLeft: active ? '2px solid #00C8FF' : '2px solid transparent',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
                    {item.label}
                    {item.badge != null && item.badge > 0 && (
                      <span style={{ marginLeft: 'auto', background: 'rgba(0,200,255,0.15)', color: '#00C8FF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, padding: '2px 7px', borderRadius: 10 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* FOOT */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,200,255,0.06)' }}>
          {isAdmin && (
            <a href="/" style={{ display: 'block', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(0,200,255,0.4)', textDecoration: 'none' }}>
              ← View Site
            </a>
          )}
          <button onClick={logout} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,68,68,0.5)', background: 'none', border: '1px solid rgba(255,68,68,0.15)', borderRadius: 2, padding: '8px 14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            {isAdmin ? 'Exit Admin' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main id="ws-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: 56, borderBottom: '1px solid rgba(0,200,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(11,30,45,0.4)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.04em', color: '#F0F4FF' }}>{title}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.3)', letterSpacing: '0.12em' }}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }} id="ws-content">
          {children}
        </div>
      </main>

      {/* RESPONSIVE */}
      <style>{`
        @media (max-width: 768px) {
          #ws-topbar-mobile { display: flex !important; }
          #ws-overlay { display: block !important; }
          #ws-sidebar {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            height: 100vh !important;
            width: 260px !important;
            transform: ${menuOpen ? 'translateX(0)' : 'translateX(-260px)'} !important;
          }
          #ws-main { padding-top: 56px; }
          #ws-content { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}
