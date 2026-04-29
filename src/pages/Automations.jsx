import { useState, useEffect } from 'react'
import { Globe, Facebook, MessageCircle, Mail, RefreshCw, Zap, CheckCircle, XCircle, Clock, ToggleLeft, ToggleRight, ExternalLink, Loader2, ChevronRight } from 'lucide-react'
import { getAllWorkflowExecutions } from '../services/api'

const N8N_BASE = 'https://n8n.srv1300653.hstgr.cloud/webhook'

const AUTOMATION_CONFIG = [
  {
    id: 'chat-widget',
    name: 'Jasica Live Chat',
    type: 'Website',
    description: 'AI-powered live chat on aniyanetworks.net. Jasica AI agent handles visitor queries, collects lead info, and sends booking links.',
    webhook: `${N8N_BASE}/chat-widget`,
    workflowNames: ['Website Chat Widget — AI Reply'],
    trigger: 'Webhook',
  },
  {
    id: 'website-contact',
    name: 'Website Lead Capture',
    type: 'Website',
    description: 'Captures leads from the WordPress contact form, creates or updates Supabase contacts, and triggers the follow-up sequence automatically.',
    webhook: `${N8N_BASE}/aniyanetworks-contact-us`,
    workflowNames: ['Website Contact Form'],
    trigger: 'Webhook',
  },
  {
    id: 'facebook',
    name: 'Facebook AI Responder',
    type: 'Facebook',
    description: 'Automated AI responses to Facebook Messenger DMs and post comments. Handles lead qualification, booking confirmations, and comment replies.',
    webhook: `${N8N_BASE}/facebook-webhook`,
    workflowNames: ['Facebook DM — AI Reply', 'Facebook DM — Booking Confirmed', 'Facebook Comment — AI Reply'],
    trigger: 'Facebook Webhook',
  },
  {
    id: 'initial-sms',
    name: 'SMS Lead Outreach',
    type: 'SMS',
    description: 'Automated SMS outreach to new leads on a scheduled cadence. Sends initial contact message and records conversation history in Supabase.',
    webhook: '',
    workflowNames: ['Initial SMS Outreach'],
    trigger: 'Schedule',
  },
  {
    id: 'sms-reply',
    name: 'SMS Conversation AI',
    type: 'SMS',
    description: 'AI-powered inbound SMS handler. Responds intelligently to customer replies, manages opt-outs, and logs all interactions.',
    webhook: `${N8N_BASE}/ans-followup`,
    workflowNames: ['SMS AI Reply', 'SMS Opt-Out'],
    trigger: 'Webhook',
  },
  {
    id: 'follow-up',
    name: 'Lead Nurture Sequence',
    type: 'FollowUp',
    description: 'Automated multi-step follow-up running hourly. Sends SMS and email touches to leads at defined intervals until they convert or opt out.',
    webhook: '',
    workflowNames: ['Follow-Up Sequence'],
    trigger: 'Schedule (Hourly)',
    steps: [
      { id: 'SMS_1',   channel: 'SMS',   delay: '2 hrs'   },
      { id: 'EMAIL_1', channel: 'Email', delay: '+1 day'  },
      { id: 'SMS_2',   channel: 'SMS',   delay: '+2 days' },
      { id: 'EMAIL_2', channel: 'Email', delay: '+3 days' },
      { id: 'SMS_3',   channel: 'SMS',   delay: '+5 days' },
    ],
  },
]

const automationIcons = {
  Website: Globe,
  Facebook: Facebook,
  SMS: MessageCircle,
  FollowUp: RefreshCw,
}

const gradients = {
  Website: 'from-blue-500 to-cyan-500',
  Facebook: 'from-indigo-600 to-blue-600',
  SMS: 'from-teal-500 to-emerald-500',
  FollowUp: 'from-amber-500 to-orange-500',
}

const cardBorders = {
  Website: 'border-blue-200 dark:border-blue-800',
  Facebook: 'border-indigo-200 dark:border-indigo-800',
  SMS: 'border-teal-200 dark:border-teal-800',
  FollowUp: 'border-amber-200 dark:border-amber-800',
}

function computeStats(executions, workflowNames) {
  const typeExecs = executions.filter(e => workflowNames.includes(e.workflow_name))
  const total = typeExecs.length
  const errors = typeExecs.filter(e => e.status === 'error').length
  const successRate = total ? Math.round((((total - errors) / total) * 100) * 10) / 10 : 0
  const lastRun = typeExecs[0]?.timestamp || null
  const recent = typeExecs.slice(0, 5)
  return { total, errors, successRate, lastRun, recent }
}

function AutomationCard({ config, stats, status, onToggle }) {
  const Icon = automationIcons[config.type] || Zap
  const { total, errors, successRate, lastRun, recent } = stats

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border ${cardBorders[config.type] || 'border-slate-200 dark:border-slate-700'} shadow-sm overflow-hidden transition-all hover:shadow-lg`}>
      <div className={`bg-gradient-to-r ${gradients[config.type] || 'from-slate-500 to-slate-600'} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{config.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-300' : 'bg-white/50'}`}></div>
                <span className="text-white/80 text-xs font-medium">{status}</span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/70 text-xs">{config.trigger}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggle(config.id)}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title={status === 'Active' ? 'Pause automation' : 'Resume automation'}
          >
            {status === 'Active'
              ? <ToggleRight size={20} className="text-white" />
              : <ToggleLeft size={20} className="text-white/60" />}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{config.description}</p>

        {config.workflowNames.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {config.workflowNames.map(wn => (
              <span key={wn} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">{wn}</span>
            ))}
          </div>
        )}

        {config.steps && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sequence · {config.steps.length} Steps</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">~11 day journey</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {config.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <ChevronRight size={10} className="text-slate-300 dark:text-slate-600" />}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${
                      step.channel === 'SMS'
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    }`}>
                      {step.channel === 'SMS' ? <MessageCircle size={10} /> : <Mail size={10} />}
                      {step.id}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{step.delay}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">{total}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total Runs</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{successRate}%</div>
            <div className="text-xs text-emerald-500 mt-0.5">Success Rate</div>
          </div>
          <div className={`${errors > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700/50'} rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {errors}
            </div>
            <div className={`text-xs mt-0.5 ${errors > 0 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>Errors</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent Executions</div>
          <div className="space-y-1.5">
            {recent.length > 0 ? recent.map(exec => (
              <div key={exec.id} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {exec.status === 'success'
                  ? <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  : <XCircle size={14} className="text-red-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block">
                    {exec.contact_name || exec.workflow_name || '—'}
                  </span>
                  {exec.notes && exec.status === 'error' && (
                    <span className="text-xs text-red-500 dark:text-red-400 truncate block">{exec.notes.slice(0, 50)}...</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                  {exec.timestamp ? new Date(exec.timestamp).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            )) : (
              <div className="text-xs text-slate-400 py-2 text-center">No executions yet</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Clock size={12} />
            {lastRun
              ? `Last run: ${new Date(lastRun).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'No runs yet'}
          </div>
          {config.webhook && (
            <a
              href={config.webhook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState(
    Object.fromEntries(AUTOMATION_CONFIG.map(a => [a.id, 'Active']))
  )

  useEffect(() => {
    getAllWorkflowExecutions()
      .then(setExecutions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggleStatus(id) {
    setStatuses(prev => ({ ...prev, [id]: prev[id] === 'Active' ? 'Paused' : 'Active' }))
  }

  const activeCount = Object.values(statuses).filter(s => s === 'Active').length
  const totalRuns = executions.length
  const totalErrors = executions.filter(e => e.status === 'error').length
  const avgSuccess = totalRuns ? Math.round(((totalRuns - totalErrors) / totalRuns) * 1000) / 10 : 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Automations</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{activeCount}/{AUTOMATION_CONFIG.length}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Running workflows</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Executions</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {loading ? <Loader2 size={24} className="animate-spin text-slate-400" /> : totalRuns.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Across all workflows</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg Success Rate</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {loading ? <Loader2 size={24} className="animate-spin text-slate-400" /> : `${avgSuccess}%`}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgSuccess}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">n8n Instance</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-2 truncate">n8n.srv1300653.hstgr.cloud</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading automations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {AUTOMATION_CONFIG.map(config => (
            <AutomationCard
              key={config.id}
              config={config}
              stats={computeStats(executions, config.workflowNames)}
              status={statuses[config.id]}
              onToggle={toggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
