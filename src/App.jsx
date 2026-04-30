import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ChatHistory from './pages/ChatHistory'
import Followups from './pages/Followups'
import Workflows from './pages/Workflows'
import Pipelines from './pages/Pipelines'
import Automations from './pages/Automations'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="contacts"    element={<Contacts />} />
        <Route path="chat-history" element={<ChatHistory />} />
        <Route path="followups"   element={<Followups />} />
        <Route path="workflows"   element={<Workflows />} />
        <Route path="pipelines"   element={<Pipelines />} />
        <Route path="automations" element={<Automations />} />
      </Route>
    </Routes>
  )
}
