import { useEffect, useRef } from 'react'
import styles from './Hero.module.css'

export default function Hero() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const W = canvas.width, H = canvas.height
      ctx.fillStyle = '#060E18'
      ctx.fillRect(0, 0, W, H)
      // Navy ink blob — top right
      const g1 = ctx.createRadialGradient(W*0.88, -H*0.08, 0, W*0.88, -H*0.08, W*0.72)
      g1.addColorStop(0, 'rgba(11,30,45,1)')
      g1.addColorStop(0.35, 'rgba(9,24,36,0.75)')
      g1.addColorStop(0.65, 'rgba(6,14,24,0.35)')
      g1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
      // Secondary bloom bottom-left
      const g2 = ctx.createRadialGradient(0, H, 0, 0, H, W*0.5)
      g2.addColorStop(0, 'rgba(11,30,45,0.6)')
      g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)
      // Cyan rim top-right
      const g3 = ctx.createRadialGradient(W, 0, 0, W, 0, W*0.4)
      g3.addColorStop(0, 'rgba(0,200,255,0.06)')
      g3.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H)
      // Bottom separator
      ctx.beginPath(); ctx.moveTo(0, H-1); ctx.lineTo(W, H-1)
      ctx.strokeStyle = 'rgba(0,200,255,0.08)'; ctx.lineWidth = 1; ctx.stroke()
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className={styles.hero} id="hero" aria-label="Mobtech Synergies hero">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Logo lockup — centered */}
        <div className={styles.logoWrap}>
          <img
            src="https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg"
            alt="Mobtech Synergies Ltd Logo"
            className={styles.logoImg}
            width="80" height="80"
          />
        </div>

        <div className={styles.badge}>
          <span className={styles.dot} />
          MOBTECH SYNERGIES LTD — EST. 2021
        </div>

        <h1 className={styles.h1}>
          BUILD SYSTEMS.<br />
          <span className={styles.accent}>NOT NOISE.</span>
        </h1>

        <p className={styles.tagline}>// Transforming Ideas Digital</p>

        <p className={styles.sub}>
          We engineer transformative technology systems at the intersection of software,
          platform engineering, and advanced mechanical innovation.
          Built in Africa. Wired for the world.
        </p>

        <div className={styles.btns}>
          <button className="btn-primary" onClick={() => scrollTo('products')}>Explore Products</button>
          <button className="btn-ghost" onClick={() => scrollTo('contact')}>Get In Touch →</button>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statN}>3+</div>
            <div className={styles.statL}>Core Products</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statN}>NG</div>
            <div className={styles.statL}>Founded in Nigeria</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statN}>∞</div>
            <div className={styles.statL}>Systems Thinking</div>
          </div>
        </div>
      </div>
    </section>
  )
}
