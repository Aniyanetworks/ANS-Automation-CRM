import { useState, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, ChevronLeft, Loader2, Send,
  CheckCheck, Zap, Heart, X, ArrowUpRight, Inbox as InboxIcon,
  MailOpen, Mail, SlidersHorizontal, Bot,
} from 'lucide-react'
import {
  getEmailMessages, getNurtureMessages, sendManualReply,
  updateEmailLead, updateNurtureClient,
} from '../services/api'
import { useNotify } from '../context/NotifyContext'
import { useAuth } from '../context/AuthContext'
import { useInbox } from '../context/InboxContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-400 to-blue-600', 'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600', 'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500', 'from-cyan-400 to-sky-600',
  'from-indigo-400 to-blue-600', 'from-pink-400 to-rose-600',
]
function avatarGradient(str) {
  let h = 0
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}
function getInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n').trim()
}
function cleanInboundBody(raw) {
  if (!raw) return ''
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const out = []
  for (const line of lines) {
    if (/^>/.test(line)) break
    if (/^On .+wrote:\s*$/.test(line.trim())) break
    out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto',
  })
}
function fmtShort(ts) {
  const toET = t => { const d = new Date(new Date(t).toLocaleString('en-US', { timeZone: 'America/Toronto' })); d.setHours(0,0,0,0); return d }
  const diff = (toET(new Date()) - toET(ts)) / 86400000
  if (diff < 1) return fmtTime(ts)
  if (diff < 2) return 'Yesterday'
  if (diff < 7) return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Toronto' })
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Toronto' })
}
function dayLabel(ts) {
  const toET = t => { const d = new Date(new Date(t).toLocaleString('en-US', { timeZone: 'America/Toronto' })); d.setHours(0,0,0,0); return d }
  const diff = (toET(new Date()) - toET(ts)) / 86400000
  if (diff < 1) return 'Today'
  if (diff < 2) return 'Yesterday'
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ThreadItem({ thread, isSelected, isUnread, onClick }) {
  const isNurture = thread.kind === 'nurture'
  const preview = thread.latestMessage?.direction === 'inbound'
    ? cleanInboundBody(thread.latestMessage.body)
    : stripHtml(thread.latestMessage?.body || '')
  const previewLine = preview.replace(/\n+/g, ' ').slice(0, 90)
  const gradient = avatarGradient(thread.name)
  const initials = getInitials(thread.name)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50 transition-all relative
        ${isSelected
          ? 'bg-blue-50/80 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500 pl-[13px]'
          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/20 border-l-[3px] border-l-transparent'
        }`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-[18px] w-2 h-2">
        {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />}
      </div>

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
        {initials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${isUnread ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
            {thread.name}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 font-medium">
            {thread.latestMessage && fmtShort(thread.latestMessage.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {thread.campaign && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide
              ${isNurture
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
              {isNurture ? <Heart size={8} /> : <Zap size={8} />}
              {thread.campaign.name}
            </span>
          )}
          {!thread.aiReplyEnabled && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Bot size={8} /> AI off
            </span>
          )}
        </div>

        <p className={`text-xs leading-snug truncate ${isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
          {thread.latestMessage?.direction === 'outbound' && (
            <span className="text-slate-400 dark:text-slate-500">You: </span>
          )}
          {previewLine || <span className="italic">No content</span>}
        </p>
      </div>
    </button>
  )
}

function DateSep({ label }) {
  return (
    <div className="flex items-center gap-3 my-5 px-4">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">{label}</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

function MessageBubble({ msg }) {
  const isOut = msg.direction === 'outbound'
  const body = isOut ? stripHtml(msg.body || '') : cleanInboundBody(msg.body || '')
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-2 px-4 group`}>
      <div className={`max-w-[72%] flex flex-col ${isOut ? 'items-end' : 'items-start'}`}>
        {msg.subject && (
          <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 px-1">
            {msg.subject}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
          isOut
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-sm border border-slate-100 dark:border-slate-600'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {body || <span className="italic opacity-50">Empty</span>}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-[10px] mt-0.5 px-1 ${isOut ? 'text-slate-400' : 'text-slate-400'}`}>
          <span>{fmtTime(msg.created_at)}</span>
          {isOut && <CheckCheck size={11} className="text-blue-400" />}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
        <MailOpen size={36} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Select a conversation</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Choose a thread from the left to read and reply to messages.</p>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Inbox() {
  const notify = useNotify()
  const navigate = useNavigate()
  const { isDemo } = useAuth()

  // Shared inbox state (threads, readMap, unread count) lives in InboxContext
  const { threads, readMap, markRead, refresh: ctxRefresh, updateThread, initialLoading } = useInbox()

  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  async function loadThreads(quiet = false) {
    if (quiet) setRefreshing(true)
    try { await ctxRefresh() } catch (e) { notify('Failed to refresh inbox: ' + e.message, 'error') }
    finally { setRefreshing(false) }
  }

  function isUnread(thread) {
    if (!thread.latestInbound) return false
    const last = readMap[`${thread.kind}:${thread.id}`]
    return !last || new Date(thread.latestInbound.created_at) > new Date(last)
  }

  async function selectThread(thread) {
    setSelected(thread)
    markRead(thread)
    setMsgLoading(true)
    setMessages([])
    setReply('')
    try {
      const msgs = thread.kind === 'email'
        ? await getEmailMessages(thread.id)
        : await getNurtureMessages(thread.id)
      setMessages(msgs)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
    } catch (e) {
      notify('Failed to load messages: ' + e.message, 'error')
    } finally {
      setMsgLoading(false)
    }
  }

  async function handleSend() {
    if (!reply.trim() || !selected || sending || isDemo) return
    setSending(true)
    const bodyText = reply.trim()
    const bodyHtml = bodyText.replace(/\n/g, '<br>')
    const subject = selected.latestMessage?.subject || ''

    // Show the sent message in the thread immediately (optimistic update).
    // n8n responds before it saves to the DB, so we can't rely on a refetch.
    const optimistic = {
      id: `opt-${Date.now()}`,
      direction: 'outbound',
      body: bodyHtml,
      subject,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setReply('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      await sendManualReply({
        kind: selected.kind,
        id: selected.id,
        to: selected.email,
        subject,
        body: bodyHtml,
      })
      // Silently refresh after n8n finishes writing to DB (~3 s) to swap in the real record.
      setTimeout(async () => {
        try {
          const msgs = selected.kind === 'email'
            ? await getEmailMessages(selected.id)
            : await getNurtureMessages(selected.id)
          setMessages(msgs)
          loadThreads(true)
        } catch {}
      }, 3500)
    } catch (e) {
      // Roll back the optimistic message and restore the draft
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setReply(bodyText)
      notify('Send failed: ' + e.message, 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleToggleAI() {
    if (!selected || togglingAI) return
    setTogglingAI(true)
    const newVal = !selected.aiReplyEnabled
    try {
      if (selected.kind === 'email') {
        await updateEmailLead(selected.id, { ai_reply_enabled: newVal })
      } else {
        await updateNurtureClient(selected.id, { ai_reply_enabled: newVal })
      }
      updateThread(selected.kind, selected.id, { aiReplyEnabled: newVal })
      setSelected(prev => ({ ...prev, aiReplyEnabled: newVal }))
    } catch (e) {
      notify('Failed to update AI reply: ' + e.message, 'error')
    } finally {
      setTogglingAI(false)
    }
  }

  function handleReplyKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // Filtering
  const unreadCount = threads.filter(isUnread).length
  const filtered = threads.filter(t => {
    if (search) {
      const q = search.toLowerCase()
      if (!(t.name || '').toLowerCase().includes(q) &&
          !(t.email || '').toLowerCase().includes(q) &&
          !(t.campaign?.name || '').toLowerCase().includes(q)) return false
    }
    if (filter === 'unread' && !isUnread(t)) return false
    if (filter === 'inbound' && t.latestMessage?.direction !== 'inbound') return false
    if (filter === 'outbound' && t.latestMessage?.direction !== 'outbound') return false
    if (typeFilter === 'outreach' && t.kind !== 'email') return false
    if (typeFilter === 'nurture' && t.kind !== 'nurture') return false
    return true
  })

  // Group messages by day for separators
  function buildDays(msgs) {
    const days = []
    let lastLabel = null
    for (const m of msgs) {
      const lbl = dayLabel(m.created_at)
      if (lbl !== lastLabel) { days.push({ type: 'sep', label: lbl }); lastLabel = lbl }
      days.push({ type: 'msg', msg: m })
    }
    return days
  }

  const isNurture = selected?.kind === 'nurture'

  return (
    <div className="-m-4 md:-m-6 flex overflow-hidden h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">

      {/* ── LEFT PANEL: Thread List ── */}
      <div className={`flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
        w-full md:w-[340px] lg:w-[380px] flex-shrink-0
        ${selected ? 'hidden md:flex' : 'flex'}`}>

        {/* Panel header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <InboxIcon size={18} className="text-slate-600 dark:text-slate-300" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Inbox</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title="Filter"
              >
                <SlidersHorizontal size={15} />
              </button>
              <button
                onClick={() => loadThreads(true)}
                disabled={refreshing}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              {/* Message filter */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'inbound', label: 'Received' },
                  { id: 'outbound', label: 'Sent' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${filter === f.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Type filter */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'outreach', label: '⚡ Outreach' },
                  { id: 'nurture', label: '❤ Nurture' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${typeFilter === f.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Loading conversations…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-6 text-center">
              <Mail size={28} className="opacity-40" />
              <p className="text-sm">
                {search || filter !== 'all' || typeFilter !== 'all'
                  ? 'No conversations match your filters.'
                  : 'No conversations yet. Once leads reply or you send emails, threads will appear here.'}
              </p>
            </div>
          ) : (
            filtered.map(t => (
              <ThreadItem
                key={`${t.kind}:${t.id}`}
                thread={t}
                isSelected={selected?.kind === t.kind && selected?.id === t.id}
                isUnread={isUnread(t)}
                onClick={() => selectThread(t)}
              />
            ))
          )}
        </div>

        {/* Stats footer */}
        {!loading && threads.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {filtered.length} of {threads.length} conversation{threads.length !== 1 ? 's' : ''}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  const next = {}
                  threads.forEach(t => { next[`${t.kind}:${t.id}`] = new Date().toISOString() })
                  setReadMap(next)
                  try { localStorage.setItem(READ_KEY, JSON.stringify(next)) } catch {}
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Thread Detail ── */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-w-0
        ${!selected ? 'hidden md:flex' : 'flex'}`}>

        {!selected ? (
          <EmptyState />
        ) : (
          <>
            {/* Thread header */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 shadow-sm">
              {/* Back button (mobile) */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(selected.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                {getInitials(selected.name)}
              </div>

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">{selected.name}</span>
                  {selected.campaign && (
                    <button
                      onClick={() => navigate(`/email-campaigns/${selected.campaignId}`)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-75
                        ${isNurture
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      title="Go to campaign"
                    >
                      {isNurture ? <Heart size={10} /> : <Zap size={10} />}
                      {selected.campaign.name}
                      <ArrowUpRight size={10} />
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{selected.email}</div>
              </div>

              {/* AI toggle + refresh */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* AI Reply toggle */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Bot size={13} className={selected.aiReplyEnabled ? 'text-emerald-500' : 'text-slate-400'} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">AI Reply</span>
                  <button
                    onClick={handleToggleAI}
                    disabled={togglingAI || isDemo}
                    title={selected.aiReplyEnabled ? 'Disable AI auto-reply for this lead' : 'Enable AI auto-reply for this lead'}
                    className={`relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-60
                      ${selected.aiReplyEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-200
                      ${selected.aiReplyEnabled ? 'left-[18px]' : 'left-0.5'}`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => selectThread(selected)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="Refresh thread"
                >
                  <RefreshCw size={15} className={msgLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto py-4" style={{ background: 'var(--inbox-chat-bg, transparent)' }}>
              {msgLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-center px-6">
                  <Mail size={28} className="opacity-40" />
                  <p className="text-sm">No messages in this thread yet.</p>
                </div>
              ) : (
                <>
                  {buildDays(messages).map((item, i) =>
                    item.type === 'sep'
                      ? <DateSep key={`sep-${i}`} label={item.label} />
                      : <MessageBubble key={item.msg.id || i} msg={item.msg} />
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </>
              )}
            </div>

            {/* Compose bar */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 shadow-sm">
              {isDemo ? (
                <div className="text-center text-xs text-slate-400 py-2">Replies are disabled in demo mode.</div>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={handleReplyKey}
                      rows={3}
                      placeholder={`Reply to ${selected.name}… (Ctrl+Enter to send)`}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition leading-relaxed"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm mb-0.5"
                    title="Send (Ctrl+Enter)"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              )}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="text-[10px] text-slate-400">
                  {isNurture ? '❤ Nurture' : '⚡ Outreach'} · {selected.email}
                </p>
                {reply.trim() && (
                  <p className="text-[10px] text-slate-400">Ctrl+Enter to send</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
