import { useState, useEffect, useRef, Fragment } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Mail, Plus, X, Loader2, Trash2, Users, Send, ChevronRight,
  Clock, CheckCircle, MessageSquareReply, Pause, Play, Sparkles, Save, Upload, Heart,
  Bold, Italic, Underline, List, ListOrdered, Link2, Eraser,
  ArrowDownLeft, ArrowUpRight, Inbox, Search, ArrowLeft, Reply,
} from 'lucide-react'
import {
  getEmailCampaigns, createEmailCampaign, updateEmailCampaign, deleteEmailCampaign,
  getEmailSteps, createEmailStep, updateEmailStep, deleteEmailStep,
  getEmailLeads, createEmailLeads, deleteEmailLead, updateEmailLeadsByCampaign,
  getNurtureClients, updateNurtureClient, deleteNurtureClient, updateNurtureClientsByCampaign,
  getEmailMessages, getNurtureMessages, updateEmailLead, sendManualReply,
} from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import { useNotify } from '../context/NotifyContext'
import { useAuth } from '../context/AuthContext'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

const leadStatusColors = {
  Active: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Replied: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Unsubscribed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Error: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600', 'from-rose-500 to-pink-600', 'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600', 'from-violet-500 to-purple-600', 'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-pink-600', 'from-lime-500 to-emerald-600',
]

// Deterministic avatar (gradient + initials) from a name/email string.
function avatarOf(str) {
  const s = (str || '?').trim()
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const init = s.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return { g: AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length], init }
}

const DEFAULT_PROMPT = `You are a helpful sales assistant for Aniya Network Solutions. A lead has replied to our outreach email. Reply warmly and professionally, answer their question, and gently steer toward booking a call. Keep it short (2-4 sentences).`

const DEFAULT_NURTURE_PROMPT = `You are writing on behalf of Aniya Network Solutions to a PAST client. Write a warm, genuine relationship check-in: ask how they and their business are doing, and reference our past work together using the note provided. This is NOT a sales pitch — never promote services, pricing, or ask for new business. Keep it short, personal, and human (3-5 sentences).`

const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']]

function hourLabel(h) {
  const hh = ((h % 24) + 24) % 24
  if (hh === 0) return '12 AM'
  if (hh === 12) return '12 PM'
  return hh < 12 ? `${hh} AM` : `${hh - 12} PM`
}

function toggleDayCsv(csv, n) {
  const set = new Set((csv || '').split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean))
  set.has(n) ? set.delete(n) : set.add(n)
  return [...set].sort((a, b) => a - b).join(',')
}

// The next moment the campaign's sending window opens, as an ISO string.
// Mirrors the scheduler's gate: only allowed weekdays (1=Mon..7=Sun) and the
// hour window, evaluated in Etc/GMT+5 (EST/EDT). Supports wrap-around
// windows where start > end (e.g. 6 PM → 5 PM = open overnight). If we're
// already inside an open window on an allowed day, returns now (send asap).
function nextWindowStart(startHour, endHour, daysCsv) {
  const tz = 'Etc/GMT+5'
  const start = Number(startHour) || 0
  const end = endHour == null ? 24 : Number(endHour)
  const allowed = new Set(String(daysCsv ?? '1,2,3,4,5,6,7').split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean))
  const now = new Date()
  if (allowed.size === 0) return now.toISOString()
  const isOpen = (h) => start <= end ? (h >= start && h < end) : (h >= start || h < end)
  // Convert a Toronto wall-clock (y, m[1-12], d, h) to the correct UTC instant.
  const toUtc = (y, m, d, h) => {
    const guess = Date.UTC(y, m - 1, d, h, 0, 0)
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false })
    const p = f.formatToParts(new Date(guess)).reduce((a, x) => (a[x.type] = x.value, a), {})
    const asTz = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second)
    return new Date(guess - (asTz - guess))
  }
  const tparts = (dt) => {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false })
    const p = f.formatToParts(dt).reduce((a, x) => (a[x.type] = x.value, a), {})
    return { y: +p.year, m: +p.month, d: +p.day, hour: (+p.hour) % 24, weekday: ((new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay() + 6) % 7) + 1 }
  }
  // Already inside an open window on an allowed day → send now.
  const np = tparts(now)
  if (allowed.has(np.weekday) && isOpen(np.hour)) return now.toISOString()
  // Otherwise the next opening is hour=start on the next allowed day that's still ahead.
  for (let i = 0; i < 8; i++) {
    const p = tparts(new Date(now.getTime() + i * 86400000))
    if (!allowed.has(p.weekday)) continue
    const winStart = toUtc(p.y, p.m, p.d, start)
    if (winStart.getTime() > now.getTime()) return winStart.toISOString()
  }
  return now.toISOString()
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SendScheduleControls({ daily, days, startH, endH, onDaily, onDays, onStart, onEnd }) {
  const dayset = new Set((days || '').split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean))
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max emails per day</label>
        <input type="number" min="1" value={daily} onChange={e => onDaily(e.target.value)} className={`${inputCls} max-w-[8rem]`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sending days</label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map(([n, lbl]) => (
            <button
              key={n}
              type="button"
              onClick={() => onDays(toggleDayCsv(days, n))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${dayset.has(n) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sending time window</label>
        <div className="flex items-center gap-2">
          <select value={startH} onChange={e => onStart(e.target.value)} className={inputCls}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
          <span className="text-xs text-slate-400">to</span>
          <select value={endH} onChange={e => onEnd(e.target.value)} className={inputCls}>
            {Array.from({ length: 24 }, (_, h) => <option key={h + 1} value={h + 1}>{hourLabel(h + 1)}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Create Campaign Modal ─────────────────────────────────────────────────────

function CampaignModal({ onClose, onCreate }) {
  const notify = useNotify()
  const [form, setForm] = useState({ name: '', type: 'outreach', from_name: '', from_email: '', interval_days: 30, interval_unit: 'days', daily_limit: 50, send_days: '1,2,3,4,5', send_start_hour: 9, send_end_hour: 18, ai_reply_prompt: DEFAULT_PROMPT, ai_reply_enabled: true, reply_delay_minutes: 0, auto_followup_enabled: true })
  const [saving, setSaving] = useState(false)

  const isNurture = form.type === 'nurture'

  function setType(type) {
    setForm(f => {
      // Swap the default prompt when switching type, unless the user already edited it.
      const wasDefault = f.ai_reply_prompt === DEFAULT_PROMPT || f.ai_reply_prompt === DEFAULT_NURTURE_PROMPT || !f.ai_reply_prompt.trim()
      return {
        ...f,
        type,
        ai_reply_prompt: wasDefault ? (type === 'nurture' ? DEFAULT_NURTURE_PROMPT : DEFAULT_PROMPT) : f.ai_reply_prompt,
      }
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      // Outreach starts Paused (review the sequence first); Nurture starts Active (first touch is a month out anyway).
      const created = await createEmailCampaign({
        ...form,
        interval_days: Number(form.interval_days) || 30,
        daily_limit: Number(form.daily_limit) || 50,
        send_start_hour: Number(form.send_start_hour) || 0,
        send_end_hour: Number(form.send_end_hour) || 24,
        reply_delay_minutes: Math.max(0, Number(form.reply_delay_minutes) || 0),
        status: isNurture ? 'Active' : 'Paused',
      })
      onCreate(created)
      onClose()
    } catch (err) {
      notify('Failed to create campaign: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="relative px-6 py-5 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-between overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white"><Mail size={20} /></span>
            <div>
              <h3 className="font-bold text-white">New Email Campaign</h3>
              <p className="text-xs text-blue-100/90">Set up outreach or a client nurture sequence</p>
            </div>
          </div>
          <button onClick={onClose} className="relative p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Campaign Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('outreach')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${!isNurture ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Send size={15} /> Sales Outreach
              </button>
              <button type="button" onClick={() => setType('nurture')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isNurture ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Heart size={15} /> Client Nurture
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {isNurture
                ? 'Recurring relationship check-ins to past clients. Enroll them from the Contacts page.'
                : 'Cold-email sequence with scheduled follow-ups. Add leads on this page.'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Campaign Name <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isNurture ? 'e.g. Past Clients — Monthly Check-in' : 'e.g. Q3 Web Design Outreach'} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Name</label>
              <input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder="Aniya Networks" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Email</label>
              <input type="email" value={form.from_email} onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))} placeholder="hello@aniyanetworks.net" className={inputCls} />
            </div>
          </div>
          {isNurture && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Check-in every</label>
              <div className="flex gap-2">
                <input type="number" min="1" value={form.interval_days} onChange={e => setForm(f => ({ ...f, interval_days: e.target.value }))} className={`${inputCls} w-24`} />
                <select value={form.interval_unit} onChange={e => setForm(f => ({ ...f, interval_unit: e.target.value }))} className={inputCls}>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">First check-in fires this long after a client is enrolled, then repeats. 30 days = monthly.</p>
            </div>
          )}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Sending Schedule</div>
            <SendScheduleControls
              daily={form.daily_limit}
              days={form.send_days}
              startH={form.send_start_hour}
              endH={form.send_end_hour}
              onDaily={v => setForm(f => ({ ...f, daily_limit: v }))}
              onDays={v => setForm(f => ({ ...f, send_days: v }))}
              onStart={v => setForm(f => ({ ...f, send_start_hour: v }))}
              onEnd={v => setForm(f => ({ ...f, send_end_hour: v }))}
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Sparkles size={12} className="text-violet-500" /> {isNurture ? 'AI Check-in Prompt (tone & rules)' : 'AI Reply Prompt'}
            </label>
            <textarea value={form.ai_reply_prompt} onChange={e => setForm(f => ({ ...f, ai_reply_prompt: e.target.value }))} rows={4} className={`${inputCls} resize-none`} />
            <p className="text-xs text-slate-400 mt-1">{isNurture ? 'Guides the AI when writing each monthly check-in, using the client note.' : 'Used by the AI agent to reply when a lead responds.'}</p>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reply Settings</div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">AI auto-reply</div>
                <p className="text-xs text-slate-400">When on, the AI automatically replies to {isNurture ? 'clients' : 'leads'} who respond. New {isNurture ? 'clients' : 'leads'} inherit this.</p>
              </div>
              <Toggle checked={form.ai_reply_enabled} onChange={v => setForm(f => ({ ...f, ai_reply_enabled: v }))} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Reply delay</div>
                <p className="text-xs text-slate-400">Wait this long before sending the AI reply (0 = instant).</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input type="number" min="0" disabled={!form.ai_reply_enabled} value={form.reply_delay_minutes} onChange={e => setForm(f => ({ ...f, reply_delay_minutes: e.target.value }))} className={`${inputCls} w-20 disabled:opacity-50`} />
                <span className="text-xs text-slate-400">min</span>
              </div>
            </div>
          </div>
          {!isNurture && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Automatic follow-ups</div>
                  <p className="text-xs text-slate-400">Send the follow-up sequence automatically until the lead replies. Off = first email only.</p>
                </div>
                <Toggle checked={form.auto_followup_enabled} onChange={v => setForm(f => ({ ...f, auto_followup_enabled: v }))} />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Campaign
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Leads Modal ───────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const splitLine = line => line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'))

  let startIdx = 0
  let map = { name: 0, email: 1, service: 2 }
  const header = splitLine(lines[0]).map(h => h.toLowerCase())
  if (header.some(h => h.includes('email'))) {
    map = {
      name: header.findIndex(h => h.includes('name')),
      email: header.findIndex(h => h.includes('email')),
      service: header.findIndex(h => h.includes('service')),
    }
    startIdx = 1
  }

  const rows = []
  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitLine(lines[i])
    const email = (map.email >= 0 ? cols[map.email] : '') || ''
    if (!email) continue
    rows.push({
      name: (map.name >= 0 ? cols[map.name] : '') || '',
      email,
      service: (map.service >= 0 ? cols[map.service] : '') || '',
    })
  }
  return rows
}

function AddLeadsModal({ campaignId, aiDefault = true, sendStartHour = 0, sendEndHour = 24, sendDays = '1,2,3,4,5,6,7', onClose, onAdded }) {
  const notify = useNotify()
  const [staged, setStaged] = useState([])
  const [draft, setDraft] = useState({ name: '', email: '', service: '' })
  const [saving, setSaving] = useState(false)
  const [csvNote, setCsvNote] = useState('')
  const fileRef = useRef(null)

  const emailValid = /\S+@\S+\.\S+/.test(draft.email.trim())

  function addDraft() {
    if (!emailValid) return
    setStaged(prev => [...prev, { name: draft.name.trim(), email: draft.email.trim(), service: draft.service.trim() }])
    setDraft({ name: '', email: '', service: '' })
  }

  function onDraftKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addDraft() }
  }

  function handleFile(e) {
    setCsvNote('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(String(reader.result))
      if (rows.length === 0) {
        setCsvNote('No rows with an email were found in that file.')
      } else {
        setStaged(prev => [...prev, ...rows])
        setCsvNote(`Imported ${rows.length} lead${rows.length !== 1 ? 's' : ''} from ${file.name}.`)
      }
    }
    reader.onerror = () => setCsvNote('Could not read the file.')
    reader.readAsText(file)
    e.target.value = '' // allow re-uploading the same file
  }

  async function submit() {
    if (staged.length === 0) return
    setSaving(true)
    try {
      // Schedule the first send for the next time the campaign's window is open,
      // so the displayed time matches when it will actually go out.
      const now = nextWindowStart(sendStartHour, sendEndHour, sendDays)
      const rows = staged.map(l => ({
        campaign_id: campaignId,
        name: l.name || '',
        email: l.email,
        service: l.service || '',
        status: 'Active',
        current_step: 0,
        next_send_at: now,
        replied: false,
        emails_sent: 0,
        ai_reply_enabled: aiDefault,
      }))
      const created = await createEmailLeads(rows)
      onAdded(created)
      const skipped = staged.length - created.length
      notify(skipped > 0
        ? `Added ${created.length} lead${created.length !== 1 ? 's' : ''}. Skipped ${skipped} already enrolled in a campaign.`
        : `Added ${created.length} lead${created.length !== 1 ? 's' : ''}.`, 'success')
      onClose()
    } catch (err) {
      notify(err.code === 'DUP_ALL'
        ? 'Those contacts are already enrolled in a campaign — a contact can only be in one campaign at a time.'
        : 'Failed to add leads: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const smallInput = 'w-full px-2.5 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Leads</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Manual entry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Add a lead</label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Upload size={13} /> Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr_1fr_auto] gap-2">
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} onKeyDown={onDraftKeyDown} placeholder="Name" className={smallInput} />
              <input value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} onKeyDown={onDraftKeyDown} placeholder="Email *" type="email" className={smallInput} />
              <input value={draft.service} onChange={e => setDraft(d => ({ ...d, service: e.target.value }))} onKeyDown={onDraftKeyDown} placeholder="Service" className={smallInput} />
              <button
                type="button"
                onClick={addDraft}
                disabled={!emailValid}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={15} /> Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Press Enter to add quickly. CSV columns: <span className="font-mono text-slate-500 dark:text-slate-300">name, email, service</span> (header row optional).
            </p>
            {csvNote && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{csvNote}</p>}
          </div>

          {/* Staged list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Leads to add ({staged.length})
              </label>
              {staged.length > 0 && (
                <button type="button" onClick={() => setStaged([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear all</button>
              )}
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {staged.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No leads staged yet. Add them above or import a CSV.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                  {staged.map((l, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{l.name || <span className="text-slate-400 italic">No name</span>}</div>
                        <div className="text-xs text-slate-400 truncate">{l.email}{l.service ? ` · ${l.service}` : ''}</div>
                      </div>
                      <button type="button" onClick={() => setStaged(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving || staged.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Add {staged.length || ''} Lead{staged.length !== 1 ? 's' : ''}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Rich Text Editor ──────────────────────────────────────────────────────────

function RteButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className="p-1.5 rounded text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      {children}
    </button>
  )
}

function RichTextEditor({ value, onChange, placeholder, chips = [] }) {
  const ref = useRef(null)

  // Seed the editor once; afterwards it's edited in place (avoids cursor jumps).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => onChange(ref.current ? ref.current.innerHTML : '')
  const exec = (cmd, arg) => { ref.current?.focus(); document.execCommand(cmd, false, arg); emit() }
  const insertText = (t) => { ref.current?.focus(); document.execCommand('insertText', false, t); emit() }
  const addLink = () => { const url = window.prompt('Link URL:', 'https://'); if (url) exec('createLink', url) }

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-wrap">
        <RteButton onClick={() => exec('bold')} title="Bold"><Bold size={14} /></RteButton>
        <RteButton onClick={() => exec('italic')} title="Italic"><Italic size={14} /></RteButton>
        <RteButton onClick={() => exec('underline')} title="Underline"><Underline size={14} /></RteButton>
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-0.5" />
        <RteButton onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={14} /></RteButton>
        <RteButton onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></RteButton>
        <RteButton onClick={addLink} title="Insert link"><Link2 size={14} /></RteButton>
        <RteButton onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser size={14} /></RteButton>
        {chips.length > 0 && <span className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-0.5" />}
        {chips.map(c => (
          <button
            key={c}
            type="button"
            onMouseDown={e => { e.preventDefault(); insertText(c) }}
            title={`Insert ${c}`}
            className="px-1.5 py-0.5 rounded text-xs font-mono text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="rte-area min-h-[9rem] max-h-72 overflow-y-auto px-3 py-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none"
      />
    </div>
  )
}

// ── Step Editor Row ───────────────────────────────────────────────────────────

function StepRow({ step, index, onSave, onDelete }) {
  const [form, setForm] = useState({ subject: step.subject || '', body: step.body || '', delay_days: step.delay_days ?? 0, delay_unit: step.delay_unit || 'days' })
  const [saving, setSaving] = useState(false)
  const dirty = form.subject !== (step.subject || '') || form.body !== (step.body || '') || Number(form.delay_days) !== (step.delay_days ?? 0) || form.delay_unit !== (step.delay_unit || 'days')

  async function save() {
    setSaving(true)
    try {
      await onSave(step.id, { subject: form.subject, body: form.body, delay_days: Number(form.delay_days) || 0, delay_unit: form.delay_unit })
    } finally {
      setSaving(false)
    }
  }

  const isFirst = index === 0

  return (
    <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pl-5 space-y-3 bg-white dark:bg-slate-800/50 shadow-sm">
      <span className={`absolute left-0 top-4 bottom-4 w-1 rounded-r ${isFirst ? 'bg-blue-500' : 'bg-purple-500'}`} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isFirst ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-fuchsia-600'}`}>
            {index + 1}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${isFirst ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
            {isFirst ? 'FIRST EMAIL' : `FOLLOW-UP ${index}`}
          </span>
          {!isFirst && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={11} /> wait
              <input
                type="number" min="0"
                value={form.delay_days}
                onChange={e => setForm(f => ({ ...f, delay_days: e.target.value }))}
                className="w-14 px-1.5 py-1 text-xs text-center border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.delay_unit}
                onChange={e => setForm(f => ({ ...f, delay_unit: e.target.value }))}
                className="px-1.5 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
              after previous
            </span>
          )}
        </div>
        <button onClick={() => onDelete(step.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      <input
        value={form.subject}
        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
        placeholder="Subject line"
        className={inputCls}
      />
      <RichTextEditor
        value={form.body}
        onChange={html => setForm(f => ({ ...f, body: html }))}
        placeholder="Write the email… format with the toolbar, and use the chips to drop in lead details."
        chips={['{{name}}', '{{email}}', '{{service}}']}
      />
      <div className="flex items-center justify-end">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
        </button>
      </div>
    </div>
  )
}

// ── Nurture Campaign Detail ───────────────────────────────────────────────────

function NurtureDetail({ campaign, onUpdated }) {
  const notify = useNotify()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmClient, setConfirmClient] = useState(null)
  const [convoClient, setConvoClient] = useState(null)
  const [prompt, setPrompt] = useState(campaign.ai_reply_prompt || '')
  const [interval, setIntervalDays] = useState(campaign.interval_days ?? 30)
  const [unit, setUnit] = useState(campaign.interval_unit || 'days')
  const [sched, setSched] = useState({
    daily_limit: campaign.daily_limit ?? 50,
    send_days: campaign.send_days ?? '1,2,3,4,5,6,7',
    send_start_hour: campaign.send_start_hour ?? 0,
    send_end_hour: campaign.send_end_hour ?? 24,
  })
  const [replyDelay, setReplyDelay] = useState(String(campaign.reply_delay_minutes ?? 0))
  const [savingSettings, setSavingSettings] = useState(false)
  const [applyingAi, setApplyingAi] = useState(false)

  useEffect(() => {
    setLoading(true)
    setPrompt(campaign.ai_reply_prompt || '')
    setIntervalDays(campaign.interval_days ?? 30)
    setUnit(campaign.interval_unit || 'days')
    setReplyDelay(String(campaign.reply_delay_minutes ?? 0))
    setSched({
      daily_limit: campaign.daily_limit ?? 50,
      send_days: campaign.send_days ?? '1,2,3,4,5,6,7',
      send_start_hour: campaign.send_start_hour ?? 0,
      send_end_hour: campaign.send_end_hour ?? 24,
    })
    getNurtureClients(campaign.id)
      .then(setClients)
      .catch(e => notify('Failed to load clients: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [campaign.id])

  const settingsDirty = prompt !== (campaign.ai_reply_prompt || '')
    || Number(interval) !== (campaign.interval_days ?? 30)
    || unit !== (campaign.interval_unit || 'days')
    || (Number(replyDelay) || 0) !== (campaign.reply_delay_minutes ?? 0)
    || Number(sched.daily_limit) !== (campaign.daily_limit ?? 50)
    || sched.send_days !== (campaign.send_days ?? '1,2,3,4,5,6,7')
    || Number(sched.send_start_hour) !== (campaign.send_start_hour ?? 0)
    || Number(sched.send_end_hour) !== (campaign.send_end_hour ?? 24)

  async function saveSettings() {
    setSavingSettings(true)
    try {
      onUpdated(await updateEmailCampaign(campaign.id, {
        ai_reply_prompt: prompt,
        interval_days: Number(interval) || 30,
        interval_unit: unit,
        reply_delay_minutes: Math.max(0, Number(replyDelay) || 0),
        daily_limit: Number(sched.daily_limit) || 50,
        send_days: sched.send_days,
        send_start_hour: Number(sched.send_start_hour) || 0,
        send_end_hour: Number(sched.send_end_hour) || 24,
      }))
    } catch (e) { notify('Failed to save: ' + e.message, 'error') } finally { setSavingSettings(false) }
  }

  async function setAiForAll(enabled) {
    setApplyingAi(true)
    try {
      onUpdated(await updateEmailCampaign(campaign.id, { ai_reply_enabled: enabled }))
      await updateNurtureClientsByCampaign(campaign.id, { ai_reply_enabled: enabled })
      setClients(prev => prev.map(c => ({ ...c, ai_reply_enabled: enabled })))
      notify(`AI auto-reply turned ${enabled ? 'on' : 'off'} for all clients.`, 'success')
    } catch (e) { notify('Failed to update AI setting: ' + e.message, 'error') } finally { setApplyingAi(false) }
  }

  async function toggleCampaign() {
    const next = campaign.status === 'Active' ? 'Paused' : 'Active'
    try { onUpdated(await updateEmailCampaign(campaign.id, { status: next })) }
    catch (e) { notify('Failed: ' + e.message, 'error') }
  }

  async function toggleClient(c) {
    const next = c.status === 'Active' ? 'Paused' : 'Active'
    try {
      const updated = await updateNurtureClient(c.id, { status: next })
      setClients(prev => prev.map(x => x.id === c.id ? updated : x))
    } catch (e) { notify('Failed: ' + e.message, 'error') }
  }

  async function removeClient() {
    if (!confirmClient) return
    try {
      await deleteNurtureClient(confirmClient.id)
      setClients(prev => prev.filter(x => x.id !== confirmClient.id))
    } catch (e) { notify('Failed: ' + e.message, 'error') } finally { setConfirmClient(null) }
  }

  const active = clients.filter(c => c.status === 'Active').length
  const totalSent = clients.reduce((s, c) => s + (c.emails_sent || 0), 0)

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirmClient}
        title="Remove Client"
        message={`Remove ${confirmClient?.name || confirmClient?.email} from this nurture campaign?`}
        confirmLabel="Remove"
        onConfirm={removeClient}
        onCancel={() => setConfirmClient(null)}
      />
      {convoClient && <LeadConversationModal lead={convoClient} fetchMessages={getNurtureMessages} kind="nurture" onClose={() => setConvoClient(null)} />}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 sm:p-6 shadow-md">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-16 bottom-0 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0"><Heart size={22} /></div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{campaign.name}</h2>
              <p className="text-sm text-rose-100/90 mt-0.5 truncate">Client nurture · every {campaign.interval_days ?? 30} {campaign.interval_unit || 'days'} · {campaign.from_name || 'no sender name'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-300' : 'bg-amber-300'}`} />{campaign.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">Nurture</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleCampaign}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-sm bg-white hover:bg-white/90 text-rose-700"
          >
            {campaign.status === 'Active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Clients', value: clients.length, icon: Users, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
          { label: 'Active', value: active, icon: Heart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
          { label: 'Check-ins Sent', value: totalSent, icon: Send, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}><s.icon size={18} /></div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Sparkles size={16} /></span>
            Check-in Settings
          </h3>
          <button onClick={saveSettings} disabled={!settingsDirty || savingSettings} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors">
            {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Check-in every</label>
          <div className="flex gap-2 max-w-xs">
            <input type="number" min="1" value={interval} onChange={e => setIntervalDays(e.target.value)} className={`${inputCls} w-24`} />
            <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">AI Check-in Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">AI auto-reply for all clients</div>
            <p className="text-xs text-slate-400">Turn AI auto-reply on or off for every client in this campaign at once.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {applyingAi && <Loader2 size={13} className="animate-spin text-slate-400" />}
            <Toggle checked={campaign.ai_reply_enabled !== false} disabled={applyingAi} onChange={setAiForAll} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Reply delay</div>
            <p className="text-xs text-slate-400">How long the AI waits before sending its reply (0 = instant). Saved with the button above.</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input type="number" min="0" value={replyDelay} onChange={e => setReplyDelay(e.target.value)} className={`${inputCls} w-20`} />
            <span className="text-xs text-slate-400">min</span>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Sending Schedule</div>
          <SendScheduleControls
            daily={sched.daily_limit}
            days={sched.send_days}
            startH={sched.send_start_hour}
            endH={sched.send_end_hour}
            onDaily={v => setSched(s => ({ ...s, daily_limit: v }))}
            onDays={v => setSched(s => ({ ...s, send_days: v }))}
            onStart={v => setSched(s => ({ ...s, send_start_hour: v }))}
            onEnd={v => setSched(s => ({ ...s, send_end_hour: v }))}
          />
          <p className="text-xs text-slate-400 mt-2">Check-ins only send on these days, within this window, and never more than the daily limit.</p>
        </div>
      </div>

      {/* Clients */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center"><Users size={16} /></span>
            Enrolled Clients
          </h3>
          <span className="text-xs text-slate-400">Add from the Contacts page → select → “Add to Nurture”</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 size={22} className="animate-spin mr-2" /> Loading...</div>
          ) : clients.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm"><Users size={26} className="opacity-30 mb-2" />No clients enrolled yet. Add them from the Contacts page.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[32rem] overflow-y-auto">
              {clients.map(c => {
                const av = avatarOf(c.name || c.email)
                return (
                <div key={c.id} onClick={() => setConvoClient(c)} title="View conversation" className="px-3.5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${av.g} text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0`}>{av.init}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.name || c.email}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>{c.status}</span>
                      <span title="AI auto-reply" className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 ${c.ai_reply_enabled === false ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'}`}>
                        <Sparkles size={9} /> AI {c.ai_reply_enabled === false ? 'off' : 'on'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{c.email}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                      {c.last_sent_at && <span className="text-slate-400">Sent {fmtDateTime(c.last_sent_at)}</span>}
                      {c.status === 'Active' && c.next_send_at && <span className="text-rose-500 dark:text-rose-400 flex items-center gap-0.5"><Clock size={10} /> Next {fmtDateTime(c.next_send_at)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs text-slate-500 dark:text-slate-300">{c.emails_sent || 0} sent</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleClient(c) }} title={c.status === 'Active' ? 'Pause' : 'Resume'} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {c.status === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmClient(c) }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Lead Conversation ─────────────────────────────────────────────────────────

// All campaign send times are shown in EST (Etc/GMT+5), regardless of the viewer's timezone.
function fmtDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Etc/GMT+5' }) + ' EST'
}

// Short time + day-separator labels for the chat view (EST).
function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Etc/GMT+5' })
}
function dayLabel(ts) {
  if (!ts) return ''
  const tz = 'Etc/GMT+5'
  const key = d => d.toLocaleDateString('en-CA', { timeZone: tz })
  const d = new Date(ts), now = new Date(), yest = new Date(now.getTime() - 86400000)
  if (key(d) === key(now)) return 'Today'
  if (key(d) === key(yest)) return 'Yesterday'
  return new Date(ts).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: tz })
}

// Keep only the person's actual new message: cut off the quoted reply chain
// (lines starting with ">"), the Gmail "On … wrote:" attribution (which often wraps
// onto two lines), and Outlook "From:/Sent:" headers — then collapse blank-line runs.
function cleanInboundBody(raw) {
  const t = String(raw || '').replace(/\r/g, '')
  const lines = t.split('\n')
  let cut = lines.length
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (/^\s*>/.test(ln)) { cut = i; break }                              // quoted text
    if (/^\s*On\b/.test(ln)) {                                            // "On <date> <name> … wrote:"
      const probe = `${ln} ${lines[i + 1] || ''} ${lines[i + 2] || ''}`
      if (/\bwrote:/.test(probe)) { cut = i; break }
    }
    if (/^\s*-{2,}\s*Original Message/i.test(ln)) { cut = i; break }      // Outlook divider
    if (/^\s*From:\s.+/.test(ln) && /@/.test(lines.slice(i, i + 4).join(' '))) { cut = i; break }
  }
  let result = lines.slice(0, cut).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (result) return result
  // Whole message was quoted — de-quote it and collapse blank lines.
  return lines.map(l => l.replace(/^\s*>+\s?/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Tidy our own outbound HTML: collapse long runs of <br> so signatures don't sprawl.
function cleanOutboundHtml(html) {
  return String(html || '').replace(/(\s*<br\s*\/?>\s*){3,}/gi, '<br><br>')
}

function LeadConversationModal({ lead, onClose, fetchMessages = getEmailMessages, kind = 'email' }) {
  const notify = useNotify()
  const { isDemo } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiOn, setAiOn] = useState(lead.ai_reply_enabled !== false)
  const [togglingAi, setTogglingAi] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [composerKey, setComposerKey] = useState(0)

  useEffect(() => {
    fetchMessages(lead.id)
      .then(data => {
        setMessages(data)
        const lastSubj = [...data].reverse().find(m => m.subject)?.subject || ''
        const base = lastSubj.replace(/^(re:\s*)+/i, '')
        setSubject(base ? `Re: ${base}` : 'Re:')
      })
      .catch(e => notify('Failed to load conversation: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [lead.id])

  async function toggleAi() {
    setTogglingAi(true)
    try {
      const upd = kind === 'nurture' ? updateNurtureClient : updateEmailLead
      await upd(lead.id, { ai_reply_enabled: !aiOn })
      setAiOn(!aiOn)
      notify(!aiOn ? 'AI auto-reply turned ON.' : 'AI auto-reply turned OFF — you can reply manually.', 'success')
    } catch (e) { notify('Failed to update: ' + e.message, 'error') } finally { setTogglingAi(false) }
  }

  async function send() {
    if (!subject.trim() || !body.trim() || !lead.email) return
    setSending(true)
    try {
      await sendManualReply({ kind, id: lead.id, to: lead.email, subject, body, threadId: lead.thread_id || '', messageId: lead.message_id || '' })
      setMessages(prev => [...prev, { id: 'local-' + Date.now(), direction: 'outbound', subject, body, created_at: new Date().toISOString() }])
      setBody('')
      setComposerKey(k => k + 1)
      setShowComposer(false)
      notify('Reply sent.', 'success')
    } catch (e) { notify('Failed to send: ' + e.message, 'error') } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh]">
        {/* Chat header (WhatsApp-style) */}
        <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {avatarOf(lead.name || lead.email).init}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white truncate leading-tight">{lead.name || lead.email}</h3>
            <p className="text-xs text-emerald-50/80 truncate">{lead.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white flex items-center gap-1">
            {lead.replied && <MessageSquareReply size={10} />}{lead.status}
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={18} className="text-white" /></button>
        </div>

        {/* AI auto-reply toggle */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles size={14} className={aiOn ? 'text-violet-500' : 'text-slate-400'} />
            <span className="text-slate-700 dark:text-slate-200">AI auto-reply</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${aiOn ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>{aiOn ? 'On' : 'Off'}</span>
            <span className="hidden sm:inline text-xs text-slate-400">· {lead.emails_sent || 0} sent · last {fmtDateTime(lead.last_sent_at)}</span>
          </div>
          {!isDemo && (
            <button onClick={toggleAi} disabled={togglingAi} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${aiOn ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
              {togglingAi ? <Loader2 size={12} className="animate-spin" /> : (aiOn ? <Pause size={12} /> : <Play size={12} />)}
              {aiOn ? 'Stop AI — I’ll reply' : 'Enable AI replies'}
            </button>
          )}
        </div>

        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 bg-[#efeae2] dark:bg-slate-900/70">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm"><Inbox size={28} className="mx-auto mb-2 opacity-40" />No messages yet.</div>
          ) : (
            messages.map((m, i) => {
              const inbound = m.direction === 'inbound'
              const day = dayLabel(m.created_at)
              const prevDay = i > 0 ? dayLabel(messages[i - 1].created_at) : null
              return (
                <Fragment key={m.id}>
                  {day && day !== prevDay && (
                    <div className="flex justify-center py-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-700/80 text-[11px] font-medium text-slate-500 dark:text-slate-300 shadow-sm">{day}</span>
                    </div>
                  )}
                  <div className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                    <div className={`relative max-w-[82%] px-3 py-2 shadow-sm text-sm leading-relaxed break-words whitespace-pre-wrap ${inbound
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-md'
                      : 'bg-[#dcf8c6] dark:bg-emerald-900/50 text-slate-800 dark:text-emerald-50 rounded-2xl rounded-tr-md'}`}>
                      {m.subject && <div className="text-[11px] font-semibold mb-0.5 opacity-70 truncate">{m.subject}</div>}
                      {inbound
                        ? <div>{cleanInboundBody(m.body)}</div>
                        : <div className="[&_a]:underline [&_a]:text-blue-700 dark:[&_a]:text-blue-300" dangerouslySetInnerHTML={{ __html: cleanOutboundHtml(m.body) }} />}
                      <div className={`text-[10px] mt-1 text-right select-none ${inbound ? 'text-slate-400' : 'text-emerald-700/70 dark:text-emerald-200/60'}`}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                </Fragment>
              )
            })
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 dark:border-slate-700">
          {isDemo ? (
            <div className="px-6 py-3 text-xs text-slate-400">Read-only demo — replying is disabled.</div>
          ) : !showComposer ? (
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">{aiOn ? 'AI is handling replies. Stop AI above to take over.' : 'AI is off — write your reply below.'}</span>
              <button onClick={() => setShowComposer(true)} disabled={!lead.email} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
                <Mail size={13} /> Write reply
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 space-y-2">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className={inputCls} />
              <RichTextEditor key={composerKey} value={body} onChange={setBody} placeholder="Write your reply…" />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowComposer(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={send} disabled={sending || !subject.trim() || !body.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />} Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Campaign Detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign, onUpdated }) {
  const notify = useNotify()
  const [steps, setSteps] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingLeads, setAddingLeads] = useState(false)
  const [confirmLead, setConfirmLead] = useState(null)
  const [convoLead, setConvoLead] = useState(null)
  const [leadFilter, setLeadFilter] = useState('All')
  const [sched, setSched] = useState({
    daily_limit: campaign.daily_limit ?? 50,
    send_days: campaign.send_days ?? '1,2,3,4,5,6,7',
    send_start_hour: campaign.send_start_hour ?? 0,
    send_end_hour: campaign.send_end_hour ?? 24,
  })
  const [savingSched, setSavingSched] = useState(false)
  const schedDirty = Number(sched.daily_limit) !== (campaign.daily_limit ?? 50)
    || sched.send_days !== (campaign.send_days ?? '1,2,3,4,5,6,7')
    || Number(sched.send_start_hour) !== (campaign.send_start_hour ?? 0)
    || Number(sched.send_end_hour) !== (campaign.send_end_hour ?? 24)

  async function saveSchedule() {
    setSavingSched(true)
    try {
      onUpdated(await updateEmailCampaign(campaign.id, {
        daily_limit: Number(sched.daily_limit) || 50,
        send_days: sched.send_days,
        send_start_hour: Number(sched.send_start_hour) || 0,
        send_end_hour: Number(sched.send_end_hour) || 24,
      }))
    } catch (e) { notify('Failed to save schedule: ' + e.message, 'error') } finally { setSavingSched(false) }
  }

  // Reply & follow-up settings (campaign-level), with a master AI toggle that also
  // applies to every existing lead so you don't have to flip them one by one.
  const [replyDelay, setReplyDelay] = useState(String(campaign.reply_delay_minutes ?? 0))
  const [savingReply, setSavingReply] = useState(false)
  const [applyingAi, setApplyingAi] = useState(false)
  const replyDelayDirty = (Number(replyDelay) || 0) !== (campaign.reply_delay_minutes ?? 0)
  useEffect(() => { setReplyDelay(String(campaign.reply_delay_minutes ?? 0)) }, [campaign.id])

  async function saveReplyDelay() {
    setSavingReply(true)
    try {
      onUpdated(await updateEmailCampaign(campaign.id, { reply_delay_minutes: Math.max(0, Number(replyDelay) || 0) }))
    } catch (e) { notify('Failed to save reply delay: ' + e.message, 'error') } finally { setSavingReply(false) }
  }

  async function setAiForAll(enabled) {
    setApplyingAi(true)
    try {
      onUpdated(await updateEmailCampaign(campaign.id, { ai_reply_enabled: enabled }))
      await updateEmailLeadsByCampaign(campaign.id, { ai_reply_enabled: enabled })
      setLeads(prev => prev.map(l => ({ ...l, ai_reply_enabled: enabled })))
      notify(`AI auto-reply turned ${enabled ? 'on' : 'off'} for all leads.`, 'success')
    } catch (e) { notify('Failed to update AI setting: ' + e.message, 'error') } finally { setApplyingAi(false) }
  }

  async function toggleAutoFollowup(enabled) {
    try {
      onUpdated(await updateEmailCampaign(campaign.id, { auto_followup_enabled: enabled }))
    } catch (e) { notify('Failed to update follow-up setting: ' + e.message, 'error') }
  }

  useEffect(() => {
    setLoading(true)
    setSched({
      daily_limit: campaign.daily_limit ?? 50,
      send_days: campaign.send_days ?? '1,2,3,4,5,6,7',
      send_start_hour: campaign.send_start_hour ?? 0,
      send_end_hour: campaign.send_end_hour ?? 24,
    })
    Promise.all([getEmailSteps(campaign.id), getEmailLeads(campaign.id)])
      .then(([s, l]) => { setSteps(s); setLeads(l) })
      .catch(e => notify('Failed to load: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [campaign.id])

  async function addStep() {
    const nextNum = steps.length === 0 ? 0 : Math.max(...steps.map(s => s.step_number)) + 1
    try {
      const created = await createEmailStep({
        campaign_id: campaign.id,
        step_number: nextNum,
        subject: '',
        body: '',
        delay_days: nextNum === 0 ? 0 : 2,
        delay_unit: 'days',
      })
      setSteps(prev => [...prev, created])
    } catch (e) {
      notify('Failed to add step: ' + e.message, 'error')
    }
  }

  async function saveStep(id, updates) {
    const updated = await updateEmailStep(id, updates)
    setSteps(prev => prev.map(s => s.id === id ? updated : s))
  }

  async function removeStep(id) {
    try {
      await deleteEmailStep(id)
      setSteps(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      notify('Failed to delete step: ' + e.message, 'error')
    }
  }

  async function removeLead() {
    if (!confirmLead) return
    try {
      await deleteEmailLead(confirmLead.id)
      setLeads(prev => prev.filter(l => l.id !== confirmLead.id))
    } catch (e) {
      notify('Failed to delete lead: ' + e.message, 'error')
    } finally {
      setConfirmLead(null)
    }
  }

  async function toggleStatus() {
    const next = campaign.status === 'Active' ? 'Paused' : 'Active'
    try {
      const updated = await updateEmailCampaign(campaign.id, { status: next })
      onUpdated(updated)
    } catch (e) {
      notify('Failed to update: ' + e.message, 'error')
    }
  }

  const active = leads.filter(l => l.status === 'Active').length
  const replied = leads.filter(l => l.replied).length
  const completed = leads.filter(l => l.status === 'Completed').length
  const filteredLeads = leadFilter === 'All'
    ? leads
    : leadFilter === 'Replied'
      ? leads.filter(l => l.replied)
      : leads.filter(l => l.status === leadFilter)

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirmLead}
        title="Remove Lead"
        message={`Remove ${confirmLead?.name || confirmLead?.email} from this campaign?`}
        confirmLabel="Remove"
        onConfirm={removeLead}
        onCancel={() => setConfirmLead(null)}
      />

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 shadow-md">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-16 bottom-0 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0"><Send size={22} /></div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{campaign.name}</h2>
              <p className="text-sm text-blue-100/90 mt-0.5 truncate">{campaign.from_name || 'No sender name'}{campaign.from_email ? ` · ${campaign.from_email}` : ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-300' : 'bg-amber-300'}`} />{campaign.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">Outreach</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-sm ${campaign.status === 'Active' ? 'bg-white/90 text-amber-700 hover:bg-white' : 'bg-white text-emerald-700 hover:bg-white'}`}
          >
            {campaign.status === 'Active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
          { label: 'Active in Sequence', value: active, icon: Send, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Replied', value: replied, icon: Reply, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}><s.icon size={18} /></div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sending Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Clock size={16} /></span>
            Sending Schedule
          </h3>
          <button onClick={saveSchedule} disabled={!schedDirty || savingSched} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">
            {savingSched ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        </div>
        <SendScheduleControls
          daily={sched.daily_limit}
          days={sched.send_days}
          startH={sched.send_start_hour}
          endH={sched.send_end_hour}
          onDaily={v => setSched(s => ({ ...s, daily_limit: v }))}
          onDays={v => setSched(s => ({ ...s, send_days: v }))}
          onStart={v => setSched(s => ({ ...s, send_start_hour: v }))}
          onEnd={v => setSched(s => ({ ...s, send_end_hour: v }))}
        />
        <p className="text-xs text-slate-400">Outreach emails only send on these days, within this window, and never more than the daily limit.</p>
      </div>

      {/* Reply & Follow-up Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Sparkles size={16} /></span>
          Reply &amp; Follow-up Settings
        </h3>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3.5">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI auto-reply for all leads</div>
            <p className="text-xs text-slate-400 mt-0.5">Turn the AI auto-reply on or off for every lead in this campaign at once.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {applyingAi && <Loader2 size={13} className="animate-spin text-slate-400" />}
            <Toggle checked={campaign.ai_reply_enabled !== false} disabled={applyingAi} onChange={setAiForAll} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3.5">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reply delay</div>
            <p className="text-xs text-slate-400 mt-0.5">How long the AI waits before sending its reply (0 = instant).</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input type="number" min="0" value={replyDelay} onChange={e => setReplyDelay(e.target.value)} className={`${inputCls} w-20`} />
            <span className="text-xs text-slate-400">min</span>
            <button onClick={saveReplyDelay} disabled={!replyDelayDirty || savingReply} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">
              {savingReply ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3.5">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Automatic follow-ups</div>
            <p className="text-xs text-slate-400 mt-0.5">Send the follow-up sequence automatically until the lead replies. Off = first email only.</p>
          </div>
          <Toggle checked={campaign.auto_followup_enabled !== false} onChange={toggleAutoFollowup} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sequence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Send size={16} /></span>
                Email Sequence
              </h3>
              <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <Plus size={13} /> Add {steps.length === 0 ? 'First Email' : 'Follow-up'}
              </button>
            </div>
            {steps.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-10 text-center text-slate-400 text-sm">
                No emails yet. Add the first email to start.
              </div>
            ) : (
              steps.map((s, i) => (
                <StepRow key={s.id} step={s} index={i} onSave={saveStep} onDelete={removeStep} />
              ))
            )}
          </div>

          {/* Leads */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Users size={16} /></span>
                Leads
              </h3>
              <button onClick={() => setAddingLeads(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                <Plus size={13} /> Add Leads
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'Active', 'Replied', 'Completed'].map(f => {
                const count = f === 'All' ? leads.length : f === 'Replied' ? leads.filter(l => l.replied).length : leads.filter(l => l.status === f).length
                return (
                  <button key={f} onClick={() => setLeadFilter(f)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${leadFilter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {f} <span className={leadFilter === f ? 'text-white/70' : 'text-slate-400'}>· {count}</span>
                  </button>
                )
              })}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {filteredLeads.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <Users size={26} className="opacity-30 mb-2" />
                  {leads.length === 0 ? 'No leads enrolled yet.' : 'No leads in this view.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[32rem] overflow-y-auto">
                  {filteredLeads.map(l => {
                    const av = avatarOf(l.name || l.email)
                    return (
                    <div key={l.id} onClick={() => setConvoLead(l)} title="View conversation" className="px-3.5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${av.g} text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0`}>{av.init}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{l.name || l.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${leadStatusColors[l.status] || 'bg-slate-100 text-slate-600'}`}>
                            {l.replied && <MessageSquareReply size={9} className="inline mr-0.5 -mt-0.5" />}
                            {l.status}
                          </span>
                          <span title="AI auto-reply" className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 ${l.ai_reply_enabled === false ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'}`}>
                            <Sparkles size={9} /> AI {l.ai_reply_enabled === false ? 'off' : 'on'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{l.email}{l.service ? ` · ${l.service}` : ''}</div>
                        <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                          {l.last_sent_at && <span className="text-slate-400">Sent {fmtDateTime(l.last_sent_at)}</span>}
                          {l.status === 'Active' && l.next_send_at && <span className="text-blue-500 dark:text-blue-400 flex items-center gap-0.5"><Clock size={10} /> Next {fmtDateTime(l.next_send_at)}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1 justify-end">
                          <CheckCircle size={11} className="text-slate-300" /> {l.emails_sent || 0} sent
                        </div>
                        <div className="text-xs text-slate-400">step {l.current_step}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmLead(l) }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {convoLead && <LeadConversationModal lead={convoLead} onClose={() => setConvoLead(null)} />}

      {addingLeads && (
        <AddLeadsModal
          campaignId={campaign.id}
          aiDefault={campaign.ai_reply_enabled !== false}
          sendStartHour={campaign.send_start_hour ?? 0}
          sendEndHour={campaign.send_end_hour ?? 24}
          sendDays={campaign.send_days ?? '1,2,3,4,5,6,7'}
          onClose={() => setAddingLeads(false)}
          onAdded={created => setLeads(prev => [...created, ...prev])}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmailCampaigns() {
  const notify = useNotify()
  const { isDemo } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [confirmCampaign, setConfirmCampaign] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  // The selected campaign is derived from the URL, so refreshing /email-campaigns/:id
  // restores exactly the same view instead of bouncing to the first campaign.
  const selected = id ? campaigns.find(c => c.id === id) || null : null

  useEffect(() => {
    getEmailCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function open(c) { navigate(`/email-campaigns/${c.id}`) }

  function handleCreate(created) {
    setCampaigns(prev => [created, ...prev])
    navigate(`/email-campaigns/${created.id}`)
  }

  function handleUpdated(updated) {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  async function removeCampaign() {
    if (!confirmCampaign) return
    try {
      const wasSelected = selected?.id === confirmCampaign.id
      await deleteEmailCampaign(confirmCampaign.id)
      setCampaigns(prev => prev.filter(c => c.id !== confirmCampaign.id))
      if (wasSelected) navigate('/email-campaigns')
    } catch (e) {
      notify('Failed to delete: ' + e.message, 'error')
    } finally {
      setConfirmCampaign(null)
    }
  }

  const outreachCount = campaigns.filter(c => c.type !== 'nurture').length
  const nurtureCount = campaigns.filter(c => c.type === 'nurture').length
  const activeCount = campaigns.filter(c => c.status === 'Active').length
  const visible = campaigns.filter(c =>
    (filter === 'all' || (filter === 'nurture' ? c.type === 'nurture' : c.type !== 'nurture')) &&
    (!query.trim() || (c.name || '').toLowerCase().includes(query.trim().toLowerCase()))
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading campaigns...
    </div>
  )

  const filters = [['all', 'All', campaigns.length], ['outreach', 'Outreach', outreachCount], ['nurture', 'Nurture', nurtureCount]]

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirmCampaign}
        title="Delete Campaign"
        message={`Delete "${confirmCampaign?.name}" and all its steps and leads? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={removeCampaign}
        onCancel={() => setConfirmCampaign(null)}
      />

      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm"><Mail size={18} /></span>
            Email Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} · {activeCount} active · AI-assisted replies & follow-ups</p>
        </div>
        {!isDemo && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar list */}
        <aside className={`lg:w-80 flex-shrink-0 space-y-3 ${selected ? 'hidden lg:block' : 'block'}`}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search campaigns…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {filters.map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {label} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto pr-0.5">
            {visible.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-10 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                {campaigns.length === 0 ? 'No campaigns yet.' : 'No matches.'}
              </div>
            ) : visible.map(c => {
              const nurture = c.type === 'nurture'
              const active = selected?.id === c.id
              const live = c.status === 'Active'
              return (
                <div
                  key={c.id}
                  onClick={() => open(c)}
                  className={`group relative w-full text-left rounded-2xl border p-3.5 transition-all cursor-pointer overflow-hidden ${active ? 'border-transparent ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'}`}
                >
                  {active && <span className={`absolute left-0 top-0 bottom-0 w-1 ${nurture ? 'bg-rose-500' : 'bg-blue-500'}`} />}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${nurture ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                      {nurture ? <Heart size={17} /> : <Send size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${nurture ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>{nurture ? 'Nurture' : 'Outreach'}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${live ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />{c.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`flex-shrink-0 transition-colors ${active ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`} />
                  </div>
                  {!isDemo && (
                    <span
                      onClick={e => { e.stopPropagation(); setConfirmCampaign(c) }}
                      title="Delete campaign"
                      className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Detail */}
        <main className={`flex-1 min-w-0 ${selected ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <>
              <button onClick={() => navigate('/email-campaigns')} className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3 hover:text-slate-700 dark:hover:text-slate-200">
                <ArrowLeft size={15} /> All campaigns
              </button>
              {selected.type === 'nurture'
                ? <NurtureDetail campaign={selected} onUpdated={handleUpdated} />
                : <CampaignDetail campaign={selected} onUpdated={handleUpdated} />}
            </>
          ) : id ? (
            <div className="flex flex-col items-center justify-center h-72 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Mail size={34} className="opacity-30 mb-2" />
              <p className="text-sm">Campaign not found.</p>
              <button onClick={() => navigate('/email-campaigns')} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to campaigns</button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm mb-3"><Mail size={26} /></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Select a campaign</p>
              <p className="text-xs mt-0.5">Pick one from the list{!isDemo ? ' or create a new campaign' : ''}.</p>
            </div>
          )}
        </main>
      </div>

      {creating && <CampaignModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  )
}
