import { useState, useEffect } from 'react'
import { Plus, Workflow, Mail, Layers, Loader2 } from 'lucide-react'
import { getPipelines } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DefaultBoard from './pipelines/DefaultBoard'
import EmailFollowupBoard from './pipelines/EmailFollowupBoard'
import CustomBoard from './pipelines/CustomBoard'
import { NewPipelineModal } from './pipelines/PipelineModals'

const ACTIVE_TAB_KEY = 'pipelines_active_tab'

export default function Pipelines() {
  const { isDemo } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(ACTIVE_TAB_KEY) || 'default' } catch { return 'default' }
  })
  const [newOpen, setNewOpen] = useState(false)

  useEffect(() => {
    getPipelines()
      .then(setPipelines)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function switchTab(id) {
    setActiveTab(id)
    try { localStorage.setItem(ACTIVE_TAB_KEY, id) } catch { /* ignore */ }
  }

  function handleCreated(pipeline) {
    setPipelines(prev => [...prev, pipeline])
    switchTab(pipeline.id)
  }

  function handlePipelineChange(updated) {
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  function handlePipelineDeleted(id) {
    setPipelines(prev => prev.filter(p => p.id !== id))
    switchTab('default')
  }

  // If the currently-active custom pipeline got deleted from elsewhere, fall back.
  const activePipeline = pipelines.find(p => p.id === activeTab)
  const effectiveTab = (activeTab === 'default' || activeTab === 'email_followup' || activePipeline) ? activeTab : 'default'

  const tabCls = (id) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      effectiveTab === id
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`

  return (
    <div className="space-y-4">
      {/* Pipeline switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => switchTab('default')} className={tabCls('default')}>
          <Workflow size={14} /> Sales Pipeline
        </button>
        <button onClick={() => switchTab('email_followup')} className={tabCls('email_followup')}>
          <Mail size={14} /> Email Follow-up
        </button>
        {pipelines.map(p => (
          <button key={p.id} onClick={() => switchTab(p.id)} className={tabCls(p.id)}>
            <Layers size={14} /> {p.name}
          </button>
        ))}
        {!isDemo && (
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Plus size={14} /> New Pipeline
          </button>
        )}
      </div>

      {/* Active board */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-2" /> Loading pipelines...
        </div>
      ) : effectiveTab === 'default' ? (
        <DefaultBoard />
      ) : effectiveTab === 'email_followup' ? (
        <EmailFollowupBoard />
      ) : activePipeline ? (
        <CustomBoard
          key={activePipeline.id}
          pipeline={activePipeline}
          onPipelineChange={handlePipelineChange}
          onPipelineDeleted={handlePipelineDeleted}
        />
      ) : null}

      {newOpen && (
        <NewPipelineModal onClose={() => setNewOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
