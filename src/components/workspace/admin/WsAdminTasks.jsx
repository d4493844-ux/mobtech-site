import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { STATUS, PRIORITY, timeAgo } from '../../../lib/workspace'
import { sendNotification } from '../../../lib/chat'

const EMPTY = { title: '', description: '', brand_id: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '', start_date: '', duration_type: 'one-time', duration_value: 1 }

export default function WsAdminTasks() {
  const [tasks, setTasks] = useState([])
  const [brands, setBrands] = useState([])
  const [employees, setEmployees] = useState([])
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState({ brand: '', status: '', priority: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [taskRes, brandRes, empRes] = await Promise.all([
      supabase.from('tasks').select('*,brands(name,color),employees(full_name)').order('created_at', { ascending: false }),
      supabase.from('brands').select('*'),
      supabase.from('employees').select('id,full_name,brand_id').eq('is_active', true)
    ])
    setTasks(taskRes.data || [])
    setBrands(brandRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const loadComments = async (taskId) => {
    const { data } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at')
    setComments(data || [])
  }

  const openTask = (t) => { setSelected(t); loadComments(t.id) }

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const save = async () => {
    if (!form.title) return flash('Title required')
    const payload = { ...form, brand_id: form.brand_id || null, assigned_to: form.assigned_to || null, due_date: form.due_date || null, start_date: form.start_date || null, duration_type: form.duration_type || 'one-time', duration_value: parseInt(form.duration_value) || 1, updated_at: new Date().toISOString() }
    let error
    if (editing === 'new') {
      const res = await supabase.from('tasks').insert([payload]); error = res.error
    } else {
      const res = await supabase.from('tasks').update(payload).eq('id', editing.id); error = res.error
    }
    if (!error) {
      flash('✓ Task saved')
      setEditing(null)
      load()
      // Notify assigned employee
      if (payload.assigned_to) {
        const title = editing === 'new' ? 'New task assigned to you' : 'Task updated'
        const body = payload.title
        await sendNotification(payload.assigned_to, 'task', title, body, '/workspace/tasks')
      }
    } else flash('Error: ' + error.message)
  }

  const updateStatus = async (taskId, status) => {
    const update = { status, updated_at: new Date().toISOString() }
    if (status === 'completed') update.completed_at = new Date().toISOString()
    await supabase.from('tasks').update(update).eq('id', taskId)
    setSelected(s => s ? { ...s, status } : s)
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('task_comments').insert([{ task_id: selected.id, author: 'Admin', author_type: 'admin', content: newComment.trim() }])
    setNewComment('')
    loadComments(selected.id)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    if (selected?.id === id) setSelected(null)
    flash('Task deleted'); load()
  }

  const filtered = tasks.filter(t =>
    (!filter.brand || t.brand_id === filter.brand) &&
    (!filter.status || t.status === filter.status) &&
    (!filter.priority || t.priority === filter.priority)
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
      {/* TASK LIST */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Tasks</div>
          <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing('new') }}>+ Create Task</button>
        </div>

        {msg && <div className="ws-msg">{msg}</div>}

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <select className="ws-input" style={{ width: 'auto', fontSize: 11 }} value={filter.brand} onChange={e => setFilter({ ...filter, brand: e.target.value })}>
            <option value="">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="ws-input" style={{ width: 'auto', fontSize: 11 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="ws-input" style={{ width: 'auto', fontSize: 11 }} value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priority</option>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filter.brand || filter.status || filter.priority) && (
            <button onClick={() => setFilter({ brand: '', status: '', priority: '' })}
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#EF4444', background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 2, padding: '0 12px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {loading ? <div className="ws-empty">Loading tasks...</div> : filtered.length === 0 ? (
          <div className="ws-empty"><div className="ws-empty-icon">◻</div>No tasks found</div>
        ) : filtered.map(t => {
          const s = STATUS[t.status]; const p = PRIORITY[t.priority]
          return (
            <div key={t.id} className="ws-task" onClick={() => openTask(t)} style={{ borderColor: selected?.id === t.id ? 'rgba(0,200,255,0.35)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div className="ws-task-title" style={{ flex: 1 }}>{t.title}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setForm({ title: t.title, description: t.description || '', brand_id: t.brand_id || '', assigned_to: t.assigned_to || '', status: t.status, priority: t.priority, due_date: t.due_date || '' }); setEditing(t) }}
                    style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#00C8FF', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={e => { e.stopPropagation(); remove(t.id) }}
                    style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Del</button>
                </div>
              </div>
              <div className="ws-task-meta">
                <span className="ws-badge" style={{ color: s.color, background: s.bg, borderColor: s.color + '40' }}>{s.label}</span>
                <span className="ws-badge" style={{ color: p.color, background: 'transparent', borderColor: p.color + '40' }}>{p.label}</span>
                {t.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: t.brands.color || '#00C8FF' }}>◆ {t.brands.name}</span>}
                {t.employees && <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>{t.employees.full_name}</span>}
                {t.due_date && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: new Date(t.due_date) < new Date() ? '#EF4444' : 'rgba(240,244,255,0.3)' }}>Due {t.due_date}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* TASK DETAIL PANEL */}
      {selected && (
        <div className="ws-card" style={{ position: 'sticky', top: 0, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em', flex: 1, marginRight: 12 }}>{selected.title}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {selected.description && <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.55)', lineHeight: 1.65 }}>{selected.description}</div>}

          <div>
            <label className="ws-label">Update Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => updateStatus(selected.id, k)}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.1em', padding: '5px 10px', borderRadius: 2, cursor: 'pointer', border: '1px solid', color: v.color, background: selected.status === k ? v.bg : 'transparent', borderColor: v.color + '50', transition: 'all 0.15s' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ws-divider" />

          <div>
            <label className="ws-label">Comments ({comments.length})</label>
            <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
              {comments.length === 0 ? <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.25)', padding: '12px 0' }}>No comments yet</div>
                : comments.map(c => (
                  <div key={c.id} className="ws-comment">
                    <div className="ws-comment-header">
                      <span className="ws-comment-author" style={{ color: c.author_type === 'admin' ? '#00C8FF' : '#F0F4FF' }}>{c.author}</span>
                      {c.author_type === 'admin' && <span className="ws-badge" style={{ color: '#00C8FF', background: 'rgba(0,200,255,0.06)', borderColor: 'rgba(0,200,255,0.2)', fontSize: 7 }}>Admin</span>}
                      <span className="ws-comment-time">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="ws-comment-body">{c.content}</div>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ws-input" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()} style={{ flex: 1 }} />
              <button className="btn-primary" style={{ fontSize: '9px', padding: '0 16px', whiteSpace: 'nowrap' }} onClick={addComment}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Create Task' : 'Edit Task'}</div>
            <div className="ws-form-full">
              <label className="ws-label">Title *</label>
              <input className="ws-input" value={form.title} placeholder="Task title" onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Description</label>
              <textarea className="ws-input" value={form.description} placeholder="Task details..." onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Brand</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">No Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ws-label">Assign To</label>
                <select className="ws-input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">Unassigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Priority</label>
                <select className="ws-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="ws-label">Due Date</label>
                <input className="ws-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Start Date</label>
                <input className="ws-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Task Type</label>
                <select className="ws-input" value={form.duration_type} onChange={e => setForm({ ...form, duration_type: e.target.value })}>
                  <option value="one-time">One-time task</option>
                  <option value="daily">Daily — repeats every day</option>
                  <option value="weekly">Weekly — repeats every week</option>
                  <option value="monthly">Monthly — repeats every month</option>
                  <option value="custom">Custom duration</option>
                </select>
              </div>
            </div>
            {form.duration_type === 'custom' && (
              <div className="ws-form-full">
                <label className="ws-label">Duration (days)</label>
                <input className="ws-input" type="number" min="1" value={form.duration_value} placeholder="Number of days" onChange={e => setForm({ ...form, duration_value: e.target.value })} />
              </div>
            )}
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
