import { useState, useEffect } from 'react'
import { X, Loader2, MessageSquare, Mail, RefreshCw, ChevronRight } from 'lucide-react'
import { getFollowUpExecutions, getFollowUpSequenceContacts } from '../services/api'

const stepOrder = ['START', 'SMS_1', 'EMAIL_1', 'SMS_2', 'EMAIL_2', 'SMS_3']

const SEQUENCE_STEPS = [
  { id: 'SMS_1',   channel: 'SMS',   delay: '2 hrs'   },
  { id: 'EMAIL_1', channel: 'Email', delay: '+1 day'  },
  { id: 'SMS_2',   channel: 'SMS',   delay: '+2 days' },
  { id: 'EMAIL_2', channel: 'Email', delay: '+3 days' },
  { id: 'SMS_3',   channel: 'SMS',   delay: '+5 days' },
]
const stepColors = {
  START:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  SMS_1:   'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  EMAIL_1: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS_2:   'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  EMAIL_2: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS_3:   'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

function stepIndex(step) {
  const i = stepOrder.indexOf(step)
  return i === -1 ? 0 : i
}

// ── Message Preview Modal ─────────────────────────────────────────────────────

function MessageModal({ contact, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{contact.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{contact.phone || contact.email || 'No contact info'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${stepColors[contact.current_step] || 'bg-slate-100 text-slate-600'}`}>
              {contact.current_step || 'START'}
            </span>
            {contact.last_action_type && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                {contact.last_action_type === 'SMS'
                  ? <MessageSquare size={13} className="text-teal-500" />
                  : <Mail size={13} className="text-purple-500" />}
                Sent via {contact.last_action_type}
              </span>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {contact.last_action_date
                ? new Date(contact.last_action_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>

          {contact.last_message_sent ? (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-2">Message Sent</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{contact.last_message_sent}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No message recorded yet.</p>
          )}

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-slate-400 mb-1">Replied</div>
              <div className={`font-semibold ${contact.customer_replied === 'Yes' ? 'text-emerald-600' : 'text-slate-500'}`}>
                {contact.customer_replied || 'No'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-slate-400 mb-1">Unsubscribed</div>
              <div className={`font-semibold ${contact.unsubscribe === 'Yes' ? 'text-red-600' : 'text-slate-500'}`}>
                {contact.unsubscribe || 'No'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <div className="text-slate-400 mb-1">Status</div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{contact.lead_status || '—'}</div>
            </div>
          </div>

          {(contact.phone || contact.email) && (
            <div className="flex items-center gap-3 pt-1">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                  <MessageSquare size={14} /> {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                  <Mail size={14} /> {contact.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Followups() {
  const [seqContacts, setSeqContacts] = useState([])
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewContact, setPreviewContact] = useState(null)
  const [seqFilter, setSeqFilter] = useState('All')

  useEffect(() => {
    Promise.all([getFollowUpSequenceContacts(), getFollowUpExecutions()])
      .then(([sc, ex]) => { setSeqContacts(sc); setExecutions(ex) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalInSeq   = seqContacts.length
  const viaSMS       = seqContacts.filter(c => c.last_action_type === 'SMS').length
  const viaEmail     = seqContacts.filter(c => c.last_action_type === 'EMAIL').length
  const replied      = seqContacts.filter(c => c.customer_replied === 'Yes').length

  const filteredSeq = seqFilter === 'All' ? seqContacts : seqContacts.filter(c => c.current_step === seqFilter)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading sequence...
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'In Sequence',   count: totalInSeq, color: 'bg-slate-900 dark:bg-slate-700' },
          { label: 'Sent via SMS',  count: viaSMS,     color: 'bg-teal-500' },
          { label: 'Sent via Email',count: viaEmail,   color: 'bg-purple-500' },
          { label: 'Replied',       count: replied,    color: 'bg-emerald-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 shadow-sm`}>
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-sm text-white opacity-80 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Step filter — timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {/* All */}
          <button
            onClick={() => setSeqFilter('All')}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              seqFilter === 'All'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-base font-bold leading-none">{seqContacts.length}</span>
            <span className="text-xs font-mono mt-0.5">All</span>
          </button>

          {SEQUENCE_STEPS.map(step => {
            const count = seqContacts.filter(c => c.current_step === step.id).length
            const isSMS = step.channel === 'SMS'
            const isActive = seqFilter === step.id
            const StepIcon = isSMS ? MessageSquare : Mail
            return (
              <div key={step.id} className="flex items-center gap-1.5 flex-shrink-0">
                <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                <button
                  onClick={() => setSeqFilter(step.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? isSMS
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'bg-purple-500 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <StepIcon size={11} className={isActive ? 'text-white/80' : isSMS ? 'text-teal-500' : 'text-purple-500'} />
                    <span className="text-xs font-mono font-semibold">{step.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}>{count}</span>
                  </div>
                  <span className={`text-xs font-sans ${isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>{step.delay}</span>
                </button>
              </div>
            )
          })}

          <span className="text-xs text-slate-400 ml-auto pl-3 flex-shrink-0 whitespace-nowrap">{filteredSeq.length} contacts</span>
        </div>
      </div>

      {/* Active contacts in sequence */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Active Contacts in Sequence</h3>
        </div>
        {filteredSeq.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {filteredSeq.map(c => {
              const initials = c.avatar || getInitials(c.name)
              const avatarColor = c.avatar_color || getAvatarColor(c.name)
              const progress = stepIndex(c.current_step)
              return (
                <div
                  key={c.id}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                  onClick={() => setPreviewContact(c)}
                >
                  <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${stepColors[c.current_step] || 'bg-slate-100 text-slate-600'}`}>
                        {c.current_step || 'START'}
                      </span>
                      {c.last_action_type && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          {c.last_action_type === 'SMS'
                            ? <MessageSquare size={11} className="text-teal-500" />
                            : <Mail size={11} className="text-purple-500" />}
                          {c.last_action_type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-0.5">
                        {stepOrder.slice(1).map((s, i) => (
                          <div key={s} className={`h-1 w-5 rounded-full ${i < progress ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{progress}/{stepOrder.length - 1} steps</span>
                    </div>
                    {c.last_message_sent && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate max-w-sm">
                        "{c.last_message_sent}"
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="block text-xs text-blue-500 hover:underline">{c.phone}</a>
                    )}
                    {c.email && (
                      <span className="block text-xs text-slate-400 mt-0.5 truncate max-w-[9rem]">{c.email}</span>
                    )}
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {c.last_action_date ? new Date(c.last_action_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={30} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No contacts in the follow-up sequence yet</p>
          </div>
        )}
      </div>

      {/* Execution log */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Execution Log</h3>
          <span className="text-xs text-slate-400">{executions.length} runs</span>
        </div>
        {executions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium">Step / Channel</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Message Preview</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(ex => {
                  const isErr = ex.status === 'error'
                  const [step, channel] = (ex.notes || '').split(' via ')
                  const matchedContact = seqContacts.find(c => c.name === ex.contact_name)
                  const initials = matchedContact ? (matchedContact.avatar || getInitials(matchedContact.name)) : getInitials(ex.contact_name)
                  const avatarColor = matchedContact ? (matchedContact.avatar_color || getAvatarColor(ex.contact_name)) : getAvatarColor(ex.contact_name)
                  return (
                    <tr
                      key={ex.id}
                      className={`border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer ${isErr ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                      onClick={() => matchedContact && setPreviewContact(matchedContact)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{ex.contact_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {step && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${stepColors[step?.trim()] || 'bg-slate-100 text-slate-600'}`}>
                              {step?.trim()}
                            </span>
                          )}
                          {channel && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              {channel?.trim() === 'SMS'
                                ? <MessageSquare size={11} className="text-teal-500" />
                                : <Mail size={11} className="text-purple-500" />}
                              {channel?.trim()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {matchedContact?.last_message_sent ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            "{matchedContact.last_message_sent}"
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isErr ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                          {isErr ? 'Error' : 'Success'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {ex.timestamp ? new Date(ex.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm">No executions logged yet</div>
        )}
      </div>

      {previewContact && (
        <MessageModal contact={previewContact} onClose={() => setPreviewContact(null)} />
      )}
    </div>
  )
}
