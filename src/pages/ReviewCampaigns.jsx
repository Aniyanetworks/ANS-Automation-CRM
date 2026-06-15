import { useState, useEffect, useRef } from 'react'
import {
  Star, Plus, X, Loader2, Trash2, Users, Save, Settings2,
  Link2, Phone, Mail, Copy, Check, Eye, MessageSquare,
  Pause, Play, AlertTriangle, Clock, ChevronRight, ExternalLink,
  Sparkles, Upload,
} from 'lucide-react'
import {
  getReviewCampaigns, createReviewCampaign, updateReviewCampaign, deleteReviewCampaign,
  getReviewLeads, createReviewLeads, deleteReviewLead,
} from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import { useNotify } from '../context/NotifyContext'
import { useAuth } from '../context/AuthContext'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

const DEFAULT_FOLLOWUP_DAYS = [1, 3, 7, 15, 30, 60]

const STEP_LABELS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth']

const DEFAULT_SMS = `Hi {{name}}, we'd love your feedback! It only takes 30 seconds: {{review_link}} — Thank you! 🙏`
const DEFAULT_EMAIL_SUBJECT = `How was your experience with us, {{name}}?`
const DEFAULT_EMAIL_BODY = `Hi {{name}},

Thank you for choosing us! We'd love to hear about your experience.

Please click below to leave your review — it only takes 30 seconds:

{{review_link}}

Your feedback means the world to us.

Warm regards,
{{from_name}}`

const ratingColors = {
  Excellent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Good: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Bad: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const statusColors = {
  Active: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Paused: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Unsubscribed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const tagLabels = {
  review_later: { label: 'Review Later', color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  review_done: { label: 'Reviewed', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  bad_alerted: { label: 'Alerted', color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' },
}

// ── Create Campaign Modal ─────────────────────────────────────────────────────

function CreateCampaignModal({ onClose, onCreate }) {
  const notify = useNotify()
  const [form, setForm] = useState({ name: '', from_name: '', from_email: '' })
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const created = await createReviewCampaign({
        name: form.name.trim(),
        from_name: form.from_name.trim(),
        from_email: form.from_email.trim(),
        status: 'Active',
        form_title: 'How was your experience?',
        form_subtitle: 'Your feedback helps us improve',
        sms_body: DEFAULT_SMS,
        email_subject: DEFAULT_EMAIL_SUBJECT,
        email_body: DEFAULT_EMAIL_BODY,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> New Review Campaign
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Campaign Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Post-Service Review Request"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Name</label>
              <input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} placeholder="Aniya Networks" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Email</label>
              <input type="email" value={form.from_email} onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))} placeholder="hello@aniyanetworks.net" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
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

function AddLeadsModal({ campaignId, onClose, onAdded }) {
  const notify = useNotify()
  const [staged, setStaged] = useState([])
  const [draft, setDraft] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const phoneOrEmailPresent = draft.phone.trim() || /\S+@\S+\.\S+/.test(draft.email.trim())

  function addDraft() {
    if (!phoneOrEmailPresent) return
    setStaged(prev => [...prev, { name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim() }])
    setDraft({ name: '', phone: '', email: '' })
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addDraft() }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      if (!lines.length) return
      const header = lines[0].toLowerCase().split(',').map(h => h.trim())
      const hasHeader = header.some(h => h.includes('name') || h.includes('phone') || h.includes('email'))
      const start = hasHeader ? 1 : 0
      const ni = hasHeader ? header.findIndex(h => h.includes('name')) : 0
      const pi = hasHeader ? header.findIndex(h => h.includes('phone')) : 1
      const ei = hasHeader ? header.findIndex(h => h.includes('email')) : 2
      const rows = lines.slice(start).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'))
        return { name: cols[ni] || '', phone: cols[pi] || '', email: cols[ei] || '' }
      }).filter(r => r.phone || r.email)
      setStaged(prev => [...prev, ...rows])
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function submit() {
    if (!staged.length) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const rows = staged.map(l => ({
        campaign_id: campaignId,
        name: l.name || '',
        phone: l.phone || '',
        email: l.email || '',
        status: 'Active',
        current_step: 0,
        next_send_at: now,
        messages_sent: 0,
      }))
      const created = await createReviewLeads(rows)
      fetch('https://n8n.srv1300653.hstgr.cloud/webhook/ang-ghl-review', { method: 'POST' }).catch(() => {})
      onAdded(created)
      onClose()
    } catch (err) {
      notify('Failed to add leads: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const smallInput = 'w-full px-2.5 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Leads to Review Campaign</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr_auto] gap-2">
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} onKeyDown={onKeyDown} placeholder="Name" className={smallInput} />
              <input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} onKeyDown={onKeyDown} placeholder="Phone *" className={smallInput} />
              <input type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} onKeyDown={onKeyDown} placeholder="Email" className={smallInput} />
              <button
                type="button"
                onClick={addDraft}
                disabled={!phoneOrEmailPresent}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={15} /> Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Phone or email required. CSV columns: <span className="font-mono text-slate-500 dark:text-slate-300">name, phone, email</span></p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Staged ({staged.length})</label>
              {staged.length > 0 && <button type="button" onClick={() => setStaged([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear all</button>}
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {staged.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No leads staged yet.</div>
              ) : (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                  {staged.map((l, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{l.name || <span className="text-slate-400 italic">No name</span>}</div>
                        <div className="text-xs text-slate-400">{l.phone}{l.phone && l.email ? ' · ' : ''}{l.email}</div>
                      </div>
                      <button onClick={() => setStaged(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
            disabled={saving || !staged.length}
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

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text, title = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={doCopy}
      title={title}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

// ── Lead History Modal ────────────────────────────────────────────────────────

function LeadHistoryModal({ lead, campaign, followupDays, followupMessages, onClose }) {
  const scheduleDays = [0, ...(followupDays.length ? followupDays : DEFAULT_FOLLOWUP_DAYS)]
  const sentCount = Number(lead.messages_sent) || 0
  const currentStep = Number(lead.current_step) || 0
  const enrolled = new Date(lead.created_at)

  const reviewLink = `${window.location.origin}/r/${lead.token}`
  const name = lead.name || 'there'
  const fromName = campaign.from_name || 'Aniya Network Solutions'
  const fromEmail = campaign.from_email || ''
  function fill(t) {
    return (t || '')
      .split('{{name}}').join(name)
      .split('{{review_link}}').join(reviewLink)
      .split('{{from_name}}').join(fromName)
      .split('{{from_email}}').join(fromEmail)
  }

  function stepDate(stepIndex) {
    const offsetDays = scheduleDays[stepIndex] || 0
    const d = new Date(enrolled.getTime() + offsetDays * 86400000)
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function stepLabel(i) {
    if (i === 0) return 'Initial Send · Day 0'
    return `${STEP_LABELS[i - 1] || `Step ${i}`} Follow-up · Day ${scheduleDays[i]}`
  }

  const totalSteps = scheduleDays.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white text-base">
                {lead.name || lead.phone || lead.email}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || ''}`}>
                {lead.status}
              </span>
              {lead.review_rating && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ratingColors[lead.review_rating] || ''}`}>
                  {lead.review_rating}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {lead.phone}{lead.phone && lead.email ? ' · ' : ''}{lead.email}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Review result */}
          {lead.submitted_at && (
            <div className={`rounded-xl p-3 border ${lead.review_rating === 'Bad'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <Star size={12} className="text-amber-500" /> Review Submitted
                <span className="ml-auto font-normal text-slate-400">
                  {new Date(lead.submitted_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {lead.review_comment && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{lead.review_comment}"</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-0.5">
            Follow-up History
          </div>

          <div className="space-y-2">
            {Array.from({ length: totalSteps }, (_, i) => {
              const sent = i < sentCount
              const isNext = i === currentStep && lead.status === 'Active'
              const pending = !sent && !isNext

              const msg = followupMessages[i] || {}
              const smsText = fill(msg.sms || campaign.sms_body || '')
              const subject = fill(msg.subject || campaign.email_subject || '')
              const emailBody = fill(msg.body || campaign.email_body || '')

              let dateLabel = ''
              if (sent) dateLabel = `Sent ${stepDate(i)}`
              else if (isNext && lead.next_send_at) {
                dateLabel = `Scheduled ${new Date(lead.next_send_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
              } else if (pending) {
                dateLabel = `Est. ${stepDate(i)}`
              }

              return (
                <div key={i} className={`rounded-xl border p-3 ${
                  sent
                    ? 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600'
                    : isNext
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${
                      sent ? 'bg-emerald-500' : isNext ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}>
                      {sent ? '✓' : isNext ? '⏳' : i + 1}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1">{stepLabel(i)}</span>
                    <span className={`text-[10px] font-medium ${sent ? 'text-emerald-600 dark:text-emerald-400' : isNext ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {dateLabel}
                    </span>
                  </div>
                  {smsText && (
                    <div className="ml-7 space-y-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 mb-0.5 uppercase tracking-wide">
                          <Phone size={9} /> SMS
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{smsText}</p>
                      </div>
                      {subject && (
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 mb-0.5 uppercase tracking-wide">
                            <Mail size={9} /> Email
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{subject}</p>
                          {emailBody && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">{emailBody}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {lead.status === 'Completed' && (
              <div className="text-center text-xs text-slate-400 py-2">
                All {sentCount} follow-up{sentCount !== 1 ? 's' : ''} completed
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-400">
            Enrolled {enrolled.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })} ·
            {sentCount} of {totalSteps} messages sent
          </div>
        </div>
      </div>
    </div>
  )
}

function buildMessages(camp, days) {
  const db = Array.isArray(camp.followup_messages) ? camp.followup_messages : []
  const d = Array.isArray(days) ? days : (Array.isArray(camp.followup_days) ? camp.followup_days : DEFAULT_FOLLOWUP_DAYS)
  return Array.from({ length: d.length + 1 }, (_, i) => ({
    sms: db[i]?.sms ?? camp.sms_body ?? DEFAULT_SMS,
    subject: db[i]?.subject ?? camp.email_subject ?? DEFAULT_EMAIL_SUBJECT,
    body: db[i]?.body ?? camp.email_body ?? DEFAULT_EMAIL_BODY,
  }))
}

// ── Campaign Detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign, onUpdated }) {
  const notify = useNotify()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingLeads, setAddingLeads] = useState(false)
  const [confirmLead, setConfirmLead] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

  // Per-step messages state
  const [followupMessages, setFollowupMessages] = useState(() => buildMessages(campaign, null))
  const [baseMessages, setBaseMessages] = useState(() => JSON.stringify(buildMessages(campaign, null)))
  const [activeStep, setActiveStep] = useState(0)
  const [savingMsgs, setSavingMsgs] = useState(false)
  const msgsDirty = JSON.stringify(followupMessages) !== baseMessages

  // Form settings state
  const [formSettings, setFormSettings] = useState({
    form_logo_url: campaign.form_logo_url || '',
    form_title: campaign.form_title || 'How was your experience?',
    form_subtitle: campaign.form_subtitle || 'Your feedback helps us improve',
    review_link: campaign.review_link || '',
    admin_phone: campaign.admin_phone || '',
    admin_email: campaign.admin_email || '',
    from_name: campaign.from_name || '',
    from_email: campaign.from_email || '',
  })
  const [savingForm, setSavingForm] = useState(false)
  const formDirty = Object.keys(formSettings).some(
    k => (formSettings[k] || '') !== (campaign[k] || '')
  )

  // Follow-up schedule state
  const [followupDays, setFollowupDays] = useState(
    Array.isArray(campaign.followup_days) ? campaign.followup_days : DEFAULT_FOLLOWUP_DAYS
  )
  const [savingSchedule, setSavingSchedule] = useState(false)
  const originalDays = Array.isArray(campaign.followup_days) ? campaign.followup_days : DEFAULT_FOLLOWUP_DAYS
  const scheduleDirty = JSON.stringify(followupDays) !== JSON.stringify(originalDays)

  useEffect(() => {
    setLoading(true)
    setActiveStep(0)
    const msgs = buildMessages(campaign, null)
    setFollowupMessages(msgs)
    setBaseMessages(JSON.stringify(msgs))
    setFormSettings({
      form_logo_url: campaign.form_logo_url || '',
      form_title: campaign.form_title || 'How was your experience?',
      form_subtitle: campaign.form_subtitle || 'Your feedback helps us improve',
      review_link: campaign.review_link || '',
      admin_phone: campaign.admin_phone || '',
      admin_email: campaign.admin_email || '',
      from_name: campaign.from_name || '',
      from_email: campaign.from_email || '',
    })
    setFollowupDays(Array.isArray(campaign.followup_days) ? campaign.followup_days : DEFAULT_FOLLOWUP_DAYS)
    getReviewLeads(campaign.id)
      .then(setLeads)
      .catch(e => notify('Failed to load leads: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [campaign.id])

  async function saveMsgs() {
    setSavingMsgs(true)
    try {
      const updated = await updateReviewCampaign(campaign.id, {
        followup_messages: followupMessages,
        // keep legacy fields in sync with step 0 for backwards compat
        sms_body: followupMessages[0]?.sms ?? DEFAULT_SMS,
        email_subject: followupMessages[0]?.subject ?? DEFAULT_EMAIL_SUBJECT,
        email_body: followupMessages[0]?.body ?? DEFAULT_EMAIL_BODY,
      })
      onUpdated(updated)
      setBaseMessages(JSON.stringify(followupMessages))
      notify('Messages saved', 'success')
    } catch (e) {
      notify('Failed to save: ' + e.message, 'error')
    } finally {
      setSavingMsgs(false)
    }
  }

  async function saveFormSettings() {
    setSavingForm(true)
    try {
      onUpdated(await updateReviewCampaign(campaign.id, formSettings))
      notify('Form settings saved', 'success')
    } catch (e) {
      notify('Failed to save: ' + e.message, 'error')
    } finally {
      setSavingForm(false)
    }
  }

  async function saveSchedule() {
    const validated = followupDays.map(d => Math.max(1, parseInt(d, 10) || 1))
    setFollowupDays(validated)
    setSavingSchedule(true)
    try {
      onUpdated(await updateReviewCampaign(campaign.id, { followup_days: validated }))
      notify('Follow-up schedule saved', 'success')
    } catch (e) {
      notify('Failed to save: ' + e.message, 'error')
    } finally {
      setSavingSchedule(false)
    }
  }

  async function toggleStatus() {
    const next = campaign.status === 'Active' ? 'Paused' : 'Active'
    try { onUpdated(await updateReviewCampaign(campaign.id, { status: next })) }
    catch (e) { notify('Failed: ' + e.message, 'error') }
  }

  async function removeLead() {
    if (!confirmLead) return
    try {
      await deleteReviewLead(confirmLead.id)
      setLeads(prev => prev.filter(l => l.id !== confirmLead.id))
    } catch (e) {
      notify('Failed: ' + e.message, 'error')
    } finally {
      setConfirmLead(null)
    }
  }

  const totalLeads = leads.length
  const activeLeads = leads.filter(l => l.status === 'Active').length
  const reviewed = leads.filter(l => l.review_rating === 'Excellent' || l.review_rating === 'Good').length
  const badReviews = leads.filter(l => l.review_rating === 'Bad').length

  const formUrl = `${window.location.origin}/r/`

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!confirmLead}
        title="Remove Lead"
        message={`Remove ${confirmLead?.name || confirmLead?.phone} from this campaign?`}
        confirmLabel="Remove"
        onConfirm={removeLead}
        onCancel={() => setConfirmLead(null)}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star size={18} className="text-amber-500" /> {campaign.name}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Review campaign · {campaign.from_name || 'no sender name'}
            {campaign.from_email ? ` · ${campaign.from_email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/r?c=${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye size={14} /> Preview Form
          </a>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${campaign.status === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'}`}
          >
            {campaign.status === 'Active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads, color: 'text-slate-900 dark:text-white' },
          { label: 'Active', value: activeLeads, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Reviewed', value: reviewed, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Bad Reviews', value: badReviews, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: Messages + Follow-up Schedule */}
          <div className="space-y-4">
            {/* Message Templates — per step */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <MessageSquare size={15} className="text-blue-500" /> Message Templates
                </h3>
                <button
                  onClick={saveMsgs}
                  disabled={!msgsDirty || savingMsgs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {savingMsgs ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
              </div>

              {/* Step selector tabs */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveStep(0)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${activeStep === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  Day 0 · Initial
                </button>
                {followupDays.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i + 1)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${activeStep === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-400">
                Editing: <span className={`font-medium ${activeStep === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'}`}>
                  {activeStep === 0 ? 'Initial send (Day 0 — enrollment)' : `${STEP_LABELS[activeStep - 1] || `Step ${activeStep}`} follow-up (Day ${followupDays[activeStep - 1]})`}
                </span>
                {' · '}Placeholders: <code className="text-slate-500 dark:text-slate-300">{'{{name}}'}</code>{' '}
                <code className="text-slate-500 dark:text-slate-300">{'{{review_link}}'}</code>{' '}
                <code className="text-slate-500 dark:text-slate-300">{'{{from_name}}'}</code>
              </p>

              {followupMessages[activeStep] && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Phone size={11} /> SMS Body
                    </label>
                    <textarea
                      value={followupMessages[activeStep].sms}
                      onChange={e => setFollowupMessages(prev => prev.map((m, i) => i === activeStep ? { ...m, sms: e.target.value } : m))}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                    <p className="text-xs text-slate-400 mt-0.5">{followupMessages[activeStep].sms.length} characters</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Mail size={11} /> Email Subject
                    </label>
                    <input
                      value={followupMessages[activeStep].subject}
                      onChange={e => setFollowupMessages(prev => prev.map((m, i) => i === activeStep ? { ...m, subject: e.target.value } : m))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Mail size={11} /> Email Body
                    </label>
                    <textarea
                      value={followupMessages[activeStep].body}
                      onChange={e => setFollowupMessages(prev => prev.map((m, i) => i === activeStep ? { ...m, body: e.target.value } : m))}
                      rows={8}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Follow-up Schedule */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Clock size={15} className="text-violet-500" /> Follow-up Schedule
                </h3>
                <button
                  onClick={saveSchedule}
                  disabled={!scheduleDirty || savingSchedule}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {savingSchedule ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
              </div>

              {/* Day 0 — fixed */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-20 flex-shrink-0 px-2 py-1 rounded-lg text-xs font-mono font-semibold text-center bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Day 0
                </div>
                <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">Initial SMS + Email on enrollment</span>
                <span className="text-xs text-slate-300 dark:text-slate-600 italic">fixed</span>
              </div>

              <div className="space-y-2 mt-1">
                {followupDays.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 flex-shrink-0 flex items-center gap-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg px-2 py-0.5">
                      <span className="text-xs text-violet-500 dark:text-violet-400 font-medium">Day</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={day}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1)
                          setFollowupDays(prev => prev.map((d, i) => i === idx ? val : d))
                        }}
                        className="w-10 bg-transparent text-xs font-mono font-semibold text-violet-700 dark:text-violet-300 text-center focus:outline-none"
                      />
                    </div>
                    <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                      {STEP_LABELS[idx] || `Step ${idx + 1}`} follow-up
                      {idx === followupDays.length - 1 && <span className="ml-1 text-red-400">→ sequence stops</span>}
                    </span>
                    <button
                      onClick={() => {
                        const msgIdx = idx + 1
                        setFollowupDays(prev => prev.filter((_, i) => i !== idx))
                        setFollowupMessages(prev => prev.filter((_, i) => i !== msgIdx))
                        if (activeStep === msgIdx) setActiveStep(Math.max(0, msgIdx - 1))
                        else if (activeStep > msgIdx) setActiveStep(s => s - 1)
                      }}
                      className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove step"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {followupDays.length < 10 && (
                <button
                  onClick={() => {
                    const last = followupDays[followupDays.length - 1] || 0
                    setFollowupDays(prev => [...prev, last + 7])
                    setFollowupMessages(prev => [...prev, { sms: DEFAULT_SMS, subject: DEFAULT_EMAIL_SUBJECT, body: DEFAULT_EMAIL_BODY }])
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 font-medium transition-colors"
                >
                  <Plus size={12} /> Add Follow-up Step
                </button>
              )}

              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                Days are counted from enrollment date. n8n reads these values from the database.
              </p>
            </div>
          </div>

          {/* Right column: Form Settings + Leads */}
          <div className="space-y-4">
            {/* Form Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Settings2 size={15} className="text-slate-500" /> Form Settings
                </h3>
                <button
                  onClick={saveFormSettings}
                  disabled={!formDirty || savingForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {savingForm ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Name</label>
                  <input value={formSettings.from_name} onChange={e => setFormSettings(f => ({ ...f, from_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Email</label>
                  <input type="email" value={formSettings.from_email} onChange={e => setFormSettings(f => ({ ...f, from_email: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Form Logo URL</label>
                <input value={formSettings.form_logo_url} onChange={e => setFormSettings(f => ({ ...f, form_logo_url: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Form Title</label>
                <input value={formSettings.form_title} onChange={e => setFormSettings(f => ({ ...f, form_title: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Form Subtitle</label>
                <input value={formSettings.form_subtitle} onChange={e => setFormSettings(f => ({ ...f, form_subtitle: e.target.value }))} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <ExternalLink size={11} /> Google Review / Redirect Link
                </label>
                <input
                  value={formSettings.review_link}
                  onChange={e => setFormSettings(f => ({ ...f, review_link: e.target.value }))}
                  placeholder="https://g.page/r/..."
                  className={inputCls}
                />
                <p className="text-xs text-slate-400 mt-0.5">Excellent / Good reviewers are redirected here.</p>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Bad Review Alerts
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Admin Phone (SMS)</label>
                    <input value={formSettings.admin_phone} onChange={e => setFormSettings(f => ({ ...f, admin_phone: e.target.value }))} placeholder="+1..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Admin Email</label>
                    <input type="email" value={formSettings.admin_email} onChange={e => setFormSettings(f => ({ ...f, admin_email: e.target.value }))} placeholder="admin@..." className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* Leads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Users size={15} className="text-amber-500" /> Enrolled Leads
                </h3>
                <button
                  onClick={() => setAddingLeads(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add Leads
                </button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {leads.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">No leads enrolled yet.</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[32rem] overflow-y-auto">
                    {leads.map(l => (
                      <div key={l.id} onClick={() => setSelectedLead(l)} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{l.name || l.phone || l.email}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColors[l.status] || ''}`}>{l.status}</span>
                            {l.review_rating && (
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${ratingColors[l.review_rating] || ''}`}>
                                {l.review_rating}
                              </span>
                            )}
                            {l.tag && tagLabels[l.tag] && (
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${tagLabels[l.tag].color}`}>
                                {tagLabels[l.tag].label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {l.phone}{l.phone && l.email ? ' · ' : ''}{l.email}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right hidden sm:block">
                          <div className="text-xs text-slate-500 dark:text-slate-300">Step {l.current_step}</div>
                          <div className="text-xs text-slate-400">{l.messages_sent || 0} sent</div>
                        </div>
                        {l.token && (
                          <div onClick={e => e.stopPropagation()}>
                            <CopyButton
                              text={`${window.location.origin}/r/${l.token}`}
                              title="Copy review form link"
                            />
                          </div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmLead(l) }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {addingLeads && (
        <AddLeadsModal
          campaignId={campaign.id}
          onClose={() => setAddingLeads(false)}
          onAdded={created => setLeads(prev => [...created, ...prev])}
        />
      )}

      {selectedLead && (
        <LeadHistoryModal
          lead={selectedLead}
          campaign={campaign}
          followupDays={followupDays}
          followupMessages={followupMessages}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReviewCampaigns() {
  const notify = useNotify()
  const { isDemo } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [confirmCampaign, setConfirmCampaign] = useState(null)

  useEffect(() => {
    getReviewCampaigns()
      .then(data => {
        setCampaigns(data)
        if (data.length) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleCreate(created) {
    setCampaigns(prev => [created, ...prev])
    setSelected(created)
  }

  function handleUpdated(updated) {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(s => s && s.id === updated.id ? updated : s)
  }

  async function removeCampaign() {
    if (!confirmCampaign) return
    try {
      await deleteReviewCampaign(confirmCampaign.id)
      setCampaigns(prev => prev.filter(c => c.id !== confirmCampaign.id))
      setSelected(s => s && s.id === confirmCampaign.id ? null : s)
    } catch (e) {
      notify('Failed to delete: ' + e.message, 'error')
    } finally {
      setConfirmCampaign(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading campaigns...
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <ConfirmDialog
        open={!!confirmCampaign}
        title="Delete Campaign"
        message={`Delete "${confirmCampaign?.name}" and all its leads? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={removeCampaign}
        onCancel={() => setConfirmCampaign(null)}
      />

      {/* Campaign list */}
      <div className="lg:w-72 flex-shrink-0 space-y-3">
        {!isDemo && (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={15} /> New Review Campaign
          </button>
        )}
        <div className="space-y-1.5">
          {campaigns.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">No campaigns yet.</div>
          ) : campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors group ${selected?.id === c.id ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.status === 'Active' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Star size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">Review · {c.status}</div>
                  </div>
                </div>
                <span
                  onClick={e => { e.stopPropagation(); setConfirmCampaign(c) }}
                  className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 size={13} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <CampaignDetail key={selected.id} campaign={selected} onUpdated={handleUpdated} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Star size={32} className="opacity-30 mb-2" />
            <p className="text-sm">Select or create a review campaign to get started</p>
          </div>
        )}
      </div>

      {creating && <CreateCampaignModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  )
}
