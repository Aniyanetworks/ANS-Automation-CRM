import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ChatHistory from './pages/ChatHistory'
import Followups from './pages/Followups'
import Workflows from './pages/Workflows'
import Pipelines from './pages/Pipelines'
import Automations from './pages/Automations'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="chat-history" element={<ChatHistory />} />
        <Route path="followups" element={<Followups />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="pipelines" element={<Pipelines />} />
        <Route path="automations" element={<Automations />} />
      </Route>
    </Routes>
  )
}
