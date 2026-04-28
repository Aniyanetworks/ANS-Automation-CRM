import { useState, useEffect } from 'react'
import { Users, TrendingUp, CalendarDays, Activity, ArrowUpRight, Loader2 } from 'lucide-react'
import { getDashboardStats, getWorkflowExecutions } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const sourceColors = {
  Website: '#3b82f6',
  Facebook: '#6366f1',
  Instagram: '#ec4899',
  Email: '#8b5cf6',
  SMS: '#14b8a6',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const sourceBadgeColors = {
  Website: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Facebook: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Email: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SMS: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}
const interestBadgeColors = {
  Yes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  No: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-emerald-500 text-xs font-medium">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getWorkflowExecutions()])
      .then(([s, e]) => { setStats(s); setExecutions(e) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading dashboard...
    </div>
  )

  if (!stats) return null

  const activeLeads = stats.totalLeads - stats.closedWon - stats.closedLost
  const successRate = stats.totalExecutions ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0
  const recentActivity = [...executions].slice(0, 8)

  const sourceData = Object.entries(stats.sourceBreakdown).map(([name, value]) => ({ name, value }))

  const pipelineCounts = {
    'New Lead': stats.newLeads,
    'Contacted': stats.contacted,
    'Follow-Up': stats.followUp,
    'Interested': stats.interested,
    'Booked': stats.booked,
    'Won': stats.closedWon,
    'Lost': stats.closedLost,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={stats.totalLeads}
          sub="All time leads"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Leads"
          value={activeLeads}
          sub="In progress"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Follow-ups"
          value={stats.pendingFollowups}
          sub={stats.overdueFollowups > 0 ? `${stats.overdueFollowups} overdue` : 'All on track'}
          icon={CalendarDays}
          color={stats.overdueFollowups > 0 ? 'bg-amber-500' : 'bg-violet-500'}
        />
        <StatCard
          title="Workflow Success Rate"
          value={`${successRate}%`}
          sub={`${stats.successfulExecutions}/${stats.totalExecutions} executions`}
          icon={Activity}
          color="bg-rose-500"
          trend="Last 50 runs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Contacts</h2>
            <a href="/contacts" className="text-xs text-blue-600 hover:underline font-medium">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Source</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Service</th>
                  <th className="text-left px-4 py-3 font-medium">Interest</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentContacts.map((c) => {
                  const initials = c.avatar || getInitials(c.name)
                  const avatarColor = c.avatar_color || getAvatarColor(c.name)
                  return (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{c.phone || c.email || 'No contact info'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadgeColors[c.source] || 'bg-slate-100 text-slate-600'}`}>
                          {sourceIcons[c.source]} {c.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{c.service_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${interestBadgeColors[c.interest] || 'bg-slate-100 text-slate-600'}`}>
                          {c.interest}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell">
                        {c.last_action_date ? new Date(c.last_action_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
                {stats.recentContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No contacts yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Lead Sources</h2>
            {sourceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                      {sourceData.map((entry) => (
                        <Cell key={entry.name} fill={sourceColors[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {sourceData.map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sourceColors[name] || '#94a3b8' }}></div>
                        <span className="text-slate-600 dark:text-slate-300">{name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Pipeline Summary</h2>
            <div className="space-y-2">
              {Object.entries(pipelineCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{stage}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: stats.totalLeads ? `${(count / stats.totalLeads) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Workflow Activity</h2>
          <a href="/workflows" className="text-xs text-blue-600 hover:underline font-medium">View all logs</a>
        </div>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {recentActivity.map((exec) => (
              <div key={exec.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${exec.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{exec.workflow_name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{exec.contact_name}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  exec.status === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {exec.status === 'success' ? 'Success' : 'Error'}
                </span>
                {exec.status === 'success' && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{exec.duration_ms}ms</span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 hidden sm:inline">
                  {new Date(exec.timestamp).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm">No workflow executions logged yet</div>
        )}
      </div>
    </div>
  )
}
