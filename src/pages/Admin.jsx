import { useState } from 'react'
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import AdminTeam from '../components/admin/AdminTeam'
import AdminBlog from '../components/admin/AdminBlog'
import AdminBlogEdit from '../components/admin/AdminBlogEdit'

export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = () => {
    sessionStorage.removeItem('mobtech_admin')
    navigate('/admin/login')
  }

  const navItems = [
    { path: '/admin', label: 'Team Members', exact: true },
    { path: '/admin/blog', label: 'Blog Posts' },
    { path: '/admin/workspace', label: '⬡ Workspace' },
  ]

  const isActive = (path, exact) => exact
    ? location.pathname === path
    : location.pathname.startsWith(path)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000', position: 'relative' }}>

      {/* MOBILE TOPBAR */}
      <div style={{
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56, background: '#080808',
        borderBottom: '1px solid rgba(0,200,255,0.08)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        fontFamily: 'Orbitron, sans-serif',
      }} id="admin-topbar">
        <div style={{ fontWeight: 900, fontSize: 15, color: '#F0F4FF' }}>
          MOB<span style={{ color: '#00C8FF' }}>TECH</span>
        </div>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}
          aria-label="Menu"
        >
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#F0F4FF', borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* DARK OVERLAY — mobile only */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 149, display: 'none',
          }}
          id="admin-overlay"
        />
      )}

      {/* SIDEBAR */}
      <aside id="admin-sidebar" style={{
        width: 220, flexShrink: 0, background: '#080808',
        borderRight: '1px solid rgba(0,200,255,0.08)',
        display: 'flex', flexDirection: 'column',
        padding: '28px 0',
        position: 'sticky', top: 0, height: '100vh',
        zIndex: 150,
      }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 14, color: '#F0F4FF', padding: '0 24px', marginBottom: 4 }}>
          MOB<span style={{ color: '#00C8FF' }}>TECH</span>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.4)', padding: '0 24px', marginBottom: 28 }}>
          Admin Dashboard
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {navItems.map(n => (
            <Link
              key={n.path}
              to={n.path}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: isActive(n.path, n.exact) ? '#00C8FF' : 'rgba(240,244,255,0.45)',
                textDecoration: 'none',
                padding: '14px 24px',
                borderLeft: isActive(n.path, n.exact) ? '2px solid #00C8FF' : '2px solid transparent',
                background: isActive(n.path, n.exact) ? 'rgba(0,200,255,0.04)' : 'transparent',
                transition: 'all 0.15s',
                display: 'block',
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: 'rgba(240,244,255,0.25)', textDecoration: 'none' }}>
            ← View Site
          </a>
          <button onClick={logout} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,68,68,0.6)', background: 'none', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 2, padding: '10px 12px', cursor: 'pointer', textAlign: 'left' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto', minWidth: 0 }} id="admin-main">
        <Routes>
          <Route path="/" element={<AdminTeam />} />
          <Route path="/blog" element={<AdminBlog />} />
          <Route path="/blog/new" element={<AdminBlogEdit />} />
          <Route path="/blog/edit/:id" element={<AdminBlogEdit />} />
        </Routes>
      </main>

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 768px) {
          #admin-topbar { display: flex !important; }
          #admin-overlay { display: block !important; }
          #admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            width: 260px !important;
            transform: ${menuOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            transition: transform 0.3s ease !important;
            padding-top: 56px !important;
          }
          #admin-main {
            padding: 72px 16px 24px !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
