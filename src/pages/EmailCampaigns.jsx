import { useState, useEffect, useRef } from 'react'
import {
  Mail, Plus, X, Loader2, Trash2, Users, Send, ChevronRight,
  Clock, CheckCircle, MessageSquareReply, Pause, Play, Sparkles, Save, Upload,
} from 'lucide-react'
import {
  getEmailCampaigns, createEmailCampaign, updateEmailCampaign, deleteEmailCampaign,
  getEmailSteps, createEmailStep, updateEmailStep, deleteEmailStep,
  getEmailLeads, createEmailLeads, deleteEmailLead,
} from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

const leadStatusColors = {
  Active:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Replied:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Completed:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Unsubscribed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Error:        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const DEFAULT_PROMPT = `You are a helpful sales assistant for Aniya Network Solutions. A lead has replied to our outreach email. Reply warmly and professionally, answer their question, and gently steer toward booking a call. Keep it short (2-4 sentences).`

// ── Create Campaign Modal ─────────────────────────────────────────────────────

function CampaignModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', from_name: '', from_email: '', ai_reply_prompt: DEFAULT_PROMPT })
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      // Start Paused so nothing sends until the sequence + leads are reviewed and the user clicks Resume.
      const created = await createEmailCampaign({ ...form, status: 'Paused' })
      onCreate(created)
      onClose()
    } catch (err) {
      alert('Failed to create campaign: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Email Campaign</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Campaign Name <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Q3 Web Design Outreach" className={inputCls} />
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
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Sparkles size={12} className="text-violet-500" /> AI Reply Prompt
            </label>
            <textarea value={form.ai_reply_prompt} onChange={e => setForm(f => ({ ...f, ai_reply_prompt: e.target.value }))} rows={4} className={`${inputCls} resize-none`} />
            <p className="text-xs text-slate-400 mt-1">Used by the AI agent to reply when a lead responds.</p>
          </div>
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

function AddLeadsModal({ campaignId, onClose, onAdded }) {
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
      const now = new Date().toISOString()
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
      }))
      const created = await createEmailLeads(rows)
      onAdded(created)
      onClose()
    } catch (err) {
      alert('Failed to add leads: ' + err.message)
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

// ── Step Editor Row ───────────────────────────────────────────────────────────

function StepRow({ step, index, onSave, onDelete }) {
  const [form, setForm] = useState({ subject: step.subject || '', body: step.body || '', delay_days: step.delay_days ?? 0 })
  const [saving, setSaving] = useState(false)
  const dirty = form.subject !== (step.subject || '') || form.body !== (step.body || '') || Number(form.delay_days) !== (step.delay_days ?? 0)

  async function save() {
    setSaving(true)
    try {
      await onSave(step.id, { subject: form.subject, body: form.body, delay_days: Number(form.delay_days) || 0 })
    } finally {
      setSaving(false)
    }
  }

  const isFirst = index === 0

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${isFirst ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
            {isFirst ? 'FIRST EMAIL' : `FOLLOW-UP ${index}`}
          </span>
          {!isFirst && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} /> wait
              <input
                type="number" min="0"
                value={form.delay_days}
                onChange={e => setForm(f => ({ ...f, delay_days: e.target.value }))}
                className="w-14 px-1.5 py-0.5 text-xs text-center border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              days after previous
            </span>
          )}
        </div>
        <button onClick={() => onDelete(step.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <input
        value={form.subject}
        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
        placeholder="Subject line"
        className={inputCls}
      />
      <textarea
        value={form.body}
        onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
        rows={5}
        placeholder="Hi {{name}}, ... about {{service}} ..."
        className={`${inputCls} resize-none`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Placeholders: <code className="text-slate-500 dark:text-slate-300">{'{{name}}'}</code> <code className="text-slate-500 dark:text-slate-300">{'{{email}}'}</code> <code className="text-slate-500 dark:text-slate-300">{'{{service}}'}</code>
        </span>
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

// ── Campaign Detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign, onUpdated }) {
  const [steps, setSteps] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingLeads, setAddingLeads] = useState(false)
  const [confirmLead, setConfirmLead] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([getEmailSteps(campaign.id), getEmailLeads(campaign.id)])
      .then(([s, l]) => { setSteps(s); setLeads(l) })
      .catch(e => alert('Failed to load: ' + e.message))
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
      })
      setSteps(prev => [...prev, created])
    } catch (e) {
      alert('Failed to add step: ' + e.message)
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
      alert('Failed to delete step: ' + e.message)
    }
  }

  async function removeLead() {
    if (!confirmLead) return
    try {
      await deleteEmailLead(confirmLead.id)
      setLeads(prev => prev.filter(l => l.id !== confirmLead.id))
    } catch (e) {
      alert('Failed to delete lead: ' + e.message)
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
      alert('Failed to update: ' + e.message)
    }
  }

  const active = leads.filter(l => l.status === 'Active').length
  const replied = leads.filter(l => l.replied).length
  const completed = leads.filter(l => l.status === 'Completed').length

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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{campaign.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {campaign.from_name || 'No sender name'} {campaign.from_email ? `· ${campaign.from_email}` : ''}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${campaign.status === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'}`}
        >
          {campaign.status === 'Active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{leads.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Leads</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{active}</div>
          <div className="text-xs text-slate-400 mt-0.5">Active in Sequence</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{replied}</div>
          <div className="text-xs text-slate-400 mt-0.5">Replied</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-500 dark:text-slate-300">{completed}</div>
          <div className="text-xs text-slate-400 mt-0.5">Completed</div>
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
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Send size={15} className="text-blue-500" /> Email Sequence
              </h3>
              <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Users size={15} className="text-blue-500" /> Leads
              </h3>
              <button onClick={() => setAddingLeads(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Plus size={13} /> Add Leads
              </button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {leads.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">No leads enrolled yet.</div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[32rem] overflow-y-auto">
                  {leads.map(l => (
                    <div key={l.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{l.name || l.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${leadStatusColors[l.status] || 'bg-slate-100 text-slate-600'}`}>
                            {l.replied && <MessageSquareReply size={9} className="inline mr-0.5 -mt-0.5" />}
                            {l.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{l.email}{l.service ? ` · ${l.service}` : ''}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1 justify-end">
                          <CheckCircle size={11} className="text-slate-300" /> {l.emails_sent || 0} sent
                        </div>
                        <div className="text-xs text-slate-400">step {l.current_step}</div>
                      </div>
                      <button
                        onClick={() => setConfirmLead(l)}
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
      )}

      {addingLeads && (
        <AddLeadsModal
          campaignId={campaign.id}
          onClose={() => setAddingLeads(false)}
          onAdded={created => setLeads(prev => [...created, ...prev])}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [confirmCampaign, setConfirmCampaign] = useState(null)

  useEffect(() => {
    getEmailCampaigns()
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
      await deleteEmailCampaign(confirmCampaign.id)
      setCampaigns(prev => prev.filter(c => c.id !== confirmCampaign.id))
      setSelected(s => s && s.id === confirmCampaign.id ? null : s)
    } catch (e) {
      alert('Failed to delete: ' + e.message)
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
        message={`Delete "${confirmCampaign?.name}" and all its steps and leads? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={removeCampaign}
        onCancel={() => setConfirmCampaign(null)}
      />

      {/* Campaign list */}
      <div className="lg:w-72 flex-shrink-0 space-y-3">
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus size={15} /> New Campaign
        </button>
        <div className="space-y-1.5">
          {campaigns.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">No campaigns yet.</div>
          ) : campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors group ${selected?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.status === 'Active' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.status}</div>
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
          <CampaignDetail campaign={selected} onUpdated={handleUpdated} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Mail size={32} className="opacity-30 mb-2" />
            <p className="text-sm">Select or create a campaign to get started</p>
          </div>
        )}
      </div>

      {creating && <CampaignModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  )
}
