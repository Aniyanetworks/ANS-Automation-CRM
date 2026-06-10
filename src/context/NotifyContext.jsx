import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

const NotifyContext = createContext(() => {})

// useNotify() returns notify(message, type|opts)
//   notify('Saved!', 'success')
//   notify('Failed: ...', 'error')
//   notify('Heads up', { type: 'info', title: 'Note' })
export function useNotify() {
  return useContext(NotifyContext)
}

const styles = {
  error:   { icon: AlertCircle, color: 'text-red-500',     badge: 'bg-red-50 dark:bg-red-900/30',     title: 'Something went wrong' },
  success: { icon: CheckCircle, color: 'text-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-900/30', title: 'Success' },
  info:    { icon: Info,        color: 'text-blue-500',    badge: 'bg-blue-50 dark:bg-blue-900/30',    title: 'Notice' },
}

export function NotifyProvider({ children }) {
  const [msg, setMsg] = useState(null) // { message, type, title }

  const notify = useCallback((message, opts = {}) => {
    const type = typeof opts === 'string' ? opts : (opts.type || 'info')
    const title = typeof opts === 'object' ? opts.title : undefined
    setMsg({ message: String(message ?? ''), type, title })
  }, [])

  const close = () => setMsg(null)
  const s = msg ? (styles[msg.type] || styles.info) : null
  const Icon = s?.icon

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {msg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={close}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${s.badge} flex items-center justify-center mb-3`}>
                <Icon size={24} className={s.color} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{msg.title || s.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{msg.message}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                autoFocus
                onClick={close}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  )
}
