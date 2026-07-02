import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, MessageSquare, Mail, RefreshCw, ChevronRight, Settings,
  Plus, Trash2, Save, Clock, CheckCircle2, AlertCircle, X, Info,
  Users, ListChecks, FileText,
} from 'lucide-react'
import {
  getFollowUpSequenceContacts,
  getFollowupSettings,
  saveFollowupSettings,
  getFollowupLogs,
} from '../services/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function avatarColor(name) {
  const c = ['bg-rose-500','bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-cyan-500','bg-pink-500','bg-orange-500']
  return c[(name || '').charCodeAt(0) % c.length]
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}
function hoursToDisplay(h) {
  if (!h && h !== 0) return { value: 24, unit: 'hours' }
  if (h < 24) return { value: h, unit: 'hours' }
  return { value: Math.round((h / 24) * 10) / 10, unit: 'days' }
}
function displayToHours(value, unit) {
  return unit === 'days' ? Number(value) * 24 : Number(value)
}

function computeDue(contact, settings) {
  const step = contact.followup_step ?? 0
  const next = settings.find(s => s.step_number === step + 1 && s.is_active)
  if (!next) return null
  const refStr = contact.last_followup_date || contact.last_action_date || contact.created_at
  if (!refStr) return null
  const hoursSince = (Date.now() - new Date(refStr)) / 3_600_000
  return hoursSince >= next.wait_hours ? next : null
}

function nextDueIn(contact, settings) {
  const step = contact.followup_step ?? 0
  const next = settings.find(s => s.step_number === step + 1 && s.is_active)
  if (!next) return null
  const refStr = contact.last_followup_date || contact.last_action_date || contact.created_at
  if (!refStr) return null
  const hoursSince = (Date.now() - new Date(refStr)) / 3_600_000
  const remaining = next.wait_hours - hoursSince
  if (remaining <= 0) return { label: next.label, overdue: true }
  if (remaining < 1) return { label: next.label, in: `${Math.round(remaining * 60)}m`, overdue: false }
  if (remaining < 24) return { label: next.label, in: `${Math.round(remaining)}h`, overdue: false }
  return { label: next.label, in: `${Math.round(remaining / 24)}d`, overdue: false }
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'logs',     label: 'Logs',     icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ─── Contact row ─────────────────────────────────────────────────────────────

function ContactRow({ contact, settings, onClick }) {
  const step  = contact.followup_step ?? 0
  const due   = computeDue(contact, settings)
  const ndi   = nextDueIn(contact, settings)
  const maxStep = settings.length
  const pct   = maxStep > 0 ? Math.min((step / maxStep) * 100, 100) : 0

  return (
    <tr
      className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${contact.avatar_color || avatarColor(contact.name)}`}>
            {contact.avatar || getInitials(contact.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{contact.name}</div>
            <div className="text-xs text-slate-400 truncate">{contact.phone || contact.email || '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            Step {step}
          </span>
          {step > 0 && settings[step - 1] && (
            <span className="text-xs text-slate-400 hidden sm:inline">{settings[step - 1].label}</span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-slate-400">{step}/{maxStep}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {fmtDate(contact.last_followup_date || contact.last_action_date)}
      </td>
      <td className="px-4 py-3">
        {ndi ? (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ndi.overdue
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
            {ndi.overdue ? `Due: ${ndi.label}` : `${ndi.in}: ${ndi.label}`}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Sequence done</span>
        )}
      </td>
    </tr>
  )
}

// ─── Contact detail modal ────────────────────────────────────────────────────

function ContactModal({ contact, settings, onClose }) {
  const step = contact.followup_step ?? 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${contact.avatar_color || avatarColor(contact.name)}`}>
              {contact.avatar || getInitials(contact.name)}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{contact.name}</div>
              <div className="text-xs text-slate-400">{contact.phone} {contact.email ? `· ${contact.email}` : ''}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={17} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Step {step} of {settings.length}
            </span>
            {contact.last_action_type && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                {contact.last_action_type === 'SMS'
                  ? <MessageSquare size={12} className="text-teal-500" />
                  : <Mail size={12} className="text-purple-500" />}
                Last: {contact.last_action_type}
              </span>
            )}
            <span className="ml-auto text-xs text-slate-400">{fmtDate(contact.last_followup_date || contact.last_action_date)}</span>
          </div>
          {contact.last_message_sent && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-1.5">Last message sent</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{contact.last_message_sent}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              ['Replied', contact.customer_replied === 'Yes' ? 'Yes' : 'No', contact.customer_replied === 'Yes' ? 'text-emerald-600' : 'text-slate-500'],
              ['Unsubscribed', contact.unsubscribe === 'Yes' ? 'Yes' : 'No', contact.unsubscribe === 'Yes' ? 'text-red-600' : 'text-slate-500'],
              ['Status', contact.lead_status || '—', 'text-slate-700 dark:text-slate-300'],
            ].map(([lbl, val, cls]) => (
              <div key={lbl} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                <div className="text-slate-400 mb-1">{lbl}</div>
                <div className={`font-semibold ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Settings editor ─────────────────────────────────────────────────────────

const TEMPLATE_VARS = '{{name}}  {{service}}  {{booking_link}}'

function StepCard({ step, idx, onChange, onDelete }) {
  const { value: wVal, unit: wUnit } = hoursToDisplay(step.wait_hours)
  const [waitVal, setWaitVal] = useState(wVal)
  const [waitUnit, setWaitUnit] = useState(wUnit)

  function commitWait(v, u) {
    onChange({ ...step, wait_hours: displayToHours(v, u) })
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {idx + 1}
        </span>
        <input
          className="flex-1 text-sm font-semibold bg-transparent border-0 border-b border-slate-200 dark:border-slate-600 focus:border-blue-500 outline-none pb-1 text-slate-900 dark:text-white"
          value={step.label}
          placeholder="Step label (e.g. First Follow-up)"
          onChange={e => onChange({ ...step, label: e.target.value })}
        />
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Wait time */}
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-500 flex-shrink-0">Wait</span>
        <input
          type="number"
          min="0"
          step="0.5"
          className="w-20 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={waitVal}
          onChange={e => { setWaitVal(e.target.value); commitWait(e.target.value, waitUnit) }}
        />
        <select
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={waitUnit}
          onChange={e => { setWaitUnit(e.target.value); commitWait(waitVal, e.target.value) }}
        >
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
        <span className="text-xs text-slate-400">after previous action</span>
      </div>

      {/* SMS */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={step.sms_enabled}
            onChange={e => onChange({ ...step, sms_enabled: e.target.checked })}
            className="w-4 h-4 rounded accent-teal-500"
          />
          <MessageSquare size={14} className="text-teal-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send SMS</span>
        </label>
        {step.sms_enabled && (
          <textarea
            rows={3}
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            placeholder="SMS message template…"
            value={step.sms_template}
            onChange={e => onChange({ ...step, sms_template: e.target.value })}
          />
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={step.email_enabled}
            onChange={e => onChange({ ...step, email_enabled: e.target.checked })}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <Mail size={14} className="text-purple-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Email</span>
        </label>
        {step.email_enabled && (
          <div className="space-y-2">
            <input
              type="text"
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Email subject…"
              value={step.email_subject}
              onChange={e => onChange({ ...step, email_subject: e.target.value })}
            />
            <textarea
              rows={4}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Email body…"
              value={step.email_template}
              onChange={e => onChange({ ...step, email_template: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500">
          <input
            type="checkbox"
            checked={step.is_active}
            onChange={e => onChange({ ...step, is_active: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-blue-500"
          />
          Active (run in sequence)
        </label>
      </div>
    </div>
  )
}

function SettingsTab({ settings, onSaved }) {
  const [steps, setSteps] = useState(() => settings.map(s => ({ ...s })))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const dirty = JSON.stringify(steps) !== JSON.stringify(settings.map(s => ({ ...s })))

  function handleChange(idx, updated) {
    setSteps(prev => prev.map((s, i) => i === idx ? updated : s))
  }
  function handleDelete(idx) {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }
  function handleAdd() {
    setSteps(prev => [...prev, {
      step_number: prev.length + 1,
      label: `Follow-up ${prev.length + 1}`,
      wait_hours: 24,
      sms_enabled: true,
      sms_template: 'Hey {{name}}, just wanted to follow up about {{service}}. Are you still interested?',
      email_enabled: false,
      email_subject: '',
      email_template: '',
      is_active: true,
    }])
  }
  async function handleSave() {
    setSaving(true); setErr('')
    try {
      const saved = await saveFollowupSettings(steps)
      onSaved(saved)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Sequence Steps</h3>
          <p className="text-xs text-slate-400 mt-0.5">These settings apply to all leads. Changes take effect on the next n8n run.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <Info size={12} />
            <span className="font-mono">{TEMPLATE_VARS}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all ${saved ? 'bg-emerald-500 text-white' : dirty ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={15} /> {err}
        </div>
      )}

      {steps.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <ListChecks size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No follow-up steps defined. Add your first step below.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <StepCard
              key={idx}
              step={step}
              idx={idx}
              onChange={updated => handleChange(idx, updated)}
              onDelete={() => handleDelete(idx)}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <Plus size={16} /> Add Follow-up Step
      </button>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Followups() {
  const [tab, setTab] = useState('overview')
  const [contacts, setContacts] = useState([])
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)
  const [stageFilter, setStageFilter] = useState(null)
  const [logSearch, setLogSearch] = useState('')
  const [logStepFilter, setLogStepFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      getFollowUpSequenceContacts(),
      getFollowupSettings(),
      getFollowupLogs(),
    ])
      .then(([c, s, l]) => { setContacts(c); setSettings(s); setLogs(l) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Stats
  const dueNow = contacts.filter(c => computeDue(c, settings))
  const sentToday = logs.filter(l => {
    const d = new Date(l.sent_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const replied = contacts.filter(c => c.customer_replied === 'Yes')

  // Stage counts for pipeline bar
  const stageMap = {}
  contacts.forEach(c => {
    const k = c.followup_step ?? 0
    stageMap[k] = (stageMap[k] || 0) + 1
  })

  // Filtered contacts for overview table
  const filteredContacts = stageFilter === null
    ? contacts
    : contacts.filter(c => (c.followup_step ?? 0) === stageFilter)

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    if (logStepFilter !== 'all' && String(l.step_number) !== logStepFilter) return false
    if (logSearch && !l.contact_name.toLowerCase().includes(logSearch.toLowerCase())) return false
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading…
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Follow-up Sequences</h1>
          <p className="text-sm text-slate-400 mt-0.5">Automated multi-step SMS + email follow-ups for all active leads</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Leads', value: contacts.length, color: 'bg-slate-900 dark:bg-slate-700', sub: 'in sequence' },
          { label: 'Due Now', value: dueNow.length, color: dueNow.length > 0 ? 'bg-red-500' : 'bg-slate-500', sub: 'need action' },
          { label: 'Sent Today', value: sentToday.length, color: 'bg-blue-500', sub: 'messages' },
          { label: 'Replied', value: replied.length, color: 'bg-emerald-500', sub: 'contacts' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className={`${color} rounded-xl p-4 shadow-sm`}>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-white/90 font-medium mt-0.5">{label}</div>
            <div className="text-xs text-white/60 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Pipeline stage filter */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Filter by Stage</div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setStageFilter(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stageFilter === null ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                All ({contacts.length})
              </button>

              <button
                onClick={() => setStageFilter(0)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  stageFilter === 0 ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                New ({stageMap[0] || 0})
              </button>

              {settings.map((s, i) => (
                <div key={s.step_number} className="flex items-center gap-1.5 flex-shrink-0">
                  <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
                  <button
                    onClick={() => setStageFilter(s.step_number)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      stageFilter === s.step_number
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Step {s.step_number}: {s.label} ({stageMap[s.step_number] || 0})
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                {stageFilter === null ? 'All Active Leads' : stageFilter === 0 ? 'New Leads' : `After Step ${stageFilter}`}
              </h3>
              <span className="text-xs text-slate-400">{filteredContacts.length} contacts</span>
            </div>
            {filteredContacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-medium">Contact</th>
                      <th className="text-left px-4 py-3 font-medium">Stage</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Sent</th>
                      <th className="text-left px-4 py-3 font-medium">Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <ContactRow
                        key={c.id}
                        contact={c}
                        settings={settings}
                        onClick={() => setSelectedContact(c)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No contacts at this stage</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Logs tab ── */}
      {tab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search contact name…"
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="flex-1 min-w-[180px] text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={logStepFilter}
              onChange={e => setLogStepFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Steps</option>
              {settings.map(s => (
                <option key={s.step_number} value={String(s.step_number)}>Step {s.step_number}: {s.label}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">{filteredLogs.length} entries</span>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            {filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-medium">Contact</th>
                      <th className="text-left px-4 py-3 font-medium">Step</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Message</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(log.contact_name)}`}>
                              {getInitials(log.contact_name)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{log.contact_name || '—'}</div>
                              <div className="text-xs text-slate-400">{log.phone || log.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {log.step_number}
                          </span>
                          <div className="text-xs text-slate-400 mt-0.5">{log.step_label}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {log.sms_text && (
                              <span className="flex items-center gap-1 text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full w-fit">
                                <MessageSquare size={10} /> SMS
                              </span>
                            )}
                            {log.email_subject && (
                              <span className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full w-fit">
                                <Mail size={10} /> Email
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                          {log.sms_text && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">"{log.sms_text}"</p>
                          )}
                          {log.email_subject && !log.sms_text && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Subj: {log.email_subject}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            log.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(log.sent_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No follow-up logs yet</p>
                <p className="text-xs mt-1 text-slate-300 dark:text-slate-600">Logs appear here after the n8n workflow runs</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === 'settings' && (
        <SettingsTab settings={settings} onSaved={newSettings => setSettings(newSettings)} />
      )}

      {selectedContact && (
        <ContactModal
          contact={selectedContact}
          settings={settings}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  )
}
