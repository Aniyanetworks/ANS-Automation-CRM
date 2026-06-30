import { useState, useEffect, useRef } from 'react'
import { Phone, Mail, Loader2, GripVertical, X, Plus, Settings, Search } from 'lucide-react'
import { getPipelineBoard, assignContactToPipeline, removeContactFromPipeline, getContacts } from '../../services/api'
import { PipelineSettingsModal } from './PipelineModals'
import { useNotify } from '../../context/NotifyContext'

const palette = [
  { border: 'border-t-slate-400',  bg: 'bg-slate-50 dark:bg-slate-700/50',   header: 'text-slate-600 dark:text-slate-300',   bar: 'bg-slate-400',  drop: 'ring-2 ring-slate-400 bg-slate-50 dark:bg-slate-700/80' },
  { border: 'border-t-blue-400',   bg: 'bg-blue-50/50 dark:bg-blue-900/20',   header: 'text-blue-700 dark:text-blue-400',     bar: 'bg-blue-400',   drop: 'ring-2 ring-blue-400 bg-blue-50/80 dark:bg-blue-900/40' },
  { border: 'border-t-violet-500', bg: 'bg-violet-50/50 dark:bg-violet-900/20', header: 'text-violet-700 dark:text-violet-400', bar: 'bg-violet-500', drop: 'ring-2 ring-violet-500 bg-violet-50/80 dark:bg-violet-900/40' },
  { border: 'border-t-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20', header: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500', drop: 'ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/40' },
  { border: 'border-t-amber-400',  bg: 'bg-amber-50/50 dark:bg-amber-900/20', header: 'text-amber-700 dark:text-amber-400',   bar: 'bg-amber-400',  drop: 'ring-2 ring-amber-400 bg-amber-50/80 dark:bg-amber-900/40' },
  { border: 'border-t-cyan-500',   bg: 'bg-cyan-50/50 dark:bg-cyan-900/20',   header: 'text-cyan-700 dark:text-cyan-400',     bar: 'bg-cyan-500',   drop: 'ring-2 ring-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/40' },
  { border: 'border-t-rose-500',   bg: 'bg-rose-50/50 dark:bg-rose-900/20',   header: 'text-rose-700 dark:text-rose-400',     bar: 'bg-rose-500',   drop: 'ring-2 ring-rose-500 bg-rose-50/80 dark:bg-rose-900/40' },
]
function paletteFor(i) { return palette[i % palette.length] }

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function getAvatarColor(name) {
  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

function AddContactsToPipelineModal({ pipelineId, stageId, stageName, excludeIds, onClose, onAdded }) {
  const notify = useNotify()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch(e => notify('Failed to load contacts: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const available = contacts.filter(c => !excludeIds.has(c.id))
  const q = search.trim().toLowerCase()
  const filtered = q
    ? available.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))
    : available

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function submit() {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const ids = [...selected]
      await Promise.all(ids.map(id => assignContactToPipeline(id, pipelineId, stageId)))
      const added = contacts.filter(c => selected.has(c.id)).map(c => ({ ...c, stageId }))
      onAdded(added)
      onClose()
    } catch (e) {
      notify('Failed to add contacts: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">Add Contacts to "{stageName}"</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400"><Loader2 size={18} className="animate-spin mr-2" /> Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">No contacts to add.</div>
          ) : (
            filtered.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="rounded border-slate-300" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name || 'Unknown'}</div>
                  <div className="text-xs text-slate-400 truncate">{c.email || c.phone || '—'}</div>
                </div>
              </label>
            ))
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2 flex-shrink-0">
          <button onClick={submit} disabled={saving || selected.size === 0} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add {selected.size || ''}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CustomBoard({ pipeline, onPipelineChange, onPipelineDeleted }) {
  const notify = useNotify()
  const [board, setBoard] = useState({})
  const [loading, setLoading] = useState(true)
  const [movingId, setMovingId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [addModalStage, setAddModalStage] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dragInfo = useRef(null)

  useEffect(() => {
    setLoading(true)
    getPipelineBoard(pipeline.id)
      .then(rows => {
        const map = {}
        pipeline.stages.forEach(s => { map[s.id] = [] })
        rows.forEach(r => { (map[r.stageId] || (map[r.stageId] = [])).push(r) })
        setBoard(map)
      })
      .catch(e => notify('Failed to load pipeline: ' + e.message, 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline.id])

  // Pick up stages added/removed via the settings modal without a full reload.
  useEffect(() => {
    setBoard(prev => {
      const next = { ...prev }
      pipeline.stages.forEach(s => { if (!next[s.id]) next[s.id] = [] })
      return next
    })
  }, [pipeline.stages])

  async function applyMove(contactId, fromStageId, toStageId) {
    if (fromStageId === toStageId || movingId === contactId) return
    setMovingId(contactId)
    const snapshot = board
    setBoard(prev => {
      const contact = prev[fromStageId]?.find(c => c.id === contactId)
      if (!contact) return prev
      return {
        ...prev,
        [fromStageId]: prev[fromStageId].filter(c => c.id !== contactId),
        [toStageId]: [...(prev[toStageId] || []), { ...contact, stageId: toStageId }],
      }
    })
    try {
      await assignContactToPipeline(contactId, pipeline.id, toStageId)
    } catch (err) {
      notify('Failed to move contact: ' + err.message, 'error')
      setBoard(snapshot)
    } finally {
      setMovingId(null)
    }
  }

  function onDragStart(e, contactId, fromStageId) {
    dragInfo.current = { contactId, fromStageId }
    setDraggingId(contactId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragEnd() {
    setDraggingId(null)
    setDragOverStage(null)
    dragInfo.current = null
  }
  function onDragOver(e, stageId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }
  function onDragLeave(e, stageId) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(prev => prev === stageId ? null : prev)
    }
  }
  function onDrop(e, toStageId) {
    e.preventDefault()
    setDragOverStage(null)
    if (!dragInfo.current) return
    const { contactId, fromStageId } = dragInfo.current
    applyMove(contactId, fromStageId, toStageId)
  }

  async function handleRemove(contactId, stageId) {
    const snapshot = board
    setBoard(prev => ({ ...prev, [stageId]: prev[stageId].filter(c => c.id !== contactId) }))
    try {
      await removeContactFromPipeline(contactId, pipeline.id)
    } catch (e) {
      notify('Failed to remove contact: ' + e.message, 'error')
      setBoard(snapshot)
    }
  }

  function handleAdded(addedContacts) {
    setBoard(prev => {
      const next = { ...prev }
      addedContacts.forEach(c => {
        next[c.stageId] = [...(next[c.stageId] || []), c]
      })
      return next
    })
  }

  const assignedIds = new Set(Object.values(board).flat().map(c => c.id))
  const total = Object.values(board).flat().length

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-2" /> Loading pipeline...
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 md:gap-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 md:px-5 py-3 flex-wrap">
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total Contacts</span>
          <span className="ml-2 font-bold text-slate-900 dark:text-white">{total}</span>
        </div>
        <div className="flex-1 min-w-32">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
            {pipeline.stages.map((s, i) => {
              const count = board[s.id]?.length || 0
              const pct = total ? (count / total) * 100 : 0
              return pct > 0 ? (
                <div key={s.id} className={`${paletteFor(i).bar} h-full`} style={{ width: `${pct}%` }} title={`${s.name}: ${count}`} />
              ) : null
            })}
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <Settings size={13} /> Manage
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipeline.stages.map((stage, i) => {
          const cards = board[stage.id] || []
          const isOver = dragOverStage === stage.id
          const c = paletteFor(i)
          return (
            <div key={stage.id} className="flex-shrink-0 w-52 md:w-56">
              <div
                className={`rounded-xl border border-slate-200 dark:border-slate-700 border-t-4 ${c.border} shadow-sm overflow-hidden transition-all duration-150 ${isOver ? c.drop : 'bg-white dark:bg-slate-800'}`}
                onDragLeave={e => onDragLeave(e, stage.id)}
              >
                <div className={`px-3 py-2.5 ${isOver ? '' : c.bg} border-b border-slate-100 dark:border-slate-700`}>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wide truncate ${c.header}`}>{stage.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                        {cards.length}
                      </span>
                      <button
                        onClick={() => setAddModalStage(stage)}
                        title="Add contacts"
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="p-2 space-y-2 min-h-32 max-h-[calc(100vh-18rem)] overflow-y-auto"
                  onDragOver={e => onDragOver(e, stage.id)}
                  onDrop={e => onDrop(e, stage.id)}
                >
                  {cards.map(ct => {
                    const initials = ct.avatar || getInitials(ct.name)
                    const avatarColor = ct.avatar_color || getAvatarColor(ct.name)
                    const isDragging = draggingId === ct.id
                    const isMoving = movingId === ct.id
                    return (
                      <div
                        key={ct.id}
                        draggable
                        onDragStart={e => onDragStart(e, ct.id, stage.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={e => e.preventDefault()}
                        className={`relative bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 shadow-sm transition-all duration-150 group select-none
                          ${isDragging ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500'}
                          ${isMoving ? 'opacity-60' : ''}`}
                      >
                        <button
                          onClick={() => handleRemove(ct.id, stage.id)}
                          title="Remove from pipeline"
                          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                        <div className="flex items-center gap-2 mb-2 pr-4">
                          <GripVertical size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0 -ml-1 cursor-grab active:cursor-grabbing" />
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{ct.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{ct.service_type}</div>
                          </div>
                        </div>

                        {(ct.phone || ct.email) && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
                            {ct.phone && <div className="flex items-center gap-1"><Phone size={10} />{ct.phone}</div>}
                            {ct.email && <div className="flex items-center gap-1 truncate"><Mail size={10} />{ct.email}</div>}
                          </div>
                        )}

                        {isMoving && (
                          <div className="flex justify-center mt-2">
                            <Loader2 size={14} className="animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {cards.length === 0 && (
                    <div className={`py-6 text-center text-xs rounded-lg border-2 border-dashed transition-colors ${isOver ? 'border-current text-current opacity-60' : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}`}>
                      {isOver ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {addModalStage && (
        <AddContactsToPipelineModal
          pipelineId={pipeline.id}
          stageId={addModalStage.id}
          stageName={addModalStage.name}
          excludeIds={assignedIds}
          onClose={() => setAddModalStage(null)}
          onAdded={handleAdded}
        />
      )}

      {settingsOpen && (
        <PipelineSettingsModal
          pipeline={pipeline}
          onClose={() => setSettingsOpen(false)}
          onUpdated={onPipelineChange}
          onDeleted={onPipelineDeleted}
        />
      )}
    </div>
  )
}
