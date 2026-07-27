'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/checklist', label: 'Checklist', icon: '📋' },
  { href: '/tasks', label: 'My Tasks', icon: '✅' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
]

const ADMIN_NAV_ITEMS = [
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/tasks', label: 'Task Assignment', icon: '📌' },
]

export default function AppShell({ children, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF7F1' }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: '#0f3d28', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/tcf-logo.png" alt="TCF Logo" style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', padding: 3 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>TCF</div>
            <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Production System</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '14px 10px' }}>
          <div style={{ fontSize: 10, opacity: 0.4, textTransform: 'uppercase', padding: '4px 10px', marginBottom: 4 }}>General</div>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                color: '#fff', textDecoration: 'none', fontSize: 13.5, marginBottom: 2,
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: active ? 600 : 400,
              }}>
                <span>{item.icon}</span> {item.label}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div style={{ fontSize: 10, opacity: 0.4, textTransform: 'uppercase', padding: '14px 10px 4px' }}>Admin</div>
              {ADMIN_NAV_ITEMS.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                    color: '#fff', textDecoration: 'none', fontSize: 13.5, marginBottom: 2,
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                  }}>
                    <span>{item.icon}</span> {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
            {profile?.full_name || profile?.email}
            <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px', background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12,
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}