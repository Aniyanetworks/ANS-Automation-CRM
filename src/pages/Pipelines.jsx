import { useState } from 'react'
import { ChevronRight, ChevronLeft, Phone, Mail } from 'lucide-react'
import { contacts, pipelineStages } from '../data/mockData'

const stageColors = {
  'New Lead': 'border-t-slate-400',
  'Contacted': 'border-t-blue-400',
  'Interested': 'border-t-orange-400',
  'Proposal Sent': 'border-t-purple-400',
  'Closed Won': 'border-t-emerald-500',
  'Closed Lost': 'border-t-red-400',
}

const stageBg = {
  'New Lead': 'bg-slate-50 dark:bg-slate-700/50',
  'Contacted': 'bg-blue-50/50 dark:bg-blue-900/20',
  'Interested': 'bg-orange-50/50 dark:bg-orange-900/20',
  'Proposal Sent': 'bg-purple-50/50 dark:bg-purple-900/20',
  'Closed Won': 'bg-emerald-50/50 dark:bg-emerald-900/20',
  'Closed Lost': 'bg-red-50/30 dark:bg-red-900/10',
}

const stageHeaderColor = {
  'New Lead': 'text-slate-600 dark:text-slate-300',
  'Contacted': 'text-blue-700 dark:text-blue-400',
  'Interested': 'text-orange-700 dark:text-orange-400',
  'Proposal Sent': 'text-purple-700 dark:text-purple-400',
  'Closed Won': 'text-emerald-700 dark:text-emerald-400',
  'Closed Lost': 'text-red-600 dark:text-red-400',
}

function getStageForContact(contact) {
  if (contact.leadStatus === 'New Lead') return 'New Lead'
  if (contact.leadStatus === 'Contacted') return 'Contacted'
  if (contact.leadStatus === 'Hot Lead' || contact.leadStatus === 'Qualified Lead') return 'Interested'
  if (contact.leadStatus === 'Proposal Sent') return 'Proposal Sent'
  if (contact.leadStatus === 'Closed Won') return 'Closed Won'
  if (contact.leadStatus === 'Closed Lost') return 'Closed Lost'
  return 'New Lead'
}

const sourceColors = {
  Website: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Facebook: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  SMS: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}
const sourceIcons = { Website: '🌐', Facebook: '📘', Instagram: '📸', Email: '📧', SMS: '💬' }

const interestColors = {
  Yes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  No: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function Pipelines() {
  const [stageData, setStageData] = useState(() => {
    const map = {}
    pipelineStages.forEach(s => { map[s] = [] })
    contacts.forEach(c => {
      const stage = getStageForContact(c)
      map[stage].push({ ...c })
    })
    return map
  })

  function moveContact(contactId, fromStage, direction) {
    const fromIdx = pipelineStages.indexOf(fromStage)
    const toIdx = direction === 'forward' ? fromIdx + 1 : fromIdx - 1
    if (toIdx < 0 || toIdx >= pipelineStages.length) return
    const toStage = pipelineStages[toIdx]
    setStageData(prev => {
      const contact = prev[fromStage].find(c => c.id === contactId)
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter(c => c.id !== contactId),
        [toStage]: [...prev[toStage], contact],
      }
    })
  }

  const totalValue = Object.values(stageData).flat().length
  const wonCount = stageData['Closed Won']?.length || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 md:gap-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 md:px-5 py-3 flex-wrap">
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total in Pipeline</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">{totalValue}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Closed Won</span>
          <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">{wonCount}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Win Rate</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">
            {totalValue ? Math.round((wonCount / totalValue) * 100) : 0}%
          </span>
        </div>
        <div className="flex-1 min-w-32">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
            {pipelineStages.map(stage => {
              const count = stageData[stage]?.length || 0
              const pct = totalValue ? (count / totalValue) * 100 : 0
              const colors = {
                'New Lead': 'bg-slate-400',
                'Contacted': 'bg-blue-400',
                'Interested': 'bg-orange-400',
                'Proposal Sent': 'bg-purple-400',
                'Closed Won': 'bg-emerald-500',
                'Closed Lost': 'bg-red-400',
              }
              return pct > 0 ? <div key={stage} className={`${colors[stage]} h-full`} style={{ width: `${pct}%` }} title={`${stage}: ${count}`} /> : null
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipelineStages.map((stage, stageIdx) => {
          const cards = stageData[stage] || []
          return (
            <div key={stage} className="flex-shrink-0 w-52 md:w-56">
              <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-t-4 ${stageColors[stage]} shadow-sm overflow-hidden`}>
                <div className={`px-3 py-2.5 ${stageBg[stage]} border-b border-slate-100 dark:border-slate-700`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wide ${stageHeaderColor[stage]}`}>{stage}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                      {cards.length}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-2 min-h-32 max-h-[calc(100vh-18rem)] overflow-y-auto">
                  {cards.map(c => (
                    <div key={c.id} className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{c.serviceType}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceColors[c.source]}`}>
                          {sourceIcons[c.source]} {c.source}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${interestColors[c.interest]}`}>
                          {c.interest}
                        </span>
                      </div>

                      {(c.phone || c.email) && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 space-y-0.5">
                          {c.phone && <div className="flex items-center gap-1"><Phone size={10} />{c.phone}</div>}
                          {c.email && <div className="flex items-center gap-1 truncate"><Mail size={10} />{c.email}</div>}
                        </div>
                      )}

                      <div className="flex gap-1 mt-2">
                        {stageIdx > 0 && (
                          <button
                            onClick={() => moveContact(c.id, stage, 'back')}
                            className="flex-1 flex items-center justify-center gap-0.5 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded border border-slate-200 dark:border-slate-600 transition-colors"
                          >
                            <ChevronLeft size={12} /> Back
                          </button>
                        )}
                        {stageIdx < pipelineStages.length - 1 && (
                          <button
                            onClick={() => moveContact(c.id, stage, 'forward')}
                            className="flex-1 flex items-center justify-center gap-0.5 py-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            Move <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-300 dark:text-slate-600">Empty</div>
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
