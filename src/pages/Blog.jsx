import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Blog.module.css'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className="sec-pre">// Insights & Updates</div>
          <div className="sec-h">THE BLOG</div>
          <div className="divider" />
          <p className={styles.heroSub}>Engineering insights, product updates, and ideas from the Mobtech team.</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>No posts published yet. Check back soon.</div>
        ) : (
          <div className={styles.grid}>
            {posts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className={styles.card}>
                {p.cover_image && <img src={p.cover_image} alt={p.title} className={styles.cardImg} />}
                <div className={styles.cardBody}>
                  <div className={styles.cardDate}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className={styles.cardTitle}>{p.title}</div>
                  {p.excerpt && <div className={styles.cardExcerpt}>{p.excerpt}</div>}
                  <div className={styles.cardLink}>Read more →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
