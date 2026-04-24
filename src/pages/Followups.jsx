import { useState } from 'react'
import { CalendarDays, Plus, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { followups as initialFollowups, contacts } from '../data/mockData'

const sourceColors = {
  Website: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const statusConfig = {
  Pending: { color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', icon: Clock, dot: 'bg-amber-400' },
  Done: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle, dot: 'bg-emerald-400' },
  Overdue: { color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: AlertCircle, dot: 'bg-red-500' },
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ contactId: '', followUpDate: '', message: '', status: 'Pending' })
  function submit(e) {
    e.preventDefault()
    const contact = contacts.find(c => c.id === form.contactId)
    if (!contact || !form.followUpDate || !form.message) return
    onAdd({
      id: 'fu_new_' + Date.now(),
      ...form,
      contactName: contact.name,
      source: contact.source,
      createdAt: new Date().toISOString(),
    })
    onClose()
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact</label>
            <select
              value={form.contactId}
              onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
              required
              className={inputCls}
            >
              <option value="">Select a contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.source})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Follow-up Date</label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message / Task</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={3}
              placeholder="What needs to be done for this follow-up?"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Add Follow-up
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

export default function Followups() {
  const [items, setItems] = useState(initialFollowups)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const pending = items.filter(f => f.status === 'Pending').length
  const overdue = items.filter(f => f.status === 'Overdue').length
  const done = items.filter(f => f.status === 'Done').length

  const filtered = filter === 'All' ? items : items.filter(f => f.status === filter)

  function markDone(id) {
    setItems(prev => prev.map(f => f.id === id ? { ...f, status: 'Done' } : f))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Follow-ups', count: items.length, color: 'bg-slate-900 dark:bg-slate-700', click: 'All' },
          { label: 'Pending', count: pending, color: 'bg-amber-500', click: 'Pending' },
          { label: 'Overdue', count: overdue, color: 'bg-red-500', click: 'Overdue' },
          { label: 'Completed', count: done, color: 'bg-emerald-500', click: 'Done' },
        ].map(({ label, count, color, click }) => (
          <button
            key={label}
            onClick={() => setFilter(click)}
            className={`${color} rounded-xl p-4 text-left transition-transform hover:scale-[1.02] shadow-sm ${filter === click ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
          >
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-sm text-white opacity-80 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

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
          <Plus size={16} />
          Add Follow-up
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(f => {
          const cfg = statusConfig[f.status]
          const StatusIcon = cfg.icon
          const contact = contacts.find(c => c.id === f.contactId)
          const isOverdue = f.status === 'Overdue'
          const isPending = f.status === 'Pending'

          return (
            <div key={f.id} className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm px-4 md:px-5 py-4 flex items-start gap-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${cfg.dot}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {contact && (
                        <div className={`w-7 h-7 rounded-full ${contact.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {contact.avatar}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white">{f.contactName}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[f.source]}`}>
                        {sourceIcons[f.source]} {f.source}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{f.message}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
                      <StatusIcon size={12} />
                      {f.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                      {new Date(f.followUpDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span>Created {new Date(f.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {isPending && (
                <button
                  onClick={() => markDone(f.id)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
                >
                  Mark Done
                </button>
              )}
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
        <AddModal onClose={() => setShowModal(false)} onAdd={item => setItems(prev => [item, ...prev])} />
      )}
    </div>
  )
}
