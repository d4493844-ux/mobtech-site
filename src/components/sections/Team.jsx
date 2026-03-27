import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Team.module.css'

const FALLBACK = [
  { id: 1, name: 'Akinyemi Akinjide', role: 'Founder & CEO', department: 'Leadership' },
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('team_members')
      .select('*')
      .order('display_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setMembers(data)
        setLoading(false)
      })
  }, [])

  // Group by department
  const departments = [...new Set(members.map(m => m.department || 'General'))]

  return (
    <section id="team" className="section-wrap">
      <div className="sec-pre">// 05 — Team</div>
      <div className="sec-h">THE BUILDERS</div>
      <div className="divider" />

      {departments.map(dept => (
        <div key={dept} className={styles.deptGroup}>
          <div className={styles.deptLabel}>{dept}</div>
          <div className={styles.grid}>
            {members.filter(m => (m.department || 'General') === dept).map(m => (
              <div key={m.id} className={styles.card}>
                {m.image_url
                  ? <img src={m.image_url} alt={m.name} className={styles.avatar} />
                  : <div className={styles.avatarText}>{initials(m.name)}</div>
                }
                <div className={styles.name}>{m.name}</div>
                <div className={styles.role}>{m.role}</div>
                {m.bio && <div className={styles.bio}>{m.bio}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
