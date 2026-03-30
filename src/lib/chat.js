import { supabase } from './supabase'

// ── Send notification to an employee ─────────────────────────
export async function sendNotification(employeeId, type, title, body, link = null) {
  if (!supabase || !employeeId) return
  await supabase.from('notifications').insert([{
    employee_id: employeeId, type, title, body, link
  }])
}

// ── Send notification to multiple employees ───────────────────
export async function sendNotificationToMany(employeeIds, type, title, body, link = null) {
  if (!supabase || !employeeIds?.length) return
  const rows = employeeIds.map(id => ({ employee_id: id, type, title, body, link }))
  await supabase.from('notifications').insert(rows)
}

// ── Get or create a DM room between two employees ─────────────
export async function getOrCreateDM(myId, theirId) {
  // Find existing DM room both are members of
  const { data: myRooms } = await supabase
    .from('chat_members').select('room_id').eq('employee_id', myId)
  const myRoomIds = (myRooms || []).map(r => r.room_id)

  if (myRoomIds.length > 0) {
    const { data: shared } = await supabase
      .from('chat_members')
      .select('room_id, chat_rooms(type)')
      .eq('employee_id', theirId)
      .in('room_id', myRoomIds)
    const dm = (shared || []).find(r => r.chat_rooms?.type === 'direct')
    if (dm) return dm.room_id
  }

  // Create new DM room
  const { data: room } = await supabase
    .from('chat_rooms').insert([{ type: 'direct' }]).select().single()
  if (!room) return null

  await supabase.from('chat_members').insert([
    { room_id: room.id, employee_id: myId },
    { room_id: room.id, employee_id: theirId }
  ])
  return room.id
}

// ── Get or create a brand group room ─────────────────────────
export async function getOrCreateBrandRoom(brandId, brandName) {
  const { data: existing } = await supabase
    .from('chat_rooms').select('id').eq('type', 'brand').eq('brand_id', brandId).single()
  if (existing) return existing.id

  const { data: room } = await supabase
    .from('chat_rooms').insert([{ type: 'brand', name: `${brandName} Team`, brand_id: brandId }]).select().single()
  return room?.id || null
}

// ── Get or create HQ room ─────────────────────────────────────
export async function getOrCreateHQRoom() {
  const { data: existing } = await supabase
    .from('chat_rooms').select('id').eq('type', 'hq').single()
  if (existing) return existing.id

  const { data: room } = await supabase
    .from('chat_rooms').insert([{ type: 'hq', name: 'Mobtech HQ — All Company' }]).select().single()
  return room?.id || null
}

// ── Mark room as read ─────────────────────────────────────────
export async function markRoomRead(roomId, employeeId) {
  await supabase.from('chat_members')
    .update({ last_read: new Date().toISOString() })
    .eq('room_id', roomId).eq('employee_id', employeeId)
}

// ── Get unread count for employee ────────────────────────────
export async function getUnreadCount(employeeId) {
  const { data: memberships } = await supabase
    .from('chat_members').select('room_id,last_read').eq('employee_id', employeeId)
  if (!memberships?.length) return 0

  let total = 0
  for (const m of memberships) {
    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', m.room_id)
      .gt('created_at', m.last_read || '1970-01-01')
      .neq('sender_id', employeeId)
    total += count || 0
  }
  return total
}

// ── Request browser push permission ──────────────────────────
export async function requestPushPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ── Send browser push notification ───────────────────────────
export function pushNotify(title, body, icon) {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body, icon: icon || 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
    badge: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
    tag: 'mobtech-notification',
    silent: false,
  })
  n.onclick = () => { window.focus(); n.close() }
}
