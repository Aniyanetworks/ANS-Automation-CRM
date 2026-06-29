import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, CalendarDays,
  Activity, Zap, Layers, Settings, Bot, X, LogOut, Mail, Star, BarChart3,
  PanelLeftClose, PanelLeftOpen, Inbox,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/inbox', icon: Inbox, label: 'Inbox' },
  { to: '/chat-history', icon: MessageSquare, label: 'Chat History' },
  { to: '/followups', icon: CalendarDays, label: 'Follow-ups' },
  { to: '/email-campaigns', icon: Mail, label: 'Email Campaigns' },
  { to: '/email-report', icon: BarChart3, label: 'Email Report' },
  { to: '/review-campaigns', icon: Star, label: 'Review Campaigns' },
  { to: '/pipelines', icon: Layers, label: 'Pipelines' },
  { to: '/workflows', icon: Activity, label: 'Workflow Logs' },
  { to: '/automations', icon: Zap, label: 'Automations' },
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const initials = getInitials(user?.user_metadata?.full_name || user?.email)

  // `collapsed` is desktop-only (icons-only rail). On mobile the drawer is always
  // full-width, so collapse styles are scoped with `md:`.
  const hideOnCollapse = collapsed ? 'md:hidden' : ''
  const centerOnCollapse = collapsed ? 'md:justify-center' : ''

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`
      fixed md:static inset-y-0 left-0 z-30
      w-60 ${collapsed ? 'md:w-16' : 'md:w-60'} bg-slate-900 flex flex-col h-full flex-shrink-0
      transform transition-all duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className={`px-3 py-5 border-b border-slate-800 flex items-center justify-between gap-2 ${centerOnCollapse}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div className={`min-w-0 ${hideOnCollapse}`}>
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

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${centerOnCollapse} ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className={hideOnCollapse}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 ${centerOnCollapse}`}
        >
          {collapsed ? <PanelLeftOpen size={17} className="flex-shrink-0" /> : <PanelLeftClose size={17} className="flex-shrink-0" />}
          <span className={hideOnCollapse}>Collapse</span>
        </button>
        <NavLink
          to="/settings"
          onClick={onClose}
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 ${centerOnCollapse}`}
        >
          <Settings size={17} className="flex-shrink-0" />
          <span className={hideOnCollapse}>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-150 ${centerOnCollapse}`}
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span className={hideOnCollapse}>Sign Out</span>
        </button>
        <div className={`mt-2 px-3 py-2.5 flex items-center gap-3 rounded-lg bg-slate-800/50 ${centerOnCollapse}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" title={collapsed ? `${displayName} · ${email}` : undefined}>
            {initials}
          </div>
          <div className={`min-w-0 ${hideOnCollapse}`}>
            <div className="text-white text-xs font-semibold truncate">{displayName}</div>
            <div className="text-slate-500 text-xs truncate">{email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
