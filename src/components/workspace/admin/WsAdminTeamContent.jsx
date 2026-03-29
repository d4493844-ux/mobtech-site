import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const EMPTY = { name: '', role: '', department: '', bio: '', image_url: '', display_order: 0 }

const DEPARTMENTS = ['Leadership', 'Gacom', 'VMS', 'Triangle Engine', 'Finance', 'Operations', 'Tech']

export default function WsAdminTeamContent() {
  const [members, setMembers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) {
      setErr('Could not load team members: ' + error.message)
    } else {
      setMembers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 4000) }
  const flashErr = t => { setErr(t); setTimeout(() => setErr(''), 6000) }

  const openEdit = m => {
    setForm({
      name: m.name || '',
      role: m.role || '',
      department: m.department || '',
      bio: m.bio || '',
      image_url: m.image_url || '',
      display_order: m.display_order ?? 0,
    })
    setEditing(m)
  }

  const openNew = () => {
    setForm({ ...EMPTY, display_order: members.length + 1 })
    setEditing('new')
  }

  const save = async () => {
    if (!form.name.trim()) return flashErr('Full name is required')
    if (!form.role.trim()) return flashErr('Role is required')
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      department: form.department.trim() || null,
      bio: form.bio.trim() || null,
      image_url: form.image_url.trim() || null,
      display_order: parseInt(form.display_order) || 0,
    }

    let error
    if (editing === 'new') {
      const res = await supabase.from('team_members').insert([payload])
      error = res.error
    } else {
      const res = await supabase.from('team_members').update(payload).eq('id', editing.id)
      error = res.error
    }

    setSaving(false)

    if (error) {
      flashErr('Save failed: ' + error.message)
    } else {
      flash('✓ Saved — changes are now live on the public website')
      setEditing(null)
      load()
    }
  }

  const remove = async id => {
    if (!window.confirm('Remove this team member from the public website?')) return
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) return flashErr('Delete failed: ' + error.message)
    flash('Team member removed from site')
    load()
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const departments = [...new Set(members.map(m => m.department || 'General'))]

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Site Team Members</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>
            Edit profiles shown on the public website — changes go live instantly
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 16px', background: 'transparent', border: '1px solid rgba(0,200,255,0.2)', color: 'rgba(0,200,255,0.6)', borderRadius: 2, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
          <button className="btn-primary" onClick={openNew}>+ Add Member</button>
        </div>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}
      {err && <div className="ws-err">{err}</div>}

      {loading ? (
        <div className="ws-empty"><div className="ws-empty-icon">◉</div>Loading...</div>
      ) : members.length === 0 ? (
        <div>
          <div className="ws-empty" style={{ marginBottom: 16 }}>
            <div className="ws-empty-icon">◉</div>
            No team members found in database
          </div>
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, padding: '16px 20px', fontSize: 12, color: 'rgba(240,244,255,0.55)', lineHeight: 1.7 }}>
            <strong style={{ color: '#F59E0B' }}>Action needed:</strong> Run the SQL in <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 2, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>SUPABASE_SETUP.sql</code> in your Supabase SQL Editor to create the <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 2, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>team_members</code> table and seed the initial team.
          </div>
        </div>
      ) : (
        departments.map(dept => (
          <div key={dept} style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.4)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
              {dept}
            </div>
            {members.filter(m => (m.department || 'General') === dept).map(m => (
              <div key={m.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 2, flexWrap: 'wrap' }}>

                {/* AVATAR */}
                <div style={{ width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,200,255,0.18)', background: 'rgba(0,200,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.image_url
                    ? <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    : <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#00C8FF' }}>{initials(m.name)}</span>
                  }
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', marginBottom: 3 }}>{m.name}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#00C8FF', letterSpacing: '0.08em', marginBottom: 4 }}>{m.role}</div>
                  {m.bio
                    ? <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', lineHeight: 1.5 }}>{m.bio.length > 120 ? m.bio.substring(0, 120) + '...' : m.bio}</div>
                    : <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.2)', fontStyle: 'italic' }}>No bio yet — click Edit Profile to add one</div>
                  }
                </div>

                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.2)' }}>#{m.display_order}</div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn-primary" style={{ fontSize: '9px', padding: '9px 18px' }} onClick={() => openEdit(m)}>
                    Edit Profile
                  </button>
                  <button className="btn-danger" style={{ fontSize: '9px', padding: '9px 14px' }} onClick={() => remove(m.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* MODAL */}
      {editing && (
        <div className="ws-modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="ws-modal" style={{ maxWidth: 640 }}>
            <div className="ws-modal-title">
              {editing === 'new' ? 'Add Team Member to Site' : `Edit — ${editing.name}`}
            </div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Full Name *</label>
                <input className="ws-input" value={form.name}
                  placeholder="e.g. Akinyemi Akinjide Samuel"
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Role / Title *</label>
                <input className="ws-input" value={form.role}
                  placeholder="e.g. Founder & CEO"
                  onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Department</label>
                <input className="ws-input" value={form.department}
                  placeholder="e.g. Leadership, Gacom"
                  list="dept-list"
                  onChange={e => setForm({ ...form, department: e.target.value })} />
                <datalist id="dept-list">
                  {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div>
                <label className="ws-label">Display Order (1 = first)</label>
                <input className="ws-input" type="number" value={form.display_order}
                  onChange={e => setForm({ ...form, display_order: e.target.value })} />
              </div>
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Profile Photo URL</label>
              <input className="ws-input" value={form.image_url}
                placeholder="https://res.cloudinary.com/... or any image URL"
                onChange={e => setForm({ ...form, image_url: e.target.value })} />
              {form.image_url && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={form.image_url} alt="Preview"
                    style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', objectPosition: 'top', border: '1px solid rgba(0,200,255,0.2)' }}
                    onError={e => e.target.style.display = 'none'} />
                  <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)' }}>Photo preview</span>
                </div>
              )}
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Bio</label>
              <textarea className="ws-input" value={form.bio} rows={5}
                placeholder="Write a bio for this team member. This appears on the public website..."
                onChange={e => setForm({ ...form, bio: e.target.value })}
                style={{ minHeight: 110 }} />
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)', marginTop: 4 }}>
                {(form.bio || '').length} characters
              </div>
            </div>

            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : editing === 'new' ? 'Add to Website' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
