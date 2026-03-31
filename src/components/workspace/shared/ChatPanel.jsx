import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getOrCreateDM, ensureGeneralRoom, ensureBrandRooms, timeAgoChat } from '../../../lib/chat'
import ChatWindow from './ChatWindow'

export default function ChatPanel({ currentUser, isAdmin = false }) {
  const [rooms, setRooms] = useState([])
  const [employees, setEmployees] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [tab, setTab] = useState('rooms')
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    // Setup brand rooms and general
    const { data: allBrands } = await supabase.from('brands').select('*')
    await ensureBrandRooms(allBrands || [])
    const general = await ensureGeneralRoom()

    let myRooms = []
    if (isAdmin) {
      // Admin sees all rooms
      const { data } = await supabase.from('chat_rooms').select('*,brands(name,color,icon)').order('type').order('name')
      myRooms = data || []
    } else {
      // Employee sees rooms they're in
      const { data: memberData } = await supabase.from('chat_room_members')
        .select('room_id').eq('employee_id', currentUser.id)
      const roomIds = (memberData || []).map(m => m.room_id)

      // Auto-join general
      if (general) {
        const inGeneral = roomIds.includes(general.id)
        if (!inGeneral) {
          await supabase.from('chat_room_members').upsert({ room_id: general.id, employee_id: currentUser.id }, { onConflict: 'room_id,employee_id' })
          roomIds.push(general.id)
        }
      }

      // Auto-join brand room if they have a brand
      if (currentUser.brand_id) {
        const { data: brandRoom } = await supabase.from('chat_rooms').select('id').eq('type', 'brand').eq('brand_id', currentUser.brand_id).limit(1)
        if (brandRoom?.length && !roomIds.includes(brandRoom[0].id)) {
          await supabase.from('chat_room_members').upsert({ room_id: brandRoom[0].id, employee_id: currentUser.id }, { onConflict: 'room_id,employee_id' })
          roomIds.push(brandRoom[0].id)
        }
      }

      if (roomIds.length) {
        const { data } = await supabase.from('chat_rooms').select('*,brands(name,color,icon)').in('id', roomIds).order('type').order('name')
        myRooms = data || []
      }
    }

    setRooms(myRooms)

    // Load people for DMs
    const { data: emps } = await supabase.from('employees').select('id,full_name,avatar_color,role,brand_id,is_active').eq('is_active', true)
    const filtered = isAdmin ? (emps || []) : (emps || []).filter(e => e.id !== currentUser.id)
    setEmployees(filtered)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startDM = async emp => {
    if (!currentUser?.id) return
    const room = await getOrCreateDM(currentUser.id, emp.id)
    if (!room) return
    const dmRoom = { ...room, name: emp.full_name, _dmUser: emp }
    setRooms(prev => prev.find(r => r.id === room.id) ? prev.map(r => r.id === room.id ? dmRoom : r) : [dmRoom, ...prev])
    setActiveRoom(dmRoom)
    setTab('rooms')
  }

  const startAdminDM = async emp => {
    // Admin DM — create a room with just the employee
    const { data: existingMember } = await supabase.from('chat_room_members')
      .select('room_id').eq('employee_id', emp.id)
    let dmRoom = null
    for (const m of existingMember || []) {
      const { data: r } = await supabase.from('chat_rooms').select('*').eq('id', m.room_id).eq('type', 'direct').maybeSingle()
      if (r) { dmRoom = r; break }
    }
    if (!dmRoom) {
      const { data: r } = await supabase.from('chat_rooms').insert([{ type: 'direct' }]).select().single()
      if (r) {
        dmRoom = r
        await supabase.from('chat_room_members').insert([{ room_id: r.id, employee_id: emp.id }])
      }
    }
    if (dmRoom) {
      const room = { ...dmRoom, name: emp.full_name, _dmUser: emp }
      setRooms(prev => prev.find(r => r.id === dmRoom.id) ? prev : [room, ...prev])
      setActiveRoom(room)
      setTab('rooms')
    }
  }

  const getRoomIcon = r => {
    if (r.type === 'direct') return r._dmUser ? null : '💬'
    if (r.type === 'brand') return r.brands?.icon || '◆'
    if (r.type === 'general') return '⬡'
    return '📢'
  }

  const getRoomColor = r => {
    if (r.type === 'brand') return r.brands?.color || '#00C8FF'
    if (r.type === 'general') return '#10B981'
    if (r.type === 'direct') return r._dmUser?.avatar_color || '#00C8FF'
    return '#F59E0B'
  }

  const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const filteredEmps = searchQ ? employees.filter(e => e.full_name.toLowerCase().includes(searchQ.toLowerCase())) : employees

  return (
    <div style={{ display: 'flex', height: '100%', background: '#060E18', borderRadius: 4, border: '1px solid rgba(0,200,255,0.08)', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <div style={{ width: activeRoom ? 200 : '100%', maxWidth: 260, borderRight: '1px solid rgba(0,200,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s' }}>

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,200,255,0.08)', flexShrink: 0 }}>
          {[{ k: 'rooms', l: 'Chats' }, { k: 'people', l: 'People' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ flex: 1, padding: '11px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: tab === t.k ? 'rgba(0,200,255,0.07)' : 'none', border: 'none', borderBottom: tab === t.k ? '2px solid #00C8FF' : '2px solid transparent', color: tab === t.k ? '#00C8FF' : 'rgba(240,244,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* SEARCH (people tab) */}
        {tab === 'people' && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search people..."
              style={{ width: '100%', background: 'rgba(6,14,24,0.8)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 6, padding: '7px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#F0F4FF', outline: 'none' }} />
          </div>
        )}

        {/* LIST */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)', textAlign: 'center' }}>Loading...</div>
          ) : tab === 'rooms' ? (
            rooms.length === 0 ? (
              <div style={{ padding: '24px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)', textAlign: 'center' }}>No chats yet</div>
            ) : rooms.map(room => (
              <div key={room.id} onClick={() => setActiveRoom(room)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: activeRoom?.id === room.id ? 'rgba(0,200,255,0.08)' : 'transparent', borderLeft: `2px solid ${activeRoom?.id === room.id ? '#00C8FF' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={{ width: 34, height: 34, borderRadius: room.type === 'direct' ? '50%' : 8, background: `${getRoomColor(room)}20`, border: `1px solid ${getRoomColor(room)}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, color: getRoomColor(room), fontFamily: 'Bebas Neue, sans-serif' }}>
                  {room.type === 'direct' && room._dmUser ? initials(room._dmUser.full_name) : getRoomIcon(room)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeRoom?.id === room.id ? '#F0F4FF' : 'rgba(240,244,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.name || 'Direct Message'}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{room.type}</div>
                </div>
              </div>
            ))
          ) : (
            filteredEmps.length === 0 ? (
              <div style={{ padding: '24px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.2)', textAlign: 'center' }}>No one found</div>
            ) : filteredEmps.map(emp => (
              <div key={emp.id} onClick={() => isAdmin ? startAdminDM(emp) : startDM(emp)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: emp.avatar_color || '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, color: '#060E18', flexShrink: 0 }}>
                  {initials(emp.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,244,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                  {emp.role && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(240,244,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.role}</div>}
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'rgba(0,200,255,0.4)', flexShrink: 0 }}>DM</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT WINDOW */}
      {activeRoom ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ChatWindow room={activeRoom} currentUser={currentUser} isAdmin={isAdmin}
            onClose={() => setActiveRoom(null)} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>💬</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.04em', color: 'rgba(240,244,255,0.25)', marginBottom: 8 }}>Select a chat</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'rgba(240,244,255,0.18)', lineHeight: 1.6 }}>Choose a channel from the left<br />or go to People to start a DM</div>
        </div>
      )}

      {/* MOBILE: full screen chat window overlay */}
      <style>{`
        @media (max-width: 640px) {
          .chat-sidebar { width: ${activeRoom ? '0' : '100%'} !important; overflow: hidden; }
          .chat-main { display: ${activeRoom ? 'flex' : 'none'} !important; position: fixed; inset: 0; z-index: 300; }
        }
      `}</style>
    </div>
  )
}
