import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './AdminTeam.module.css'

const EMPTY = { name: '', role: '', department: '', bio: '', image_url: '', display_order: 0 }

export default function AdminTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | member object
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('team_members').select('*').order('display_order')
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(EMPTY); setEditing('new') }
  const openEdit = (m) => { setForm({ ...m }); setEditing(m) }
  const cancel = () => { setEditing(null); setForm(EMPTY) }

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const save = async () => {
    setSaving(true)
    if (editing === 'new') {
      const { error } = await supabase.from('team_members').insert([form])
      if (!error) { flash('Member added!'); cancel(); load() }
      else flash('Error: ' + error.message)
    } else {
      const { error } = await supabase.from('team_members').update(form).eq('id', editing.id)
      if (!error) { flash('Member updated!'); cancel(); load() }
      else flash('Error: ' + error.message)
    }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    flash('Member deleted.')
    load()
  }

  function initials(name) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.pageTitle}>Team Members</div>
          <div className={styles.pageSub}>Manage your team — changes reflect live on the site</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Member</button>
      </div>

      {msg && <div className={styles.msg}>{msg}</div>}

      {/* FORM MODAL */}
      {editing && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <div className={styles.modalTitle}>{editing === 'new' ? 'Add New Member' : 'Edit Member'}</div>
            <div className={styles.formGrid}>
              <div>
                <label className="admin-label">Full Name *</label>
                <input className="admin-input" value={form.name} placeholder="Full name"
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Role / Title *</label>
                <input className="admin-input" value={form.role} placeholder="e.g. Founder & CEO"
                  onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Department</label>
                <input className="admin-input" value={form.department} placeholder="e.g. Leadership, Gacom"
                  onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Display Order</label>
                <input className="admin-input" type="number" value={form.display_order}
                  onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Photo URL</label>
                <input className="admin-input" value={form.image_url} placeholder="https://... (leave blank for initials)"
                  onChange={e => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Bio (optional)</label>
                <textarea className="admin-input" value={form.bio} placeholder="Short bio..."
                  onChange={e => setForm({ ...form, bio: e.target.value })} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className="btn-ghost" onClick={cancel}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.name || !form.role}>
                {saving ? 'Saving...' : 'Save Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER LIST */}
      {loading ? (
        <div className={styles.loading}>Loading team...</div>
      ) : (
        <div className={styles.list}>
          {members.map(m => (
            <div key={m.id} className={styles.row}>
              <div className={styles.rowAvatar}>
                {m.image_url
                  ? <img src={m.image_url} alt={m.name} />
                  : <span>{initials(m.name)}</span>
                }
              </div>
              <div className={styles.rowInfo}>
                <div className={styles.rowName}>{m.name}</div>
                <div className={styles.rowMeta}>{m.role} {m.department ? `· ${m.department}` : ''}</div>
              </div>
              <div className={styles.rowOrder}>#{m.display_order}</div>
              <div className={styles.rowActions}>
                <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => openEdit(m)}>Edit</button>
                <button className="btn-danger" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => remove(m.id)}>Delete</button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className={styles.empty}>No team members yet. Click "Add Member" to get started.</div>
          )}
        </div>
      )}
    </div>
  )
}
