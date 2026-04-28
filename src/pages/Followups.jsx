import { useState, useEffect } from 'react'
import { CalendarDays, Plus, X, CheckCircle, Clock, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { getFollowups, updateFollowupStatus, createFollowup, deleteFollowup, getContacts } from '../services/api'

const sourceColors = {
  Website:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email:     'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS:       'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const statusConfig = {
  Pending: { color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', icon: Clock, dot: 'bg-amber-400' },
  Done:    { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle, dot: 'bg-emerald-400' },
  Overdue: { color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: AlertCircle, dot: 'bg-red-500' },
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

function resolveStatus(f) {
  if (f.status === 'Done') return 'Done'
  const today = new Date().toISOString().split('T')[0]
  if (f.follow_up_date && f.follow_up_date < today) return 'Overdue'
  return 'Pending'
}

function sortByDate(items) {
  return [...items].sort((a, b) => {
    if (!a.follow_up_date) return 1
    if (!b.follow_up_date) return -1
    return a.follow_up_date.localeCompare(b.follow_up_date)
  })
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({ contacts, onClose, onAdd }) {
  const [form, setForm] = useState({ contact_id: '', follow_up_date: '', message: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    const contact = contacts.find(c => c.id === form.contact_id)
    if (!contact) { setError('Please select a contact.'); return }
    if (!form.follow_up_date) { setError('Please choose a follow-up date.'); return }
    if (!form.message.trim()) { setError('Please enter a message or task.'); return }

    setSaving(true)
    try {
      const created = await createFollowup({
        contact_id: contact.id,
        contact_name: contact.name,
        phone: contact.phone || null,
        source: contact.source || null,
        follow_up_date: form.follow_up_date,
        message: form.message.trim(),
        status: 'Pending',
      })
      onAdd(created)
      onClose()
    } catch (err) {
      setError('Failed to create follow-up: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Follow-up</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact</label>
            <select
              value={form.contact_id}
              onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Follow-up Date</label>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message / Task</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={3}
              placeholder="What needs to be done for this follow-up?"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Add Follow-up
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Followups() {
  const [items, setItems] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [loadingId, setLoadingId] = useState(null)  // for Mark Done
  const [deletingId, setDeletingId] = useState(null) // for Delete

  useEffect(() => {
    Promise.all([getFollowups(), getContacts()])
      .then(([fus, cts]) => { setItems(fus); setContacts(cts) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function markDone(id) {
    if (loadingId === id) return
    setLoadingId(id)
    try {
      const updated = await updateFollowupStatus(id, 'Done')
      setItems(prev => prev.map(f => f.id === id ? updated : f))
    } catch (err) {
      alert('Failed to update: ' + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function remove(id) {
    if (deletingId === id) return
    setDeletingId(id)
    try {
      await deleteFollowup(id)
      setItems(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleAdd(item) {
    setItems(prev => sortByDate([...prev, item]))
  }

  const resolvedItems = items.map(f => ({ ...f, status: resolveStatus(f) }))
  const pending = resolvedItems.filter(f => f.status === 'Pending').length
  const overdue = resolvedItems.filter(f => f.status === 'Overdue').length
  const done    = resolvedItems.filter(f => f.status === 'Done').length
  const filtered = filter === 'All' ? resolvedItems : resolvedItems.filter(f => f.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading follow-ups...
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Follow-ups', count: resolvedItems.length, color: 'bg-slate-900 dark:bg-slate-700', key: 'All' },
          { label: 'Pending',        count: pending,               color: 'bg-amber-500',                  key: 'Pending' },
          { label: 'Overdue',        count: overdue,               color: 'bg-red-500',                    key: 'Overdue' },
          { label: 'Completed',      count: done,                  color: 'bg-emerald-500',                key: 'Done' },
        ].map(({ label, count, color, key }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`${color} rounded-xl p-4 text-left transition-transform hover:scale-[1.02] shadow-sm ${filter === key ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
          >
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-sm text-white opacity-80 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Filter tabs + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Pending', 'Overdue', 'Done'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Follow-up
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(f => {
          const cfg = statusConfig[f.status] || statusConfig.Pending
          const StatusIcon = cfg.icon
          const contact = contacts.find(c => c.id === f.contact_id)
          const isOverdue = f.status === 'Overdue'
          const isPending = f.status === 'Pending'
          const initials = contact ? (contact.avatar || getInitials(contact.name)) : getInitials(f.contact_name)
          const avatarColor = contact ? (contact.avatar_color || getAvatarColor(contact.name)) : getAvatarColor(f.contact_name)
          const phone = f.phone || contact?.phone

          return (
            <div
              key={f.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm px-4 md:px-5 py-4 flex items-start gap-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${cfg.dot}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{f.contact_name || 'Unknown'}</span>
                      {f.source && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[f.source] || 'bg-slate-100 text-slate-600'}`}>
                          {sourceIcons[f.source]} {f.source}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{f.message}</p>
                  </div>

                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {f.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                      {f.follow_up_date
                        ? new Date(f.follow_up_date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  {phone && (
                    <a href={`tel:${phone}`} className="hover:text-blue-500 transition-colors">{phone}</a>
                  )}
                  <span>Created {f.created_at ? new Date(f.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {(isPending || isOverdue) && (
                  <button
                    onClick={() => markDone(f.id)}
                    disabled={loadingId === f.id}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {loadingId === f.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                    Mark Done
                  </button>
                )}
                <button
                  onClick={() => remove(f.id)}
                  disabled={deletingId === f.id}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete follow-up"
                >
                  {deletingId === f.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-16 text-center text-slate-400">
            <CalendarDays size={36} className="mx-auto mb-2 opacity-30" />
            <p>No follow-ups for this filter</p>
          </div>
        )}
      </div>

      {showModal && (
        <AddModal
          contacts={contacts}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
