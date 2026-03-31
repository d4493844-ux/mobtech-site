import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { markRoomRead, notifyRoomMembers, timeAgoChat } from '../../../lib/chat'

export default function ChatWindow({ room, currentUser, isAdmin = false, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const loadMessages = async () => {
    const { data } = await supabase.from('chat_messages')
      .select('*').eq('room_id', room.id)
      .order('created_at', { ascending: true }).limit(100)
    setMessages(data || [])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    await markRoomRead(room.id, isAdmin ? 'admin' : currentUser.id)
  }

  useEffect(() => {
    if (!supabase || !room) return
    loadMessages()
    const channel = supabase.channel(`room_${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `room_id=eq.${room.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const msg = {
      room_id: room.id,
      sender_id: isAdmin ? null : currentUser.id,
      sender_name: isAdmin ? 'Admin' : currentUser.full_name,
      sender_color: isAdmin ? '#00C8FF' : (currentUser.avatar_color || '#00C8FF'),
      content: input.trim(),
      is_admin: isAdmin,
    }
    await supabase.from('chat_messages').insert([msg])
    // Notify other members
    await notifyRoomMembers(
      room.id,
      isAdmin ? null : currentUser.id,
      'message',
      isAdmin ? 'New message from Admin' : `New message from ${currentUser.full_name}`,
      input.trim().substring(0, 60),
      '/workspace'
    )
    setInput('')
    setSending(false)
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.08)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{room.name || 'Direct Message'}</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            {room.type === 'direct' ? 'Direct Message' : room.type === 'brand' ? 'Brand Channel' : room.type === 'general' ? 'Company General' : 'Broadcast'}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.35)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>✕</button>
        )}
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.25)' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>
            No messages yet — say something!
          </div>
        ) : messages.map((m, i) => {
          const isMe = isAdmin ? m.is_admin : m.sender_id === currentUser?.id
          const showName = !isMe && (i === 0 || messages[i-1].sender_id !== m.sender_id)
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.sender_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#060E18', flexShrink: 0 }}>
                  {initials(m.sender_name)}
                </div>
              )}
              <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {showName && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: m.sender_color || 'rgba(240,244,255,0.4)', letterSpacing: '0.08em', paddingLeft: 4, paddingRight: 4 }}>{m.sender_name}{m.is_admin && ' (Admin)'}</div>}
                <div style={{ padding: '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMe ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMe ? 'rgba(0,200,255,0.25)' : 'rgba(255,255,255,0.08)'}`, fontSize: 13, color: '#F0F4FF', lineHeight: 1.5, wordBreak: 'break-word' }}>
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,200,255,0.08)', flexShrink: 0, display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, background: 'rgba(6,14,24,0.8)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 20, padding: '9px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F0F4FF', outline: 'none' }}
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ width: 38, height: 38, borderRadius: '50%', background: input.trim() ? '#00C8FF' : 'rgba(0,200,255,0.1)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#060E18' : 'rgba(0,200,255,0.4)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
