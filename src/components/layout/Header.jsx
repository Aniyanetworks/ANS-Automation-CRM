import { Bell, Search, Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'

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

export default function Header() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'ANS CRM'
  const subtitle = pageSubtitles[pathname] || ''

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52 transition-all"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={15} />
          Add Contact
        </button>
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            MP
          </div>
        </div>
      </div>
    </header>
  )
}
