import { useState, useEffect, useRef } from 'react'
import { Phone, Mail, Loader2, GripVertical, X, Calendar, MessageSquare, Tag, User, Activity } from 'lucide-react'
import { getContacts, updateContact } from '../services/api'

const pipelineStages = ['New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Booked', 'Closed Won', 'Closed Lost']

const stageColors = {
  'New Lead':    'border-t-slate-400',
  'Contacted':   'border-t-blue-400',
  'Follow-Up':   'border-t-cyan-500',
  'Interested':  'border-t-orange-400',
  'Booked':      'border-t-violet-500',
  'Closed Won':  'border-t-emerald-500',
  'Closed Lost': 'border-t-red-400',
}
const stageBg = {
  'New Lead':    'bg-slate-50 dark:bg-slate-700/50',
  'Contacted':   'bg-blue-50/50 dark:bg-blue-900/20',
  'Follow-Up':   'bg-cyan-50/50 dark:bg-cyan-900/20',
  'Interested':  'bg-orange-50/50 dark:bg-orange-900/20',
  'Booked':      'bg-violet-50/50 dark:bg-violet-900/20',
  'Closed Won':  'bg-emerald-50/50 dark:bg-emerald-900/20',
  'Closed Lost': 'bg-red-50/30 dark:bg-red-900/10',
}
const stageDrop = {
  'New Lead':    'ring-2 ring-slate-400 bg-slate-50 dark:bg-slate-700/80',
  'Contacted':   'ring-2 ring-blue-400 bg-blue-50/80 dark:bg-blue-900/40',
  'Follow-Up':   'ring-2 ring-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/40',
  'Interested':  'ring-2 ring-orange-400 bg-orange-50/80 dark:bg-orange-900/40',
  'Booked':      'ring-2 ring-violet-500 bg-violet-50/80 dark:bg-violet-900/40',
  'Closed Won':  'ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/40',
  'Closed Lost': 'ring-2 ring-red-400 bg-red-50/80 dark:bg-red-900/30',
}
const stageHeaderColor = {
  'New Lead':    'text-slate-600 dark:text-slate-300',
  'Contacted':   'text-blue-700 dark:text-blue-400',
  'Follow-Up':   'text-cyan-700 dark:text-cyan-400',
  'Interested':  'text-orange-700 dark:text-orange-400',
  'Booked':      'text-violet-700 dark:text-violet-400',
  'Closed Won':  'text-emerald-700 dark:text-emerald-400',
  'Closed Lost': 'text-red-600 dark:text-red-400',
}
const stageBarColors = {
  'New Lead':    'bg-slate-400',
  'Contacted':   'bg-blue-400',
  'Follow-Up':   'bg-cyan-500',
  'Interested':  'bg-orange-400',
  'Booked':      'bg-violet-500',
  'Closed Won':  'bg-emerald-500',
  'Closed Lost': 'bg-red-400',
}
const stageBadge = {
  'New Lead':    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'Contacted':   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Follow-Up':   'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Interested':  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Booked':      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Closed Won':  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Closed Lost': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}
const sourceColors = {
  Website:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Facebook:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Email:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  SMS:       'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }
const interestColors = {
  Yes:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  No:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}
function getStage(contact) {
  return pipelineStages.includes(contact.lead_status) ? contact.lead_status : 'New Lead'
}
function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Contact Detail Modal ───────────────────────────────────────────────────

function ContactModal({ contact, onClose }) {
  const initials = contact.avatar || getInitials(contact.name)
  const avatarColor = contact.avatar_color || getAvatarColor(contact.name)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white text-base font-bold flex-shrink-0`}>
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{contact.name || 'Unknown'}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contact.lead_status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${stageBadge[contact.lead_status] || 'bg-slate-100 text-slate-600'}`}>
                    {contact.lead_status}
                  </span>
                )}
                {contact.source && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[contact.source] || 'bg-slate-100 text-slate-600'}`}>
                    {sourceIcons[contact.source]} {contact.source}
                  </span>
                )}
                {contact.interest && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${interestColors[contact.interest] || 'bg-slate-100 text-slate-600'}`}>
                    {contact.interest === 'Yes' ? '✓ Interested' : contact.interest === 'No' ? '✗ Not Interested' : '⏳ Pending'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Contact info */}
          <Section icon={User} title="Contact Info">
            <Row label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : null} />
            <Row label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : null} />
            <Row label="Service" value={contact.service_type} />
          </Section>

          {/* Message / Summary */}
          {(contact.message || contact.summary) && (
            <Section icon={MessageSquare} title="Details">
              {contact.message && <RowBlock label="Initial Message" value={contact.message} />}
              {contact.summary && <RowBlock label="Summary" value={contact.summary} />}
            </Section>
          )}

          {/* Automation status */}
          <Section icon={Activity} title="Automation">
            <Row label="Current Step" value={contact.current_step} />
            <Row label="Customer Replied" value={contact.customer_replied} />
            <Row label="SMS Sent" value={contact.initial_sms_sent} />
            <Row label="Unsubscribed" value={contact.unsubscribe} />
            {contact.last_message_sent && <RowBlock label="Last Message" value={contact.last_message_sent} />}
          </Section>

          {/* Dates */}
          <Section icon={Calendar} title="Timeline">
            <Row label="Created" value={formatDate(contact.created_at)} />
            <Row label="Last Action" value={formatDate(contact.last_action_date)} />
            {contact.last_action_type && <Row label="Action Type" value={contact.last_action_type} />}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</span>
      </div>
      <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2 space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, href }) {
  if (!value || value === 'No' && label === 'Unsubscribed') {
    // still show but muted
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{label}</span>
      {href ? (
        <a href={href} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">{value || '—'}</a>
      ) : (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-right truncate">{value || '—'}</span>
      )}
    </div>
  )
}

function RowBlock({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{value}</p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

export default function Pipelines() {
  const [stageData, setStageData] = useState(() => {
    const map = {}
    pipelineStages.forEach(s => { map[s] = [] })
    return map
  })
  const [loading, setLoading] = useState(true)
  const [movingId, setMovingId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const dragInfo = useRef(null)
  const didDrag = useRef(false) // distinguish click from drag

  useEffect(() => {
    getContacts().then(data => {
      const map = {}
      pipelineStages.forEach(s => { map[s] = [] })
      data.forEach(c => { map[getStage(c)].push(c) })
      setStageData(map)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function applyMove(contactId, fromStage, toStage) {
    if (fromStage === toStage) return
    if (movingId === contactId) return

    setMovingId(contactId)
    const snapshot = stageData

    setStageData(prev => {
      const contact = prev[fromStage].find(c => c.id === contactId)
      if (!contact) return prev
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter(c => c.id !== contactId),
        [toStage]: [...prev[toStage], { ...contact, lead_status: toStage }],
      }
    })

    try {
      await updateContact(contactId, { lead_status: toStage })
    } catch (err) {
      console.error('Failed to update lead status:', err)
      setStageData(snapshot)
    } finally {
      setMovingId(null)
    }
  }

  function onDragStart(e, contactId, fromStage) {
    dragInfo.current = { contactId, fromStage }
    didDrag.current = true
    setDraggingId(contactId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnd() {
    setDraggingId(null)
    setDragOverStage(null)
    dragInfo.current = null
    // keep didDrag true briefly so onClick can detect it
    setTimeout(() => { didDrag.current = false }, 0)
  }

  function onDragOver(e, stage) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  function onDragLeave(e, stage) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(prev => prev === stage ? null : prev)
    }
  }

  function onDrop(e, toStage) {
    e.preventDefault()
    setDragOverStage(null)
    if (!dragInfo.current) return
    const { contactId, fromStage } = dragInfo.current
    applyMove(contactId, fromStage, toStage)
  }

  function onCardClick(contact) {
    if (didDrag.current) return
    setSelectedContact(contact)
  }

  const totalValue = Object.values(stageData).flat().length
  const wonCount = stageData['Closed Won']?.length || 0

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading pipeline...
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 md:gap-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 md:px-5 py-3 flex-wrap">
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total in Pipeline</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">{totalValue}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Closed Won</span>
          <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">{wonCount}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Win Rate</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">
            {totalValue ? Math.round((wonCount / totalValue) * 100) : 0}%
          </span>
        </div>
        <div className="flex-1 min-w-32">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
            {pipelineStages.map(stage => {
              const count = stageData[stage]?.length || 0
              const pct = totalValue ? (count / totalValue) * 100 : 0
              return pct > 0 ? (
                <div key={stage} className={`${stageBarColors[stage]} h-full`} style={{ width: `${pct}%` }} title={`${stage}: ${count}`} />
              ) : null
            })}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipelineStages.map((stage) => {
          const cards = stageData[stage] || []
          const isOver = dragOverStage === stage
          return (
            <div key={stage} className="flex-shrink-0 w-52 md:w-56">
              <div
                className={`rounded-xl border border-slate-200 dark:border-slate-700 border-t-4 ${stageColors[stage]} shadow-sm overflow-hidden transition-all duration-150 ${isOver ? stageDrop[stage] : 'bg-white dark:bg-slate-800'}`}
                onDragOver={e => onDragOver(e, stage)}
                onDragLeave={e => onDragLeave(e, stage)}
                onDrop={e => onDrop(e, stage)}
              >
                {/* Column header */}
                <div className={`px-3 py-2.5 ${isOver ? '' : stageBg[stage]} border-b border-slate-100 dark:border-slate-700`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wide ${stageHeaderColor[stage]}`}>{stage}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-32 max-h-[calc(100vh-18rem)] overflow-y-auto">
                  {cards.map(c => {
                    const initials = c.avatar || getInitials(c.name)
                    const avatarColor = c.avatar_color || getAvatarColor(c.name)
                    const isDragging = draggingId === c.id
                    const isMoving = movingId === c.id
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => onDragStart(e, c.id, stage)}
                        onDragEnd={onDragEnd}
                        onClick={() => onCardClick(c)}
                        className={`bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 shadow-sm transition-all duration-150 group select-none
                          ${isDragging ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer'}
                          ${isMoving ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0 -ml-1 cursor-grab active:cursor-grabbing" />
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.service_type}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.source && (
                            <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceColors[c.source] || 'bg-slate-100 text-slate-600'}`}>
                              {sourceIcons[c.source]} {c.source}
                            </span>
                          )}
                          {c.interest && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${interestColors[c.interest] || 'bg-slate-100 text-slate-600'}`}>
                              {c.interest}
                            </span>
                          )}
                        </div>

                        {(c.phone || c.email) && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
                            {c.phone && <div className="flex items-center gap-1"><Phone size={10} />{c.phone}</div>}
                            {c.email && <div className="flex items-center gap-1 truncate"><Mail size={10} />{c.email}</div>}
                          </div>
                        )}

                        {isMoving && (
                          <div className="flex justify-center mt-2">
                            <Loader2 size={14} className="animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {cards.length === 0 && (
                    <div className={`py-6 text-center text-xs rounded-lg border-2 border-dashed transition-colors ${isOver ? 'border-current text-current opacity-60' : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}`}>
                      {isOver ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contact detail modal */}
      {selectedContact && (
        <ContactModal contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  )
}
