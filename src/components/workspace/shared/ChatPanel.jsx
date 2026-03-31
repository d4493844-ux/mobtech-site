import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getOrCreateDM, ensureGeneralRoom, ensureBrandRooms, timeAgoChat } from '../../../lib/chat'
import ChatWindow from './ChatWindow'

export default function ChatPanel({ currentUser, isAdmin = false }) {
  const [rooms, setRooms] = useState([])
  const [employees, setEmployees] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [tab, setTab] = useState('rooms') // rooms | people
  const [loading, setLoading] = useState(true)
  const [unreadMap, setUnreadMap] = useState({})

  const load = async () => {
    if (!supabase) return
    setLoading(true)

    // Ensure brand group rooms and general room exist
    const { data: allBrands } = await supabase.from('brands').select('*')
    await ensureBrandRooms(allBrands || [])
    const general = await ensureGeneralRoom()

    // Get rooms this user is in
    let myRooms = []
    if (isAdmin) {
      const { data } = await supabase.from('chat_rooms').select('*,brands(name,color,icon)').order('created_at')
      myRooms = data || []
    } else {
      const { data: memberData } = await supabase.from('chat_room_members')
        .select('room_id,last_read_at').eq('employee_id', currentUser.id)
      const roomIds = (memberData || []).map(m => m.room_id)
      if (roomIds.length) {
        const { data } = await supabase.from('chat_rooms')
          .select('*,brands(name,color,icon)').in('id', roomIds)
        myRooms = data || []
      }
      // Also add general if not already there
      if (general && !myRooms.find(r => r.id === general.id)) {
        // Auto-join general
        await supabase.from('chat_room_members').upsert({ room_id: general.id, employee_id: currentUser.id })
        myRooms.push({ ...general })
      }
    }

    setRooms(myRooms)

    // Get all active employees for DMs
    const { data: emps } = await supabase.from('employees')
      .select('id,full_name,avatar_color,role,brand_id,is_active')
      .eq('is_active', true)
      .neq('id', isAdmin ? '00000000-0000-0000-0000-000000000000' : currentUser.id)
    setEmployees(emps || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startDM = async (emp) => {
    const room = await getOrCreateDM(currentUser.id, emp.id)
    if (!room) return
    const dmRoom = { ...room, name: emp.full_name, dmUser: emp }
    setRooms(prev => {
      if (prev.find(r => r.id === room.id)) return prev
      return [dmRoom, ...prev]
    })
    setActiveRoom(dmRoom)
    setTab('rooms')
  }

  const startAdminDM = async (emp) => {
    // Admin creates a room with this employee
    const room = await getOrCreateDM(emp.id, emp.id) // placeholder
    const { data: existingRooms } = await supabase.from('chat_room_members')
      .select('room_id').eq('employee_id', emp.id)
    // Find DM rooms
    let dmRoom = null
    for (const r of existingRooms || []) {
      const { data } = await supabase.from('chat_rooms').select('*').eq('id', r.room_id).eq('type', 'direct').single()
      if (data) { dmRoom = data; break }
    }
    if (!dmRoom) {
      const { data } = await supabase.from('chat_rooms').insert([{ type: 'direct' }]).select().single()
      dmRoom = data
      if (dmRoom) {
        await supabase.from('chat_room_members').insert([{ room_id: dmRoom.id, employee_id: emp.id }])
      }
    }
    if (dmRoom) setActiveRoom({ ...dmRoom, name: emp.full_name })
    setTab('rooms')
  }

  const getRoomIcon = (room) => {
    if (room.type === 'direct') return '💬'
    if (room.type === 'brand') return room.brands?.icon || '◆'
    if (room.type === 'general') return '⬡'
    if (room.type === 'broadcast') return '📢'
    return '◻'
  }

  const getRoomColor = (room) => {
    if (room.type === 'direct') return '#00C8FF'
    if (room.type === 'brand') return room.brands?.color || '#00C8FF'
    if (room.type === 'general') return '#10B981'
    return '#F59E0B'
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 500, gap: 0 }}>
      {/* SIDEBAR */}
      <div style={{ width: 220, borderRight: '1px solid rgba(0,200,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
          {['rooms', 'people'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: tab === t ? 'rgba(0,200,255,0.06)' : 'none', border: 'none', borderBottom: tab === t ? '1px solid #00C8FF' : '1px solid transparent', color: tab === t ? '#00C8FF' : 'rgba(240,244,255,0.35)', cursor: 'pointer' }}>
              {t === 'rooms' ? 'Chats' : 'People'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'rooms' && (
            loading ? <div style={{ padding: '20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.25)' }}>Loading...</div>
            : rooms.length === 0 ? <div style={{ padding: '20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>No chats yet</div>
            : rooms.map(room => (
              <div key={room.id}
                onClick={() => setActiveRoom(room)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: activeRoom?.id === room.id ? 'rgba(0,200,255,0.07)' : 'transparent', borderLeft: activeRoom?.id === room.id ? '2px solid #00C8FF' : '2px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ width: 32, height: 32, borderRadius: room.type === 'direct' ? '50%' : 6, background: `${getRoomColor(room)}18`, border: `1px solid ${getRoomColor(room)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {room.type === 'direct' && room.dmUser
                    ? <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: room.dmUser?.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#060E18' }}>{initials(room.name)}</div>
                    : getRoomIcon(room)
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeRoom?.id === room.id ? '#F0F4FF' : 'rgba(240,244,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.name || 'Direct Message'}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {room.type}
                  </div>
                </div>
              </div>
            ))
          )}

          {tab === 'people' && (
            <div>
              {employees.length === 0 ? (
                <div style={{ padding: '20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>No team members</div>
              ) : employees.map(emp => (
                <div key={emp.id}
                  onClick={() => isAdmin ? startAdminDM(emp) : startDM(emp)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: emp.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, color: '#060E18', flexShrink: 0 }}>
                    {initials(emp.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,244,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                    {emp.role && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.role}</div>}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.4)' }}>DM →</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onClose={() => setActiveRoom(null)}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.2 }}>💬</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.04em', color: 'rgba(240,244,255,0.3)', marginBottom: 8 }}>Select a chat</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)' }}>Choose from your chats or start a DM with someone</div>
          </div>
        )}
      </div>
    </div>
  )
}
