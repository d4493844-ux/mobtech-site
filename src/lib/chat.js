import { supabase } from './supabase'

export async function sendNotification(employeeId, type, title, body, link = null) {
  if (!supabase || !employeeId) return
  await supabase.from('notifications').insert([{ employee_id: employeeId, type, title, body, link }])
}

export async function notifyRoomMembers(roomId, excludeId, type, title, body, link) {
  if (!supabase) return
  const { data } = await supabase.from('chat_room_members').select('employee_id').eq('room_id', roomId)
  const members = (data || []).filter(m => m.employee_id !== excludeId)
  if (!members.length) return
  await supabase.from('notifications').insert(members.map(m => ({ employee_id: m.employee_id, type, title, body, link })))
}

export async function getOrCreateDM(emp1Id, emp2Id) {
  if (!supabase) return null
  // Find rooms emp1 is in
  const { data: rooms1 } = await supabase.from('chat_room_members').select('room_id').eq('employee_id', emp1Id)
  const ids1 = new Set((rooms1 || []).map(r => r.room_id))
  // Find rooms emp2 is in that overlap
  const { data: rooms2 } = await supabase.from('chat_room_members').select('room_id').eq('employee_id', emp2Id)
  const shared = (rooms2 || []).find(r => ids1.has(r.room_id))
  if (shared) {
    const { data: room } = await supabase.from('chat_rooms').select('*').eq('id', shared.room_id).eq('type', 'direct').maybeSingle()
    if (room) return room
  }
  // Create new DM
  const { data: room, error } = await supabase.from('chat_rooms').insert([{ type: 'direct' }]).select().single()
  if (error || !room) return null
  await supabase.from('chat_room_members').insert([
    { room_id: room.id, employee_id: emp1Id },
    { room_id: room.id, employee_id: emp2Id },
  ])
  return room
}

export async function ensureGeneralRoom() {
  if (!supabase) return null
  const { data } = await supabase.from('chat_rooms').select('*').eq('type', 'general').limit(1)
  if (data && data.length > 0) return data[0]
  const { data: room, error } = await supabase.from('chat_rooms').insert([{ type: 'general', name: 'Mobtech General' }]).select().single()
  if (error) return null
  return room
}

export async function ensureBrandRooms(brands) {
  if (!supabase || !brands?.length) return
  for (const brand of brands) {
    const { data } = await supabase.from('chat_rooms').select('id').eq('type', 'brand').eq('brand_id', brand.id).limit(1)
    if (data && data.length > 0) continue
    const { data: room } = await supabase.from('chat_rooms')
      .insert([{ type: 'brand', name: `${brand.name} Team`, brand_id: brand.id }]).select().single()
    if (room) {
      const { data: emps } = await supabase.from('employees').select('id').eq('brand_id', brand.id).eq('is_active', true)
      if (emps?.length) {
        await supabase.from('chat_room_members').insert(emps.map(e => ({ room_id: room.id, employee_id: e.id })))
      }
    }
  }
}

export async function markRoomRead(roomId, employeeId) {
  if (!supabase || !employeeId || employeeId === 'admin') return
  await supabase.from('chat_room_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId).eq('employee_id', employeeId)
}

export function timeAgoChat(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
