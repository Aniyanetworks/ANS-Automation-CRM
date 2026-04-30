import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, CalendarDays,
  Activity, Zap, Layers, Settings, Bot, X, LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/chat-history', icon: MessageSquare, label: 'Chat History' },
  { to: '/followups', icon: CalendarDays, label: 'Follow-ups' },
  { to: '/pipelines', icon: Layers, label: 'Pipelines' },
  { to: '/workflows', icon: Activity, label: 'Workflow Logs' },
  { to: '/automations', icon: Zap, label: 'Automations' },
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const initials = getInitials(user?.user_metadata?.full_name || user?.email)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`
      fixed md:static inset-y-0 left-0 z-30
      w-60 bg-slate-900 flex flex-col h-full flex-shrink-0
      transform transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide">ANS GHL</div>
            <div className="text-slate-400 text-xs">Aniya Networks</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
        >
          <Settings size={17} />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-150"
        >
          <LogOut size={17} />
          Sign Out
        </button>
        <div className="mt-2 px-3 py-2.5 flex items-center gap-3 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{displayName}</div>
            <div className="text-slate-500 text-xs truncate">{email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
