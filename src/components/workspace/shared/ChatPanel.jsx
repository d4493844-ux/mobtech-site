import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { getOrCreateDM, getOrCreateBrandRoom, getOrCreateHQRoom, markRoomRead, sendNotification } from '../../../lib/chat'
import { timeAgo } from '../../../lib/workspace'

export default function ChatPanel({ employee, isAdmin = false }) {
  const [open, setOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [activeRoomData, setActiveRoomData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [employees, setEmployees] = useState([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [sending, setSending] = useState(false)
  const [view, setView] = useState('rooms') // rooms | chat | newdm
  const [dmSearch, setDmSearch] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const channelRef = useRef(null)

  const myId = isAdmin ? null : employee?.id
  const myName = isAdmin ? 'Admin' : employee?.full_name

  useEffect(() => {
    if (!supabase) return
    loadRooms()
    loadEmployees()
    requestPushPerms()
  }, [])

  const requestPushPerms = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const loadEmployees = async () => {
    const { data } = await supabase.from('employees').select('id,full_name,avatar_color,role,brand_id').eq('is_active', true)
    setEmployees(data || [])
  }

  const loadRooms = async () => {
    if (!supabase) return
    let roomIds = []

    if (isAdmin) {
      // Admin sees all group/hq rooms
      const { data } = await supabase.from('chat_rooms').select('*,brands(name,color,icon)').in('type', ['hq','brand','group']).order('created_at')
      setRooms(data || [])
      return
    }

    // Get rooms employee is member of
    const { data: memberships } = await supabase.from('chat_members').select('room_id,last_read').eq('employee_id', myId)
    roomIds = (memberships || []).map(m => m.room_id)

    if (roomIds.length === 0) { setRooms([]); return }

    const { data: roomData } = await supabase.from('chat_rooms').select('*,brands(name,color,icon)').in('id', roomIds)

    // Get last message + unread for each room
    const enriched = await Promise.all((roomData || []).map(async room => {
      const membership = memberships.find(m => m.room_id === room.id)
      const { data: lastMsg } = await supabase.from('chat_messages').select('content,sender_name,created_at').eq('room_id', room.id).order('created_at', { ascending: false }).limit(1)
      const { count } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('room_id', room.id).gt('created_at', membership?.last_read || '1970-01-01').neq('sender_id', myId)
      return { ...room, lastMsg: lastMsg?.[0] || null, unread: count || 0 }
    }))

    const totalUnread = enriched.reduce((sum, r) => sum + r.unread, 0)
    setUnreadTotal(totalUnread)
    setRooms(enriched.sort((a, b) => new Date(b.lastMsg?.created_at || b.created_at) - new Date(a.lastMsg?.created_at || a.created_at)))
  }

  const openRoom = async (room) => {
    setActiveRoom(room.id)
    setActiveRoomData(room)
    setView('chat')
    setMessages([])

    // Load messages
    const { data } = await supabase.from('chat_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(60)
    setMessages(data || [])

    // Mark read
    if (myId) await markRoomRead(room.id, myId)

    // Update unread count locally
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread: 0 } : r))
    setUnreadTotal(prev => Math.max(0, prev - (room.unread || 0)))

    // Subscribe to realtime
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase.channel(`room-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (myId) markRoomRead(room.id, myId)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'instant' }); inputRef.current?.focus() }, 100)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return
    setSending(true)
    const content = newMsg.trim()
    setNewMsg('')

    const { data: msg, error } = await supabase.from('chat_messages').insert([{
      room_id: activeRoom,
      sender_id: myId || null,
      sender_name: myName,
      content,
      message_type: 'text'
    }]).select().single()

    setSending(false)

    // Send notifications to other room members
    if (!isAdmin && myId) {
      const { data: members } = await supabase.from('chat_members').select('employee_id').eq('room_id', activeRoom)
      const others = (members || []).map(m => m.employee_id).filter(id => id !== myId)
      for (const id of others) {
        await sendNotification(id, 'message', `${myName}`, content.length > 60 ? content.substring(0, 60) + '...' : content, `/workspace/chat`)
      }
    }
  }

  const startDM = async (otherEmployee) => {
    if (!myId) return
    const roomId = await getOrCreateDM(myId, otherEmployee.id)
    if (!roomId) return
    const room = { id: roomId, type: 'direct', name: otherEmployee.full_name, _dmWith: otherEmployee }
    await openRoom(room)
  }

  const joinHQRoom = async () => {
    const roomId = await getOrCreateHQRoom()
    if (!roomId || !myId) return
    await supabase.from('chat_members').upsert([{ room_id: roomId, employee_id: myId }])
    await loadRooms()
    const room = { id: roomId, type: 'hq', name: 'Mobtech HQ — All Company' }
    openRoom(room)
  }

  const joinBrandRoom = async () => {
    if (!employee?.brand_id || !employee?.brands) return
    const roomId = await getOrCreateBrandRoom(employee.brand_id, employee.brands?.name || 'Brand')
    if (!roomId || !myId) return
    await supabase.from('chat_members').upsert([{ room_id: roomId, employee_id: myId }])
    await loadRooms()
    const room = { id: roomId, type: 'brand', name: `${employee.brands?.name || 'Brand'} Team` }
    openRoom(room)
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const getRoomIcon = (room) => {
    if (room.type === 'hq') return '⬡'
    if (room.type === 'brand') return room.brands?.icon || '◆'
    if (room.type === 'direct') return null
    return '◈'
  }

  const getRoomName = (room) => {
    if (room.type === 'direct') return room._dmWith?.full_name || room.name || 'Direct Message'
    return room.name || 'Chat'
  }

  const filteredEmployees = employees.filter(e =>
    e.id !== myId && (e.full_name.toLowerCase().includes(dmSearch.toLowerCase()) || e.role?.toLowerCase().includes(dmSearch.toLowerCase()))
  )

  return (
    <>
      {/* CHAT BUBBLE BUTTON */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadRooms() }}
        style={{ position: 'relative', background: open ? 'rgba(0,200,255,0.1)' : 'none', border: '1px solid ' + (open ? 'rgba(0,200,255,0.3)' : 'transparent'), borderRadius: 4, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: open ? '#00C8FF' : 'rgba(240,244,255,0.4)', transition: 'all 0.15s' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {unreadTotal > 0 && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#fff', fontWeight: 700, border: '2px solid #060E18' }}>
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </div>
        )}
      </button>

      {/* CHAT PANEL */}
      {open && (
        <div style={{ position: 'fixed', bottom: 0, right: 0, width: '100%', maxWidth: 420, height: '70vh', minHeight: 400, background: '#0B1E2D', border: '1px solid rgba(0,200,255,0.15)', borderRadius: '12px 12px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.08)', flexShrink: 0 }}>
            {view === 'chat' && (
              <button onClick={() => { setView('rooms'); setActiveRoom(null); if (channelRef.current) supabase.removeChannel(channelRef.current) }}
                style={{ background: 'none', border: 'none', color: 'rgba(0,200,255,0.6)', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>←</button>
            )}
            {view === 'newdm' && (
              <button onClick={() => setView('rooms')}
                style={{ background: 'none', border: 'none', color: 'rgba(0,200,255,0.6)', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>←</button>
            )}
            <div style={{ flex: 1, fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: '#F0F4FF' }}>
              {view === 'rooms' && 'Messages'}
              {view === 'newdm' && 'New Message'}
              {view === 'chat' && getRoomName(activeRoomData || {})}
            </div>
            {view === 'rooms' && (
              <button onClick={() => setView('newdm')}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: '#00C8FF', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 2, padding: '5px 12px', cursor: 'pointer' }}>
                + New DM
              </button>
            )}
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>✕</button>
          </div>

          {/* ROOMS LIST */}
          {view === 'rooms' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Quick join group chats */}
              {!isAdmin && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,200,255,0.05)' }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,200,255,0.35)', marginBottom: 8 }}>Group Chats</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={joinHQRoom} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, padding: '5px 12px', background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 2, color: '#00C8FF', cursor: 'pointer' }}>⬡ HQ Chat</button>
                    {employee?.brand_id && <button onClick={joinBrandRoom} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, padding: '5px 12px', background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 2, color: '#00C8FF', cursor: 'pointer' }}>◆ {employee?.brands?.name || 'Brand'} Chat</button>}
                  </div>
                </div>
              )}

              {rooms.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)', lineHeight: 1.8 }}>
                  No conversations yet.<br />Start a DM or join a group chat.
                </div>
              ) : rooms.map(room => (
                <div key={room.id} onClick={() => openRoom(room)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.04)', cursor: 'pointer', background: room.id === activeRoom ? 'rgba(0,200,255,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: room.type === 'direct' ? (room._dmWith?.avatar_color || '#00C8FF') : 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: room.type === 'direct' ? 14 : 18, color: room.type === 'direct' ? '#060E18' : room.brands?.color || '#00C8FF', flexShrink: 0 }}>
                    {room.type === 'direct' ? initials(getRoomName(room)) : getRoomIcon(room)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: room.unread > 0 ? 600 : 400, color: room.unread > 0 ? '#F0F4FF' : 'rgba(240,244,255,0.65)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getRoomName(room)}</div>
                    {room.lastMsg && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.lastMsg.sender_name}: {room.lastMsg.content}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {room.lastMsg && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)' }}>{timeAgo(room.lastMsg.created_at)}</div>}
                    {room.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#060E18', fontWeight: 700 }}>{room.unread}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEW DM — employee search */}
          {view === 'newdm' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
                <input
                  style={{ width: '100%', background: 'rgba(6,14,24,0.8)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 3, padding: '8px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F0F4FF', outline: 'none' }}
                  placeholder="Search team members..."
                  value={dmSearch} onChange={e => setDmSearch(e.target.value)} autoFocus />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredEmployees.map(emp => (
                  <div key={emp.id} onClick={() => startDM(emp)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(0,200,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,200,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: emp.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#060E18', flexShrink: 0 }}>
                      {initials(emp.full_name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F4FF' }}>{emp.full_name}</div>
                      {emp.role && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.5)' }}>{emp.role}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>
                    Start the conversation
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === myId || (isAdmin && msg.sender_name === 'Admin')
                  const showName = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                      {showName && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'rgba(0,200,255,0.5)', marginBottom: 3, marginLeft: 4 }}>{msg.sender_name}</div>}
                      <div style={{ maxWidth: '80%', background: isMe ? '#00C8FF' : 'rgba(255,255,255,0.06)', color: isMe ? '#060E18' : '#F0F4FF', borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px', padding: '8px 12px', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.2)', marginTop: 2, marginLeft: 4, marginRight: 4 }}>{timeAgo(msg.created_at)}</div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid rgba(0,200,255,0.06)', flexShrink: 0 }}>
                <input
                  ref={inputRef}
                  style={{ flex: 1, background: 'rgba(6,14,24,0.8)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 20, padding: '9px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F0F4FF', outline: 'none' }}
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: newMsg.trim() ? '#00C8FF' : 'rgba(0,200,255,0.1)', border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s', color: newMsg.trim() ? '#060E18' : 'rgba(0,200,255,0.3)', fontSize: 16 }}>
                  →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
