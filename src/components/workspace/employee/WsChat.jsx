import ChatPanel from '../shared/ChatPanel'
import { getEmployee } from '../../../lib/workspace'

export default function WsChat() {
  const employee = getEmployee()
  if (!employee) return null
  return (
    <div style={{ height: 'calc(100vh - 112px)', minHeight: 500 }}>
      <ChatPanel currentUser={employee} isAdmin={false} />
    </div>
  )
}
