import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './AdminBlog.module.css'

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const togglePublish = async (post) => {
    const { error } = await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id)
    if (!error) { flash(post.published ? 'Post unpublished.' : 'Post published!'); load() }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    flash('Post deleted.')
    load()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.pageTitle}>Blog Posts</div>
          <div className={styles.pageSub}>Write, edit, and publish posts to the public blog</div>
        </div>
        <Link to="/admin/blog/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '10px', padding: '12px 24px' }}>
          + New Post
        </Link>
      </div>

      {msg && <div className={styles.msg}>{msg}</div>}

      {loading ? (
        <div className={styles.loading}>Loading posts...</div>
      ) : (
        <div className={styles.list}>
          {posts.map(p => (
            <div key={p.id} className={styles.row}>
              <div className={styles.rowInfo}>
                <div className={styles.rowTitle}>{p.title}</div>
                <div className={styles.rowMeta}>
                  <span className={styles.slug}>/{p.slug}</span>
                  <span>·</span>
                  <span>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className={`${styles.badge} ${p.published ? styles.published : styles.draft}`}>
                {p.published ? 'Published' : 'Draft'}
              </div>
              <div className={styles.rowActions}>
                <button className="btn-ghost" style={{ fontSize: '9px', padding: '8px 14px' }} onClick={() => togglePublish(p)}>
                  {p.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link to={`/admin/blog/edit/${p.id}`} className="btn-ghost" style={{ fontSize: '9px', padding: '8px 14px', textDecoration: 'none', display: 'inline-block' }}>
                  Edit
                </Link>
                <button className="btn-danger" style={{ fontSize: '9px', padding: '8px 14px' }} onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className={styles.empty}>No posts yet. Click "+ New Post" to start writing.</div>
          )}
        </div>
      )}
    </div>
  )
}
