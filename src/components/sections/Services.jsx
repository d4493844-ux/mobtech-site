import styles from './Services.module.css'

const services = [
  { num: '01', title: 'Software Systems', desc: 'End-to-end scalable software products powering businesses, communities, and digital ecosystems.' },
  { num: '02', title: 'Platform Engineering', desc: 'Designing and deploying platforms that connect users, enable interactions, and create economic opportunity.' },
  { num: '03', title: 'Market Infrastructure', desc: 'Digital marketplace architecture redefining trade, commerce, and value exchange in a digital-first world.' },
  { num: '04', title: 'Mechanical Innovation', desc: 'Hardware and engineering design — a rare convergence of digital precision and physical performance.' },
]

export default function Services() {
  return (
    <section id="services" className="section-wrap">
      <div className="sec-pre">// 04 — Services</div>
      <div className="sec-h">HOW WE OPERATE</div>
      <div className="divider" />
      <div className={styles.grid}>
        {services.map((s) => (
          <div key={s.num} className={styles.item}>
            <div className={styles.num}>{s.num}</div>
            <div className={styles.title}>{s.title}</div>
            <div className={styles.desc}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
