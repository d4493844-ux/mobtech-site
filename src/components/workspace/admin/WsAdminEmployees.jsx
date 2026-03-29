import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { hashPassword, timeAgo } from '../../../lib/workspace'

const EMPTY = { username: '', full_name: '', role: '', brand_id: '', password: '', avatar_color: '#00C8FF', is_leader: false }
const COLORS = ['#00C8FF','#7C3AED','#059669','#DC2626','#F59E0B','#EC4899','#06B6D4']

export default function WsAdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [brands, setBrands] = useState([])
  const [assignments, setAssignments] = useState([]) // leader_assignments
  const [editing, setEditing] = useState(null)
  const [assigning, setAssigning] = useState(null) // leader being assigned members
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [plainPasswords, setPlainPasswords] = useState({})

  const load = async () => {
    setLoading(true); setErr('')
    const [empRes, brandRes, asnRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: true }),
      supabase.from('brands').select('*'),
      supabase.from('leader_assignments').select('*'),
    ])
    if (empRes.error) setErr('Could not load employees: ' + empRes.error.message)
    else setEmployees(empRes.data || [])
    if (!brandRes.error) setBrands(brandRes.data || [])
    if (!asnRes.error) setAssignments(asnRes.data || [])
    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3500) }
  const flashErr = t => { setErr(t); setTimeout(() => setErr(''), 5000) }

  const genPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
    return Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => chars[b % chars.length]).join('')
  }

  const openNew = () => { setForm({ ...EMPTY, password: genPassword() }); setEditing('new') }
  const openEdit = e => {
    setForm({ username: e.username, full_name: e.full_name, role: e.role || '', brand_id: e.brand_id || '', password: '', avatar_color: e.avatar_color || '#00C8FF', is_leader: e.is_leader || false })
    setEditing(e)
  }

  const save = async () => {
    if (!form.username || !form.full_name) return flashErr('Username and full name are required')
    if (editing === 'new' && !form.password) return flashErr('Password is required')
    const payload = {
      username: form.username.toLowerCase().trim(),
      full_name: form.full_name.trim(),
      role: form.role || null,
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
    else flashErr('Save failed: ' + error.message)
  }

  const toggleActive = async emp => {
    const { error } = await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id)
    if (error) return flashErr(error.message)
    flash(emp.is_active ? 'Deactivated' : '✓ Activated'); load()
  }

  const toggleLeader = async emp => {
    const { error } = await supabase.from('employees').update({ is_leader: !emp.is_leader }).eq('id', emp.id)
    if (error) return flashErr(error.message)
    flash(emp.is_leader ? `${emp.full_name} removed as leader` : `✓ ${emp.full_name} is now a Team Leader`)
    load()
  }

  const remove = async id => {
    if (!window.confirm('Delete this employee permanently?')) return
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return flashErr(error.message)
    flash('Employee deleted'); load()
  }

  // ── LEADER ASSIGNMENTS ──────────────────────────────────────
  const getMemberIds = (leaderId) => assignments.filter(a => a.leader_id === leaderId).map(a => a.member_id)

  const toggleMemberAssignment = async (leaderId, memberId, currentlyAssigned) => {
    if (currentlyAssigned) {
      await supabase.from('leader_assignments').delete().eq('leader_id', leaderId).eq('member_id', memberId)
    } else {
      await supabase.from('leader_assignments').insert([{ leader_id: leaderId, member_id: memberId }])
    }
    // Refresh assignments only
    const { data } = await supabase.from('leader_assignments').select('*')
    if (data) setAssignments(data)
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const grouped = brands.map(b => ({
    brand: b,
    members: employees.filter(e => e.brand_id === b.id)
  })).filter(g => g.members.length > 0)
  const unassigned = employees.filter(e => !e.brand_id)

  // For assigning modal — show all employees in same brand except the leader
  // Leaders can assign anyone — HQ staff or any brand
  const assignableMembers = assigning
    ? employees.filter(e => e.id !== assigning.id && e.is_active)
    : []

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Employees</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>
            {loading ? 'Loading...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} across ${brands.length} brand${brands.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '9px 16px', background: 'transparent', border: '1px solid rgba(0,200,255,0.2)', color: 'rgba(0,200,255,0.6)', borderRadius: 2, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
          <button className="btn-primary" onClick={openNew}>+ Add Employee</button>
        </div>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}
      {err && <div className="ws-err">{err}</div>}

      {/* PASSWORD BOX */}
      {Object.keys(plainPasswords).length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 10 }}>
            ⚠ Save these passwords now — they won't show again
          </div>
          {Object.entries(plainPasswords).map(([username, pass]) => (
            <div key={username} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#00C8FF' }}>{username}</span>
              <span style={{ color: 'rgba(240,244,255,0.3)' }}>→</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#F0F4FF', background: 'rgba(0,0,0,0.4)', padding: '3px 12px', borderRadius: 2 }}>{pass}</span>
            </div>
          ))}
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="ws-empty"><div className="ws-empty-icon">◈</div>Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="ws-empty"><div className="ws-empty-icon">◈</div>No employees yet — click "+ Add Employee" to get started</div>
      ) : (
        <>
          {grouped.map(({ brand, members }) => (
            <div key={brand.id} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
                <span style={{ fontSize: 18, color: brand.color }}>{brand.icon}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: brand.color }}>{brand.name}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
              <EmployeeList members={members} onEdit={openEdit} onToggleActive={toggleActive} onToggleLeader={toggleLeader} onDelete={remove} onAssign={setAssigning} getMemberIds={getMemberIds} initials={initials} />
            </div>
          ))}
          {unassigned.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
                <span style={{ fontSize: 18, color: '#00C8FF' }}>⬡</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: '#00C8FF' }}>Mobtech HQ</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.25)' }}>Parent company — oversees all brands</span>
              </div>
              <EmployeeList members={unassigned} onEdit={openEdit} onToggleActive={toggleActive} onToggleLeader={toggleLeader} onDelete={remove} onAssign={setAssigning} getMemberIds={getMemberIds} initials={initials} />
            </div>
          )}
        </>
      )}

      {/* EDIT/CREATE MODAL */}
      {editing && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">{editing === 'new' ? 'Add New Employee' : `Edit — ${editing.full_name || ''}`}</div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Full Name *</label>
                <input className="ws-input" value={form.full_name} placeholder="e.g. Henshaw John" onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Username * (used to login)</label>
                <input className="ws-input" value={form.username} placeholder="e.g. henshaw.john" onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Role / Title</label>
                <input className="ws-input" value={form.role} placeholder="e.g. Managing Director" onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <label className="ws-label">Assign to Brand</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">Mobtech HQ (No brand)</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="ws-form-full">
              <label className="ws-label">{editing === 'new' ? 'Password *' : 'Reset Password (blank = keep current)'}</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="ws-input" value={form.password} placeholder="Enter or generate a password" onChange={e => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
                <button type="button" onClick={() => setForm({ ...form, password: genPassword() })}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, padding: '0 16px', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.25)', color: '#00C8FF', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Auto-Generate
                </button>
              </div>
            </div>

            {/* LEADER TOGGLE */}
            <div className="ws-form-full" style={{ background: 'rgba(0,200,255,0.03)', border: '1px solid rgba(0,200,255,0.1)', borderRadius: 3, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', marginBottom: 3 }}>Team Leader Access</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', lineHeight: 1.5 }}>Leaders can create and assign tasks to their assigned team members</div>
                </div>
                <div onClick={() => setForm({ ...form, is_leader: !form.is_leader })}
                  style={{ width: 48, height: 26, borderRadius: 13, background: form.is_leader ? '#00C8FF' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.is_leader ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            </div>

            <div className="ws-form-full" style={{ marginTop: 14 }}>
              <label className="ws-label">Avatar Colour</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, avatar_color: c })}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer', border: form.avatar_color === c ? '3px solid #fff' : '3px solid transparent', transition: 'border 0.15s', boxSizing: 'border-box' }} />
                ))}
              </div>
            </div>

            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>{editing === 'new' ? 'Create Employee' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MEMBERS MODAL */}
      {assigning && (
        <div className="ws-modal-overlay">
          <div className="ws-modal" style={{ maxWidth: 500 }}>
            <div className="ws-modal-title">Assign Team Members to {assigning.full_name}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
              Select which employees this leader can assign tasks to. Only selected members will appear in their task assignment dropdown.
            </div>

            {assignableMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(240,244,255,0.25)' }}>
                No other employees in this brand yet.<br />Add employees and assign them to the same brand first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto' }}>
                {assignableMembers.map(member => {
                  const assigned = getMemberIds(assigning.id).includes(member.id)
                  return (
                    <div key={member.id}
                      onClick={() => toggleMemberAssignment(assigning.id, member.id, assigned)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: assigned ? 'rgba(0,200,255,0.06)' : 'rgba(11,30,45,0.6)', border: `1px solid ${assigned ? 'rgba(0,200,255,0.3)' : 'rgba(0,200,255,0.07)'}`, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}>

                      {/* CHECKBOX */}
                      <div style={{ width: 20, height: 20, borderRadius: 3, border: `2px solid ${assigned ? '#00C8FF' : 'rgba(255,255,255,0.2)'}`, background: assigned ? '#00C8FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {assigned && <span style={{ color: '#060E18', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </div>

                      {/* AVATAR */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: member.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#060E18', flexShrink: 0 }}>
                        {initials(member.full_name)}
                      </div>

                      {/* INFO */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{member.full_name}</div>
                        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.5)', marginTop: 2 }}>
                          @{member.username}{member.role ? ` · ${member.role}` : ''}
                        </div>
                      </div>

                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: assigned ? '#00C8FF' : 'rgba(240,244,255,0.2)', letterSpacing: '0.1em' }}>
                        {assigned ? 'Assigned' : 'Not assigned'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="ws-modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-primary" onClick={() => { setAssigning(null); flash(`✓ Team assignments saved for ${assigning.full_name}`) }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeList({ members, onEdit, onToggleActive, onToggleLeader, onDelete, onAssign, getMemberIds, initials }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {members.map(e => {
        const assignedCount = e.is_leader ? getMemberIds(e.id).length : 0
        return (
          <div key={e.id} className="ws-card" style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: e.is_active ? 1 : 0.5, flexWrap: 'wrap' }}>
            <div className="ws-avatar" style={{ background: e.avatar_color || '#00C8FF', width: 44, height: 44, flexShrink: 0, fontSize: 14 }}>
              {initials(e.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF' }}>{e.full_name}</span>
                {e.is_leader && (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2, background: 'rgba(0,200,255,0.12)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.3)' }}>
                    Team Leader
                  </span>
                )}
                {!e.is_active && (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    Inactive
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.6)', letterSpacing: '0.06em' }}>
                @{e.username}{e.role ? ` · ${e.role}` : ''}
              </div>
              {e.is_leader && (
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: assignedCount > 0 ? 'rgba(0,200,255,0.45)' : 'rgba(240,244,255,0.2)', marginTop: 3 }}>
                  {assignedCount > 0 ? `${assignedCount} member${assignedCount !== 1 ? 's' : ''} assigned` : 'No members assigned yet'}
                </div>
              )}
              {e.last_seen && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)', marginTop: 2 }}>Last seen {timeAgo(e.last_seen)}</div>}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 14px' }} onClick={() => onEdit(e)}>Edit</button>

              {/* ASSIGN MEMBERS — only shows for leaders */}
              {e.is_leader && (
                <button
                  onClick={() => onAssign(e)}
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', padding: '8px 14px', letterSpacing: '0.1em', textTransform: 'uppercase', background: assignedCount > 0 ? 'rgba(0,200,255,0.1)' : 'transparent', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  ◈ Assign Members {assignedCount > 0 ? `(${assignedCount})` : ''}
                </button>
              )}

              <button
                onClick={() => onToggleLeader(e)}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', padding: '8px 14px', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: e.is_leader ? 'rgba(240,244,255,0.35)' : 'rgba(240,244,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}>
                {e.is_leader ? 'Remove Leader' : 'Set Leader'}
              </button>

              <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 14px', color: e.is_active ? '#F59E0B' : '#10B981', borderColor: e.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }} onClick={() => onToggleActive(e)}>
                {e.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn-danger" style={{ fontSize: '9px', padding: '8px 14px' }} onClick={() => onDelete(e.id)}>Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
