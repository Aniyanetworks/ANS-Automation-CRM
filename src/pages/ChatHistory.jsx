import { useState, useEffect, useRef } from 'react'
import { Search, MessageSquare, Bot, User, ChevronLeft, Loader2 } from 'lucide-react'
import { getContacts, getChatMessages, getAllChatSessions } from '../services/api'

const sourceColors = {
  Website: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const interestColors = {
  Yes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  No: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Splits a message record into individual speaker bubbles.
// Handles "Customer: ... Agent: ..." combined text format from n8n.
function parseMessageParts(msg) {
  const raw = (msg.text || '').trim()
  const hasPrefix = /\b(Customer|Agent):/i.test(raw)

  if (!hasPrefix) {
    const text = raw.replace(/-{3,}/g, '').trim()
    return text ? [{ role: msg.role, text, timestamp: msg.timestamp }] : []
  }

  const parts = []
  const regex = /\b(Customer|Agent):\s*([\s\S]*?)(?=\b(?:Customer|Agent):|$)/gi
  let match
  while ((match = regex.exec(raw)) !== null) {
    const role = match[1].toLowerCase() === 'agent' ? 'agent' : 'user'
    const text = match[2].replace(/-{3,}/g, '').trim()
    if (text) parts.push({ role, text, timestamp: msg.timestamp })
  }
  return parts
}

export default function ChatHistory() {
  const [sessions, setSessions] = useState([])
  const [contactMap, setContactMap] = useState({})
  const [messages, setMessages] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [activeSessionId, setActiveSessionId] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    Promise.all([getAllChatSessions(), getContacts()])
      .then(([sessionData, contactData]) => {
        setSessions(sessionData)
        const bySession = {}
        const byPhone = {}
        contactData.forEach(c => {
          if (c.session_id) bySession[c.session_id] = c
          if (c.phone) byPhone[c.phone] = c
        })
        // For each session, resolve contact by session_id first, then phone
        const map = {}
        sessionData.forEach(s => {
          map[s.session_id] = bySession[s.session_id] || byPhone[s.phone] || null
        })
        setContactMap(map)
      })
      .catch(console.error)
      .finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return }
    setLoadingMessages(true)
    getChatMessages(activeSessionId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }, [activeSessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase()
    if (!q) return true
    const c = contactMap[s.session_id]
    return (
      (c?.name || '').toLowerCase().includes(q) ||
      (c?.service_type || '').toLowerCase().includes(q) ||
      (c?.source || '').toLowerCase().includes(q) ||
      s.session_id.toLowerCase().includes(q)
    )
  })

  const active = activeSessionId ? contactMap[activeSessionId] : null
  const activeSession = activeSessionId ? sessions.find(s => s.session_id === activeSessionId) : null
  const activeDisplayName = active?.name || activeSession?.phone || 'Unknown'
  const chatHeight = 'h-[calc(100vh-5.5rem)] md:h-[calc(100vh-8rem)]'

  return (
    <div className={`flex gap-3 md:gap-5 ${chatHeight}`}>
      {/* Session list */}
      <div className={`flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-shrink-0 w-full md:w-80 ${activeSessionId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
          {loadingSessions && (
            <div className="py-10 flex justify-center text-slate-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          {!loadingSessions && filtered.map(s => {
            const c = contactMap[s.session_id]
            const name = c?.name || null
            const displayName = name || s.phone || 'Unknown'
            const initials = c?.avatar || getInitials(name || s.phone)
            const avatarColor = c?.avatar_color || getAvatarColor(displayName)
            const isActive = s.session_id === activeSessionId
            return (
              <div
                key={s.session_id}
                onClick={() => setActiveSessionId(s.session_id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</div>
                      {c?.interest && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${interestColors[c.interest] || 'bg-slate-100 text-slate-600'}`}>
                          {c.interest}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {c?.source && (
                        <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceColors[c.source] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {sourceIcons[c.source] || '💬'} {c.source}
                        </span>
                      )}
                      {c?.service_type && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.service_type}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                      {s.role === 'agent' ? '🤖 ' : '👤 '}{s.text}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!loadingSessions && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">No conversations found</div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-400">{sessions.length} conversations total</p>
        </div>
      </div>

      {/* Chat view */}
      <div className={`flex-1 flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${activeSessionId ? 'flex' : 'hidden md:flex'}`}>
        {activeSessionId ? (
          <>
            <div className="px-4 md:px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSessionId(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={`w-10 h-10 rounded-full ${active?.avatar_color || getAvatarColor(active?.name)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {active?.avatar || getInitials(active?.name)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{activeDisplayName}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {active?.source && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[active.source] || 'bg-slate-100 text-slate-600'}`}>
                        {sourceIcons[active.source]} {active.source}
                      </span>
                    )}
                    {active?.service_type && <span className="text-xs text-slate-400 dark:text-slate-500">{active.service_type}</span>}
                    {active?.phone && <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">{active.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-400">Session ID</div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400">{activeSessionId}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {loadingMessages && (
                <div className="flex justify-center pt-8 text-slate-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              )}
              {!loadingMessages && messages.length > 0 && (
                <div className="text-center">
                  <span className="text-xs text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    {formatDate(messages[0].timestamp)}
                  </span>
                </div>
              )}
              {!loadingMessages && messages.flatMap((msg, i) => {
                const avatarColor = active?.avatar_color || getAvatarColor(active?.name)
                return parseMessageParts(msg).map((part, j) => {
                  const isAgent = part.role === 'agent'
                  return (
                    <div key={`${msg.id || i}-${j}`} className={`flex items-end gap-2.5 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${isAgent ? 'bg-blue-500' : avatarColor}`}>
                        {isAgent ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
                      </div>
                      <div className="max-w-xs sm:max-w-sm">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isAgent
                            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-600'
                            : 'bg-blue-600 text-white rounded-tr-sm'
                        }`}>
                          {part.text}
                        </div>
                        <div className={`text-xs text-slate-400 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
                          {isAgent ? '🤖 Jasica · ' : ''}{formatTime(part.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                })
              })}
              {!loadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-16">
                  <MessageSquare size={40} className="opacity-20 mb-2" />
                  <p>No messages stored for this contact</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 md:px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a manual message..."
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="opacity-20 mb-3" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a contact from the left to view chat history</p>
          </div>
        )}
      </div>
    </div>
  )
}
