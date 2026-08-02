'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  Menu, X, Home, CheckSquare, Package, Clock, Users,
  ClipboardList, History, BarChart3, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/inventory', label: 'Inventory', icon: Package },
]

const TRACKING_ITEMS = [
  { href: '/deadlines', label: 'Deadline Center', icon: Clock },
]

const ADMIN_NAV_ITEMS = [
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/tasks', label: 'Task Assignment', icon: ClipboardList },
  { href: '/activity', label: 'Activity Log', icon: History },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

function NavLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={
        'relative flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-colors ' +
        (active
          ? 'bg-white/[0.08] text-white font-semibold'
          : 'text-white/60 hover:bg-white/[0.05] hover:text-white/90')
      }
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#5ECE96]" />
      )}
      <Icon size={16} strokeWidth={2} className={active ? 'text-[#5ECE96]' : 'text-white/45'} />
      {item.label}
    </Link>
  )
}

export default function AppShell({ children, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = ['admin', 'super_admin'].includes(profile ? profile.role : '')
  const initials = ((profile && (profile.full_name || profile.email)) || '?').slice(0, 1).toUpperCase()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.08]">
        <img src="/tcf-logo.png" alt="TCF Logo" className="w-10 h-10 rounded-lg bg-white p-1.5 object-contain flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[16px] text-white leading-tight tracking-tight">TCF</div>
          <div className="text-[9px] text-white/40 uppercase tracking-[0.12em]">Production System</div>
        </div>
        <button onClick={closeMobile} className="lg:hidden text-white/50 hover:text-white flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em] px-3 pb-2">General</div>
        {NAV_ITEMS.map(function (item) {
          return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
        })}

        <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em] px-3 pt-6 pb-2">Tracking</div>
        {TRACKING_ITEMS.map(function (item) {
          return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
        })}

        {isAdmin && (
          <>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em] px-3 pt-6 pb-2">Admin</div>
            {ADMIN_NAV_ITEMS.map(function (item) {
              return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/[0.08]">
        <Link href="/profile" onClick={closeMobile} className="flex items-center gap-2.5 mb-2.5 hover:bg-white/[0.05] rounded-lg px-2 py-2 -mx-1 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#16A35A] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-[12.5px] text-white truncate leading-tight">{profile ? (profile.full_name || profile.email) : ''}</div>
            <div className="text-[10px] text-white/45 capitalize">{profile && profile.role ? profile.role.replace('_', ' ') : ''}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-white/85 text-[12px] font-medium transition-colors"
        >
          <LogOut size={13} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f3d28] flex items-center justify-between px-4 z-30">
        <button onClick={function () { setMobileOpen(true) }} className="text-white p-1">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/tcf-logo.png" alt="TCF Logo" className="w-7 h-7 rounded-md bg-white p-1 object-contain" />
          <span className="font-display font-bold text-white text-sm tracking-tight">TCF</span>
        </div>
        <div className="w-8" />
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMobile} />
      )}

      {/* ── Sidebar: fixed on desktop, sliding drawer on mobile ── */}
      <aside
        className={
          'w-[252px] bg-[#0f3d28] flex flex-col flex-shrink-0 fixed top-0 bottom-0 left-0 z-50 transition-transform duration-200 lg:translate-x-0 lg:static ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 px-4 py-6 pt-20 lg:px-10 lg:py-9 lg:pt-9 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}