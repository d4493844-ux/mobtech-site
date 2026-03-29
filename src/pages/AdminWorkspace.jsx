import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import WorkspaceLayout from '../components/workspace/shared/WorkspaceLayout'
import WsAdminDashboard from '../components/workspace/admin/WsAdminDashboard'
import WsAdminEmployees from '../components/workspace/admin/WsAdminEmployees'
import WsAdminTasks from '../components/workspace/admin/WsAdminTasks'
import WsAdminDocuments from '../components/workspace/admin/WsAdminDocuments'
import WsAdminTeamContent from '../components/workspace/admin/WsAdminTeamContent'
import { WsAdminAnnouncements, WsAdminBrands, WsAdminActivity } from '../components/workspace/admin/WsAdminOther'
import { supabase } from '../lib/supabase'

export default function AdminWorkspace() {
  const [counts, setCounts] = useState({ tasks: 0, employees: 0, docs: 0 })

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'todo'),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('documents').select('id', { count: 'exact', head: true }),
    ]).then(([tasks, emps, docs]) => {
      setCounts({ tasks: tasks.count || 0, employees: emps.count || 0, docs: docs.count || 0 })
    })
  }, [])

  const navItems = [
    { section: 'Overview', items: [
      { path: '/admin/workspace', icon: '⬡', label: 'Dashboard' },
      { path: '/admin/workspace/activity', icon: '◎', label: 'Activity Log' },
    ]},
    { section: 'Management', items: [
      { path: '/admin/workspace/employees', icon: '◈', label: 'Employees', badge: counts.employees },
      { path: '/admin/workspace/tasks', icon: '◻', label: 'Tasks', badge: counts.tasks },
      { path: '/admin/workspace/brands', icon: '◆', label: 'Brands' },
    ]},
    { section: 'Content', items: [
      { path: '/admin/workspace/team-content', icon: '◉', label: 'Site Team' },
      { path: '/admin/workspace/documents', icon: '◫', label: 'Documents', badge: counts.docs },
      { path: '/admin/workspace/announcements', icon: '◬', label: 'Announcements' },
    ]},
    { section: 'Site Admin', items: [
      { path: '/admin', icon: '◁', label: 'Back to Site Admin' },
    ]}
  ]

  return (
    <WorkspaceLayout title="Workspace" navItems={navItems} isAdmin>
      <Routes>
        <Route path="/" element={<WsAdminDashboard />} />
        <Route path="/employees" element={<WsAdminEmployees />} />
        <Route path="/tasks" element={<WsAdminTasks />} />
        <Route path="/documents" element={<WsAdminDocuments />} />
        <Route path="/announcements" element={<WsAdminAnnouncements />} />
        <Route path="/brands" element={<WsAdminBrands />} />
        <Route path="/activity" element={<WsAdminActivity />} />
        <Route path="/team-content" element={<WsAdminTeamContent />} />
      </Routes>
    </WorkspaceLayout>
  )
}
