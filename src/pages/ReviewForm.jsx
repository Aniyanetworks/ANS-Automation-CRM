import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2, Star, Copy, Check, CheckCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getReviewFormData, getReviewCampaignPreview, submitReviewByToken } from '../services/api'

const RATINGS = [
  { value: 'Excellent', emoji: '🌟', label: 'Excellent', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  { value: 'Good', emoji: '👍', label: 'Good', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
  { value: 'Bad', emoji: '👎', label: 'Bad', color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
]

export default function ReviewForm() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = !token && searchParams.has('c')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [step, setStep] = useState('choose') // choose | form | submitted | later | error
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isPreview) {
      const campaignId = searchParams.get('c')
      const fallback = {
        name: 'Preview User',
        review_campaigns: {
          form_logo_url: '',
          form_title: 'How was your experience?',
          form_subtitle: 'Your feedback helps us improve',
          review_link: '#',
        },
      }
      if (campaignId) {
        getReviewCampaignPreview(campaignId)
          .then(camp => setData({ name: 'Preview User', review_campaigns: camp }))
          .catch(() => setData(fallback))
          .finally(() => setLoading(false))
      } else {
        setData(fallback)
        setLoading(false)
      }
      return
    }

    if (!token) {
      setLoadError('Invalid review link.')
      setLoading(false)
      return
    }

    getReviewFormData(token)
      .then(d => {
        setData(d)
        if (d.submitted_at) setStep('submitted')
        if (d.tag === 'review_later') setStep('later')
      })
      .catch(e => setLoadError(e.message || 'This review link is invalid or has expired.'))
      .finally(() => setLoading(false))
  }, [token, isPreview])

  async function handleLater() {
    if (isPreview) { setStep('later'); return }
    try {
      await submitReviewByToken(token, { tag: 'review_later' })
    } catch { /* silent — still show the page */ }
    setStep('later')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    try {
      if (!isPreview) {
        await submitReviewByToken(token, {
          review_rating: rating,
          review_comment: comment.trim(),
          submitted_at: new Date().toISOString(),
          status: 'Completed',
          tag: 'review_done',
        })
      }

      // Auto-copy comment to clipboard
      if (comment.trim()) {
        try {
          await navigator.clipboard.writeText(comment.trim())
          setCopied(true)
        } catch { /* clipboard not available */ }
      }

      setStep('submitted')

      // Redirect good reviews to Google after 2.5s
      const campaign = data?.review_campaigns || {}
      if ((rating === 'Excellent' || rating === 'Good') && campaign.review_link && campaign.review_link !== '#') {
        setTimeout(() => {
          window.location.href = campaign.review_link
        }, 2500)
      }
    } catch (err) {
      alert('Failed to submit review: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 size={28} className="animate-spin text-amber-500" />
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-sm">
        <AlertCircle size={40} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Link not found</h2>
        <p className="text-sm text-slate-400">{loadError}</p>
      </div>
    </div>
  )

  const campaign = data?.review_campaigns || {}
  const leadName = data?.name || 'there'

  // ── Shell ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100 dark:border-slate-700">
            {campaign.form_logo_url ? (
              <img
                src={campaign.form_logo_url}
                alt="Logo"
                className="h-12 mx-auto mb-4 object-contain"
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Star size={22} className="text-amber-500" />
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {campaign.form_title || 'How was your experience?'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {campaign.form_subtitle || 'Your feedback helps us improve'}
            </p>
          </div>

          <div className="px-8 py-6">

            {/* ── Step: choose ── */}
            {step === 'choose' && (
              <div className="text-center space-y-5">
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Hi <span className="font-semibold">{leadName}</span>, would you like to leave your review now?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <Star size={24} className="text-amber-500" />
                    Review Now
                  </button>
                  <button
                    onClick={handleLater}
                    className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Clock size={24} className="text-slate-400" />
                    Review Later
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: form ── */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">
                    How would you rate your experience?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RATINGS.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRating(r.value)}
                        className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all font-medium text-sm ${rating === r.value ? r.color + ' border-2 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'}`}
                      >
                        <span className="text-2xl">{r.emoji}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Share your experience <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                    placeholder="Tell us what you liked or how we can improve..."
                    className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                  />
                  {comment.trim() && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Copy size={10} /> Your comment will be copied to clipboard on submit
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!rating || submitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                  Submit Review
                </button>

                <button
                  type="button"
                  onClick={handleLater}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  I'll do this later
                </button>
              </form>
            )}

            {/* ── Step: submitted ── */}
            {step === 'submitted' && (
              <div className="text-center space-y-4 py-2">
                {rating === 'Bad' ? (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <ThumbsDown size={28} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank you for your feedback</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        We're sorry to hear about your experience. Our team will be in touch shortly.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      <CheckCircle size={28} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank you! 🎉</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Your review has been submitted. {campaign.review_link && campaign.review_link !== '#' ? 'Redirecting you to leave a public review…' : ''}
                      </p>
                    </div>
                    {campaign.review_link && campaign.review_link !== '#' && (
                      <a
                        href={campaign.review_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        <Star size={15} /> Leave a Public Review
                      </a>
                    )}
                  </>
                )}

                {copied && comment.trim() && (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      Your comment was copied to clipboard — paste it in the review!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: later ── */}
            {step === 'later' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <Clock size={28} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No problem!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    We'll send you a follow-up reminder. Your link will keep working whenever you're ready.
                  </p>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-400 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <Star size={15} /> Actually, I'll review now
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by ANS CRM · Aniya Network Solutions
        </p>
      </div>
    </div>
  )
}
