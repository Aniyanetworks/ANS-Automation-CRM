import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, CalendarDays,
  Activity, Zap, Layers, Settings, Bot,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/chat-history', icon: MessageSquare, label: 'Chat History' },
  { to: '/followups', icon: CalendarDays, label: 'Follow-ups' },
  { to: '/pipelines', icon: Layers, label: 'Pipelines' },
  { to: '/workflows', icon: Activity, label: 'Workflow Logs' },
  { to: '/automations', icon: Zap, label: 'Automations' },
]

export default function Sidebar() {
  return (
    <div className="w-60 bg-slate-900 flex flex-col h-full flex-shrink-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide">ANS CRM</div>
            <div className="text-slate-400 text-xs">Aniya Networks</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
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

      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
        >
          <Settings size={17} />
          Settings
        </NavLink>
        <div className="mt-2 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            MP
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">Manam Parves</div>
            <div className="text-slate-500 text-xs">Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
}
