import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const EMPTY = {
  name: '', role: '', department: '', bio: '', image_url: '', display_order: 0
}

export default function WsAdminTeamContent() {
  const [members, setMembers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('team_members').select('*').order('display_order')
    if (error) setErr('Failed to load: ' + error.message)
    else setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3500) }
  const flashErr = t => { setErr(t); setTimeout(() => setErr(''), 5000) }

  const openEdit = m => {
    setForm({
      name: m.name || '',
      role: m.role || '',
      department: m.department || '',
      bio: m.bio || '',
      image_url: m.image_url || '',
      display_order: m.display_order || 0
    })
    setEditing(m)
  }

  const openNew = () => { setForm(EMPTY); setEditing('new') }

  const save = async () => {
    if (!form.name || !form.role) return flashErr('Name and role are required')
    let error
    if (editing === 'new') {
      const res = await supabase.from('team_members').insert([form]); error = res.error
    } else {
      const res = await supabase.from('team_members').update(form).eq('id', editing.id); error = res.error
    }
    if (!error) { flash('✓ Team member saved — changes are live on the site'); setEditing(null); load() }
    else flashErr('Save failed: ' + error.message)
  }

  const remove = async id => {
    if (!window.confirm('Remove this team member from the public site?')) return
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) return flashErr(error.message)
    flash('Team member removed'); load()
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const departments = [...new Set(members.map(m => m.department || 'General'))]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Site Team Members</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>
            Edit team profiles shown on the public website — including the CEO & Founder
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 16px', background: 'transparent', border: '1px solid rgba(0,200,255,0.2)', color: 'rgba(0,200,255,0.6)', borderRadius: 2, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
          <button className="btn-primary" onClick={openNew}>+ Add Member</button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.1)', borderRadius: 3, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span style={{ color: '#00C8FF', flexShrink: 0 }}>◎</span>
        <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', lineHeight: 1.65 }}>
          Changes here update the <strong style={{ color: '#F0F4FF' }}>Team section on your public website</strong> in real time. You can edit bios, photos, roles, and display order for every team member including <strong style={{ color: '#00C8FF' }}>Akinyemi Akinjide Samuel</strong>.
        </div>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}
      {err && <div className="ws-err">{err}</div>}

      {loading ? (
        <div className="ws-empty"><div className="ws-empty-icon">◈</div>Loading team members...</div>
      ) : members.length === 0 ? (
        <div className="ws-empty"><div className="ws-empty-icon">◈</div>No team members — click "+ Add Member" to add</div>
      ) : (
        departments.map(dept => (
          <div key={dept} style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.4)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
              {dept}
            </div>
            {members.filter(m => (m.department || 'General') === dept).map(m => (
              <div key={m.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 2, flexWrap: 'wrap' }}>
                {/* AVATAR */}
                <div style={{ width: 52, height: 52, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,200,255,0.2)', background: 'rgba(0,200,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.image_url
                    ? <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    : <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: '#00C8FF' }}>{initials(m.name)}</span>
                  }
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', marginBottom: 3 }}>{m.name}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#00C8FF', letterSpacing: '0.08em', marginBottom: 3 }}>{m.role}</div>
                  {m.bio && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', lineHeight: 1.5, maxWidth: 400 }}>{m.bio.substring(0, 100)}{m.bio.length > 100 ? '...' : ''}</div>}
                </div>

                {/* ORDER */}
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.2)' }}>#{m.display_order}</div>

                {/* ACTIONS */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => openEdit(m)}>
                    Edit Profile
                  </button>
                  <button className="btn-danger" style={{ fontSize: '9px', padding: '8px 14px' }} onClick={() => remove(m.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal" style={{ maxWidth: 620 }}>
            <div className="ws-modal-title">
              {editing === 'new' ? 'Add Team Member' : `Edit — ${editing.name || ''}`}
            </div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Full Name *</label>
                <input className="ws-input" value={form.name} placeholder="e.g. Akinyemi Akinjide Samuel" onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Role / Title *</label>
                <input className="ws-input" value={form.role} placeholder="e.g. Founder & CEO" onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Department</label>
                <input className="ws-input" value={form.department} placeholder="e.g. Leadership, Gacom" onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Display Order</label>
                <input className="ws-input" type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Profile Photo URL</label>
              <input className="ws-input" value={form.image_url} placeholder="https://... (Cloudinary, etc)" onChange={e => setForm({ ...form, image_url: e.target.value })} />
              {form.image_url && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={form.image_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover', objectPosition: 'top', border: '1px solid rgba(0,200,255,0.2)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)' }}>Photo preview</span>
                </div>
              )}
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Bio</label>
              <textarea className="ws-input" value={form.bio} rows={4}
                placeholder="Brief biography shown on the public website..."
                onChange={e => setForm({ ...form, bio: e.target.value })}
                style={{ minHeight: 100 }}
              />
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)', marginTop: 4 }}>
                {form.bio.length} characters
              </div>
            </div>

            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>
                {editing === 'new' ? 'Add to Site' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
