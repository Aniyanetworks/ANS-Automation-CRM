import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Filter, X, Phone, Mail, ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { getContacts, updateContact, createContact, deleteContact } from '../services/api'

const sourceColors = {
  Website: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

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
}

const leadStatuses = ['New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Booked', 'Closed Won', 'Closed Lost']

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
  const [form, setForm] = useState({
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    lead_status: contact.lead_status || 'New Lead',
    interest: contact.interest || 'Pending',
    service_type: contact.service_type || '',
    summary: contact.summary || '',
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
      alert('Failed to save: ' + err.message)
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
  const blankForm = {
    name: '', email: '', phone: '', source: 'Website',
    service_type: '', lead_status: 'New Lead', interest: 'Pending',
    summary: '', message: '',
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
      alert('Failed to create: ' + err.message)
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

          {contact.last_message_sent && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-2">Last Message Sent</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{contact.last_message_sent}"</p>
            </div>
          )}

          {(contact.current_step || contact.last_action_type) && (
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

export default function Contacts() {
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

  // Handle navigation state from Header (Add Contact button, search, or suggestion click)
  const pendingContactId = useRef(null)
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
    getContacts()
      .then(data => {
        setContacts(data)
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

  function handleSave(updated) {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)
  }

  async function handleDelete(contact) {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    try {
      await deleteContact(contact.id)
      setContacts(prev => prev.filter(c => c.id !== contact.id))
      setSelected(null)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

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
      return matchSearch && matchInterest && matchSource && matchStatus
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (sortKey === 'last_action_date') { va = new Date(va || 0); vb = new Date(vb || 0) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={13} className="text-slate-300 dark:text-slate-600" />
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-blue-500" /> : <ChevronDown size={13} className="text-blue-500" />
  }

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
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> Add Contact
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('name')}>
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
                return (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-5 py-3.5">
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
          onDelete={() => handleDelete(selected)}
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
    </div>
  )
}
