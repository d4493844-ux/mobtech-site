import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getEmployee, clearEmployee, STATUS, PRIORITY, timeAgo, formatBytes, logActivity, isLeader } from '../lib/workspace'
import WorkspaceLayout from '../components/workspace/shared/WorkspaceLayout'
import LeaderTasks from '../components/workspace/employee/LeaderTasks'
import '../workspace.css'

const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', jpg: '🖼', jpeg: '🖼', png: '🖼', zip: '🗜' }
const getIcon = (name = '') => FILE_ICONS[name.split('.').pop()?.toLowerCase()] || '📁'

// ── MY TASKS ──────────────────────────────────────────────────
function MyTasks({ employee }) {
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*,brands(name,color)')
      .eq('assigned_to', employee.id).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }
  useEffect(() => { if (supabase) load() }, [])

  const loadComments = async (taskId) => {
    const { data } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at')
    setComments(data || [])
  }

  const openTask = (t) => { setSelected(t); loadComments(t.id) }

  const updateStatus = async (taskId, status) => {
    const update = { status, updated_at: new Date().toISOString() }
    if (status === 'completed') update.completed_at = new Date().toISOString()
    await supabase.from('tasks').update(update).eq('id', taskId)
    await logActivity(employee.id, `Updated task status to ${status}`, 'task', taskId)
    setSelected(s => s ? { ...s, status } : s)
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('task_comments').insert([{ task_id: selected.id, author: employee.full_name, author_type: 'employee', content: newComment.trim() }])
    await logActivity(employee.id, 'Commented on task', 'task', selected.id)
    setNewComment(''); loadComments(selected.id)
  }

  const statusFilters = [
    { key: 'all', label: 'All' }, { key: 'todo', label: 'To Do' },
    { key: 'inprogress', label: 'In Progress' }, { key: 'review', label: 'Review' },
    { key: 'completed', label: 'Done' }, { key: 'blocked', label: 'Blocked' },
  ]
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 2, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: filter === f.key ? 'rgba(0,200,255,0.1)' : 'transparent', color: filter === f.key ? '#00C8FF' : 'rgba(240,244,255,0.4)', borderColor: filter === f.key ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.08)' }}>
              {f.label}
            </button>
          ))}
        </div>
        {loading ? <div className="ws-empty">Loading tasks...</div>
          : filtered.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◻</div>{filter === 'all' ? 'No tasks assigned yet' : `No ${filter} tasks`}</div>
          : filtered.map(t => {
            const s = STATUS[t.status]; const p = PRIORITY[t.priority]
            return (
              <div key={t.id} className="ws-task" onClick={() => openTask(t)} style={{ borderColor: selected?.id === t.id ? 'rgba(0,200,255,0.4)' : undefined }}>
                <div className="ws-task-title">{t.title}</div>
                <div className="ws-task-meta">
                  <span className="ws-badge" style={{ color: s.color, background: s.bg, borderColor: s.color + '40' }}>{s.label}</span>
                  <span className="ws-badge" style={{ color: p.color, background: 'transparent', borderColor: p.color + '40' }}>{p.label}</span>
                  {t.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: t.brands.color }}>◆ {t.brands.name}</span>}
                  {t.due_date && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? '#EF4444' : 'rgba(240,244,255,0.3)' }}>Due {t.due_date}</span>}
                </div>
              </div>
            )
          })}
      </div>
      {selected && (
        <div className="ws-card" style={{ position: 'sticky', top: 0, maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em', flex: 1, marginRight: 10 }}>{selected.title}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.35)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          {selected.description && <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', lineHeight: 1.65 }}>{selected.description}</div>}
          {selected.due_date && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: new Date(selected.due_date) < new Date() ? '#EF4444' : 'rgba(240,244,255,0.4)' }}>Due: {selected.due_date}</div>}
          <div>
            <label className="ws-label">Update Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => updateStatus(selected.id, k)}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, padding: '5px 10px', borderRadius: 2, cursor: 'pointer', border: '1px solid', color: v.color, background: selected.status === k ? v.bg : 'transparent', borderColor: v.color + '50' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ws-divider" />
          <div>
            <label className="ws-label">Comments ({comments.length})</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
              {comments.length === 0 ? <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.25)', padding: '10px 0' }}>No comments yet</div>
                : comments.map(c => (
                  <div key={c.id} className="ws-comment">
                    <div className="ws-comment-header">
                      <span className="ws-comment-author" style={{ color: c.author_type === 'admin' ? '#00C8FF' : '#F0F4FF' }}>{c.author}</span>
                      {c.author_type === 'admin' && <span className="ws-badge" style={{ fontSize: 7, color: '#00C8FF', background: 'rgba(0,200,255,0.06)', borderColor: 'rgba(0,200,255,0.2)' }}>Admin</span>}
                      <span className="ws-comment-time">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="ws-comment-body">{c.content}</div>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ws-input" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} style={{ flex: 1 }} />
              <button className="btn-primary" style={{ fontSize: '9px', padding: '0 14px' }} onClick={addComment}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DOCUMENTS ─────────────────────────────────────────────────
function MyDocuments({ employee }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) return
    const brandFilter = employee.brand_id
      ? `shared_with_all.eq.true,brand_id.eq.${employee.brand_id}`
      : 'shared_with_all.eq.true'
    supabase.from('documents').select('*,brands(name,color)')
      .or(brandFilter).order('created_at', { ascending: false })
      .then(({ data }) => { setDocs(data || []); setLoading(false) })
  }, [])
  const download = async (doc) => {
    await logActivity(employee.id, `Downloaded: ${doc.name}`, 'document', doc.id)
    window.open(doc.file_url, '_blank')
  }
  return (
    <div>
      {loading ? <div className="ws-empty">Loading...</div>
        : docs.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◫</div>No documents shared yet</div>
        : docs.map(d => (
          <div key={d.id} className="ws-doc">
            <div className="ws-doc-icon">{getIcon(d.name)}</div>
            <div style={{ flex: 1 }}>
              <div className="ws-doc-name">{d.name}</div>
              <div className="ws-doc-meta">{d.file_type?.toUpperCase()} {d.file_size ? `· ${formatBytes(d.file_size)}` : ''} · {timeAgo(d.created_at)}</div>
              {d.description && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', marginTop: 3 }}>{d.description}</div>}
            </div>
            <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => download(d)}>Download ↓</button>
          </div>
        ))}
    </div>
  )
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────
function MyAnnouncements({ employee }) {
  const [list, setList] = useState([])
  useEffect(() => {
    if (!supabase) return
    const filter = employee.brand_id
      ? `brand_id.is.null,brand_id.eq.${employee.brand_id}`
      : 'brand_id.is.null'
    supabase.from('announcements').select('*,brands(name,color)')
      .or(filter).order('created_at', { ascending: false })
      .then(({ data }) => setList(data || []))
  }, [])
  const PC = { normal: '#8899BB', important: '#F59E0B', urgent: '#EF4444' }
  return (
    <div>
      {list.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◬</div>No announcements</div>
        : list.map(a => (
          <div key={a.id} className="ws-card" style={{ marginBottom: 2, borderLeft: `2px solid ${PC[a.priority]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{a.title}</span>
              {a.priority !== 'normal' && <span className="ws-badge" style={{ color: PC[a.priority], background: 'transparent', borderColor: PC[a.priority] + '40', fontSize: 7 }}>{a.priority}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.55)', lineHeight: 1.65, marginBottom: 8 }}>{a.content}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>{timeAgo(a.created_at)}</div>
          </div>
        ))}
    </div>
  )
}

// ── HOME ──────────────────────────────────────────────────────
function EmployeeHome({ employee }) {
  const [stats, setStats] = useState({ total: 0, inprogress: 0, completed: 0, blocked: 0 })
  useEffect(() => {
    if (!supabase) return
    supabase.from('tasks').select('status').eq('assigned_to', employee.id).then(({ data }) => {
      const t = data || []
      setStats({ total: t.length, inprogress: t.filter(x => x.status === 'inprogress').length, completed: t.filter(x => x.status === 'completed').length, blocked: t.filter(x => x.status === 'blocked').length })
    })
  }, [])
  return (
    <div>
      {isLeader(employee) && (
        <div style={{ background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 3, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, color: '#00C8FF' }}>◈</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>You are a Team Leader</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)', marginTop: 2 }}>You can assign and manage tasks for your team from the <strong style={{ color: '#00C8FF' }}>Team Tasks</strong> section.</div>
          </div>
        </div>
      )}
      <div className="ws-stats">
        <div className="ws-stat"><div className="ws-stat-n">{stats.total}</div><div className="ws-stat-l">My Tasks</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{stats.inprogress}</div><div className="ws-stat-l">In Progress</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{stats.completed}</div><div className="ws-stat-l">Completed</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{stats.blocked}</div><div className="ws-stat-l">Blocked</div></div>
      </div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em', margin: '24px 0 14px' }}>Announcements</div>
      <MyAnnouncements employee={employee} />
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function EmployeeWorkspace() {
  const navigate = useNavigate()
  const employee = getEmployee()
  useEffect(() => { if (!employee) navigate('/workspace/login') }, [])
  if (!employee) return null

  const leader = isLeader(employee)

  const navItems = [
    { section: 'Workspace', items: [
      { path: '/workspace', icon: '⬡', label: 'Home' },
      { path: '/workspace/tasks', icon: '◻', label: 'My Tasks' },
      ...(leader ? [{ path: '/workspace/team-tasks', icon: '◈', label: 'Team Tasks' }] : []),
      { path: '/workspace/documents', icon: '◫', label: 'Documents' },
      { path: '/workspace/announcements', icon: '◬', label: 'Announcements' },
    ]}
  ]

  return (
    <WorkspaceLayout title="My Workspace" navItems={navItems} isAdmin={false}>
      <Routes>
        <Route path="/" element={<EmployeeHome employee={employee} />} />
        <Route path="/tasks" element={<MyTasks employee={employee} />} />
        {leader && <Route path="/team-tasks" element={<LeaderTasks employee={employee} />} />}
        <Route path="/documents" element={<MyDocuments employee={employee} />} />
        <Route path="/announcements" element={<MyAnnouncements employee={employee} />} />
      </Routes>
    </WorkspaceLayout>
  )
}
