import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { hashPassword, timeAgo } from '../../../lib/workspace'

const EMPTY = { username: '', full_name: '', role: '', brand_id: '', password: '', avatar_color: '#00C8FF', is_leader: false }
const COLORS = ['#00C8FF','#7C3AED','#059669','#DC2626','#F59E0B','#EC4899','#06B6D4']

export default function WsAdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [brands, setBrands] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [plainPasswords, setPlainPasswords] = useState({})

  const load = async () => {
    setLoading(true)
    const [empRes, brandRes] = await Promise.all([
      supabase.from('employees').select('*,brands(name,color)').order('display_order,created_at'),
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

  const openNew = () => { setForm({ ...EMPTY, password: genPassword() }); setEditing('new') }
  const openEdit = (e) => {
    setForm({ username: e.username, full_name: e.full_name, role: e.role || '', brand_id: e.brand_id || '', password: '', avatar_color: e.avatar_color || '#00C8FF', is_leader: e.is_leader || false })
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
      is_leader: form.is_leader,
    }
    if (form.password) payload.password_hash = await hashPassword(form.password)
    let error
    if (editing === 'new') {
      const res = await supabase.from('employees').insert([payload]); error = res.error
      if (!error) setPlainPasswords(p => ({ ...p, [form.username]: form.password }))
    } else {
      const res = await supabase.from('employees').update(payload).eq('id', editing.id); error = res.error
      if (!error && form.password) setPlainPasswords(p => ({ ...p, [editing.username]: form.password }))
    }
    if (!error) { flash(editing === 'new' ? '✓ Employee created' : '✓ Employee updated'); setEditing(null); load() }
    else flash('Error: ' + error.message)
  }

  const toggleActive = async (emp) => {
    await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id)
    flash(emp.is_active ? 'Deactivated' : 'Reactivated'); load()
  }

  const toggleLeader = async (emp) => {
    await supabase.from('employees').update({ is_leader: !emp.is_leader }).eq('id', emp.id)
    flash(emp.is_leader ? `${emp.full_name} removed as team leader` : `✓ ${emp.full_name} is now a team leader`)
    load()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this employee?')) return
    await supabase.from('employees').delete().eq('id', id)
    flash('Deleted'); load()
  }

  const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  // Group by brand
  const grouped = brands.map(b => ({
    brand: b,
    members: employees.filter(e => e.brand_id === b.id)
  }))
  const unassigned = employees.filter(e => !e.brand_id)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Employees</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>Manage team access and assign team leaders per brand</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Employee</button>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}

      {/* PASSWORD BOX */}
      {Object.keys(plainPasswords).length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 10 }}>⚠ Save these passwords — they won't show again</div>
          {Object.entries(plainPasswords).map(([username, pass]) => (
            <div key={username} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#00C8FF', fontFamily: 'IBM Plex Mono, monospace' }}>{username}</span>
              <span style={{ color: 'rgba(240,244,255,0.5)' }}>→</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F0F4FF', background: 'rgba(0,0,0,0.3)', padding: '2px 10px', borderRadius: 2 }}>{pass}</span>
            </div>
          ))}
        </div>
      )}

      {/* LEADER INFO BOX */}
      <div style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 3, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: '#00C8FF', fontSize: 16, flexShrink: 0 }}>◈</span>
        <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', lineHeight: 1.65 }}>
          <strong style={{ color: '#F0F4FF' }}>Team Leaders</strong> — employees marked as leaders can log into their workspace and create + assign tasks to other employees within their brand. Toggle leader status using the <strong style={{ color: '#00C8FF' }}>Leader</strong> button on any employee.
        </div>
      </div>

      {/* GROUPED BY BRAND */}
      {loading ? <div className="ws-empty">Loading...</div> : (
        <>
          {grouped.map(({ brand, members }) => members.length > 0 && (
            <div key={brand.id} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
                <span style={{ fontSize: 18, color: brand.color }}>{brand.icon}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: brand.color }}>{brand.name}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
              <EmpList members={members} onEdit={openEdit} onToggleActive={toggleActive} onToggleLeader={toggleLeader} onDelete={remove} initials={initials} />
            </div>
          ))}

          {unassigned.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,255,0.25)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
                Unassigned
              </div>
              <EmpList members={unassigned} onEdit={openEdit} onToggleActive={toggleActive} onToggleLeader={toggleLeader} onDelete={remove} initials={initials} />
            </div>
          )}

          {employees.length === 0 && (
            <div className="ws-empty"><div className="ws-empty-icon">◈</div>No employees yet</div>
          )}
        </>
      )}

      {/* MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Add Employee' : 'Edit Employee'}</div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Full Name *</label>
                <input className="ws-input" value={form.full_name} placeholder="Full name" onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Username * (login)</label>
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
              <label className="ws-label">{editing === 'new' ? 'Password *' : 'New Password (blank = keep current)'}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="ws-input" value={form.password} placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
                <button type="button" onClick={() => setForm({ ...form, password: genPassword() })}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, padding: '0 16px', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', color: '#00C8FF', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Generate
                </button>
              </div>
            </div>

            {/* LEADER TOGGLE */}
            <div className="ws-form-full" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 3, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', marginBottom: 3 }}>Team Leader</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)' }}>Can create and assign tasks to their brand's employees</div>
                </div>
                <div onClick={() => setForm({ ...form, is_leader: !form.is_leader })}
                  style={{ width: 44, height: 24, borderRadius: 12, background: form.is_leader ? '#00C8FF' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.is_leader ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Avatar Colour</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

function EmpList({ members, onEdit, onToggleActive, onToggleLeader, onDelete, initials }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {members.map(e => (
        <div key={e.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: e.is_active ? 1 : 0.45, flexWrap: 'wrap' }}>
          <div className="ws-avatar" style={{ background: e.avatar_color || '#00C8FF', width: 42, height: 42, flexShrink: 0, fontSize: 13 }}>
            {initials(e.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF' }}>{e.full_name}</span>
              {e.is_leader && (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2, background: 'rgba(0,200,255,0.12)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.3)' }}>
                  Team Leader
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#00C8FF', letterSpacing: '0.08em', marginTop: 2 }}>
              @{e.username}{e.role ? ` · ${e.role}` : ''}
            </div>
          </div>
          {e.last_seen && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.2)' }}>Last seen {timeAgo(e.last_seen)}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 12px' }} onClick={() => onEdit(e)}>Edit</button>
            <button
              onClick={() => onToggleLeader(e)}
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', padding: '7px 12px', letterSpacing: '0.1em', textTransform: 'uppercase', background: e.is_leader ? 'rgba(0,200,255,0.1)' : 'transparent', color: e.is_leader ? '#00C8FF' : 'rgba(240,244,255,0.4)', border: `1px solid ${e.is_leader ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}>
              {e.is_leader ? '◈ Leader' : 'Make Leader'}
            </button>
            <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 12px', color: e.is_active ? '#F59E0B' : '#10B981', borderColor: e.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }} onClick={() => onToggleActive(e)}>
              {e.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button className="btn-danger" style={{ fontSize: '9px', padding: '7px 12px' }} onClick={() => onDelete(e.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
