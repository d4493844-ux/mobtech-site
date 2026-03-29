import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { STATUS, PRIORITY, timeAgo, logActivity } from '../../../lib/workspace'

const EMPTY = { title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'todo', brand_id: '' }

export default function LeaderTasks({ employee }) {
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [brands, setBrands] = useState([])
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState({ status: '', member: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [noMembers, setNoMembers] = useState(false)

  const load = async () => {
    setLoading(true)

    // Step 1 — get assigned member IDs for this leader
    const { data: asnData, error: asnErr } = await supabase
      .from('leader_assignments')
      .select('member_id')
      .eq('leader_id', employee.id)

    const memberIds = (asnData || []).map(a => a.member_id)

    if (memberIds.length === 0) {
      setNoMembers(true)
      setTeamMembers([])
      setTasks([])
      setLoading(false)
      return
    }

    setNoMembers(false)

    // Step 2 — get those members' full profiles
    const { data: memberData } = await supabase
      .from('employees')
      .select('id,full_name,avatar_color,role,brand_id')
      .in('id', memberIds)
      .eq('is_active', true)

    setTeamMembers(memberData || [])

    // Step 3 — get tasks created by this leader OR assigned to their members
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*,employees(full_name,avatar_color),brands(name,color)')
      .or(`created_by.eq.${employee.full_name},assigned_to.in.(${memberIds.join(',')})`)
      .order('created_at', { ascending: false })

    setTasks(taskData || [])

    // Step 4 — get brands for the task form
    const { data: brandData } = await supabase.from('brands').select('*')
    setBrands(brandData || [])

    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const loadComments = async (taskId) => {
    const { data } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at')
    setComments(data || [])
  }

  const openTask = t => { setSelected(t); loadComments(t.id) }

  const save = async () => {
    if (!form.title) return flash('Title is required')
    if (!form.assigned_to) return flash('Please assign this task to a team member')

    // Auto-set brand from assigned member if not set
    let brandId = form.brand_id || null
    if (!brandId) {
      const member = teamMembers.find(m => m.id === form.assigned_to)
      brandId = member?.brand_id || null
    }

    const payload = {
      title: form.title,
      description: form.description,
      assigned_to: form.assigned_to,
      priority: form.priority,
      due_date: form.due_date || null,
      status: form.status || 'todo',
      brand_id: brandId,
      created_by: employee.full_name,
      updated_at: new Date().toISOString()
    }

    let error
    if (editing === 'new') {
      const res = await supabase.from('tasks').insert([payload]); error = res.error
      if (!error) await logActivity(employee.id, `Created task: ${form.title}`, 'task')
    } else {
      const res = await supabase.from('tasks').update(payload).eq('id', editing.id); error = res.error
      if (!error) await logActivity(employee.id, `Updated task: ${form.title}`, 'task', editing.id)
    }

    if (!error) { flash('✓ Task saved'); setEditing(null); load() }
    else flash('Error: ' + error.message)
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
    await supabase.from('task_comments').insert([{
      task_id: selected.id, author: employee.full_name,
      author_type: 'employee', content: newComment.trim()
    }])
    await logActivity(employee.id, 'Commented on task', 'task', selected.id)
    setNewComment(''); loadComments(selected.id)
  }

  const remove = async id => {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    if (selected?.id === id) setSelected(null)
    flash('Task deleted'); load()
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const filtered = tasks.filter(t =>
    (!filter.status || t.status === filter.status) &&
    (!filter.member || t.assigned_to === filter.member)
  )

  const myCreated = tasks.filter(t => t.created_by === employee.full_name).length
  const pending = tasks.filter(t => t.status !== 'completed').length
  const done = tasks.filter(t => t.status === 'completed').length

  // NO MEMBERS ASSIGNED YET
  if (noMembers) return (
    <div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.04em', marginBottom: 20 }}>Team Tasks</div>
      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 14, opacity: 0.4 }}>◈</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', marginBottom: 8 }}>No team members assigned yet</div>
        <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
          Ask your admin to assign team members to you from the workspace employee management page. Once assigned, you'll be able to create and assign tasks to them here.
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* STATS */}
      <div className="ws-stats" style={{ marginBottom: 20 }}>
        <div className="ws-stat"><div className="ws-stat-n">{tasks.length}</div><div className="ws-stat-l">Total Tasks</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{myCreated}</div><div className="ws-stat-l">Created by You</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{pending}</div><div className="ws-stat-l">Pending</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{done}</div><div className="ws-stat-l">Completed</div></div>
        <div className="ws-stat"><div className="ws-stat-n">{teamMembers.length}</div><div className="ws-stat-l">Team Members</div></div>
      </div>

      {/* TEAM MEMBER CHIPS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {teamMembers.map(m => {
          const active = tasks.filter(t => t.assigned_to === m.id && t.status !== 'completed').length
          return (
            <div key={m.id}
              onClick={() => setFilter(f => ({ ...f, member: f.member === m.id ? '' : m.id }))}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: filter.member === m.id ? 'rgba(0,200,255,0.1)' : 'rgba(11,30,45,0.8)', border: `1px solid ${filter.member === m.id ? 'rgba(0,200,255,0.4)' : 'rgba(0,200,255,0.08)'}`, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#060E18', flexShrink: 0 }}>
                {initials(m.full_name)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF' }}>{m.full_name.split(' ')[0]}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: active > 0 ? '#F59E0B' : '#10B981' }}>{active} active</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
        {/* TASK LIST */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="ws-input" style={{ width: 'auto', fontSize: 11 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
                <option value="">All Status</option>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {(filter.status || filter.member) && (
                <button onClick={() => setFilter({ status: '', member: '' })}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#EF4444', background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 2, padding: '0 12px', cursor: 'pointer' }}>
                  Clear
                </button>
              )}
            </div>
            <button className="btn-primary" style={{ fontSize: '10px' }} onClick={() => { setForm(EMPTY); setEditing('new') }}>
              + Assign Task
            </button>
          </div>

          {msg && <div className="ws-msg">{msg}</div>}

          {loading ? <div className="ws-empty">Loading...</div>
            : filtered.length === 0 ? (
              <div className="ws-empty">
                <div className="ws-empty-icon">◻</div>
                {tasks.length === 0 ? 'No tasks yet — create one for your team' : 'No tasks match this filter'}
              </div>
            ) : filtered.map(t => {
              const s = STATUS[t.status]; const p = PRIORITY[t.priority]
              return (
                <div key={t.id} className="ws-task" onClick={() => openTask(t)} style={{ borderColor: selected?.id === t.id ? 'rgba(0,200,255,0.4)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div className="ws-task-title" style={{ flex: 1 }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); setForm({ title: t.title, description: t.description || '', assigned_to: t.assigned_to || '', priority: t.priority, due_date: t.due_date || '', status: t.status, brand_id: t.brand_id || '' }); setEditing(t) }}
                        style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#00C8FF', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={e => { e.stopPropagation(); remove(t.id) }}
                        style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Del</button>
                    </div>
                  </div>
                  <div className="ws-task-meta">
                    <span className="ws-badge" style={{ color: s.color, background: s.bg, borderColor: s.color + '40' }}>{s.label}</span>
                    <span className="ws-badge" style={{ color: p.color, background: 'transparent', borderColor: p.color + '40' }}>{p.label}</span>
                    {t.employees && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.employees.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'Bebas Neue, sans-serif', color: '#060E18' }}>
                          {initials(t.employees.full_name)}
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{t.employees.full_name}</span>
                      </span>
                    )}
                    {t.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: t.brands.color }}>◆ {t.brands.name}</span>}
                    {t.due_date && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? '#EF4444' : 'rgba(240,244,255,0.3)' }}>Due {t.due_date}</span>}
                  </div>
                </div>
              )
            })}
        </div>

        {/* DETAIL PANEL */}
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
                {comments.length === 0
                  ? <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.25)', padding: '10px 0' }}>No comments yet</div>
                  : comments.map(c => (
                    <div key={c.id} className="ws-comment">
                      <div className="ws-comment-header">
                        <span className="ws-comment-author">{c.author}</span>
                        <span className="ws-comment-time">{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="ws-comment-body">{c.content}</div>
                    </div>
                  ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="ws-input" placeholder="Add a comment..." value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()} style={{ flex: 1 }} />
                <button className="btn-primary" style={{ fontSize: '9px', padding: '0 14px' }} onClick={addComment}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Assign New Task' : 'Edit Task'}</div>
            <div className="ws-form-full">
              <label className="ws-label">Task Title *</label>
              <input className="ws-input" value={form.title} placeholder="What needs to be done?" onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Description</label>
              <textarea className="ws-input" value={form.description} placeholder="Task details and instructions..." onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Assign To *</label>
              <select className="ws-input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Select a team member</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}{m.role ? ` — ${m.role}` : ''}</option>
                ))}
              </select>
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
            {brands.length > 0 && (
              <div className="ws-form-full">
                <label className="ws-label">Brand (optional — auto-set from assignee)</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">Auto / No brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {editing !== 'new' && (
              <div className="ws-form-full">
                <label className="ws-label">Status</label>
                <select className="ws-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            )}
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>{editing === 'new' ? 'Assign Task' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
