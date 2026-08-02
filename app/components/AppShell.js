'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/tasks', label: 'My Tasks', icon: '✅' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
]

const TRACKING_ITEMS = [
  { href: '/deadlines', label: 'Deadline Center', icon: '⏰' },
]

const ADMIN_NAV_ITEMS = [
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/tasks', label: 'Task Assignment', icon: '📌' },
  { href: '/activity', label: 'Activity Log', icon: '📜' },
  { href: '/reports', label: 'Reports', icon: '📊' },
]

function NavLink({ item, active, onClick }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-colors ' + (active ? 'bg-white/12 text-white font-semibold' : 'text-white/75 hover:bg-white/8 hover:text-white')}
    >
      <span className="text-base leading-none">{item.icon}</span> {item.label}
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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img src="/tcf-logo.png" alt="TCF Logo" className="w-11 h-11 rounded-lg bg-white p-1.5 object-contain flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-white leading-tight">TCF</div>
          <div className="text-[9px] text-white/45 uppercase tracking-wider">Production System</div>
        </div>
        <button onClick={closeMobile} className="lg:hidden text-white/60 hover:text-white flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
        <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pb-1.5">General</div>
        {NAV_ITEMS.map(function (item) {
          return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
        })}

        <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pt-4 pb-1.5">Tracking</div>
        {TRACKING_ITEMS.map(function (item) {
          return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
        })}

        {isAdmin && (
          <>
            <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pt-4 pb-1.5">Admin</div>
            {ADMIN_NAV_ITEMS.map(function (item) {
              return <NavLink key={item.href} item={item} active={pathname === item.href} onClick={closeMobile} />
            })}
          </>
        )}
      </nav>

      <div className="p-3.5 border-t border-white/10">
        <Link href="/profile" onClick={closeMobile} className="flex items-center gap-2.5 mb-3 hover:bg-white/5 rounded-lg px-1.5 py-1.5 -mx-1.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#16A35A] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-[12.5px] text-white truncate">{profile ? (profile.full_name || profile.email) : ''}</div>
            <div className="text-[10px] text-white/50 capitalize">{profile && profile.role ? profile.role.replace('_', ' ') : ''}</div>
          </div>
        </Link>
        <button onClick={handleLogout} className="w-full py-2 bg-white/10 hover:bg-white/15 rounded-md text-white text-[12px] transition-colors">
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#EEF7F1]">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f3d28] flex items-center justify-between px-4 z-30">
        <button onClick={function () { setMobileOpen(true) }} className="text-white p-1">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/tcf-logo.png" alt="TCF Logo" className="w-7 h-7 rounded-md bg-white p-1 object-contain" />
          <span className="font-bold text-white text-sm">TCF</span>
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
          'w-[248px] bg-[#0f3d28] flex flex-col flex-shrink-0 fixed top-0 bottom-0 left-0 z-50 transition-transform duration-200 lg:translate-x-0 lg:static ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 px-4 py-6 pt-20 lg:px-10 lg:py-8 lg:pt-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}