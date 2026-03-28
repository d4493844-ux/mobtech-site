import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminTeam from '../components/admin/AdminTeam'
import AdminBlog from '../components/admin/AdminBlog'
import AdminBlogEdit from '../components/admin/AdminBlogEdit'
import styles from './Admin.module.css'

export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = () => {
    sessionStorage.removeItem('mobtech_admin')
    navigate('/admin/login')
  }

  const navItems = [
    { path: '/admin', label: 'Team Members', exact: true },
    { path: '/admin/blog', label: 'Blog Posts' },
  ]

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sideBrand}>MOB<span>TECH</span></div>
        <div className={styles.sideLabel}>Admin Dashboard</div>
        <nav className={styles.sideNav}>
          {navItems.map(n => {
            const active = n.exact
              ? location.pathname === n.path
              : location.pathname.startsWith(n.path)
            return (
              <Link key={n.path} to={n.path} className={`${styles.sideLink} ${active ? styles.active : ''}`}>
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className={styles.sideBottom}>
          <a href="/" className={styles.viewSite} target="_blank" rel="noreferrer">View Site ↗</a>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<AdminTeam />} />
          <Route path="/blog" element={<AdminBlog />} />
          <Route path="/blog/new" element={<AdminBlogEdit />} />
          <Route path="/blog/edit/:id" element={<AdminBlogEdit />} />
        </Routes>
      </main>
    </div>
  )
}