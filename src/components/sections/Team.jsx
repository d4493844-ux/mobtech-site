import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Team.module.css'

const FALLBACK = [
  { id: 1, name: 'Akinyemi Akinjide Samuel', role: 'Founder & CEO', department: 'Leadership', image_url: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg', bio: 'Self-built entrepreneur and systems thinker. Started from Bells University of Technology, built websites to survive, and evolved into designing digital ecosystems. Author of The Power of Debt and Business Models. Driving Africa\'s tech transformation through purpose-built innovation.' },
  { id: 2, name: 'Odusote Oluwaseyi', role: 'General Manager', department: 'Leadership' },
  { id: 3, name: 'All Well Brown Tamunoibi', role: 'Assistant General Manager', department: 'Leadership' },
  { id: 4, name: 'Henshaw John', role: 'Managing Director', department: 'Gacom' },
  { id: 5, name: 'Henshaw James', role: 'Assistant Managing Director', department: 'Gacom' },
]

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Team() {
  const [members, setMembers] = useState(FALLBACK)

  useEffect(() => {
    if (!supabase) return
    supabase.from('team_members').select('*').order('display_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setMembers(data)
      })
  }, [])

  const founder = members.find(m => m.display_order === 1 || m.name?.includes('Akinyemi')) || members[0]
  const rest = members.filter(m => m.id !== founder.id)
  const departments = [...new Set(rest.map(m => m.department || 'General'))]

  return (
    <section id="team" className="section-wrap" itemScope itemType="https://schema.org/Organization">
      <div className="sec-pre">// 05 — Team</div>
      <div className="sec-h">THE BUILDERS</div>
      <div className="divider" />

      {/* FOUNDER SPOTLIGHT */}
      <div className={styles.founder} itemScope itemType="https://schema.org/Person">
        <div className={styles.founderImg}>
          {founder.image_url
            ? <img src={founder.image_url} alt={`${founder.name} - ${founder.role} at Mobtech Synergies Ltd`} itemProp="image" width="220" height="220" />
            : <div className={styles.founderInitials}>{initials(founder.name)}</div>
          }
          <div className={styles.founderBadge}>Founder</div>
        </div>
        <div className={styles.founderInfo}>
          <div className={styles.founderPre}>// Visionary Behind Mobtech</div>
          <h2 className={styles.founderName} itemProp="name">{founder.name}</h2>
          <div className={styles.founderRole} itemProp="jobTitle">{founder.role}</div>
          <p className={styles.founderBio} itemProp="description">{founder.bio}</p>
          <div className={styles.founderTags}>
            <span>Systems Thinker</span>
            <span>Author</span>
            <span>Engineer</span>
            <span>Built in Nigeria</span>
          </div>
        </div>
      </div>

      {/* REST OF TEAM */}
      {departments.map(dept => (
        <div key={dept} className={styles.deptGroup}>
          <div className={styles.deptLabel}>{dept}</div>
          <div className={styles.grid}>
            {rest.filter(m => (m.department || 'General') === dept).map(m => (
              <div key={m.id} className={styles.card} itemScope itemType="https://schema.org/Person">
                {m.image_url
                  ? <img src={m.image_url} alt={`${m.name} - ${m.role}`} className={styles.avatar} itemProp="image" width="60" height="60" />
                  : <div className={styles.avatarText}>{initials(m.name)}</div>
                }
                <div className={styles.name} itemProp="name">{m.name}</div>
                <div className={styles.role} itemProp="jobTitle">{m.role}</div>
                {m.bio && <div className={styles.bio} itemProp="description">{m.bio}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
