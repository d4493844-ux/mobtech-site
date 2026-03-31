import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { timeAgo } from '../../../lib/workspace'
import { sendNotification } from '../../../lib/chat'
import { sendNotificationToMany } from '../../../lib/chat'

// ── ANNOUNCEMENTS ─────────────────────────────────────────────
export function WsAdminAnnouncements() {
  const [list, setList] = useState([])
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState({ title: '', content: '', brand_id: '', priority: 'normal' })
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [a, b] = await Promise.all([
      supabase.from('announcements').select('*,brands(name,color)').order('created_at', { ascending: false }),
      supabase.from('brands').select('*')
    ])
    setList(a.data || []); setBrands(b.data || [])
  }
  useEffect(() => { if (supabase) load() }, [])
  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const save = async () => {
    if (!form.title || !form.content) return flash('Title and content required')
    const { error } = await supabase.from('announcements').insert([{ ...form, brand_id: form.brand_id || null, created_by: 'Admin' }])
    if (!error) {
      flash('✓ Announcement posted')
      setShow(false)
      setForm({ title: '', content: '', brand_id: '', priority: 'normal' })
      load()
      // Notify all active employees
      const { data: emps } = await supabase.from('employees').select('id').eq('is_active', true)
      const ids = (emps || []).map(e => e.id)
      if (ids.length) await sendNotificationToMany(ids, 'announcement', form.title, form.content, '/workspace/announcements')
    } else flash('Error: ' + error.message)
  }

  const remove = async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    flash('Deleted'); load()
  }

  const PC = { normal: '#8899BB', important: '#F59E0B', urgent: '#EF4444' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Announcements</div>
        <button className="btn-primary" onClick={() => setShow(true)}>+ New Announcement</button>
      </div>
      {msg && <div className="ws-msg">{msg}</div>}
      {list.length === 0 ? <div className="ws-empty"><div className="ws-empty-icon">◬</div>No announcements yet</div>
        : list.map(a => (
          <div key={a.id} className="ws-card" style={{ marginBottom: 2, borderLeft: `2px solid ${PC[a.priority]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.55)', lineHeight: 1.65, marginBottom: 10 }}>{a.content}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="ws-badge" style={{ color: PC[a.priority], background: 'transparent', borderColor: PC[a.priority] + '40' }}>{a.priority}</span>
                  {a.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: a.brands.color }}>◆ {a.brands.name}</span>}
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>{timeAgo(a.created_at)}</span>
                </div>
              </div>
              <button className="btn-danger" style={{ fontSize: '9px', padding: '6px 12px', flexShrink: 0 }} onClick={() => remove(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      {show && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">New Announcement</div>
            <div className="ws-form-full"><label className="ws-label">Title *</label><input className="ws-input" value={form.title} placeholder="Announcement title" onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="ws-form-full"><label className="ws-label">Content *</label><textarea className="ws-input" value={form.content} placeholder="Message..." rows={4} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
            <div className="ws-form-row">
              <div><label className="ws-label">Priority</label>
                <select className="ws-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div><label className="ws-label">Brand (optional)</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">All Brands</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── BRANDS ────────────────────────────────────────────────────
export function WsAdminBrands() {
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', color: '#00C8FF', icon: '◆' })
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const load = async () => { const { data } = await supabase.from('brands').select('*').order('created_at'); setBrands(data || []) }
  useEffect(() => { if (supabase) load() }, [])
  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const save = async () => {
    if (!form.name) return flash('Name required')
    const payload = { ...form, slug: form.slug || slugify(form.name) }
    let error
    if (editing === 'new') { const r = await supabase.from('brands').insert([payload]); error = r.error }
    else { const r = await supabase.from('brands').update(payload).eq('id', editing.id); error = r.error }
    if (!error) { flash('✓ Brand saved'); setEditing(null); load() }
    else flash('Error: ' + error.message)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this brand? All its tasks will lose the brand association.')) return
    await supabase.from('brands').delete().eq('id', id); flash('Brand deleted'); load()
  }

  const ICONS = ['◆', '◈', '◉', '△', '◻', '◬', '◫', '⬡', '◎', '★']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Brands</div>
        <button className="btn-primary" onClick={() => { setForm({ name: '', slug: '', color: '#00C8FF', icon: '◆' }); setEditing('new') }}>+ Add Brand</button>
      </div>
      {msg && <div className="ws-msg">{msg}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {brands.map(b => (
          <div key={b.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 3, background: b.color + '20', border: `1px solid ${b.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: b.color, flexShrink: 0 }}>{b.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.3)', marginTop: 2 }}>/{b.slug}</div>
            </div>
            <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => { setForm({ name: b.name, slug: b.slug, color: b.color, icon: b.icon }); setEditing(b) }}>Edit</button>
            <button className="btn-danger" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => remove(b.id)}>Delete</button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Add Brand' : 'Edit Brand'}</div>
            <div className="ws-form-row">
              <div><label className="ws-label">Brand Name *</label><input className="ws-input" value={form.name} placeholder="e.g. Gacom" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="ws-label">Slug</label><input className="ws-input" value={form.slug} placeholder="auto-generated" onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Colour</label>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                style={{ width: 60, height: 40, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Icon</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm({ ...form, icon: ic })} style={{ width: 36, height: 36, background: form.icon === ic ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.icon === ic ? 'rgba(0,200,255,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 3, cursor: 'pointer', fontSize: 16, color: '#F0F4FF' }}>{ic}</button>
                ))}
              </div>
            </div>
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save Brand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ACTIVITY LOG ──────────────────────────────────────────────
export function WsAdminActivity() {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.from('activity_log').select('*,employees(full_name,avatar_color)').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setLog(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em', marginBottom: 22 }}>Activity Log</div>
      {loading ? <div className="ws-empty">Loading...</div> : log.length === 0 ? (
        <div className="ws-empty"><div className="ws-empty-icon">◎</div>No activity yet</div>
      ) : log.map(e => (
        <div key={e.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(0,200,255,0.04)' }}>
          <div className="ws-avatar" style={{ background: e.employees?.avatar_color || '#00C8FF', width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
            {(e.employees?.full_name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>{e.employees?.full_name || 'Unknown'}</span>
            <span style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', marginLeft: 8 }}>{e.action}</span>
            {e.entity_type && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.4)', marginLeft: 8 }}>{e.entity_type}</span>}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)', flexShrink: 0 }}>{timeAgo(e.created_at)}</div>
        </div>
      ))}
    </div>
  )
}

export default WsAdminAnnouncements
