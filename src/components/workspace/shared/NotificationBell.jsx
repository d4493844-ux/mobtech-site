import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { timeAgoChat } from '../../../lib/chat'

const TYPE_ICONS = { message: '💬', task: '◻', announcement: '◬', system: '⬡' }
const TYPE_COLORS = { message: '#00C8FF', task: '#F59E0B', announcement: '#EF4444', system: '#10B981' }

export default function NotificationBell({ employeeId, isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  const load = async () => {
    if (!supabase || !employeeId) return
    const { data } = await supabase.from('notifications')
      .select('*').eq('employee_id', employeeId)
      .order('created_at', { ascending: false }).limit(30)
    setNotifications(data || [])
    setUnread((data || []).filter(n => !n.is_read).length)
  }

  useEffect(() => {
    load()
    if (!supabase || !employeeId) return
    const channel = supabase.channel(`notifs_${employeeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `employee_id=eq.${employeeId}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
        setUnread(u => u + 1)
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title, {
            body: payload.new.body || '',
            icon: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'
          })
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [employeeId])

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!supabase) return
    await supabase.from('notifications').update({ is_read: true }).eq('employee_id', employeeId).eq('is_read', false)
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    setUnread(0)
  }

  const markRead = async (id) => {
    if (!supabase) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  const requestPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); requestPermission() }}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 3, transition: 'background 0.15s', color: unread > 0 ? '#00C8FF' : 'rgba(240,244,255,0.4)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320, background: '#0B1E2D', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 4, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: '#F0F4FF' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>
                No notifications yet
              </div>
            ) : notifications.map(n => (
              <div key={n.id}
                onClick={() => markRead(n.id)}
                style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.04)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(0,200,255,0.03)', transition: 'background 0.15s' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${TYPE_COLORS[n.type]}18`, border: `1px solid ${TYPE_COLORS[n.type]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {TYPE_ICONS[n.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: n.is_read ? 'rgba(240,244,255,0.5)' : '#F0F4FF', marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)', marginTop: 4 }}>{timeAgoChat(n.created_at)}</div>
                </div>
                {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C8FF', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
