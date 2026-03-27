import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Hero.module.css'

export default function Hero() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const W = canvas.width, H = canvas.height

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      // Primary navy ink blob — top right
      const g1 = ctx.createRadialGradient(W * 0.88, -H * 0.08, 0, W * 0.88, -H * 0.08, W * 0.72)
      g1.addColorStop(0, 'rgba(8,25,80,0.98)')
      g1.addColorStop(0.35, 'rgba(5,16,52,0.65)')
      g1.addColorStop(0.65, 'rgba(2,8,28,0.3)')
      g1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, W, H)

      // Right edge navy bleed
      const g2 = ctx.createLinearGradient(W * 0.55, 0, W, 0)
      g2.addColorStop(0, 'rgba(0,0,0,0)')
      g2.addColorStop(1, 'rgba(6,18,60,0.45)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, W, H)

      // Faint cyan rim at top-right corner
      const g3 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.4)
      g3.addColorStop(0, 'rgba(0,200,255,0.04)')
      g3.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g3
      ctx.fillRect(0, 0, W, H)

      // Bottom separator line
      ctx.beginPath()
      ctx.moveTo(0, H - 1)
      ctx.lineTo(W, H - 1)
      ctx.strokeStyle = 'rgba(0,200,255,0.08)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className={styles.hero} id="hero">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          MOBTECH SYNERGIES LTD — EST. 2021
        </div>
        <h1 className={styles.h1}>
          BUILD SYSTEMS.<br />
          <span className={styles.accent}>NOT NOISE.</span>
          <span className={styles.tagline}>// Transforming Ideas Digital</span>
        </h1>
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
