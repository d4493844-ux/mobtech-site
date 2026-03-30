import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { pushNotify } from '../../../lib/chat'
import { timeAgo } from '../../../lib/workspace'

export default function NotificationBell({ employee, isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const panelRef = useRef(null)
  const prevCountRef = useRef(0)

  const load = async () => {
    if (!supabase) return
    const query = isAdmin
      ? supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30)
      : supabase.from('notifications').select('*').eq('employee_id', employee?.id).order('created_at', { ascending: false }).limit(30)
    const { data } = await query
    const notifs = data || []
    setNotifications(notifs)
    setUnread(notifs.filter(n => !n.is_read).length)
  }

  useEffect(() => {
    load()
    if (!supabase) return

    // Realtime subscription
    const channel = supabase.channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        ...((!isAdmin && employee?.id) ? { filter: `employee_id=eq.${employee.id}` } : {})
      }, (payload) => {
        const n = payload.new
        setNotifications(prev => [n, ...prev])
        setUnread(prev => prev + 1)
        // Browser push
        pushNotify(n.title, n.body || '')
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [employee?.id])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!supabase) return
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const TYPE_ICON = { message: '💬', task: '◻', announcement: '◬', mention: '@' }
  const TYPE_COLOR = { message: '#00C8FF', task: '#F59E0B', announcement: '#10B981', mention: '#A78BFA' }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, transition: 'background 0.15s', color: unread > 0 ? '#00C8FF' : 'rgba(240,244,255,0.4)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#fff', fontWeight: 700, border: '2px solid #060E18' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 340, background: '#0B1E2D', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 300, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: '#F0F4FF' }}>Notifications {unread > 0 && <span style={{ color: '#EF4444' }}>({unread})</span>}</div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>
                No notifications yet
              </div>
            ) : notifications.map(n => (
              <div key={n.id}
                onClick={() => markRead(n.id)}
                style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.04)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(0,200,255,0.03)', transition: 'background 0.15s' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${TYPE_COLOR[n.type]}20`, border: `1px solid ${TYPE_COLOR[n.type]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: TYPE_COLOR[n.type] }}>
                  {TYPE_ICON[n.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: n.is_read ? 'rgba(240,244,255,0.55)' : '#F0F4FF', marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', lineHeight: 1.5, marginBottom: 3 }}>{n.body}</div>}
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)' }}>{timeAgo(n.created_at)}</div>
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
