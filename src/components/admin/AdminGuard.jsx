import { Navigate } from 'react-router-dom'

export function AdminGuard({ children }) {
  const isAuth = sessionStorage.getItem('mobtech_admin') === 'true'
  if (!isAuth) return <Navigate to="/admin/login" replace />
  return children
}
