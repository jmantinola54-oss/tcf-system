import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const CARDS = [
  { href: '/checklist', icon: '📋', label: 'Checklist', sub: 'Branches & progress', color: '#E1F7EC' },
  { href: '/tasks', icon: '✅', label: 'My Tasks', sub: 'Assigned to you', color: '#FFF3DC' },
  { href: '/inventory', icon: '📦', label: 'Inventory', sub: 'Stock & withdrawals', color: '#E9F5EC' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  if (profile?.status === 'pending') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF3DC] flex items-center justify-center mx-auto mb-5 text-3xl">⏳</div>
        <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-2">Welcome, {profile.full_name}</h1>
        <p className="text-[#B06800] font-semibold text-sm mb-1">Your account is waiting for administrator approval.</p>
        <p className="text-[#6E9A7C] text-xs">You'll get access automatically once an admin approves your account — no need to sign up again.</p>
      </div>
    )
  }

  if (profile?.status === 'suspended' || profile?.status === 'rejected') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FDEAEA] flex items-center justify-center mx-auto mb-5 text-3xl">🚫</div>
        <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-2">Access unavailable</h1>
        <p className="text-[#C0282A] font-semibold text-sm">Your account access has been {profile.status}.</p>
        <p className="text-[#6E9A7C] text-xs mt-1">Contact an administrator if you believe this is a mistake.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[#0f3d28] mb-1">
        Welcome, {profile?.full_name || user.email}
      </h1>
      <p className="text-[#6E9A7C] text-sm mb-8">Here's what's happening today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(card => (
          <a key={card.href} href={card.href} className="group">
            <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: card.color }}>
                {card.icon}
              </div>
              <div className="font-bold text-[#0A1F12] text-[15px]">{card.label}</div>
              <div className="text-xs text-[#6E9A7C] mt-0.5">{card.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}