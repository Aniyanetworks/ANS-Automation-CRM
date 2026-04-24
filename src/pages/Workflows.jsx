import { useState } from 'react'
import { Activity, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { workflowExecutions } from '../data/mockData'

const automationColors = {
  Website: 'bg-blue-50 text-blue-700',
  Facebook: 'bg-indigo-50 text-indigo-700',
  Instagram: 'bg-pink-50 text-pink-700',
  Email: 'bg-purple-50 text-purple-700',
  SMS: 'bg-teal-50 text-teal-700',
}
const automationIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

function formatDuration(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function Workflows() {
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterAuto, setFilterAuto] = useState('All')
  const [expanded, setExpanded] = useState(null)

  const total = workflowExecutions.length
  const success = workflowExecutions.filter(e => e.status === 'success').length
  const errors = workflowExecutions.filter(e => e.status === 'error').length
  const successRate = Math.round((success / total) * 100)
  const avgDuration = Math.round(
    workflowExecutions.filter(e => e.duration > 0).reduce((s, e) => s + e.duration, 0) /
    workflowExecutions.filter(e => e.duration > 0).length
  )

  const allAutomations = [...new Set(workflowExecutions.map(e => e.automation))]

  const filtered = workflowExecutions
    .filter(e => {
      const matchStatus = filterStatus === 'All' || e.status === filterStatus.toLowerCase()
      const matchAuto = filterAuto === 'All' || e.automation === filterAuto
      return matchStatus && matchAuto
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">Total Runs</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{total}</div>
          <div className="text-xs text-slate-400 mt-1">All time</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-emerald-600 text-sm font-medium">Successful</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{success}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
            </div>
            <span className="text-xs text-emerald-600 font-medium">{successRate}%</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-red-500 text-sm font-medium">Errors</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{errors}</div>
          <div className="text-xs text-red-400 mt-1">{Math.round((errors / total) * 100)}% error rate</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">Avg Duration</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{formatDuration(avgDuration)}</div>
          <div className="text-xs text-slate-400 mt-1">Successful runs only</div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {['All', 'Success', 'Error'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'Success' && '✓ '}{s === 'Error' && '✗ '}{s}
            </button>
          ))}
        </div>
        <select
          value={filterAuto}
          onChange={e => setFilterAuto(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
        >
          <option value="All">All Automations</option>
          {allAutomations.map(a => <option key={a}>{a}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} executions</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Workflow</th>
              <th className="text-left px-4 py-3 font-medium">Automation</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Trigger</th>
              <th className="text-left px-4 py-3 font-medium">Duration</th>
              <th className="text-left px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(exec => {
              const isExpanded = expanded === exec.id
              return (
                <>
                  <tr
                    key={exec.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${exec.status === 'error' ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      {exec.status === 'success' ? (
                        <CheckCircle size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium text-slate-900">{exec.workflowName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${automationColors[exec.automation]}`}>
                        {automationIcons[exec.automation]} {exec.automation}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{exec.contactName}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{exec.trigger}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {exec.status === 'success' ? (
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock size={13} className="text-slate-400" />
                          {formatDuration(exec.duration)}
                        </span>
                      ) : (
                        <span className="text-sm text-red-400">Failed</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(exec.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5">
                      {exec.notes && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : exec.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-400"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && exec.notes && (
                    <tr key={`${exec.id}-detail`} className="border-b border-slate-50 bg-red-50/50">
                      <td colSpan={8} className="px-5 py-3">
                        <div className="flex items-start gap-2">
                          <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-red-600 mb-0.5">Error Details</div>
                            <div className="text-sm text-red-700 font-mono bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                              {exec.notes}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Activity size={32} className="mx-auto mb-2 opacity-30" />
            <p>No executions match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
