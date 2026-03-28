import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import AdminWorkspace from './pages/AdminWorkspace'
import EmployeeWorkspace from './pages/EmployeeWorkspace'
import WorkspaceLogin from './components/workspace/employee/WorkspaceLogin'
import { AdminGuard } from './components/admin/AdminGuard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/workspace/login" element={<WorkspaceLogin />} />
      <Route path="/workspace/*" element={<EmployeeWorkspace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/workspace/*" element={<AdminGuard><AdminWorkspace /></AdminGuard>} />
      <Route path="/admin/*" element={<AdminGuard><Admin /></AdminGuard>} />
    </Routes>
  )
}
