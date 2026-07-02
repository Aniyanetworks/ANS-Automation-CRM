import { useState } from 'react'
import { Crown, Users, DollarSign, TrendingUp, AlertCircle, Check, ChevronDown, ChevronUp, Search } from 'lucide-react'

// ── Static plan definitions ──────────────────────────────────────────────────

const PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    period: 'Monthly',
    price: 14.99,
    currency: 'CA$',
    color: 'blue',
    features: [
      '1 tune-up per year',
      'Priority scheduling ahead of non-members',
      'No trip / service call fee',
      '10% off any repair',
      '$60/year loyalty credit toward repairs or a new system',
    ],
  },
  {
    id: 'comfort',
    name: 'Comfort Club',
    period: 'Monthly',
    badge: 'Most Popular',
    price: 29,
    currency: 'CA$',
    color: 'indigo',
    features: [
      '1 visit per year (spring AC check or fall heating check)',
      'Priority scheduling',
      'No trip fee',
      '15% off any repair',
      '2-year warranty on repairs',
      '$120/year loyalty credit',
      '1 air filter per year included',
    ],
  },
  {
    id: 'total',
    name: 'Total Comfort',
    period: 'Monthly',
    price: 49,
    currency: 'CA$',
    color: 'violet',
    features: [
      '2 visits per year (spring AC check and fall heating check)',
      'Priority scheduling',
      'No trip fee',
      '20% off any repair',
      '2-year warranty on repairs',
      '$240/year loyalty credit',
      'All filters included',
      'Same-day service guaranteed',
      'No after-hours surcharge',
      'Transfers to new owner if you sell your home',
    ],
  },
]

// ── Fake subscriber data ─────────────────────────────────────────────────────

const SUBSCRIBERS = [
  { id: 1,  name: 'James Whitfield',    phone: '+1 (416) 555-0182', email: 'james.whitfield@email.com',   plan: 'Comfort Club',   price: 29,    since: '2024-03-15', next: '2025-08-15', status: 'Active',    color: 'bg-blue-500' },
  { id: 2,  name: 'Sarah Chen',         phone: '+1 (647) 555-0234', email: 'sarah.chen@gmail.com',        plan: 'Total Comfort',  price: 49,    since: '2024-01-08', next: '2025-08-08', status: 'Active',    color: 'bg-violet-500' },
  { id: 3,  name: 'Marcus DeLeon',      phone: '+1 (905) 555-0317', email: 'm.deleon@hotmail.com',        plan: 'Essential',      price: 14.99, since: '2024-06-22', next: '2025-08-22', status: 'Active',    color: 'bg-emerald-500' },
  { id: 4,  name: 'Priya Nair',         phone: '+1 (437) 555-0408', email: 'priya.nair@outlook.com',      plan: 'Comfort Club',   price: 29,    since: '2023-11-30', next: '2025-08-30', status: 'Active',    color: 'bg-rose-500' },
  { id: 5,  name: 'David Okafor',       phone: '+1 (416) 555-0559', email: 'david.okafor@gmail.com',      plan: 'Total Comfort',  price: 49,    since: '2024-02-14', next: '2025-08-14', status: 'Active',    color: 'bg-amber-500' },
  { id: 6,  name: 'Linda Fontaine',     phone: '+1 (905) 555-0641', email: 'linda.f@bell.net',            plan: 'Essential',      price: 14.99, since: '2024-08-01', next: '2025-08-01', status: 'Active',    color: 'bg-teal-500' },
  { id: 7,  name: 'Ryan Kowalski',      phone: '+1 (647) 555-0773', email: 'rkowalski@rogers.com',        plan: 'Comfort Club',   price: 29,    since: '2024-04-10', next: '2025-08-10', status: 'Active',    color: 'bg-cyan-500' },
  { id: 8,  name: 'Amara Diallo',       phone: '+1 (416) 555-0882', email: 'amara.diallo@gmail.com',      plan: 'Comfort Club',   price: 29,    since: '2023-09-18', next: '2025-08-18', status: 'Paused',    color: 'bg-orange-500' },
  { id: 9,  name: 'Tom Bridgeman',      phone: '+1 (437) 555-0926', email: 'tom.b@yahoo.ca',              plan: 'Essential',      price: 14.99, since: '2024-07-05', next: '—',          status: 'Cancelled', color: 'bg-pink-500' },
  { id: 10, name: 'Isabelle Tremblay',  phone: '+1 (905) 555-0114', email: 'itremblay@videotron.ca',      plan: 'Total Comfort',  price: 49,    since: '2023-12-20', next: '2025-08-20', status: 'Active',    color: 'bg-indigo-500' },
  { id: 11, name: 'Kevin Nguyen',       phone: '+1 (416) 555-0228', email: 'kevin.nguyen88@gmail.com',    plan: 'Comfort Club',   price: 29,    since: '2024-05-03', next: '2025-08-03', status: 'Active',    color: 'bg-lime-600' },
  { id: 12, name: 'Grace Olawale',      phone: '+1 (647) 555-0337', email: 'grace.olawale@email.com',     plan: 'Total Comfort',  price: 49,    since: '2024-01-25', next: '2025-08-25', status: 'Active',    color: 'bg-fuchsia-500' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const planColorMap = {
  blue: {
    card:    'border-blue-200 dark:border-blue-800',
    header:  'bg-blue-50 dark:bg-blue-900/20',
    icon:    'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    price:   'text-blue-700 dark:text-blue-300',
    check:   'text-blue-500',
    button:  'bg-blue-600 hover:bg-blue-700',
    count:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  indigo: {
    card:    'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-400 dark:ring-indigo-600',
    header:  'bg-indigo-600 dark:bg-indigo-700',
    icon:    'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    price:   'text-indigo-700 dark:text-indigo-300',
    check:   'text-indigo-500',
    button:  'bg-indigo-600 hover:bg-indigo-700',
    count:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  violet: {
    card:    'border-violet-200 dark:border-violet-800',
    header:  'bg-violet-50 dark:bg-violet-900/20',
    icon:    'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    price:   'text-violet-700 dark:text-violet-300',
    check:   'text-violet-500',
    button:  'bg-violet-600 hover:bg-violet-700',
    count:   'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
}

const statusStyle = {
  Active:    'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  Paused:    'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  Cancelled: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
}

const planBadgeStyle = {
  'Essential':     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Comfort Club':  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Total Comfort': 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function fmt(date) {
  if (date === '—') return '—'
  return new Date(date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function PlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false)
  const c = planColorMap[plan.color]
  const count = SUBSCRIBERS.filter(s => s.plan === plan.name && s.status === 'Active').length
  const isPopular = !!plan.badge
  const visibleFeatures = expanded ? plan.features : plan.features.slice(0, 4)

  return (
    <div className={`relative bg-white dark:bg-slate-800 rounded-2xl border shadow-sm flex flex-col overflow-hidden ${c.card}`}>
      {/* Popular banner */}
      {isPopular && (
        <div className="absolute top-0 inset-x-0 bg-indigo-600 text-white text-center text-xs font-bold py-1 tracking-wide uppercase">
          ★ Most Popular
        </div>
      )}

      {/* Header */}
      <div className={`px-6 pt-${isPopular ? '9' : '6'} pb-5 ${isPopular ? 'bg-indigo-50 dark:bg-indigo-900/10' : c.header}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{plan.period}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.count}`}>{count} active</span>
        </div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.currency}</span>
          <span className={`text-4xl font-extrabold ${c.price}`}>{plan.price}</span>
          <span className="text-sm text-slate-400">/month</span>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex-1">
        <ul className="space-y-2.5">
          {visibleFeatures.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Check size={14} className={`mt-0.5 flex-shrink-0 ${c.check}`} />
              {f}
            </li>
          ))}
        </ul>
        {plan.features.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> +{plan.features.length - 4} more features</>}
          </button>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm ${c.button}`}>
          Manage Plan
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Membership() {
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const activeCount     = SUBSCRIBERS.filter(s => s.status === 'Active').length
  const mrr             = SUBSCRIBERS.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.price, 0)
  const pausedCount     = SUBSCRIBERS.filter(s => s.status === 'Paused').length
  const cancelledCount  = SUBSCRIBERS.filter(s => s.status === 'Cancelled').length

  const filtered = SUBSCRIBERS
    .filter(s => {
      const q = search.toLowerCase()
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q)
      const matchPlan   = filterPlan   === 'All' || s.plan   === filterPlan
      const matchStatus = filterStatus === 'All' || s.status === filterStatus
      return matchQ && matchPlan && matchStatus
    })
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronDown size={12} className="text-slate-300 dark:text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  const inputCls = 'px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow">
              <Crown size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Membership</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">Manage subscription plans and member accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
            <AlertCircle size={12} /> Demo data — showcase only
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Active Members"    value={activeCount}          sub={`${pausedCount} paused · ${cancelledCount} cancelled`} color="blue" />
        <StatCard icon={DollarSign}  label="Monthly Revenue"   value={`CA$${mrr.toFixed(2)}`} sub="from active subscriptions" color="emerald" />
        <StatCard icon={TrendingUp}  label="Avg. Plan Value"   value={`CA$${(mrr / activeCount).toFixed(2)}`} sub="per active member" color="indigo" />
        <StatCard icon={Crown}       label="Premium Members"   value={SUBSCRIBERS.filter(s => s.plan === 'Total Comfort' && s.status === 'Active').length} sub="on Total Comfort plan" color="amber" />
      </div>

      {/* Plan cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </div>

      {/* Subscribers table */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Subscribers
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium">{filtered.length}</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members..."
                className={`pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48`}
              />
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className={inputCls}>
              <option value="All">All Plans</option>
              {PLANS.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
              <option value="All">All Statuses</option>
              <option>Active</option><option>Paused</option><option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">Member <SortIcon col="name" /></div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('plan')}>
                    <div className="flex items-center gap-1">Plan <SortIcon col="plan" /></div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('price')}>
                    <div className="flex items-center gap-1">Amount <SortIcon col="price" /></div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('since')}>
                    <div className="flex items-center gap-1">Member Since <SortIcon col="since" /></div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Next Billing</th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1">Status <SortIcon col="status" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {getInitials(s.name)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="text-slate-700 dark:text-slate-300">{s.phone}</div>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${planBadgeStyle[s.plan]}`}>{s.plan}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300">
                      CA${s.price}<span className="text-xs font-normal text-slate-400">/mo</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{fmt(s.since)}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{fmt(s.next)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-14 text-center text-slate-400">
              <Crown size={30} className="mx-auto mb-2 opacity-20" />
              <p>No members match your filters</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
