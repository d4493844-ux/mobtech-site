import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { supabase } from '../../lib/supabase'
import styles from './AdminBlogEdit.module.css'

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminBlogEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', cover_image: '', published: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(!isNew)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: '',
    editorProps: {
      attributes: { class: styles.editorArea }
    }
  })

  useEffect(() => {
    if (!isNew && id) {
      supabase.from('blog_posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({ title: data.title, slug: data.slug, excerpt: data.excerpt || '', cover_image: data.cover_image || '', published: data.published })
          editor?.commands.setContent(data.content || '')
        }
        setLoading(false)
      })
    }
  }, [id, editor])

  const handleTitleChange = (e) => {
    const title = e.target.value
    setForm(f => ({ ...f, title, slug: isNew ? slugify(title) : f.slug }))
  }

  const save = async (publish = null) => {
    setSaving(true)
    const content = editor?.getHTML() || ''
    const payload = {
      ...form,
      content,
      published: publish !== null ? publish : form.published,
      updated_at: new Date().toISOString()
    }

    let error
    if (isNew) {
      const res = await supabase.from('blog_posts').insert([payload])
      error = res.error
    } else {
      const res = await supabase.from('blog_posts').update(payload).eq('id', id)
      error = res.error
    }

    setSaving(false)
    if (!error) {
      setMsg(isNew ? 'Post created!' : 'Post saved!')
      setTimeout(() => navigate('/admin/blog'), 1200)
    } else {
      setMsg('Error: ' + error.message)
    }
  }

  if (loading) return <div className={styles.loading}>Loading post...</div>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => navigate('/admin/blog')}>
          ← Back
        </button>
        <div className={styles.headerTitle}>{isNew ? 'New Post' : 'Edit Post'}</div>
        <div className={styles.headerActions}>
          <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 16px' }} onClick={() => save(false)} disabled={saving}>
            Save Draft
          </button>
          <button className="btn-primary" style={{ fontSize: '9px', padding: '9px 20px' }} onClick={() => save(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {msg && <div className={styles.msg}>{msg}</div>}

      <div className={styles.body}>
        <div className={styles.main}>
          <input
            className={styles.titleInput}
            placeholder="Post title..."
            value={form.title}
            onChange={handleTitleChange}
          />

          {/* Toolbar */}
          {editor && (
            <div className={styles.toolbar}>
              {[
                { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
                { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
                { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
                { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
                { label: '— ', action: () => editor.chain().focus().setHorizontalRule().run() },
                { label: '• List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
                { label: '1. List', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
                { label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
                { label: 'Code', action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
              ].map((btn, i) => (
                <button key={i} className={`${styles.toolBtn} ${btn.active ? styles.toolActive : ''}`} onClick={btn.action} type="button">
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          <EditorContent editor={editor} className={styles.editor} />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <label className="admin-label">Slug (URL)</label>
            <input className="admin-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="post-url-slug" />
          </div>
          <div className={styles.sideSection}>
            <label className="admin-label">Excerpt</label>
            <textarea className="admin-input" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description..." rows={3} />
          </div>
          <div className={styles.sideSection}>
            <label className="admin-label">Cover Image URL</label>
            <input className="admin-input" value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} placeholder="https://..." />
            {form.cover_image && <img src={form.cover_image} alt="" className={styles.coverPreview} />}
          </div>
        </div>
      </div>
    </div>
  )
}
