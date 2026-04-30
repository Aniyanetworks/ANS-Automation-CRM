import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bot, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { data, error } = await signUp(form.email, form.password, { full_name: form.name })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      navigate('/dashboard', { replace: true })
    } else {
      setNeedsConfirmation(true)
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            We sent a confirmation link to <span className="font-medium text-slate-700 dark:text-slate-300">{form.email}</span>. Click it to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <Bot size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ANS GHL</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your account</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={set('name')}
              placeholder="John Smith"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Create Account
          </button>
        </form>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-8">Aniya Networks · ANS GHL</p>
    </div>
  )
}
