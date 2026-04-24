import { Users, TrendingUp, CalendarDays, Activity, ArrowUpRight, Globe, MessageCircle } from 'lucide-react'
import { contacts, followups, workflowExecutions, automations } from '../data/mockData'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const sourceColors = {
  Website: '#3b82f6',
  Facebook: '#6366f1',
  Instagram: '#ec4899',
  Email: '#8b5cf6',
  SMS: '#14b8a6',
}

const sourceIcons = {
  Website: '🌐',
  Facebook: '📘',
  Instagram: '📸',
  Email: '📧',
  SMS: '💬',
}

function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
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

function SourceBadge({ source }) {
  const colors = {
    Website: 'bg-blue-50 text-blue-700',
    Facebook: 'bg-indigo-50 text-indigo-700',
    Instagram: 'bg-pink-50 text-pink-700',
    Email: 'bg-purple-50 text-purple-700',
    SMS: 'bg-teal-50 text-teal-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[source] || 'bg-slate-100 text-slate-700'}`}>
      {sourceIcons[source]} {source}
    </span>
  )
}

function InterestBadge({ interest }) {
  const map = {
    Yes: 'bg-emerald-50 text-emerald-700',
    No: 'bg-red-50 text-red-700',
    Pending: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[interest] || 'bg-slate-100 text-slate-600'}`}>
      {interest}
    </span>
  )
}

export default function Dashboard() {
  const activeLeads = contacts.filter(c => c.interest !== 'No' && c.leadStatus !== 'Closed Lost' && c.leadStatus !== 'Closed Won').length
  const pendingFollowups = followups.filter(f => f.status === 'Pending').length
  const overdueFollowups = followups.filter(f => f.status === 'Overdue').length
  const successCount = workflowExecutions.filter(e => e.status === 'success').length
  const successRate = Math.round((successCount / workflowExecutions.length) * 100)

  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.lastActionDate) - new Date(a.lastActionDate))
    .slice(0, 6)

  const recentActivity = [...workflowExecutions]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)

  const sourceCounts = contacts.reduce((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1
    return acc
  }, {})
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  const pipelineCounts = {
    'New Lead': contacts.filter(c => c.leadStatus === 'New Lead').length,
    'Contacted': contacts.filter(c => c.leadStatus === 'Contacted').length,
    'Hot/Qualified': contacts.filter(c => ['Hot Lead', 'Qualified Lead'].includes(c.leadStatus)).length,
    'Proposal': contacts.filter(c => c.leadStatus === 'Proposal Sent').length,
    'Won': contacts.filter(c => c.leadStatus === 'Closed Won').length,
    'Lost': contacts.filter(c => c.leadStatus === 'Closed Lost').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={contacts.length}
          sub="All time leads"
          icon={Users}
          color="bg-blue-500"
          trend="+3 this week"
        />
        <StatCard
          title="Active Leads"
          value={activeLeads}
          sub="In progress"
          icon={TrendingUp}
          color="bg-emerald-500"
          trend="+2 since yesterday"
        />
        <StatCard
          title="Pending Follow-ups"
          value={pendingFollowups}
          sub={overdueFollowups > 0 ? `${overdueFollowups} overdue` : 'All on track'}
          icon={CalendarDays}
          color={overdueFollowups > 0 ? 'bg-amber-500' : 'bg-violet-500'}
        />
        <StatCard
          title="Workflow Success Rate"
          value={`${successRate}%`}
          sub={`${successCount}/${workflowExecutions.length} executions`}
          icon={Activity}
          color="bg-rose-500"
          trend="Last 20 runs"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Contacts</h2>
            <a href="/contacts" className="text-xs text-blue-600 hover:underline font-medium">View all</a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-left px-4 py-3 font-medium">Interest</th>
                <th className="text-left px-4 py-3 font-medium">Last Action</th>
              </tr>
            </thead>
            <tbody>
              {recentContacts.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {c.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.phone || c.email || 'No contact info'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><SourceBadge source={c.source} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.serviceType}</td>
                  <td className="px-4 py-3"><InterestBadge interest={c.interest} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(c.lastActionDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Lead Sources</h2>
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
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sourceColors[name] || '#94a3b8' }}></div>
                    <span className="text-slate-600">{name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Pipeline Summary</h2>
            <div className="space-y-2">
              {Object.entries(pipelineCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{stage}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / contacts.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Workflow Activity</h2>
          <a href="/workflows" className="text-xs text-blue-600 hover:underline font-medium">View all logs</a>
        </div>
        <div className="divide-y divide-slate-50">
          {recentActivity.map((exec) => (
            <div key={exec.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${exec.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{exec.workflowName}</div>
                <div className="text-xs text-slate-400">{exec.contactName}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                exec.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {exec.status === 'success' ? 'Success' : 'Error'}
              </span>
              {exec.status === 'success' && (
                <span className="text-xs text-slate-400 flex-shrink-0">{exec.duration}ms</span>
              )}
              <span className="text-xs text-slate-400 flex-shrink-0">
                {new Date(exec.timestamp).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
