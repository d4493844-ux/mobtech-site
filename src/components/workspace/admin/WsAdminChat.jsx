import ChatPanel from '../shared/ChatPanel'

const ADMIN_USER = { id: 'admin', full_name: 'Admin', avatar_color: '#00C8FF' }

export default function WsAdminChat() {
  return (
    <div style={{ height: 'calc(100vh - 112px)', minHeight: 500 }}>
      <ChatPanel currentUser={ADMIN_USER} isAdmin={true} />
    </div>
  )
}
