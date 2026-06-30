import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Mail, Zap, Heart } from 'lucide-react'
import { getEmailPipelineLeads } from '../../services/api'

const stages = ['Enrolled Leads', 'Email Sent', 'Replied', 'Unsubscribed', 'Completed']

const stageColors = {
  'Enrolled Leads': 'border-t-slate-400',
  'Email Sent':      'border-t-blue-400',
  'Replied':         'border-t-emerald-500',
  'Unsubscribed':    'border-t-red-400',
  'Completed':       'border-t-violet-500',
}
const stageBg = {
  'Enrolled Leads': 'bg-slate-50 dark:bg-slate-700/50',
  'Email Sent':      'bg-blue-50/50 dark:bg-blue-900/20',
  'Replied':         'bg-emerald-50/50 dark:bg-emerald-900/20',
  'Unsubscribed':    'bg-red-50/30 dark:bg-red-900/10',
  'Completed':       'bg-violet-50/50 dark:bg-violet-900/20',
}
const stageHeaderColor = {
  'Enrolled Leads': 'text-slate-600 dark:text-slate-300',
  'Email Sent':      'text-blue-700 dark:text-blue-400',
  'Replied':         'text-emerald-700 dark:text-emerald-400',
  'Unsubscribed':    'text-red-600 dark:text-red-400',
  'Completed':       'text-violet-700 dark:text-violet-400',
}
const stageBarColors = {
  'Enrolled Leads': 'bg-slate-400',
  'Email Sent':      'bg-blue-400',
  'Replied':         'bg-emerald-500',
  'Unsubscribed':    'bg-red-400',
  'Completed':       'bg-violet-500',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}
function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'America/Toronto' })
}

export default function EmailFollowupBoard() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEmailPipelineLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading email pipeline...
    </div>
  )

  const stageData = {}
  stages.forEach(s => { stageData[s] = [] })
  leads.forEach(l => { (stageData[l.stage] || stageData['Enrolled Leads']).push(l) })

  const total = leads.length
  const repliedCount = stageData['Replied'].length
  const replyRate = total ? Math.round((repliedCount / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 md:gap-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 md:px-5 py-3 flex-wrap">
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total Enrolled</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">{total}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Replied</span>
          <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">{repliedCount}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Reply Rate</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">{replyRate}%</span>
        </div>
        <div className="flex-1 min-w-32">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
            {stages.map(stage => {
              const count = stageData[stage].length
              const pct = total ? (count / total) * 100 : 0
              return pct > 0 ? (
                <div key={stage} className={`${stageBarColors[stage]} h-full`} style={{ width: `${pct}%` }} title={`${stage}: ${count}`} />
              ) : null
            })}
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 italic">Stage updates automatically — not draggable</span>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map(stage => {
          const cards = stageData[stage]
          return (
            <div key={stage} className="flex-shrink-0 w-52 md:w-56">
              <div className={`rounded-xl border border-slate-200 dark:border-slate-700 border-t-4 ${stageColors[stage]} shadow-sm overflow-hidden bg-white dark:bg-slate-800`}>
                <div className={`px-3 py-2.5 ${stageBg[stage]} border-b border-slate-100 dark:border-slate-700`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wide ${stageHeaderColor[stage]}`}>{stage}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                      {cards.length}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-2 min-h-32 max-h-[calc(100vh-18rem)] overflow-y-auto">
                  {cards.map(l => {
                    const initials = getInitials(l.name)
                    const avatarColor = getAvatarColor(l.name)
                    const isNurture = l.kind === 'nurture'
                    return (
                      <div
                        key={`${l.kind}:${l.id}`}
                        onClick={() => l.campaignId && navigate(`/email-campaigns/${l.campaignId}`)}
                        className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 shadow-sm transition-all duration-150 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500 select-none"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{l.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{l.email}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {l.campaign && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold
                              ${isNurture
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                              {isNurture ? <Heart size={8} /> : <Zap size={8} />}
                              {l.campaign.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1"><Mail size={10} />{l.emailsSent} sent</span>
                          <span>{formatDate(l.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}

                  {cards.length === 0 && (
                    <div className="py-6 text-center text-xs rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
