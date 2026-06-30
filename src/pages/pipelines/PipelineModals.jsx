import { useState } from 'react'
import { X, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Layers, Settings, AlertTriangle } from 'lucide-react'
import {
  createPipeline, renamePipeline, deletePipeline,
  addPipelineStage, renamePipelineStage, reorderPipelineStages, deletePipelineStage,
} from '../../services/api'
import { useNotify } from '../../context/NotifyContext'

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

export function NewPipelineModal({ onClose, onCreated }) {
  const notify = useNotify()
  const [name, setName] = useState('')
  const [stages, setStages] = useState(['New', 'In Progress', 'Done'])
  const [saving, setSaving] = useState(false)

  function updateStage(i, value) {
    setStages(prev => prev.map((s, idx) => idx === i ? value : s))
  }
  function addStage() {
    setStages(prev => [...prev, ''])
  }
  function removeStage(i) {
    setStages(prev => prev.filter((_, idx) => idx !== i))
  }

  const cleanStages = stages.map(s => s.trim()).filter(Boolean)
  const valid = name.trim() && cleanStages.length >= 2

  async function submit() {
    if (!valid) return
    setSaving(true)
    try {
      const pipeline = await createPipeline(name.trim(), cleanStages)
      onCreated(pipeline)
      onClose()
    } catch (e) {
      notify('Failed to create pipeline: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={16} className="text-indigo-500" /> New Pipeline
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pipeline Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Onboarding" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Stages (in order)</label>
            <div className="space-y-2">
              {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                  <input value={s} onChange={e => updateStage(i, e.target.value)} placeholder="Stage name" className={inputCls} />
                  <button
                    type="button"
                    onClick={() => removeStage(i)}
                    disabled={stages.length <= 2}
                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStage}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus size={12} /> Add stage
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={saving || !valid}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Pipeline
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PipelineSettingsModal({ pipeline, onClose, onUpdated, onDeleted }) {
  const notify = useNotify()
  const [name, setName] = useState(pipeline.name)
  const [stages, setStages] = useState(pipeline.stages)
  const [newStageName, setNewStageName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [busyStageId, setBusyStageId] = useState(null)
  const [addingStage, setAddingStage] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function emit(nextStages) {
    setStages(nextStages)
    onUpdated({ ...pipeline, name, stages: nextStages })
  }

  async function saveName() {
    if (!name.trim() || name.trim() === pipeline.name) return
    setSavingName(true)
    try {
      await renamePipeline(pipeline.id, name.trim())
      onUpdated({ ...pipeline, name: name.trim(), stages })
    } catch (e) {
      notify('Failed to rename pipeline: ' + e.message, 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function saveStageName(stageId, value) {
    if (!value.trim()) return
    setBusyStageId(stageId)
    try {
      await renamePipelineStage(stageId, value.trim())
      emit(stages.map(s => s.id === stageId ? { ...s, name: value.trim() } : s))
    } catch (e) {
      notify('Failed to rename stage: ' + e.message, 'error')
    } finally {
      setBusyStageId(null)
    }
  }

  async function moveStage(index, dir) {
    const target = index + dir
    if (target < 0 || target >= stages.length) return
    const a = stages[index], b = stages[target]
    setBusyStageId(a.id)
    try {
      await reorderPipelineStages([{ id: a.id, position: b.position }, { id: b.id, position: a.position }])
      const next = [...stages]
      next[index] = { ...b }
      next[target] = { ...a }
      emit(next)
    } catch (e) {
      notify('Failed to reorder stages: ' + e.message, 'error')
    } finally {
      setBusyStageId(null)
    }
  }

  async function removeStage(stage) {
    if (stage.contactCount > 0) {
      notify(`Move the ${stage.contactCount} contact${stage.contactCount !== 1 ? 's' : ''} out of "${stage.name}" before deleting it.`, 'error')
      return
    }
    if (stages.length <= 2) {
      notify('A pipeline needs at least 2 stages.', 'error')
      return
    }
    setBusyStageId(stage.id)
    try {
      await deletePipelineStage(stage.id)
      emit(stages.filter(s => s.id !== stage.id))
    } catch (e) {
      notify('Failed to delete stage: ' + e.message, 'error')
    } finally {
      setBusyStageId(null)
    }
  }

  async function addStage() {
    if (!newStageName.trim()) return
    setAddingStage(true)
    try {
      const stage = await addPipelineStage(pipeline.id, newStageName.trim(), stages.length)
      emit([...stages, stage])
      setNewStageName('')
    } catch (e) {
      notify('Failed to add stage: ' + e.message, 'error')
    } finally {
      setAddingStage(false)
    }
  }

  async function handleDeletePipeline() {
    setDeleting(true)
    try {
      await deletePipeline(pipeline.id)
      onDeleted(pipeline.id)
      onClose()
    } catch (e) {
      notify('Failed to delete pipeline: ' + e.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings size={16} className="text-slate-500" /> Manage Pipeline
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pipeline Name</label>
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              <button
                onClick={saveName}
                disabled={savingName || !name.trim() || name.trim() === pipeline.name}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
              >
                {savingName ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Stages</label>
            <div className="space-y-2">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <button onClick={() => moveStage(i, -1)} disabled={i === 0 || busyStageId === s.id} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ArrowUp size={12} /></button>
                    <button onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1 || busyStageId === s.id} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ArrowDown size={12} /></button>
                  </div>
                  <input
                    defaultValue={s.name}
                    onBlur={e => saveStageName(s.id, e.target.value)}
                    className={`${inputCls} py-1.5`}
                  />
                  <span className="text-[10px] text-slate-400 w-12 text-right flex-shrink-0">{s.contactCount} lead{s.contactCount !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => removeStage(s)}
                    disabled={busyStageId === s.id}
                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="New stage name" className={`${inputCls} py-1.5`} />
              <button
                onClick={addStage}
                disabled={addingStage || !newStageName.trim()}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex-shrink-0 flex items-center gap-1"
              >
                {addingStage ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <Trash2 size={12} /> Delete this pipeline
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle size={13} /> Delete "{pipeline.name}" and remove all contacts from it?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeletePipeline}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {deleting && <Loader2 size={12} className="animate-spin" />} Yes, delete it
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
