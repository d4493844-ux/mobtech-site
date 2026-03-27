import styles from './Products.module.css'

const products = [
  {
    id: 'PRODUCT-001 // PLATFORM',
    name: 'GACOM',
    line: 'Global Gaming Community Platform',
    desc: 'A digital ecosystem connecting gamers across continents — competitions, communities, and monetisation infrastructure built for the creator economy of gaming.',
    tags: ['Platform', 'Gaming', 'Community', 'Monetisation'],
  },
  {
    id: 'PRODUCT-002 // MARKETPLACE',
    name: 'VMS',
    line: 'Virtual Market Space',
    desc: 'A revolutionary digital marketplace dismantling physical barriers to trade. Seamless buyer-seller interaction in a fully virtual environment — redefining how commerce moves.',
    tags: ['E-Commerce', 'Digital Trade', 'Market Infra'],
  },
  {
    id: 'PRODUCT-003 // ENGINEERING',
    name: 'TRIANGLE ENGINE',
    line: 'Proprietary Mechanical Innovation',
    desc: 'A proprietary engine design advancing compact, efficient, next-generation mobility — proof that Mobtech builds in every dimension, from code to metal.',
    tags: ['Mechanical', 'Hardware', 'Mobility', 'R&D'],
  },
]

export default function Products() {
  return (
    <section id="products" className="section-wrap">
      <div className="sec-pre">// 03 — Products</div>
      <div className="sec-h">WHAT WE BUILD</div>
      <div className="divider" />
      <div className={styles.grid}>
        {products.map((p) => (
          <div key={p.name} className={styles.card}>
            <div className={styles.pid}>{p.id}</div>
            <div className={styles.name}>{p.name}</div>
            <div className={styles.line}>{p.line}</div>
            <div className={styles.desc}>{p.desc}</div>
            <div className={styles.tags}>
              {p.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
