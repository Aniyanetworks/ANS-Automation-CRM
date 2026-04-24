import { Bell, Search, Plus, Menu, Sun, Moon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/contacts': 'Contacts',
  '/chat-history': 'Chat History',
  '/followups': 'Follow-ups',
  '/pipelines': 'Pipelines',
  '/workflows': 'Workflow Logs',
  '/automations': 'Automations',
}

const pageSubtitles = {
  '/dashboard': 'Overview of your CRM activity',
  '/contacts': 'Manage and track all your leads',
  '/chat-history': 'View all conversation history',
  '/followups': 'Manage scheduled follow-ups',
  '/pipelines': 'Track deals through your sales pipeline',
  '/workflows': 'Monitor n8n automation executions',
  '/automations': 'Manage your active automation channels',
}

export default function Header({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const title = pageTitles[pathname] || 'ANS CRM'
  const subtitle = pageSubtitles[pathname] || ''

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white leading-tight">{title}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="pl-8 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52 transition-all"
          />
        </div>
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} />
          <span className="hidden md:inline">Add Contact</span>
          <span className="md:hidden">Add</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            MP
          </div>
        </div>
      </div>
    </header>
  )
}
