import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { hashPassword, timeAgo } from '../../../lib/workspace'

const EMPTY = { username: '', full_name: '', role: '', brand_id: '', password: '', avatar_color: '#00C8FF' }
const COLORS = ['#00C8FF','#7C3AED','#059669','#DC2626','#F59E0B','#EC4899','#06B6D4']

export default function WsAdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [brands, setBrands] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPass, setShowPass] = useState({})
  const [plainPasswords, setPlainPasswords] = useState({})

  const load = async () => {
    setLoading(true)
    const [empRes, brandRes] = await Promise.all([
      supabase.from('employees').select('*,brands(name,color)').order('created_at'),
      supabase.from('brands').select('*')
    ])
    setEmployees(empRes.data || [])
    setBrands(brandRes.data || [])
    setLoading(false)
  }
  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3500) }

  const genPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
    return Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => chars[b % chars.length]).join('')
  }

  const openNew = () => {
    const pass = genPassword()
    setForm({ ...EMPTY, password: pass })
    setEditing('new')
  }

  const openEdit = (e) => {
    setForm({ username: e.username, full_name: e.full_name, role: e.role || '', brand_id: e.brand_id || '', password: '', avatar_color: e.avatar_color || '#00C8FF' })
    setEditing(e)
  }

  const save = async () => {
    if (!form.username || !form.full_name) return flash('Username and full name required')
    if (editing === 'new' && !form.password) return flash('Password required')

    const payload = {
      username: form.username.toLowerCase().trim(),
      full_name: form.full_name.trim(),
      role: form.role,
      brand_id: form.brand_id || null,
      avatar_color: form.avatar_color,
    }

    if (form.password) {
      payload.password_hash = await hashPassword(form.password)
    }

    let error
    if (editing === 'new') {
      const res = await supabase.from('employees').insert([payload])
      error = res.error
      if (!error) {
        setPlainPasswords(p => ({ ...p, [form.username]: form.password }))
      }
    } else {
      const res = await supabase.from('employees').update(payload).eq('id', editing.id)
      error = res.error
      if (!error && form.password) {
        setPlainPasswords(p => ({ ...p, [editing.username]: form.password }))
      }
    }

    if (!error) { flash(editing === 'new' ? '✓ Employee created' : '✓ Employee updated'); setEditing(null); load() }
    else flash('Error: ' + error.message)
  }

  const toggleActive = async (emp) => {
    await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id)
    flash(emp.is_active ? 'Employee deactivated' : 'Employee reactivated')
    load()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this employee? This cannot be undone.')) return
    await supabase.from('employees').delete().eq('id', id)
    flash('Employee deleted'); load()
  }

  const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Employees</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>Create and manage team member access</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Employee</button>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}

      {/* PASSWORD REMINDER BOX */}
      {Object.keys(plainPasswords).length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 10 }}>⚠ Save these passwords — they won't show again</div>
          {Object.entries(plainPasswords).map(([username, pass]) => (
            <div key={username} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#00C8FF', fontFamily: 'IBM Plex Mono, monospace' }}>{username}</span>
              <span style={{ color: 'rgba(240,244,255,0.5)' }}>→</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0F4FF', background: 'rgba(0,0,0,0.3)', padding: '2px 10px', borderRadius: 2 }}>{pass}</span>
            </div>
          ))}
        </div>
      )}

      {/* LIST */}
      {loading ? <div className="ws-empty">Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {employees.map(e => (
            <div key={e.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: e.is_active ? 1 : 0.45 }}>
              <div className="ws-avatar" style={{ background: e.avatar_color || '#00C8FF', width: 42, height: 42, flexShrink: 0 }}>
                {initials(e.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF' }}>{e.full_name}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#00C8FF', letterSpacing: '0.08em', marginTop: 2 }}>
                  @{e.username} {e.role ? `· ${e.role}` : ''} {e.brands ? `· ${e.brands.name}` : ''}
                </div>
              </div>
              {e.last_seen && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>Last seen {timeAgo(e.last_seen)}</div>}
              <span className="ws-badge" style={{ color: e.is_active ? '#10B981' : '#EF4444', background: e.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderColor: e.is_active ? '#10B98140' : '#EF444440' }}>
                {e.is_active ? 'Active' : 'Inactive'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => openEdit(e)}>Edit</button>
                <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 14px', color: e.is_active ? '#F59E0B' : '#10B981', borderColor: e.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }} onClick={() => toggleActive(e)}>
                  {e.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-danger" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => remove(e.id)}>Delete</button>
              </div>
            </div>
          ))}
          {employees.length === 0 && <div className="ws-empty"><div className="ws-empty-icon">◈</div>No employees yet. Add one to get started.</div>}
        </div>
      )}

      {/* MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Add New Employee' : 'Edit Employee'}</div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Full Name *</label>
                <input className="ws-input" value={form.full_name} placeholder="Full name" onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Username * (for login)</label>
                <input className="ws-input" value={form.username} placeholder="e.g. john.henshaw" onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Role / Title</label>
                <input className="ws-input" value={form.role} placeholder="e.g. Managing Director" onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Brand</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="ws-form-full">
              <label className="ws-label">{editing === 'new' ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="ws-input" value={form.password} placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
                <button type="button" onClick={() => setForm({ ...form, password: genPassword() })}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', padding: '0 16px', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', color: '#00C8FF', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Generate
                </button>
              </div>
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Avatar Colour</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, avatar_color: c })}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.avatar_color === c ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.15s' }} />
                ))}
              </div>
            </div>
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
