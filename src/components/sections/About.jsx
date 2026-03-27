import styles from './About.module.css'

const cards = [
  { title: 'Vision', body: "Drive Africa's transformation through science, technology, and engineering innovation — building systems that are globally competitive, locally rooted." },
  { title: 'Mission', body: 'Solve real-world challenges through scalable systems. Unlock the full potential of African creativity and ingenuity. Build solutions that outlast trends.' },
  { title: 'Philosophy', body: '"Build systems, not noise." Long-term impact over short-term hype. Innovation driven by purpose — not imitation, not noise, not surface-level aesthetics.' },
  { title: 'Approach', body: 'Multi-dimensional: software + marketplace systems + hardware engineering. Original products. African problems, global solutions. One unified ecosystem.' },
]

export default function About() {
  return (
    <section id="about" className="section-wrap">
      <div className="sec-pre">// 02 — About</div>
      <div className="sec-h">WHO WE ARE</div>
      <div className="divider" />
      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.title} className={styles.card}>
            <div className={styles.cardTitle}>{c.title}</div>
            <div className={styles.cardBody}>{c.body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
