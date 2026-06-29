import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getInboxThreads } from '../services/api'
import { useAuth } from './AuthContext'

export const INBOX_READ_KEY = 'inbox_read_map'

const InboxCtx = createContext({
  threads: [], unreadCount: 0, unreadThreads: [],
  readMap: {}, markRead: () => {}, refresh: async () => {},
  updateThread: () => {}, initialLoading: true,
})

export function InboxProvider({ children }) {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [readMap, setReadMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(INBOX_READ_KEY) || '{}') } catch { return {} }
  })

  const isUnread = (t, rm) => {
    if (!t.latestInbound) return false
    const last = rm[`${t.kind}:${t.id}`]
    return !last || new Date(t.latestInbound.created_at) > new Date(last)
  }

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const data = await getInboxThreads()
      setThreads(data)
    } catch {}
  }, [user])

  useEffect(() => {
    if (!user) return
    refresh().finally(() => setInitialLoading(false))
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh, user])

  const markRead = useCallback((thread) => {
    const key = `${thread.kind}:${thread.id}`
    setReadMap(prev => {
      const next = { ...prev, [key]: new Date().toISOString() }
      try { localStorage.setItem(INBOX_READ_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Optimistic patch for a single thread (e.g. AI toggle)
  const updateThread = useCallback((kind, id, patch) => {
    setThreads(prev => prev.map(t => t.kind === kind && t.id === id ? { ...t, ...patch } : t))
  }, [])

  const unreadThreads = threads.filter(t => isUnread(t, readMap))
  const unreadCount = unreadThreads.length

  return (
    <InboxCtx.Provider value={{
      threads, unreadCount, unreadThreads,
      readMap, markRead, refresh, updateThread, initialLoading,
    }}>
      {children}
    </InboxCtx.Provider>
  )
}

export function useInbox() { return useContext(InboxCtx) }
