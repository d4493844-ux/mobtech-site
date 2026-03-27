import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import { AdminGuard } from './components/admin/AdminGuard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <AdminGuard>
          <Admin />
        </AdminGuard>
      } />
    </Routes>
  )
}
