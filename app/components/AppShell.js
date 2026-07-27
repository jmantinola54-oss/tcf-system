'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/tasks', label: 'My Tasks', icon: '✅' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
]

const TRACKING_ITEMS = [
  { href: '/deadlines', label: 'Deadline Center', icon: '⏰' },
  { href: '/reports', label: 'Reports', icon: '📊' },
]

const ADMIN_NAV_ITEMS = [
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/tasks', label: 'Task Assignment', icon: '📌' },
  { href: '/activity', label: 'Activity Log', icon: '📜' },
]

function NavLink({ item, active }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-colors ${
        active ? 'bg-white/12 text-white font-semibold' : 'text-white/75 hover:bg-white/8 hover:text-white'
      }`}
    >
      <span className="text-base leading-none">{item.icon}</span> {item.label}
    </Link>
  )
}

export default function AppShell({ children, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role)
  const initials = (profile?.full_name || profile?.email || '?').slice(0, 1).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#EEF7F1]">
      <aside className="w-[248px] bg-[#0f3d28] flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img src="/tcf-logo.png" alt="TCF Logo" className="w-11 h-11 rounded-lg bg-white p-1.5 object-contain" />
          <div>
            <div className="font-bold text-[15px] text-white leading-tight">TCF</div>
            <div className="text-[9px] text-white/45 uppercase tracking-wider">Production System</div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
          <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pb-1.5">General</div>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pt-4 pb-1.5">Tracking</div>
          {TRACKING_ITEMS.map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          {isAdmin && (
            <>
              <div className="text-[10px] text-white/35 uppercase tracking-wider px-3 pt-4 pb-1.5">Admin</div>
              {ADMIN_NAV_ITEMS.map(item => (
                <NavLink key={item.href} item={item} active={pathname === item.href} />
              ))}
            </>
          )}
        </nav>

        <div className="p-3.5 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#16A35A] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] text-white truncate">{profile?.full_name || profile?.email}</div>
              <div className="text-[10px] text-white/50 capitalize">{profile?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-white/10 hover:bg-white/15 rounded-md text-white text-[12px] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}