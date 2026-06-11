import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setDemoMode, DEMO_EMAIL, blockIfDemo } from '../lib/demo'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDemoMode(session?.user?.email === DEMO_EMAIL)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setDemoMode(session?.user?.email === DEMO_EMAIL)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo: user?.email === DEMO_EMAIL,
      signIn:         (email, password)   => supabase.auth.signInWithPassword({ email, password }),
      signUp:         (email, password, data) => supabase.auth.signUp({ email, password, options: { data } }),
      signOut:        ()                  => supabase.auth.signOut(),
      updatePassword: (password)          => { blockIfDemo(); return supabase.auth.updateUser({ password }) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
