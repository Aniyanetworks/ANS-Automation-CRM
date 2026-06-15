import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Filter, X, Phone, Mail, ChevronDown, ChevronUp, Loader2, Plus, Trash2, Heart, Upload, Download, FolderPlus, Send, Tag, Star } from 'lucide-react'
import {
  getContacts, updateContact, createContact, createContacts, deleteContact, deleteContacts,
  getNurtureCampaigns, createNurtureClients,
  getContactGroups, getGroupMemberships, createContactGroup, deleteContactGroup, addContactsToGroup,
  getEmailCampaigns, createEmailLeads,
  getReviewCampaigns, createReviewLeads,
} from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import { useNotify } from '../context/NotifyContext'
import { useAuth } from '../context/AuthContext'

// ── CSV helpers (contact bulk import) ──────────────────────────────────────────

const CONTACT_CSV_COLUMNS = ['name', 'email', 'phone', 'source', 'service_type', 'lead_status', 'interest', 'summary', 'message', 'client_note']

function parseCsvRows(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(field); field = '' }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (ch !== '\r') field += ch
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function parseContactsCsv(text) {
  const rows = parseCsvRows(text)
  if (rows.length === 0) return []
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const idx = {}
  CONTACT_CSV_COLUMNS.forEach(col => { idx[col] = header.indexOf(col) })
  // If no recognizable header, treat the first row as data in column order.
  const hasHeader = idx.name >= 0 || idx.email >= 0
  const get = (r, col, pos) => {
    const at = hasHeader ? idx[col] : pos
    return at >= 0 ? (r[at] || '').trim() : ''
  }
  const out = []
  for (let i = hasHeader ? 1 : 0; i < rows.length; i++) {
    const r = rows[i]
    if (r.every(c => !c || !c.trim())) continue
    const name = get(r, 'name', 0)
    const email = get(r, 'email', 1)
    if (!name && !email) continue
    out.push({
      name,
      email,
      phone: get(r, 'phone', 2),
      source: get(r, 'source', 3) || 'Website',
      service_type: get(r, 'service_type', 4),
      lead_status: get(r, 'lead_status', 5) || 'New Lead',
      interest: get(r, 'interest', 6) || 'Pending',
      summary: get(r, 'summary', 7),
      message: get(r, 'message', 8),
      client_note: get(r, 'client_note', 9),
    })
  }
  return out
}

function downloadContactTemplate() {
  const header = CONTACT_CSV_COLUMNS.join(',')
  const ex1 = 'John Doe,john@example.com,4165551234,Website,WhatsApp Automation,New Lead,Pending,Wants to automate support,Enquiry from website,'
  const ex2 = 'Jane Smith,jane@example.com,4165555678,Facebook,Booking Automation,Contacted,Yes,Needs booking + reminders,,Past project delivered'
  const csv = [header, ex1, ex2].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contacts-template.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const sourceColors = {
  Website:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email:     'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS:       'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  WhatsApp:  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Referral:  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Other:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬', WhatsApp: '📱', Referral: '🤝', Other: '📋' }

const interestColors = {
  Yes: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  No: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
}

const statusColors = {
  'New Lead': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'Contacted': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Follow-Up': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Interested': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Booked': 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'Closed Won': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Closed Lost': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Client': 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

const leadStatuses = ['New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Booked', 'Closed Won', 'Closed Lost', 'Client']

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  const i = (name || '').charCodeAt(0) % colors.length
  return colors[i]
}

function EditModal({ contact, onClose, onSave }) {
  const notify = useNotify()
  const [form, setForm] = useState({
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    lead_status: contact.lead_status || 'New Lead',
    interest: contact.interest || 'Pending',
    service_type: contact.service_type || '',
    summary: contact.summary || '',
    client_note: contact.client_note || '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateContact(contact.id, form)
      onSave(updated)
      onClose()
    } catch (err) {
      notify('Failed to save: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Edit Contact</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lead Status</label>
              <select value={form.lead_status} onChange={e => setForm(f => ({ ...f, lead_status: e.target.value }))} className={inputCls}>
                {leadStatuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Interest</label>
              <select value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))} className={inputCls}>
                <option>Yes</option><option>No</option><option>Pending</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Service Type</label>
              <input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Summary</label>
              <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                <Heart size={12} className="text-rose-500" /> Client / Project Note
              </label>
              <textarea value={form.client_note} onChange={e => setForm(f => ({ ...f, client_note: e.target.value }))} rows={3} placeholder="Past work with us, project outcomes, anything to personalize relationship check-ins..." className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
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

function CreateModal({ onClose, onCreate }) {
  const notify = useNotify()
  const blankForm = {
    name: '', email: '', phone: '', source: 'Website',
    service_type: '', lead_status: 'New Lead', interest: 'Pending',
    summary: '', message: '', client_note: '',
  }
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const created = await createContact({
        ...form,
        last_action_date: new Date().toISOString(),
        avatar: getInitials(form.name),
        avatar_color: getAvatarColor(form.name),
      })
      onCreate(created)
      onClose()
    } catch (err) {
      notify('Failed to create: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Contact</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name <span className="text-red-400">*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="4161234567" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
                {['Website', 'Facebook', 'Instagram', 'Email', 'SMS', 'WhatsApp', 'Referral', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lead Status</label>
              <select value={form.lead_status} onChange={e => setForm(f => ({ ...f, lead_status: e.target.value }))} className={inputCls}>
                {leadStatuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Interest</label>
              <select value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))} className={inputCls}>
                <option>Yes</option><option>No</option><option>Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Service Type</label>
              <input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} placeholder="e.g. WhatsApp Automation" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Initial Message / Notes</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} placeholder="What did they enquire about?" className={`${inputCls} resize-none`} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Summary</label>
              <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2} placeholder="Brief summary of this lead..." className={`${inputCls} resize-none`} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                <Heart size={12} className="text-rose-500" /> Client / Project Note
              </label>
              <textarea value={form.client_note} onChange={e => setForm(f => ({ ...f, client_note: e.target.value }))} rows={2} placeholder="Past work with us, project outcomes... (used for relationship check-ins)" className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Contact
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

function ContactDetail({ contact, onClose, onEdit, onDelete }) {
  if (!contact) return null
  const initials = contact.avatar || getInitials(contact.name)
  const avatarColor = contact.avatar_color || getAvatarColor(contact.name)
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Contact Details</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0`}>
              {initials}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{contact.name}</div>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[contact.lead_status] || 'bg-slate-100 text-slate-600'}`}>
                {contact.lead_status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone size={15} className="text-slate-400 flex-shrink-0" />
              <span className={contact.phone ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}>{contact.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-slate-400 flex-shrink-0" />
              <span className={contact.email ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}>{contact.email || 'Not provided'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-medium mb-1">Source</div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[contact.source] || 'bg-slate-100 text-slate-600'}`}>
                {sourceIcons[contact.source]} {contact.source}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-medium mb-1">Interest</div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${interestColors[contact.interest] || 'bg-slate-100 text-slate-600'}`}>
                {contact.interest}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 col-span-2">
              <div className="text-xs text-slate-400 font-medium mb-1">Service Type</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{contact.service_type || '—'}</div>
            </div>
          </div>

          {contact.summary && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-2">AI Summary</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{contact.summary}</p>
            </div>
          )}

          {contact.client_note && (
            <div className="bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4">
              <div className="text-xs text-rose-500 dark:text-rose-400 font-medium mb-2 flex items-center gap-1"><Heart size={12} /> Client / Project Note</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{contact.client_note}</p>
            </div>
          )}

          {contact.last_message_sent && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-2">Last Message Sent</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{contact.last_message_sent}"</p>
            </div>
          )}

          {contact.lead_status === 'Follow-Up' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-2">Follow-Up Sequence</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Current Step</div>
                  <div className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{contact.current_step || 'START'}</div>
                </div>
                {contact.last_action_type && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    via {contact.last_action_type}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400 font-medium mb-1">SMS Sent</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.initial_sms_sent === 'Yes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {contact.initial_sms_sent || 'No'}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Replied</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.customer_replied === 'Yes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {contact.customer_replied || 'No'}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Unsubscribed</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.unsubscribe === 'Yes' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                {contact.unsubscribe || 'No'}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Last Action</div>
              <div className="text-slate-700 dark:text-slate-300">
                {contact.last_action_date ? new Date(contact.last_action_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}
              </div>
            </div>
          </div>

          {contact.session_id && (
            <div className="text-xs text-slate-400">
              Session ID: <span className="font-mono text-slate-600 dark:text-slate-400">{contact.session_id}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button onClick={onEdit} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Edit Contact
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function NurtureEnrollModal({ contacts, onClose, onDone }) {
  const notify = useNotify()
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getNurtureCampaigns()
      .then(data => { setCampaigns(data); if (data.length) setCampaignId(data[0].id) })
      .catch(e => notify('Failed to load nurture campaigns: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const withEmail = contacts.filter(c => c.email && c.email.trim())
  const skipped = contacts.length - withEmail.length
  const campaign = campaigns.find(c => c.id === campaignId)
  const inputCls2 = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

  async function submit() {
    if (!campaign || withEmail.length === 0) return
    setSaving(true)
    try {
      // First check-in fires on the next scheduler tick (so it goes out promptly after enrolment).
      // The recurring interval is applied by the nurture workflow after each send.
      const next = new Date().toISOString()
      const rows = withEmail.map(c => ({
        campaign_id: campaign.id,
        contact_id: c.id,
        name: c.name || '',
        email: c.email,
        note: c.client_note || '',
        status: 'Active',
        next_send_at: next,
        emails_sent: 0,
      }))
      await createNurtureClients(rows)
      onDone(withEmail.length)
      onClose()
    } catch (e) {
      notify('Failed to enroll: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Heart size={16} className="text-rose-500" /> Add to Client Nurture</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No Client Nurture campaign exists yet. Create one on the <span className="font-medium text-slate-700 dark:text-slate-200">Email Campaigns</span> page (type: "Client Nurture"), then come back.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nurture Campaign</label>
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className={inputCls2}>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                {withEmail.length} contact{withEmail.length !== 1 ? 's' : ''} will be enrolled. First check-in in {Number(campaign?.interval_days) || 30} {campaign?.interval_unit || 'days'}, then every {Number(campaign?.interval_days) || 30} {campaign?.interval_unit || 'days'}.
                {skipped > 0 && <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{skipped} skipped (no email address).</div>}
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving || loading || campaigns.length === 0 || withEmail.length === 0} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />} Enroll {withEmail.length || ''}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const fieldCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

function BulkImportModal({ onClose, onImported }) {
  const notify = useNotify()
  const fileRef = useRef(null)
  const [staged, setStaged] = useState([])
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseContactsCsv(String(reader.result))
      if (rows.length === 0) notify('No valid rows found — each row needs at least a name or email.', 'error')
      setStaged(rows)
    }
    reader.onerror = () => notify('Could not read the file.', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  async function submit() {
    if (staged.length === 0) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const rows = staged.map(c => ({
        ...c,
        last_action_date: now,
        avatar: getInitials(c.name || c.email),
        avatar_color: getAvatarColor(c.name || c.email),
      }))
      const created = await createContacts(rows)
      onImported(created)
      notify(`Imported ${created.length} contact${created.length !== 1 ? 's' : ''}.`, 'success')
      onClose()
    } catch (err) {
      notify('Import failed: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Bulk Import Contacts</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">Step 1 — Download the template</div>
              <div className="text-xs text-slate-400 mt-0.5">CSV columns: {CONTACT_CSV_COLUMNS.join(', ')}</div>
            </div>
            <button onClick={downloadContactTemplate} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0">
              <Download size={14} /> Template
            </button>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Step 2 — Upload your filled CSV</div>
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              <Upload size={16} /> {fileName ? `Replace file (${fileName})` : 'Choose CSV file'}
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </div>
          {staged.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{staged.length} contact{staged.length !== 1 ? 's' : ''} ready</div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                {staged.map((c, i) => (
                  <div key={i} className="px-4 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name || <span className="text-slate-400 italic">No name</span>}</div>
                      <div className="text-xs text-slate-400 truncate">{[c.email, c.phone, c.service_type].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">{c.lead_status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button onClick={submit} disabled={saving || staged.length === 0} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import {staged.length || ''} Contact{staged.length !== 1 ? 's' : ''}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AddToGroupModal({ contactIds, groups, onClose, onDone }) {
  const notify = useNotify()
  const [mode, setMode] = useState(groups.length ? 'existing' : 'new')
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      let gid = groupId
      if (mode === 'new') {
        if (!newName.trim()) { setSaving(false); return }
        const g = await createContactGroup(newName.trim())
        gid = g.id
      }
      if (!gid) { setSaving(false); return }
      await addContactsToGroup(gid, contactIds)
      onDone(contactIds.length)
      onClose()
    } catch (err) {
      notify('Failed to add to group: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FolderPlus size={16} className="text-blue-500" /> Add to Group</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Adding {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} to a group.</p>
          <div className="flex gap-2">
            <button onClick={() => setMode('existing')} disabled={!groups.length} className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${mode === 'existing' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>Existing group</button>
            <button onClick={() => setMode('new')} className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${mode === 'new' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>New group</button>
          </div>
          {mode === 'existing' ? (
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className={fieldCls}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New group name (e.g. Toronto Clients)" className={fieldCls} autoFocus />
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving || (mode === 'new' ? !newName.trim() : !groupId)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />} Add to Group
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PushGroupModal({ group, members, onClose, onDone }) {
  const notify = useNotify()
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getEmailCampaigns()
      .then(all => {
        setCampaigns(all)
        if (all.length) setCampaignId(all[0].id)
      })
      .catch(e => notify('Failed to load campaigns: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const withEmail = members.filter(m => m.email && m.email.trim())
  const skipped = members.length - withEmail.length
  const campaign = campaigns.find(c => c.id === campaignId)
  const isNurture = campaign && campaign.type === 'nurture'

  async function submit() {
    if (!campaign || withEmail.length === 0) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (isNurture) {
        const rows = withEmail.map(m => ({
          campaign_id: campaign.id,
          contact_id: m.id,
          name: m.name || '',
          email: m.email,
          note: m.client_note || '',
          status: 'Active',
          next_send_at: now,
          emails_sent: 0,
        }))
        await createNurtureClients(rows)
      } else {
        const rows = withEmail.map(m => ({
          campaign_id: campaign.id,
          name: m.name || '',
          email: m.email,
          service: m.service_type || '',
          status: 'Active',
          current_step: 0,
          next_send_at: now,
          replied: false,
          emails_sent: 0,
        }))
        await createEmailLeads(rows)
      }
      onDone(withEmail.length, campaign.name)
      onClose()
    } catch (err) {
      notify('Failed to push to campaign: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Send size={16} className="text-blue-500" /> Push “{group.name}” to Campaign</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No email campaign exists yet. Create one on the <span className="font-medium text-slate-700 dark:text-slate-200">Email Campaigns</span> page first.</div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Campaign</label>
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className={fieldCls}>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name} {(c.type || 'outreach') === 'nurture' ? '— Nurture' : '— Outreach'}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                {withEmail.length} of {members.length} group member{members.length !== 1 ? 's' : ''} will be enrolled as {isNurture ? 'nurture clients' : 'leads'}.
                {skipped > 0 && <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{skipped} skipped (no email address).</div>}
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving || loading || campaigns.length === 0 || withEmail.length === 0} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Push {withEmail.length || ''} to Campaign
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewEnrollModal({ contacts, onClose, onDone }) {
  const notify = useNotify()
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getReviewCampaigns()
      .then(data => { setCampaigns(data); if (data.length) setCampaignId(data[0].id) })
      .catch(e => notify('Failed to load review campaigns: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const withContact = contacts.filter(c => c.phone || c.email)
  const skipped = contacts.length - withContact.length
  const inputCls2 = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500'

  async function submit() {
    if (!campaignId || withContact.length === 0) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const rows = withContact.map(c => ({
        campaign_id: campaignId,
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        status: 'Active',
        current_step: 0,
        next_send_at: now,
        messages_sent: 0,
      }))
      await createReviewLeads(rows)
      fetch('https://n8n.srv1300653.hstgr.cloud/webhook/ang-ghl-review', { mode: 'no-cors' }).catch(() => {})
      onDone(withContact.length)
      onClose()
    } catch (e) {
      notify('Failed to enroll: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Star size={16} className="text-amber-500" /> Add to Review Campaign</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No Review Campaign exists yet. Create one on the <span className="font-medium text-slate-700 dark:text-slate-200">Review Campaigns</span> page, then come back.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Review Campaign</label>
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className={inputCls2}>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                {withContact.length} contact{withContact.length !== 1 ? 's' : ''} will be enrolled. Initial SMS + Email sent immediately, then follow-ups at Day 1, 3, 7, 15, 30, 60.
                {skipped > 0 && <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{skipped} skipped (no phone or email).</div>}
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving || loading || campaigns.length === 0 || withContact.length === 0} className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />} Enroll {withContact.length || ''}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function Contacts() {
  const notify = useNotify()
  const { isDemo } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterInterest, setFilterInterest] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sortKey, setSortKey] = useState('last_action_date')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmPending, setConfirmPending] = useState(null)
  const [nurtureOpen, setNurtureOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  // confirmPending: null | { type: 'single', contact } | { type: 'bulk' }
  const [groups, setGroups] = useState([])
  const [memberships, setMemberships] = useState([]) // [{ group_id, contact_id }]
  const [filterGroup, setFilterGroup] = useState('All')
  const [importOpen, setImportOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [pushGroup, setPushGroup] = useState(null)
  const [confirmGroup, setConfirmGroup] = useState(null)

  const pendingContactId = useRef(null)

  function reloadGroups() {
    getContactGroups().then(setGroups).catch(() => {})
    getGroupMemberships().then(setMemberships).catch(() => {})
  }

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreating(true)
      navigate('/contacts', { replace: true, state: {} })
    }
    if (location.state?.searchQuery) {
      setSearch(location.state.searchQuery)
      navigate('/contacts', { replace: true, state: {} })
    }
    if (location.state?.openContact) {
      pendingContactId.current = location.state.openContact
      navigate('/contacts', { replace: true, state: {} })
    }
  }, [location.state])

  useEffect(() => {
    Promise.all([getContacts(), getContactGroups(), getGroupMemberships()])
      .then(([data, grps, mems]) => {
        setContacts(data)
        setGroups(grps)
        setMemberships(mems)
        if (pendingContactId.current) {
          const found = data.find(c => c.id === pendingContactId.current)
          if (found) setSelected(found)
          pendingContactId.current = null
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCreate(created) {
    setContacts(prev => [created, ...prev])
  }

  function handleImported(created) {
    setContacts(prev => [...created, ...prev])
  }

  async function executeDeleteGroup() {
    if (!confirmGroup) return
    try {
      await deleteContactGroup(confirmGroup.id)
      setGroups(prev => prev.filter(g => g.id !== confirmGroup.id))
      setMemberships(prev => prev.filter(m => m.group_id !== confirmGroup.id))
      if (filterGroup === confirmGroup.id) setFilterGroup('All')
    } catch (err) {
      notify('Failed to delete group: ' + err.message, 'error')
    } finally {
      setConfirmGroup(null)
    }
  }

  function handleSave(updated) {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)
  }

  async function executeConfirmedDelete() {
    if (!confirmPending) return
    try {
      if (confirmPending.type === 'single') {
        await deleteContact(confirmPending.contact.id)
        setContacts(prev => prev.filter(c => c.id !== confirmPending.contact.id))
        setSelected(null)
      } else {
        const ids = [...selectedIds]
        await deleteContacts(ids)
        setContacts(prev => prev.filter(c => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
      }
    } catch (err) {
      notify('Failed to delete: ' + err.message, 'error')
    } finally {
      setConfirmPending(null)
    }
  }

  function toggleSelect(id, e) {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const groupMemberIds = filterGroup === 'All'
    ? null
    : new Set(memberships.filter(m => m.group_id === filterGroup).map(m => m.contact_id))
  const groupCounts = groups.reduce((acc, g) => {
    acc[g.id] = memberships.filter(m => m.group_id === g.id).length
    return acc
  }, {})

  const filtered = contacts
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.service_type || '').toLowerCase().includes(q)
      const matchInterest = filterInterest === 'All' || c.interest === filterInterest
      const matchSource = filterSource === 'All' || c.source === filterSource
      const matchStatus = filterStatus === 'All' || c.lead_status === filterStatus
      const matchGroup = !groupMemberIds || groupMemberIds.has(c.id)
      return matchSearch && matchInterest && matchSource && matchStatus && matchGroup
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (sortKey === 'last_action_date') { va = new Date(va || 0); vb = new Date(vb || 0) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))
  const someSelected = filtered.some(c => selectedIds.has(c.id)) && !allSelected

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={13} className="text-slate-300 dark:text-slate-600" />
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-blue-500" /> : <ChevronDown size={13} className="text-blue-500" />
  }

  const confirmTitle = confirmPending?.type === 'bulk'
    ? `Delete ${selectedIds.size} Contact${selectedIds.size > 1 ? 's' : ''}`
    : 'Delete Contact'
  const confirmMessage = confirmPending?.type === 'bulk'
    ? `Permanently delete ${selectedIds.size} contact${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
    : `Delete ${confirmPending?.contact?.name}? This cannot be undone.`

  const allStatuses = [...new Set(contacts.map(c => c.lead_status).filter(Boolean))]
  const allSources = [...new Set(contacts.map(c => c.source).filter(Boolean))]
  const inputCls = 'px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading contacts...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500">
      Error: {error}
    </div>
  )

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmPending}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Delete"
        onConfirm={executeConfirmedDelete}
        onCancel={() => setConfirmPending(null)}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, service..."
            className={`w-full pl-9 pr-4 ${inputCls}`}
          />
        </div>
        <select value={filterInterest} onChange={e => setFilterInterest(e.target.value)} className={inputCls}>
          <option value="All">All Interest</option>
          <option>Yes</option><option>No</option><option>Pending</option>
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={inputCls}>
          <option value="All">All Sources</option>
          {allSources.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
          <option value="All">All Statuses</option>
          {allStatuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} contacts</span>
        {selectedIds.size > 0 && (
          <>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{selectedIds.size} selected</span>
            {!isDemo && (
              <button
                onClick={() => setAddGroupOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <FolderPlus size={14} /> Add to Group
              </button>
            )}
            {!isDemo && (
              <button
                onClick={() => setNurtureOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Heart size={14} /> Add to Nurture
              </button>
            )}
            {!isDemo && (
              <button
                onClick={() => setReviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Star size={14} /> Add to Review
              </button>
            )}
            {!isDemo && (
              <button
                onClick={() => setConfirmPending({ type: 'bulk' })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Trash2 size={14} /> Delete {selectedIds.size}
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </>
        )}
        {!isDemo && (
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex-shrink-0"
          >
            <Upload size={15} /> Import CSV
          </button>
        )}
        {!isDemo && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={15} /> Add Contact
          </button>
        )}
      </div>

      {/* Groups bar */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide"><Tag size={12} /> Groups</span>
          <button
            onClick={() => setFilterGroup('All')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterGroup === 'All' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            All
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setFilterGroup(g.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterGroup === g.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {g.name} <span className={filterGroup === g.id ? 'text-white/70' : 'text-slate-400'}>· {groupCounts[g.id] || 0}</span>
            </button>
          ))}
          {filterGroup !== 'All' && !isDemo && (
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={() => setPushGroup(groups.find(g => g.id === filterGroup))}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <Send size={12} /> Push to Campaign
              </button>
              <button
                onClick={() => setConfirmGroup(groups.find(g => g.id === filterGroup))}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={12} /> Delete Group
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Name <SortIcon col="name" /></div>
                </th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Contact Info</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Service</th>
                <th className="text-left px-4 py-3 font-medium">Interest</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 hidden md:table-cell" onClick={() => toggleSort('last_action_date')}>
                  <div className="flex items-center gap-1">Last Action <SortIcon col="last_action_date" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const initials = c.avatar || getInitials(c.name)
                const avatarColor = c.avatar_color || getAvatarColor(c.name)
                const isChecked = selectedIds.has(c.id)
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group ${isChecked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-5 py-3.5 w-10" onClick={e => toggleSelect(c.id, e)}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</div>
                          <div className="text-xs text-slate-400 font-mono hidden sm:block">{c.session_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[c.source] || 'bg-slate-100 text-slate-600'}`}>
                        {sourceIcons[c.source]} {c.source}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="text-sm text-slate-700 dark:text-slate-300">{c.phone || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
                      <div className="text-xs text-slate-400">{c.email || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{c.service_type}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${interestColors[c.interest] || 'bg-slate-100 text-slate-600'}`}>
                        {c.interest}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.lead_status] || 'bg-slate-100 text-slate-600'}`}>
                        {c.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell">
                      {c.last_action_date ? new Date(c.last_action_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Filter size={32} className="mx-auto mb-2 opacity-30" />
            <p>No contacts match your filters</p>
          </div>
        )}
      </div>

      {selected && !editing && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmPending({ type: 'single', contact: selected })}
        />
      )}
      {selected && editing && (
        <EditModal
          contact={selected}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />
      )}
      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
      {nurtureOpen && (
        <NurtureEnrollModal
          contacts={contacts.filter(c => selectedIds.has(c.id))}
          onClose={() => setNurtureOpen(false)}
          onDone={(n) => { setSelectedIds(new Set()); notify(`Enrolled ${n} client${n !== 1 ? 's' : ''} into the nurture campaign.`, 'success') }}
        />
      )}
      {importOpen && (
        <BulkImportModal
          onClose={() => setImportOpen(false)}
          onImported={handleImported}
        />
      )}
      {addGroupOpen && (
        <AddToGroupModal
          contactIds={[...selectedIds]}
          groups={groups}
          onClose={() => setAddGroupOpen(false)}
          onDone={(n) => { setSelectedIds(new Set()); reloadGroups(); notify(`Added ${n} contact${n !== 1 ? 's' : ''} to the group.`, 'success') }}
        />
      )}
      {pushGroup && (
        <PushGroupModal
          group={pushGroup}
          members={contacts.filter(c => memberships.some(m => m.group_id === pushGroup.id && m.contact_id === c.id))}
          onClose={() => setPushGroup(null)}
          onDone={(n, campaignName) => notify(`Pushed ${n} contact${n !== 1 ? 's' : ''} from “${pushGroup.name}” into “${campaignName}”.`, 'success')}
        />
      )}
      {reviewOpen && (
        <ReviewEnrollModal
          contacts={contacts.filter(c => selectedIds.has(c.id))}
          onClose={() => setReviewOpen(false)}
          onDone={(n) => { setSelectedIds(new Set()); notify(`Enrolled ${n} contact${n !== 1 ? 's' : ''} into the review campaign.`, 'success') }}
        />
      )}
      <ConfirmDialog
        open={!!confirmGroup}
        title="Delete Group"
        message={`Delete the group “${confirmGroup?.name}”? The contacts themselves are not deleted.`}
        confirmLabel="Delete Group"
        onConfirm={executeDeleteGroup}
        onCancel={() => setConfirmGroup(null)}
      />
    </div>
  )
}
