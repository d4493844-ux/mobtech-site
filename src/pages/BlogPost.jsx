import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/layout/SEO'
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
      .eq('slug', slug).eq('published', true).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPost(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <><Navbar /><div className={styles.loading}>Loading...</div></>
  if (notFound) return (
    <>
      <SEO title="Post Not Found" />
      <Navbar />
      <div className={styles.notFound}>
        <div className={styles.nfCode}>404</div>
        <div className={styles.nfTitle}>Post not found</div>
        <Link to="/blog" className="btn-primary" style={{ display:'inline-block', marginTop:24, textDecoration:'none' }}>← Back to Blog</Link>
      </div>
    </>
  )

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: 'Akinyemi Akinjide Samuel',
      url: 'https://mobtechsynergies.com/#founder'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mobtech Synergies Ltd',
      logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://mobtechsynergies.com/blog/${post.slug}` }
  }

  return (
    <>
      <SEO title={post.title} description={post.excerpt} image={post.cover_image} url={`/blog/${post.slug}`} type="article" schema={blogSchema} />
      <Navbar />
      <article className={styles.article} itemScope itemType="https://schema.org/BlogPosting">
        {post.cover_image && (
          <div className={styles.cover}>
            <img src={post.cover_image} alt={post.title} itemProp="image" />
          </div>
        )}
        <div className={styles.inner}>
          <div className={styles.meta}>
            <Link to="/blog" className={styles.back}>← Blog</Link>
            <span className={styles.date} itemProp="datePublished" content={post.created_at}>
              {new Date(post.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
            </span>
          </div>
          <h1 className={styles.title} itemProp="headline">{post.title}</h1>
          {post.excerpt && <p className={styles.excerpt} itemProp="description">{post.excerpt}</p>}
          <div className={styles.divider} />
          <div className={styles.content} itemProp="articleBody" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
      <Footer />
    </>
  )
}
