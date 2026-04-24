import { useState } from 'react'
import { Search, Filter, X, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { contacts } from '../data/mockData'

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
  'Hot Lead': 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Qualified Lead': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Proposal Sent': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Closed Won': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Closed Lost': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

function ContactDetail({ contact, onClose }) {
  if (!contact) return null
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
            <div className={`w-14 h-14 rounded-2xl ${contact.avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0`}>
              {contact.avatar}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{contact.name}</div>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[contact.leadStatus]}`}>
                {contact.leadStatus}
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[contact.source]}`}>
                {sourceIcons[contact.source]} {contact.source}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-medium mb-1">Interest</div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${interestColors[contact.interest]}`}>
                {contact.interest}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 col-span-2">
              <div className="text-xs text-slate-400 font-medium mb-1">Service Type</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{contact.serviceType}</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium mb-2">AI Summary</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{contact.summary}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium mb-2">Last Message Sent</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{contact.lastMessageSent}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400 font-medium mb-1">SMS Sent</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.initialSmsSent === 'Yes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {contact.initialSmsSent}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Replied</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.customerReplied === 'Yes' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                {contact.customerReplied}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Unsubscribed</div>
              <span className={`px-2 py-0.5 rounded-full font-medium ${contact.unsubscribe === 'Yes' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                {contact.unsubscribe}
              </span>
            </div>
            <div>
              <div className="text-slate-400 font-medium mb-1">Last Action</div>
              <div className="text-slate-700 dark:text-slate-300">
                {new Date(contact.lastActionDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Session ID: <span className="font-mono text-slate-600 dark:text-slate-400">{contact.sessionId}</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Edit Contact
          </button>
          <button className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Add Follow-up
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [filterInterest, setFilterInterest] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selected, setSelected] = useState(null)
  const [sortKey, setSortKey] = useState('lastActionDate')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = contacts
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.serviceType.toLowerCase().includes(q)
      const matchInterest = filterInterest === 'All' || c.interest === filterInterest
      const matchSource = filterSource === 'All' || c.source === filterSource
      const matchStatus = filterStatus === 'All' || c.leadStatus === filterStatus
      return matchSearch && matchInterest && matchSource && matchStatus
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (sortKey === 'lastActionDate') { va = new Date(va); vb = new Date(vb) }
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

  const allStatuses = [...new Set(contacts.map(c => c.leadStatus))]
  const allSources = [...new Set(contacts.map(c => c.source))]

  const inputCls = 'px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'

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
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 hidden md:table-cell" onClick={() => toggleSort('lastActionDate')}>
                  <div className="flex items-center gap-1">Last Action <SortIcon col="lastActionDate" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {c.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono hidden sm:block">{c.sessionId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[c.source]}`}>
                      {sourceIcons[c.source]} {c.source}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <div className="text-sm text-slate-700 dark:text-slate-300">{c.phone || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
                    <div className="text-xs text-slate-400">{c.email || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{c.serviceType}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${interestColors[c.interest]}`}>
                      {c.interest}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.leadStatus]}`}>
                      {c.leadStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell">
                    {new Date(c.lastActionDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
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

      {selected && <ContactDetail contact={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
