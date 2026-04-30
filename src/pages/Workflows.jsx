import { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, Loader2, Trash2 } from 'lucide-react'
import { getWorkflowExecutions, deleteWorkflowExecutions } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

const automationColors = {
  Website: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  follow_up: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}
const automationIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬', follow_up: '🔁' }
const automationLabels = {
  Website: 'Website',
  Facebook: 'Facebook',
  Instagram: 'Instagram',
  Email: 'Email',
  SMS: 'SMS',
  follow_up: 'Follow-Up',
}
const automationTextColors = {
  Website: 'text-blue-600 dark:text-blue-400',
  Facebook: 'text-indigo-600 dark:text-indigo-400',
  Instagram: 'text-pink-600 dark:text-pink-400',
  Email: 'text-purple-600 dark:text-purple-400',
  SMS: 'text-teal-600 dark:text-teal-400',
  follow_up: 'text-amber-600 dark:text-amber-400',
}

function formatDuration(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function Workflows() {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterAuto, setFilterAuto] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    getWorkflowExecutions()
      .then(setExecutions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const total = executions.length
  const success = executions.filter(e => e.status === 'success').length
  const errors = executions.filter(e => e.status === 'error').length
  const successRate = total ? Math.round((success / total) * 100) : 0
  const durationsWithValue = executions.filter(e => e.duration_ms > 0)
  const avgDuration = durationsWithValue.length
    ? Math.round(durationsWithValue.reduce((s, e) => s + e.duration_ms, 0) / durationsWithValue.length)
    : 0

  const allAutomations = [...new Set(executions.map(e => e.automation).filter(Boolean))]

  const filtered = executions
    .filter(e => {
      const matchStatus = filterStatus === 'All' || e.status === filterStatus.toLowerCase()
      const matchAuto = filterAuto === 'All' || e.automation === filterAuto
      return matchStatus && matchAuto
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const allSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))
  const someSelected = filtered.some(e => selectedIds.has(e.id)) && !allSelected

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)))
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

  async function executeDelete() {
    const ids = [...selectedIds]
    setConfirmOpen(false)
    try {
      await deleteWorkflowExecutions(ids)
      setExecutions(prev => prev.filter(e => !selectedIds.has(e.id)))
      setSelectedIds(new Set())
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selectedIds.size} Log${selectedIds.size > 1 ? 's' : ''}`}
        message={`Permanently delete ${selectedIds.size} execution log${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Runs</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{total}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">All time</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Successful</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{success}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{successRate}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-red-500 dark:text-red-400 text-sm font-medium">Errors</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{errors}</div>
          <div className="text-xs text-red-400 mt-1">{Math.round((errors / total) * 100)}% error rate</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg Duration</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatDuration(avgDuration)}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Successful runs only</div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {['All', 'Success', 'Error'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {s === 'Success' && '✓ '}{s === 'Error' && '✗ '}{s}
            </button>
          ))}
        </div>
        <select
          value={filterAuto}
          onChange={e => setFilterAuto(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Automations</option>
          {allAutomations.map(a => <option key={a} value={a}>{automationLabels[a] || a}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} executions</span>
        {selectedIds.size > 0 && (
          <>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{selectedIds.size} selected</span>
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Trash2 size={14} /> Delete {selectedIds.size}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading executions...
        </div>
      ) : (
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
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Workflow</th>
                  <th className="text-left px-4 py-3 font-medium">Automation</th>
                  <th className="text-left px-4 py-3 font-medium">Contact</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Trigger</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Timestamp</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exec => {
                  const isExpanded = expanded === exec.id
                  const isError = exec.status === 'error'
                  const isChecked = selectedIds.has(exec.id)
                  return (
                    <>
                      <tr
                        key={exec.id}
                        className={`border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${isError ? 'bg-red-50/30 dark:bg-red-900/10' : ''} ${isChecked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <td className="px-5 py-3.5 w-10" onClick={e => toggleSelect(exec.id, e)}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          {exec.status === 'success'
                            ? <CheckCircle size={18} className="text-emerald-500" />
                            : <XCircle size={18} className="text-red-500" />}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={`text-sm font-medium ${automationTextColors[exec.automation] || 'text-slate-900 dark:text-white'}`}>{exec.workflow_name || '—'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${automationColors[exec.automation] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {automationIcons[exec.automation] || '⚙️'} {automationLabels[exec.automation] || exec.automation || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300">{exec.contact_name || '—'}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">{exec.trigger || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {exec.status === 'success' ? (
                            <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                              <Clock size={13} className="text-slate-400" />
                              {formatDuration(exec.duration_ms)}
                            </span>
                          ) : (
                            <span className="text-sm text-red-400">Failed</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                          {exec.timestamp ? new Date(exec.timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {exec.notes && (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : exec.id)}
                              className={`p-1.5 rounded transition-colors ${isError ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && exec.notes && (
                        <tr key={`${exec.id}-detail`} className={`border-b border-slate-50 dark:border-slate-700 ${isError ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-slate-50 dark:bg-slate-700/30'}`}>
                          <td colSpan={9} className="px-5 py-3">
                            <div className="flex items-start gap-2">
                              {isError
                                ? <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                : <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                              <div>
                                <div className={`text-xs font-semibold mb-0.5 ${isError ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {isError ? 'Error Details' : 'Notes'}
                                </div>
                                <div className={`text-sm font-mono px-3 py-2 rounded-lg border ${isError ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'}`}>
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
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p>No executions match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
