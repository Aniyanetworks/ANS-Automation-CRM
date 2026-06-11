import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Eye } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDemo } = useAuth()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        {isDemo && (
          <div className="flex items-center justify-center gap-2 bg-amber-500 text-white text-xs md:text-sm font-medium px-4 py-1.5 flex-shrink-0">
            <Eye size={14} />
            Demo mode — sample data only. Creating, editing, and deleting are disabled.
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
