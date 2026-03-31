import ChatPanel from '../shared/ChatPanel'

export default function WsAdminChat() {
  const ADMIN_USER = { id: null, full_name: 'Admin', avatar_color: '#00C8FF', is_admin: true }
  return (
    <div style={{ height: 'calc(100vh - 112px)', minHeight: 500 }}>
      <ChatPanel currentUser={ADMIN_USER} isAdmin={true} />
    </div>
  )
}
