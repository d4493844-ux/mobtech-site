import { useState } from 'react'
import styles from './Contact.module.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', category: 'General', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Wire up your email service (EmailJS, Resend, etc.) here
    console.log('Form submitted:', form)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
    setForm({ name: '', email: '', category: 'General', message: '' })
  }

  const info = [
    { label: 'Location', value: 'Lagos, Nigeria' },
    { label: 'Email', value: 'hello@mobtechsynergies.com' },
    { label: 'Status', value: '● Open to partnerships', highlight: true },
  ]

  return (
    <section id="contact" className="section-wrap">
      <div className="sec-pre">// 06 — Contact</div>
      <div className="sec-h">INITIATE CONTACT</div>
      <div className="divider" />
      <div className={styles.wrap}>
        <div className={styles.info}>
          {info.map(i => (
            <div key={i.label} className={styles.line}>
              <div className={styles.dot} />
              <div>
                <div className={styles.lbl}>{i.label}</div>
                <div className={styles.val} style={i.highlight ? { color: 'var(--cyan)' } : {}}>{i.value}</div>
              </div>
            </div>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formTitle}>SEND A TRANSMISSION</div>
          <div className={styles.formGrid}>
            <div>
              <label className="admin-label">Name</label>
              <input className="admin-input" placeholder="Your name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="admin-label">Email</label>
              <input className="admin-input" type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="admin-label">Category</label>
            <select className="admin-input" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>General</option>
              <option>Investor</option>
              <option>Partner</option>
              <option>Career</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="admin-label">Message</label>
            <textarea className="admin-input" placeholder="Your message..." rows={4} value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            {sent ? '✓ TRANSMISSION SENT' : 'SUBMIT INQUIRY'}
          </button>
        </form>
      </div>
    </section>
  )
}
