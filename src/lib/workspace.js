import { supabase } from './supabase'

// ── Simple hash (not bcrypt — no backend, all client-side) ──
export async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'mobtech_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Employee Auth ──
export async function employeeLogin(username, password) {
  const hash = await hashPassword(password)
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .eq('password_hash', hash)
    .eq('is_active', true)
    .single()
  if (error || !data) return { error: 'Invalid username or password' }
  // Update last_seen
  await supabase.from('employees').update({ last_seen: new Date().toISOString() }).eq('id', data.id)
  return { employee: data }
}

export function getEmployee() {
  try { return JSON.parse(sessionStorage.getItem('ws_employee')) } catch { return null }
}
export function setEmployee(emp) { sessionStorage.setItem('ws_employee', JSON.stringify(emp)) }
export function clearEmployee() { sessionStorage.removeItem('ws_employee') }

export function getAdminAuth() { return sessionStorage.getItem('mobtech_admin') === 'true' }

// ── Activity Logger ──
export async function logActivity(employeeId, action, entityType = null, entityId = null, metadata = null) {
  await supabase.from('activity_log').insert([{
    employee_id: employeeId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata
  }])
}

// ── Status config ──
export const STATUS = {
  todo:        { label: 'To Do',       color: '#8899BB', bg: 'rgba(136,153,187,0.1)' },
  inprogress:  { label: 'In Progress', color: '#00C8FF', bg: 'rgba(0,200,255,0.1)' },
  review:      { label: 'Under Review',color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  blocked:     { label: 'Blocked',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

export const PRIORITY = {
  low:    { label: 'Low',    color: '#8899BB' },
  medium: { label: 'Medium', color: '#F59E0B' },
  high:   { label: 'High',   color: '#EF4444' },
  urgent: { label: 'Urgent', color: '#FF0000' },
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
