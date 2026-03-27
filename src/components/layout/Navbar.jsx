import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const scrollTo = (id) => {
    setMenuOpen(false)
    if (location.pathname !== '/') { window.location.href = `/#${id}`; return }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
      <Link to="/" className={styles.brand} aria-label="Mobtech Synergies Home">
        <img src="https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg"
          alt="Mobtech Logo" width="32" height="32" className={styles.navLogo} />
        MOB<span>TECH</span>
      </Link>
      <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <button onClick={() => scrollTo('about')}>About</button>
        <button onClick={() => scrollTo('products')}>Products</button>
        <button onClick={() => scrollTo('services')}>Services</button>
        <button onClick={() => scrollTo('team')}>Team</button>
        <Link to="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
        <button onClick={() => scrollTo('contact')}>Contact</button>
      </div>
      <button className="btn-primary" style={{ fontSize:'9px', padding:'9px 20px' }} onClick={() => scrollTo('contact')}>Get In Touch</button>
      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
    </nav>
  )
}
