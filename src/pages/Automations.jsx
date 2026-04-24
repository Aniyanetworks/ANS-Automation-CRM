import { useState } from 'react'
import { Globe, Facebook, Instagram, Mail, MessageCircle, Zap, CheckCircle, XCircle, TrendingUp, Clock, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'
import { automations, workflowExecutions } from '../data/mockData'

const automationIcons = {
  Website: Globe,
  Facebook: Facebook,
  Instagram: Instagram,
  Email: Mail,
  SMS: MessageCircle,
}

const gradients = {
  Website: 'from-blue-500 to-cyan-500',
  Facebook: 'from-indigo-600 to-blue-600',
  Instagram: 'from-pink-500 to-rose-600',
  Email: 'from-purple-500 to-violet-600',
  SMS: 'from-teal-500 to-emerald-500',
}

const cardBorders = {
  Website: 'border-blue-200',
  Facebook: 'border-indigo-200',
  Instagram: 'border-pink-200',
  Email: 'border-purple-200',
  SMS: 'border-teal-200',
}

function AutomationCard({ automation, onToggle }) {
  const Icon = automationIcons[automation.type] || Zap
  const recentExecs = workflowExecutions
    .filter(e => e.automation === automation.type)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)

  const recentErrors = recentExecs.filter(e => e.status === 'error').length

  return (
    <div className={`bg-white rounded-2xl border ${cardBorders[automation.type]} shadow-sm overflow-hidden transition-all hover:shadow-lg`}>
      <div className={`bg-gradient-to-r ${gradients[automation.type]} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{automation.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${automation.status === 'Active' ? 'bg-green-300' : 'bg-white/50'}`}></div>
                <span className="text-white/80 text-xs font-medium">{automation.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggle(automation.id)}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title={automation.status === 'Active' ? 'Pause automation' : 'Resume automation'}
          >
            {automation.status === 'Active'
              ? <ToggleRight size={20} className="text-white" />
              : <ToggleLeft size={20} className="text-white/60" />
            }
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{automation.description}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-900">{automation.totalExecutions}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total Runs</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{automation.successRate}%</div>
            <div className="text-xs text-emerald-500 mt-0.5">Success Rate</div>
          </div>
          <div className={`${automation.recentErrors > 0 ? 'bg-red-50' : 'bg-slate-50'} rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${automation.recentErrors > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {automation.recentErrors}
            </div>
            <div className={`text-xs mt-0.5 ${automation.recentErrors > 0 ? 'text-red-400' : 'text-slate-400'}`}>Recent Errors</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Executions</div>
          <div className="space-y-1.5">
            {recentExecs.length > 0 ? recentExecs.map(exec => (
              <div key={exec.id} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                {exec.status === 'success'
                  ? <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  : <XCircle size={14} className="text-red-500 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-700 font-medium truncate block">{exec.contactName}</span>
                  {exec.notes && (
                    <span className="text-xs text-red-500 truncate block">{exec.notes.slice(0, 50)}...</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(exec.timestamp).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) : (
              <div className="text-xs text-slate-400 py-2 text-center">No recent executions</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={12} />
            Last run: {new Date(automation.lastRun).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          {automation.webhook && (
            <a
              href={automation.webhook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
            >
              Webhook <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Automations() {
  const [items, setItems] = useState(automations)

  function toggleStatus(id) {
    setItems(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' } : a
    ))
  }

  const active = items.filter(a => a.status === 'Active').length
  const total = items.length
  const totalRuns = items.reduce((s, a) => s + a.totalExecutions, 0)
  const avgSuccess = Math.round(items.reduce((s, a) => s + a.successRate, 0) / items.length * 10) / 10

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">Active Automations</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{active}/{total}</div>
          <div className="text-xs text-slate-400 mt-1">Running channels</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">Total Executions</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalRuns.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Across all channels</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">Avg Success Rate</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{avgSuccess}%</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgSuccess}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-slate-500 text-sm font-medium">n8n Instance</div>
          <div className="text-sm font-bold text-slate-900 mt-2 truncate">n8n.srv1300653.hstgr.cloud</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {items.map(automation => (
          <AutomationCard key={automation.id} automation={automation} onToggle={toggleStatus} />
        ))}
      </div>
    </div>
  )
}
