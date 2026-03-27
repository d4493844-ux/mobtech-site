import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './BlogPost.module.css'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!supabase) { setNotFound(true); setLoading(false); return }
    supabase.from('blog_posts').select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPost(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <><Navbar /><div className={styles.loading}>Loading post...</div></>

  if (notFound) return (
    <>
      <Navbar />
      <div className={styles.notFound}>
        <div className={styles.nfCode}>404</div>
        <div className={styles.nfTitle}>Post not found</div>
        <Link to="/blog" className="btn-primary" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>
          ← Back to Blog
        </Link>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <article className={styles.article}>
        {post.cover_image && (
          <div className={styles.cover}>
            <img src={post.cover_image} alt={post.title} />
          </div>
        )}
        <div className={styles.inner}>
          <div className={styles.meta}>
            <Link to="/blog" className={styles.back}>← Blog</Link>
            <span className={styles.date}>
              {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
          <div className={styles.divider} />
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
      <Footer />
    </>
  )
}
