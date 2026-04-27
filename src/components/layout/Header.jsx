import { useState, useEffect, useRef } from 'react'
import { Bell, Search, Plus, Menu, Sun, Moon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { searchContacts } from '../../services/api'

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

const statusColors = {
  'New Lead': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Contacted': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Hot Lead': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Qualified Lead': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Proposal Sent': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Closed Won': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Closed Lost': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Header({ onMenuToggle }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [searchVal, setSearchVal] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  const title = pageTitles[pathname] || 'ANS CRM'
  const subtitle = pageSubtitles[pathname] || ''

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearchVal(val)

    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchContacts(val.trim())
      setSuggestions(results)
      setShowDropdown(results.length > 0)
    }, 250)
  }

  function handleAddContact() {
    navigate('/contacts', { state: { openCreate: true } })
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!searchVal.trim()) return
    setShowDropdown(false)
    navigate('/contacts', { state: { searchQuery: searchVal.trim() } })
  }

  function handleSuggestionClick(contact) {
    setSearchVal('')
    setSuggestions([])
    setShowDropdown(false)
    navigate('/contacts', { state: { openContact: contact.id } })
  }

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
        <div ref={wrapperRef} className="relative hidden md:block">
          <form onSubmit={handleSearch}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Search contacts..."
              className="pl-8 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52 transition-all"
            />
          </form>

          {showDropdown && (
            <div className="absolute top-full mt-1.5 left-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((contact) => {
                const initials = contact.avatar || getInitials(contact.name)
                const avatarColor = contact.avatar_color || 'bg-blue-500'
                return (
                  <button
                    key={contact.id}
                    onMouseDown={() => handleSuggestionClick(contact)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{contact.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{contact.email || contact.phone || '—'}</div>
                    </div>
                    {contact.lead_status && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusColors[contact.lead_status] || 'bg-slate-100 text-slate-600'}`}>
                        {contact.lead_status}
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                onMouseDown={handleSearch}
                className="w-full px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-center border-t border-slate-100 dark:border-slate-700 transition-colors"
              >
                See all results for "{searchVal}"
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleAddContact}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
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
