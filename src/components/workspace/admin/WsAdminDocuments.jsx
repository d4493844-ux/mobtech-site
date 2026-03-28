import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatBytes, timeAgo } from '../../../lib/workspace'

const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📋', pptx: '📋', jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', mp4: '🎥', zip: '🗜' }
const getIcon = (name = '') => { const ext = name.split('.').pop()?.toLowerCase(); return FILE_ICONS[ext] || '📁' }

export default function WsAdminDocuments() {
  const [docs, setDocs] = useState([])
  const [brands, setBrands] = useState([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', brand_id: '', shared_with_all: true })
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    const [docRes, brandRes] = await Promise.all([
      supabase.from('documents').select('*,brands(name,color)').order('created_at', { ascending: false }),
      supabase.from('brands').select('*')
    ])
    setDocs(docRes.data || [])
    setBrands(brandRes.data || [])
  }
  useEffect(() => { if (supabase) load() }, [])

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3500) }

  const upload = async () => {
    if (!file) return flash('Please select a file')
    if (!form.name) return flash('Please enter a document name')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `docs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from('workspace-docs').upload(path, file)
    if (uploadError) { setUploading(false); return flash('Upload error: ' + uploadError.message) }
    const { data: urlData } = supabase.storage.from('workspace-docs').getPublicUrl(path)
    const { error } = await supabase.from('documents').insert([{
      name: form.name, description: form.description,
      brand_id: form.brand_id || null,
      file_url: urlData.publicUrl,
      file_type: ext, file_size: file.size,
      shared_with_all: form.shared_with_all,
      uploaded_by: 'Admin'
    }])
    setUploading(false)
    if (!error) { flash('✓ Document uploaded'); setShowUpload(false); setFile(null); setForm({ name: '', description: '', brand_id: '', shared_with_all: true }); load() }
    else flash('Error: ' + error.message)
  }

  const remove = async (doc) => {
    if (!window.confirm('Delete this document?')) return
    const path = doc.file_url.split('/workspace-docs/')[1]
    if (path) await supabase.storage.from('workspace-docs').remove([path])
    await supabase.from('documents').delete().eq('id', doc.id)
    flash('Document deleted'); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.04em' }}>Documents</div>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>Upload and share files with your team</div>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>+ Upload Document</button>
      </div>
      {msg && <div className="ws-msg">{msg}</div>}

      {docs.length === 0 ? (
        <div className="ws-empty"><div className="ws-empty-icon">◫</div>No documents uploaded yet</div>
      ) : docs.map(d => (
        <div key={d.id} className="ws-doc">
          <div className="ws-doc-icon">{getIcon(d.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ws-doc-name">{d.name}</div>
            <div className="ws-doc-meta">
              {d.file_type?.toUpperCase()} {d.file_size ? `· ${formatBytes(d.file_size)}` : ''} · Uploaded {timeAgo(d.created_at)}
              {d.brands && ` · ${d.brands.name}`}
              {d.shared_with_all && ' · Shared with all'}
            </div>
            {d.description && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', marginTop: 3 }}>{d.description}</div>}
          </div>
          <div className="ws-doc-actions">
            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '9px', padding: '7px 14px', display: 'inline-block' }}>Download</a>
            <button className="btn-danger" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => remove(d)}>Delete</button>
          </div>
        </div>
      ))}

      {showUpload && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-title">Upload Document</div>
            <div className="ws-form-full">
              <label className="ws-label">Document Name *</label>
              <input className="ws-input" value={form.name} placeholder="e.g. Q1 Strategy Brief" onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="ws-form-full">
              <label className="ws-label">Description</label>
              <input className="ws-input" value={form.description} placeholder="Brief description..." onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="ws-form-row">
              <div>
                <label className="ws-label">Brand (optional)</label>
                <select className="ws-input" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                <input type="checkbox" id="shareAll" checked={form.shared_with_all} onChange={e => setForm({ ...form, shared_with_all: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="shareAll" className="ws-label" style={{ margin: 0, cursor: 'pointer' }}>Share with all employees</label>
              </div>
            </div>
            <div className="ws-form-full">
              <label className="ws-label">File *</label>
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '1px dashed rgba(0,200,255,0.25)', borderRadius: 3, padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,200,255,0.02)', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>◫</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(0,200,255,0.5)' }}>
                  {file ? file.name : 'Click to select file'}
                </div>
                {file && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', marginTop: 4 }}>{formatBytes(file.size)}</div>}
              </div>
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            </div>
            <div className="ws-modal-actions">
              <button className="btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn-primary" onClick={upload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
