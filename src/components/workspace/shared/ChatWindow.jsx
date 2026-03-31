import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { markRoomRead, notifyRoomMembers, timeAgoChat } from '../../../lib/chat'

export default function ChatWindow({ room, currentUser, isAdmin = false, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

  const loadMessages = async () => {
    if (!supabase) return
    const { data } = await supabase.from('chat_messages')
      .select('*').eq('room_id', room.id)
      .order('created_at', { ascending: true }).limit(100)
    setMessages(data || [])
    setLoading(false)
    scrollBottom()
    await markRoomRead(room.id, isAdmin ? null : currentUser?.id)
  }

  useEffect(() => {
    if (!supabase || !room) return
    setMessages([])
    setLoading(true)
    loadMessages()
    const channel = supabase.channel(`room_${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'chat_messages', filter: `room_id=eq.${room.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        scrollBottom()
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const msg = {
      room_id: room.id,
      sender_name: isAdmin ? 'Admin' : (currentUser?.full_name || 'Unknown'),
      sender_color: isAdmin ? '#00C8FF' : (currentUser?.avatar_color || '#00C8FF'),
      content: input.trim(),
      is_admin: isAdmin,
    }
    // Only add sender_id if it's a real UUID (not admin)
    if (!isAdmin && currentUser?.id) msg.sender_id = currentUser.id

    const { error } = await supabase.from('chat_messages').insert([msg])
    if (!error) {
      await notifyRoomMembers(room.id, currentUser?.id || null, 'message',
        `💬 ${msg.sender_name}`, input.trim().substring(0, 60), '/workspace/chat')
    }
    setInput('')
    setSending(false)
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const isMe = m => isAdmin ? m.is_admin : m.sender_id === currentUser?.id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#060E18' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.08)', flexShrink: 0, background: '#0B1E2D' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{room.name || 'Direct Message'}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            {room.type === 'direct' ? '● Direct Message' : room.type === 'brand' ? '● Brand Channel' : room.type === 'general' ? '● Company General' : '● Broadcast'}
          </div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.35)', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}>✕</button>}
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.2 }}>💬</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>No messages yet — say something!</div>
          </div>
        ) : messages.map((m, i) => {
          const mine = isMe(m)
          const showName = !mine && (i === 0 || messages[i - 1].sender_id !== m.sender_id || messages[i - 1].is_admin !== m.is_admin)
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!mine && showName && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.sender_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#060E18', flexShrink: 0 }}>
                  {initials(m.sender_name)}
                </div>
              )}
              {!mine && !showName && <div style={{ width: 28, flexShrink: 0 }} />}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }}>
                {showName && !mine && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: m.sender_color || 'rgba(240,244,255,0.4)', letterSpacing: '0.08em', paddingLeft: 4 }}>
                    {m.sender_name}{m.is_admin ? ' (Admin)' : ''}
                  </div>
                )}
                <div style={{ padding: '9px 13px', borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px', background: mine ? 'rgba(0,200,255,0.18)' : 'rgba(255,255,255,0.07)', border: `1px solid ${mine ? 'rgba(0,200,255,0.28)' : 'rgba(255,255,255,0.09)'}`, fontSize: 13, color: '#F0F4FF', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {m.content}
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)', paddingLeft: 4, paddingRight: 4 }}>{timeAgoChat(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,200,255,0.08)', flexShrink: 0, display: 'flex', gap: 8, background: '#0B1E2D', alignItems: 'center' }}>
        <input
          style={{ flex: 1, background: 'rgba(6,14,24,0.9)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 20, padding: '10px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F0F4FF', outline: 'none', minWidth: 0 }}
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? '#00C8FF' : 'rgba(0,200,255,0.1)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#060E18' : 'rgba(0,200,255,0.3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
