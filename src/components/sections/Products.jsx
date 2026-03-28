import styles from './Products.module.css'

const products = [
  {
    id: 'PRODUCT-001 // PLATFORM',
    name: 'GACOM',
    line: 'Global Gaming Community Platform',
    desc: 'A digital ecosystem connecting gamers across continents — competitions, communities, and monetisation infrastructure built for the creator economy of gaming.',
    tags: ['Platform', 'Gaming', 'Community', 'Monetisation'],
    image: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_3_a541nu.jpg',
  },
  {
    id: 'PRODUCT-002 // MARKETPLACE',
    name: 'VMS',
    line: 'Virtual Market Space',
    desc: 'A revolutionary digital marketplace dismantling physical barriers to trade. Seamless buyer-seller interaction in a fully virtual environment — redefining how commerce moves.',
    tags: ['E-Commerce', 'Digital Trade', 'Market Infra'],
    image: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774644613/WhatsApp_Image_2026-03-27_at_03.12.01_1_numxrq.jpg',
  },
  {
    id: 'PRODUCT-003 // ENGINEERING',
    name: 'TRIANGLE ENGINE',
    line: 'Proprietary Mechanical Innovation',
    desc: 'A proprietary engine design advancing compact, efficient, next-generation mobility — proof that Mobtech builds in every dimension, from code to metal.',
    tags: ['Mechanical', 'Hardware', 'Mobility', 'R&D'],
    image: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774644614/WhatsApp_Image_2026-03-27_at_03.12.01_2_kkooce.jpg',
  },
]

export default function Products() {
  return (
    <section id="products" className="section-wrap" itemScope itemType="https://schema.org/ItemList">
      <div className="sec-pre">// 03 — Products</div>
      <div className="sec-h">WHAT WE BUILD</div>
      <div className="divider" />
      <div className={styles.grid}>
        {products.map((p, i) => (
          <div key={p.name} className={styles.card} itemScope itemType="https://schema.org/Product" itemProp="itemListElement">
            <div className={styles.imgWrap}>
              <img
                src={p.image}
                alt={`${p.name} — ${p.line} by Mobtech Synergies Ltd`}
                className={styles.img}
                width="480" height="260"
                loading="lazy"
                itemProp="image"
              />
              <div className={styles.imgOverlay}>
                <div className={styles.pid}>{p.id}</div>
              </div>
            </div>
            <div className={styles.body}>
              <div className={styles.name} itemProp="name">{p.name}</div>
              <div className={styles.line}>{p.line}</div>
              <div className={styles.desc} itemProp="description">{p.desc}</div>
              <div className={styles.tags}>
                {p.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
