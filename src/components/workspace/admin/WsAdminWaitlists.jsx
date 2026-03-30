import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const DEFAULT_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', required: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
]

const FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select']

const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function WsAdminWaitlists() {
  const [waitlists, setWaitlists] = useState([])
  const [brands, setBrands] = useState([])
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ name: '', slug: '', description: '', brand_id: '', is_open: true, thank_you_message: "You're on the list! We'll be in touch soon.", fields: DEFAULT_FIELDS })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [wlRes, brandRes] = await Promise.all([
      supabase.from('waitlists').select('*,brands(name,color,icon)').order('created_at', { ascending: false }),
      supabase.from('brands').select('*')
    ])
    if (!wlRes.error) setWaitlists(wlRes.data || [])
    if (!brandRes.error) setBrands(brandRes.data || [])
    setLoading(false)
  }

  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 4000) }
  const flashErr = t => { setErr(t); setTimeout(() => setErr(''), 6000) }

  const openNew = () => {
    setForm({ name: '', slug: '', description: '', brand_id: '', is_open: true, thank_you_message: "You're on the list! We'll be in touch soon.", fields: DEFAULT_FIELDS })
    setEditing('new')
  }

  const openEdit = w => {
    setForm({ name: w.name, slug: w.slug, description: w.description || '', brand_id: w.brand_id || '', is_open: w.is_open, thank_you_message: w.thank_you_message || '', fields: w.fields || DEFAULT_FIELDS })
    setEditing(w)
  }

  const viewEntries = async w => {
    setViewing(w)
    const { data } = await supabase.from('waitlist_entries').select('*').eq('waitlist_id', w.id).order('created_at', { ascending: false })
    setEntries(data || [])
  }

  const save = async () => {
    if (!form.name.trim()) return flashErr('Waitlist name is required')
    if (!form.slug.trim()) return flashErr('URL slug is required')
    if (form.fields.length === 0) return flashErr('At least one field is required')
    setSaving(true)
    const payload = { ...form, brand_id: form.brand_id || null }
    let error
    if (editing === 'new') {
      const res = await supabase.from('waitlists').insert([payload]); error = res.error
    } else {
      const res = await supabase.from('waitlists').update(payload).eq('id', editing.id); error = res.error
    }
    setSaving(false)
    if (error) return flashErr('Save failed: ' + error.message)
    flash('✓ Waitlist saved — live at /waitlist/' + form.slug)
    setEditing(null); load()
  }

  const toggleOpen = async w => {
    await supabase.from('waitlists').update({ is_open: !w.is_open }).eq('id', w.id)
    flash(w.is_open ? 'Waitlist closed' : '✓ Waitlist opened')
    load()
  }

  const remove = async id => {
    if (!window.confirm('Delete this waitlist and all its entries?')) return
    await supabase.from('waitlists').delete().eq('id', id)
    flash('Waitlist deleted'); load()
  }

  const deleteEntry = async id => {
    await supabase.from('waitlist_entries').delete().eq('id', id)
    setEntries(e => e.filter(x => x.id !== id))
  }

  const exportCSV = () => {
    if (!entries.length) return
    const keys = Object.keys(entries[0].data)
    const header = [...keys, 'Signed up'].join(',')
    const rows = entries.map(e => [...keys.map(k => `"${(e.data[k] || '').toString().replace(/"/g, '""')}"`), new Date(e.created_at).toLocaleString()].join(','))
    const csv = [header, ...rows].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `${viewing?.slug || 'waitlist'}-entries.csv`
    a.click()
  }

  // Field builder helpers
  const addField = () => setForm(f => ({ ...f, fields: [...f.fields, { key: `field_${Date.now()}`, label: 'New Field', type: 'text', required: false }] }))
  const removeField = idx => setForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }))
  const updateField = (idx, key, val) => setForm(f => ({ ...f, fields: f.fields.map((field, i) => i === idx ? { ...field, [key]: val } : field) }))

  const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://mobtechsynergies.com'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Waitlists</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>Create signup pages for product launches, early access, and more</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Create Waitlist</button>
      </div>

      {msg && <div className="ws-msg">{msg}</div>}
      {err && <div className="ws-err">{err}</div>}

      {loading ? <div className="ws-empty"><div className="ws-empty-icon">◬</div>Loading...</div>
        : waitlists.length === 0 ? (
          <div className="ws-empty">
            <div className="ws-empty-icon">◬</div>
            No waitlists yet — create one for VMS, Gacom, or any product launch
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {waitlists.map(w => (
              <div key={w.id} className="ws-card" style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em', color: '#F0F4FF' }}>{w.name}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 2, background: w.is_open ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: w.is_open ? '#10B981' : '#EF4444', border: `1px solid ${w.is_open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                        {w.is_open ? '● Open' : '○ Closed'}
                      </span>
                      {w.brands && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: w.brands.color }}>{w.brands.icon} {w.brands.name}</span>}
                    </div>
                    {w.description && <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', marginBottom: 8 }}>{w.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#00C8FF', background: 'rgba(0,200,255,0.06)', padding: '3px 10px', borderRadius: 2 }}>
                        /waitlist/{w.slug}
                      </code>
                      <button onClick={() => navigator.clipboard?.writeText(`${SITE}/waitlist/${w.slug}`).then(() => flash('Link copied!'))}
                        style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
                        Copy Link ↗
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <button onClick={() => viewEntries(w)}
                      style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.25)', color: '#00C8FF', borderRadius: 2, cursor: 'pointer' }}>
                      View Signups
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 12px' }} onClick={() => openEdit(w)}>Edit</button>
                      <button className="btn-ghost" style={{ fontSize: '9px', padding: '7px 12px', color: w.is_open ? '#F59E0B' : '#10B981', borderColor: w.is_open ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)' }} onClick={() => toggleOpen(w)}>
                        {w.is_open ? 'Close' : 'Open'}
                      </button>
                      <button className="btn-danger" style={{ fontSize: '9px', padding: '7px 12px' }} onClick={() => remove(w.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* ENTRIES MODAL */}
      {viewing && (
        <div className="ws-modal-overlay" onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className="ws-modal" style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div className="ws-modal-title" style={{ marginBottom: 0 }}>{viewing.name} — Signups ({entries.length})</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {entries.length > 0 && (
                  <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={exportCSV}>Export CSV ↓</button>
                )}
                <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => setViewing(null)}>Close</button>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="ws-empty"><div className="ws-empty-icon">◬</div>No signups yet — share the link to start collecting</div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {entries.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(0,200,255,0.05)', flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)', width: 24, flexShrink: 0, paddingTop: 2 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {Object.entries(e.data).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 80 }}>{k}</span>
                          <span style={{ fontSize: 13, color: '#F0F4FF' }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)', marginTop: 6 }}>
                        {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(e.id)} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(239,68,68,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {editing && (
        <div className="ws-modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="ws-modal" style={{ maxWidth: 680 }}>
            <div className="ws-modal-title">{editing === 'new' ? 'Create Waitlist' : `Edit — ${editing.name}`}</div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Waitlist Name *</label>
                <input className="ws-input" value={form.name} placeholder="e.g. VMS Early Access"
                  onChange={e => setForm({ ...form, name: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} />
              </div>
              <div>
                <label className="ws-label">URL Slug * — /waitlist/...</label>
                <input className="ws-input" value={form.slug} placeholder="e.g. vms-early-access"
                  onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
            </div>

            <div className="ws-form-row">
              <div>
                <label className="ws-label">Brand</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">Mobtech (General)</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20 }}>
                <label className="ws-label" style={{ margin: 0 }}>Open for signups</label>
                <div onClick={() => setForm({ ...form, is_open: !form.is_open })}
                  style={{ width: 48, height: 26, borderRadius: 13, background: form.is_open ? '#00C8FF' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.is_open ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Description</label>
              <textarea className="ws-input" value={form.description} rows={2} placeholder="What is this waitlist for? Shown on the signup page."
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="ws-form-full">
              <label className="ws-label">Thank You Message</label>
              <input className="ws-input" value={form.thank_you_message} placeholder="Message shown after signup"
                onChange={e => setForm({ ...form, thank_you_message: e.target.value })} />
            </div>

            {/* FIELD BUILDER */}
            <div className="ws-form-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="ws-label" style={{ margin: 0 }}>Form Fields</label>
                <button onClick={addField} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: '#00C8FF', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 2, padding: '5px 14px', cursor: 'pointer' }}>
                  + Add Field
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.fields.map((field, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 3 }}>
                    <input className="ws-input" value={field.label} placeholder="Field Label"
                      onChange={e => updateField(idx, 'label', e.target.value)}
                      style={{ fontSize: 12 }} />
                    <select className="ws-input" value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} style={{ fontSize: 12 }}>
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} style={{ cursor: 'pointer' }} />
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.4)' }}>Req</span>
                    </div>
                    {/* drag handle placeholder */}
                    <span style={{ color: 'rgba(240,244,255,0.2)', fontSize: 12, cursor: 'grab' }}>⠿</span>
                    <button onClick={() => removeField(idx)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* PREVIEW URL */}
            {form.slug && (
              <div style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.1)', borderRadius: 3, padding: '10px 14px', marginTop: 8 }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.5)', marginBottom: 3 }}>Public URL</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#00C8FF' }}>
                  {SITE}/waitlist/{form.slug}
                </div>
              </div>
            )}

            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : editing === 'new' ? 'Create Waitlist' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
