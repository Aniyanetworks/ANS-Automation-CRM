import { useState } from 'react'
import { Search, MessageSquare, Bot, User } from 'lucide-react'
import { contacts, chatHistories } from '../data/mockData'

const sourceColors = {
  Website: 'bg-blue-50 text-blue-700',
  Facebook: 'bg-indigo-50 text-indigo-700',
  Instagram: 'bg-pink-50 text-pink-700',
  Email: 'bg-purple-50 text-purple-700',
  SMS: 'bg-teal-50 text-teal-700',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const interestColors = {
  Yes: 'bg-emerald-50 text-emerald-700',
  No: 'bg-red-50 text-red-700',
  Pending: 'bg-amber-50 text-amber-700',
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ChatHistory() {
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(contacts[0]?.id || null)

  const contactsWithHistory = contacts.filter(c => chatHistories[c.sessionId])

  const filtered = contactsWithHistory.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.serviceType.toLowerCase().includes(q) || c.source.toLowerCase().includes(q)
  })

  const active = contacts.find(c => c.id === activeId)
  const messages = active ? (chatHistories[active.sessionId] || []) : []

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      <div className="w-80 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtered.map(c => {
            const msgs = chatHistories[c.sessionId] || []
            const last = msgs[msgs.length - 1]
            const isActive = c.id === activeId
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{c.name}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${interestColors[c.interest]}`}>
                        {c.interest}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceColors[c.source]}`}>
                        {sourceIcons[c.source]} {c.source}
                      </span>
                    </div>
                    {last && (
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {last.role === 'agent' ? '🤖 ' : '👤 '}{last.text}
                      </div>
                    )}
                    <div className="text-xs text-slate-300 mt-0.5">{msgs.length} messages</div>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">No conversations found</div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">{contactsWithHistory.length} conversations total</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {active ? (
          <>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${active.avatarColor} flex items-center justify-center text-white font-bold`}>
                  {active.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{active.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[active.source]}`}>
                      {sourceIcons[active.source]} {active.source}
                    </span>
                    <span className="text-xs text-slate-400">{active.serviceType}</span>
                    {active.phone && <span className="text-xs text-slate-400">{active.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Session ID</div>
                <div className="text-xs font-mono text-slate-600">{active.sessionId}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50">
              {messages.length > 0 && (
                <div className="text-center">
                  <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {formatDate(messages[0].timestamp)}
                  </span>
                </div>
              )}
              {messages.map((msg, i) => {
                const isAgent = msg.role === 'agent'
                return (
                  <div key={i} className={`flex items-end gap-2.5 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${isAgent ? 'bg-blue-500' : active.avatarColor}`}>
                      {isAgent
                        ? <Bot size={14} className="text-white" />
                        : <User size={14} className="text-white" />
                      }
                    </div>
                    <div className={`max-w-sm ${isAgent ? '' : ''}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAgent
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                          : 'bg-blue-600 text-white rounded-tr-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`text-xs text-slate-400 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
                        {isAgent ? '🤖 Jasica · ' : ''}{formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                )
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare size={40} className="opacity-20 mb-2" />
                  <p>No messages stored for this contact</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a manual message..."
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
