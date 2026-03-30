import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'

const LOGO = 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'

export default function WaitlistPage() {
  const { slug } = useParams()
  const [waitlist, setWaitlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [closed, setClosed] = useState(false)
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.from('waitlists').select('*,brands(name,color,icon)')
      .eq('slug', slug).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        if (!data.is_open) { setClosed(true) }
        setWaitlist(data)
        // Init form data
        const init = {}
        ;(data.fields || []).forEach(f => { init[f.key] = '' })
        setFormData(init)
        setLoading(false)
      })
  }, [slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Validate required
    const fields = waitlist.fields || []
    for (const field of fields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`${field.label} is required`)
        return
      }
    }
    setSubmitting(true)
    const { error: err } = await supabase.from('waitlist_entries').insert([{
      waitlist_id: waitlist.id,
      data: formData
    }])
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    setSubmitted(true)
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'rgba(240,244,255,0.3)' }}>Loading...</div>
      </div>
    </>
  )

  if (notFound) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 80, color: 'rgba(0,200,255,0.1)', lineHeight: 1 }}>404</div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'rgba(240,244,255,0.35)', marginTop: 12 }}>Waitlist not found</div>
        <Link to="/" className="btn-primary" style={{ marginTop: 24, display: 'inline-block', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    </>
  )

  return (
    <>
      <SEO title={waitlist.name} description={waitlist.description} url={`/waitlist/${slug}`} />
      <Navbar />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 60px', background: '#060E18' }}>

        {/* BACKGROUND CANVAS EFFECT */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 80% 10%, rgba(11,30,45,0.95) 0%, rgba(6,14,24,0) 60%), radial-gradient(ellipse at 20% 90%, rgba(11,30,45,0.5) 0%, rgba(6,14,24,0) 50%)'
        }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

          {/* BRAND HEADER */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <img src={LOGO} alt="Mobtech" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(0,200,255,0.2)', objectFit: 'cover' }} />
              {waitlist.brands && (
                <>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.25)' }}>×</div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: waitlist.brands.color, letterSpacing: '0.06em' }}>
                    {waitlist.brands.icon} {waitlist.brands.name}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: closed ? 'rgba(239,68,68,0.6)' : 'rgba(0,200,255,0.6)', border: `1px solid ${closed ? 'rgba(239,68,68,0.2)' : 'rgba(0,200,255,0.2)'}`, padding: '5px 14px', borderRadius: 2, marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: closed ? '#EF4444' : '#00C8FF', display: 'block' }} />
              {closed ? 'Waitlist Closed' : 'Waitlist Open'}
            </div>

            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(32px, 6vw, 52px)', letterSpacing: '0.03em', color: '#F0F4FF', lineHeight: 1, marginBottom: 14 }}>
              {waitlist.name}
            </h1>

            {waitlist.description && (
              <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.5)', lineHeight: 1.75, maxWidth: 420, margin: '0 auto' }}>
                {waitlist.description}
              </p>
            )}
          </div>

          {/* FORM CARD */}
          <div style={{ background: '#0B1E2D', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 4, padding: '32px 28px' }}>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: '0.04em', color: '#10B981', marginBottom: 12 }}>You're In!</div>
                <div style={{ fontSize: 14, color: 'rgba(240,244,255,0.55)', lineHeight: 1.7 }}>{waitlist.thank_you_message}</div>
                <Link to="/" style={{ display: 'inline-block', marginTop: 24, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.6)', textDecoration: 'none' }}>
                  ← Back to Mobtech
                </Link>
              </div>
            ) : closed ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.3 }}>○</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.04em', color: '#EF4444', marginBottom: 10 }}>This Waitlist is Closed</div>
                <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', lineHeight: 1.7 }}>Signups are not currently open. Check back later or visit our homepage for updates.</div>
                <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>Back to Mobtech</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {(waitlist.fields || []).map(field => (
                  <div key={field.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.55)', display: 'block', marginBottom: 6 }}>
                      {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="admin-input"
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        rows={3}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        className="admin-input"
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 3, padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#EF4444', marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={submitting}>
                  {submitting ? 'Joining...' : 'Join Waitlist →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(240,244,255,0.2)', letterSpacing: '0.08em' }}>
                  By joining you agree to receive updates from Mobtech Synergies Ltd
                </div>
              </form>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(240,244,255,0.2)', textDecoration: 'none' }}>
              MOBTECH SYNERGIES LTD
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
