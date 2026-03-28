import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { STATUS, PRIORITY, timeAgo } from '../../../lib/workspace'

export default function WsAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, todo: 0, inprogress: 0, completed: 0, blocked: 0, employees: 0 })
  const [recent, setRecent] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('tasks').select('id,status'),
      supabase.from('employees').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('tasks').select('*,brands(name,color),employees(full_name)').order('created_at', { ascending: false }).limit(6),
      supabase.from('announcements').select('*,brands(name)').order('created_at', { ascending: false }).limit(3),
      supabase.from('brands').select('id,name,color,icon'),
    ]).then(([taskRes, empRes, recentRes, annRes, brandRes]) => {
      const tasks = taskRes.data || []
      setStats({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
        employees: empRes.count || 0,
      })
      setRecent(recentRes.data || [])
      setAnnouncements(annRes.data || [])
      setBrands(brandRes.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="ws-empty">Loading dashboard...</div>

  return (
    <div>
      {/* STATS */}
      <div className="ws-stats">
        {[
          { n: stats.total, l: 'Total Tasks' },
          { n: stats.todo, l: 'To Do' },
          { n: stats.inprogress, l: 'In Progress' },
          { n: stats.completed, l: 'Completed' },
          { n: stats.blocked, l: 'Blocked' },
          { n: stats.employees, l: 'Active Employees' },
        ].map(s => (
          <div key={s.l} className="ws-stat">
            <div className="ws-stat-n">{s.n}</div>
            <div className="ws-stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="ws-grid-2" style={{ gap: 20 }}>
        {/* RECENT TASKS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em' }}>Recent Tasks</div>
            <button onClick={() => navigate('/admin/workspace/tasks')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', color: '#00C8FF', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              View All →
            </button>
          </div>
          {recent.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◻</div>No tasks yet</div> : recent.map(t => {
            const s = STATUS[t.status]
            return (
              <div key={t.id} className="ws-task" onClick={() => navigate('/admin/workspace/tasks')}>
                <div className="ws-task-title">{t.title}</div>
                <div className="ws-task-meta">
                  <span className="ws-badge" style={{ color: s.color, background: s.bg, borderColor: s.color + '40' }}>{s.label}</span>
                  {t.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: t.brands.color || '#00C8FF' }}>◆ {t.brands.name}</span>}
                  {t.employees && <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>{t.employees.full_name}</span>}
                  <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', marginLeft: 'auto' }}>{timeAgo(t.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          {/* BRANDS */}
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em', marginBottom: 14 }}>Brands</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
            {brands.map(b => (
              <div key={b.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 18, color: b.color }}>{b.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</span>
              </div>
            ))}
          </div>

          {/* ANNOUNCEMENTS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em' }}>Announcements</div>
            <button onClick={() => navigate('/admin/workspace/announcements')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', color: '#00C8FF', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              Manage →
            </button>
          </div>
          {announcements.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◬</div>No announcements</div>
            : announcements.map(a => (
              <div key={a.id} className="ws-card" style={{ marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: a.priority === 'urgent' ? '#EF4444' : a.priority === 'important' ? '#F59E0B' : '#F0F4FF' }}>{a.title}</span>
                  {a.priority !== 'normal' && <span className="ws-badge" style={{ color: a.priority === 'urgent' ? '#EF4444' : '#F59E0B', background: 'transparent', borderColor: a.priority === 'urgent' ? '#EF444440' : '#F59E0B40' }}>{a.priority}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', lineHeight: 1.6 }}>{a.content}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)', marginTop: 8 }}>{timeAgo(a.created_at)}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
