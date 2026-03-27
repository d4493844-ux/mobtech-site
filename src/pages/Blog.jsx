import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/layout/SEO'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Blog.module.css'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('blog_posts').select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  return (
    <>
      <SEO
        title="Blog — Engineering Insights & Updates"
        description="Engineering insights, product updates, tech innovation stories, and ideas from the Mobtech Synergies team. Gacom, VMS, and the future of African tech."
        url="/blog"
        type="blog"
      />
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
                {p.cover_image && <img src={p.cover_image} alt={p.title} className={styles.cardImg} width="400" height="200" />}
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
