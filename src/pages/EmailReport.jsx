import { useState, useEffect } from 'react'
import { Mail, Send, MessageSquareReply, XCircle, CheckCircle, Loader2, Heart, Download, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getEmailCampaigns, getAllEmailLeads, getAllNurtureClients, getAllWorkflowExecutions } from '../services/api'

const todayStr = () => new Date().toISOString().slice(0, 10)
const daysAgoStr = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

function campaignMetrics(c, leads, clients) {
  const today = todayStr()
  if (c.type === 'nurture') {
    const cs = clients.filter(x => x.campaign_id === c.id)
    return {
      recipients: cs.length,
      active: cs.filter(x => x.status === 'Active').length,
      replied: 0,
      totalSent: cs.reduce((s, x) => s + (x.emails_sent || 0), 0),
      today: cs.filter(x => x.last_sent_at && x.last_sent_at.slice(0, 10) === today).length,
    }
  }
  const ls = leads.filter(x => x.campaign_id === c.id)
  return {
    recipients: ls.length,
    active: ls.filter(x => x.status === 'Active').length,
    replied: ls.filter(x => x.replied).length,
    totalSent: ls.reduce((s, x) => s + (x.emails_sent || 0), 0),
    today: ls.filter(x => x.last_sent_at && x.last_sent_at.slice(0, 10) === today).length,
  }
}

function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportExecsCsv(rows, from, to) {
  const header = ['timestamp', 'status', 'recipient', 'workflow', 'automation', 'trigger', 'notes']
  const lines = [header.join(',')]
  for (const e of rows) {
    lines.push([
      e.timestamp ? new Date(e.timestamp).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' }) + ' EST' : '',
      e.status || '',
      e.contact_name || '',
      e.workflow_name || '',
      e.automation || '',
      e.trigger || '',
      e.notes || '',
    ].map(csvCell).join(','))
  }
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `email-report_${from}_to_${to}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${color}`}>{label}</div>
        {Icon && <Icon size={16} className={color} />}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

const PRESETS = [
  { label: '7d', days: 6 },
  { label: '14d', days: 13 },
  { label: '30d', days: 29 },
  { label: '90d', days: 89 },
]

export default function EmailReport() {
  const [campaigns, setCampaigns] = useState([])
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [execs, setExecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(daysAgoStr(13))
  const [to, setTo] = useState(todayStr())

  useEffect(() => {
    Promise.all([getEmailCampaigns(), getAllEmailLeads(), getAllNurtureClients(), getAllWorkflowExecutions()])
      .then(([c, l, n, e]) => { setCampaigns(c); setLeads(l); setClients(n); setExecs(e) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading report...
    </div>
  )

  const isReply = e => /reply/i.test(e.workflow_name || '') || e.trigger === 'gmail_reply'
  const inRange = e => { const d = (e.timestamp || '').slice(0, 10); return d && d >= from && d <= to }

  const emailExecs = execs.filter(e => e.automation === 'Email')
  const ranged = emailExecs.filter(inRange)
  const sends = ranged.filter(e => e.status === 'success' && !isReply(e))
  const replies = ranged.filter(e => e.status === 'success' && isReply(e))
  const failed = ranged.filter(e => e.status === 'error')
  const today = todayStr()
  const sentToday = emailExecs.filter(e => e.status === 'success' && !isReply(e) && (e.timestamp || '').slice(0, 10) === today).length

  // Day buckets across the selected range (capped at 400 days).
  const days = []
  let cur = new Date(from), end = new Date(to), guard = 0
  while (cur <= end && guard < 400) {
    const d = cur.toISOString().slice(0, 10)
    days.push({ date: d, label: new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }), sent: 0, replies: 0 })
    cur = new Date(cur.getTime() + 86400000); guard++
  }
  const dayIdx = Object.fromEntries(days.map((d, i) => [d.date, i]))
  sends.forEach(e => { const k = (e.timestamp || '').slice(0, 10); if (k in dayIdx) days[dayIdx[k]].sent++ })
  replies.forEach(e => { const k = (e.timestamp || '').slice(0, 10); if (k in dayIdx) days[dayIdx[k]].replies++ })

  const sortedRanged = [...ranged].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const recent = sortedRanged.slice(0, 60)

  function applyPreset(n) { setFrom(daysAgoStr(n)); setTo(todayStr()) }

  const dateInput = 'px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      {/* Date range + export toolbar */}
      <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300"><Calendar size={15} /> Range</span>
        <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} className={dateInput} />
        <span className="text-xs text-slate-400">to</span>
        <input type="date" value={to} min={from} max={todayStr()} onChange={e => setTo(e.target.value)} className={dateInput} />
        <div className="flex items-center gap-1">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{p.label}</button>
          ))}
        </div>
        <button
          onClick={() => exportExecsCsv(sortedRanged, from, to)}
          disabled={sortedRanged.length === 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Emails Sent" value={sends.length} sub="In selected range" color="text-blue-600 dark:text-blue-400" icon={Send} />
        <StatCard label="Sent Today" value={sentToday} sub="Since midnight" color="text-emerald-600 dark:text-emerald-400" icon={Mail} />
        <StatCard label="Replies Handled" value={replies.length} sub="In selected range" color="text-violet-600 dark:text-violet-400" icon={MessageSquareReply} />
        <StatCard label="Failed" value={failed.length} sub="In selected range" color="text-red-500 dark:text-red-400" icon={XCircle} />
      </div>

      {/* Daily chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Sending Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="replies" name="Replies" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-campaign breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">By Campaign <span className="text-xs font-normal text-slate-400">(lifetime totals)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Recipients</th>
                <th className="text-left px-4 py-3 font-medium">Emails Sent</th>
                <th className="text-left px-4 py-3 font-medium">Replied</th>
                <th className="text-left px-4 py-3 font-medium">Sent Today</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const m = campaignMetrics(c, leads, clients)
                const nurture = c.type === 'nurture'
                return (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${nurture ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {nurture ? <Heart size={10} /> : <Send size={10} />} {nurture ? 'Nurture' : 'Outreach'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{m.recipients} <span className="text-xs text-slate-400">({m.active} active)</span></td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{m.totalSent}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{nurture ? '—' : m.replied}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{m.today}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {campaigns.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No campaigns yet.</div>}
      </div>

      {/* Activity log */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Email Activity</h3>
          <span className="text-xs text-slate-400">{recent.length} of {sortedRanged.length} in range</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Recipient</th>
                <th className="text-left px-4 py-3 font-medium">Workflow</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Detail</th>
                <th className="text-left px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(e => {
                const err = e.status === 'error'
                return (
                  <tr key={e.id} className={`border-b border-slate-50 dark:border-slate-700 ${err ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                    <td className="px-5 py-3">
                      {err ? <XCircle size={16} className="text-red-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{e.contact_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{e.workflow_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs ${err ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{e.notes || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' }) + ' EST' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sortedRanged.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No email activity in this range.</div>}
      </div>
    </div>
  )
}
