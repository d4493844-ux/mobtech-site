import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>MOB<span>TECH</span> SYNERGIES LTD</div>
          <p className={styles.tagline}>// Transforming Ideas Digital</p>
        </div>
        <div className={styles.cols}>
          <div className={styles.col}>
            <div className={styles.colTitle}>Company</div>
            <button onClick={() => scrollTo('about')}>About</button>
            <button onClick={() => scrollTo('team')}>Team</button>
            <button onClick={() => scrollTo('services')}>Services</button>
          </div>
          <div className={styles.col}>
            <div className={styles.colTitle}>Products</div>
            <button onClick={() => scrollTo('products')}>Gacom</button>
            <button onClick={() => scrollTo('products')}>VMS</button>
            <button onClick={() => scrollTo('products')}>Triangle Engine</button>
          </div>
          <div className={styles.col}>
            <div className={styles.colTitle}>Connect</div>
            <Link to="/blog">Blog</Link>
            <button onClick={() => scrollTo('contact')}>Contact</button>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span className={styles.copy}>© 2025 Mobtech Synergies Ltd — Built in Africa, Wired for the World</span>
        <Link to="/admin/login" className={styles.adminLink}>Admin</Link>
      </div>
    </footer>
  )
}
