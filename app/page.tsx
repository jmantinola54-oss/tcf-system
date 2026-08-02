import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardList, CheckSquare, Package, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CARDS = [
  { href: '/checklist', icon: ClipboardList, label: 'Checklist', sub: 'Branches & progress', tint: '#E1F7EC', ink: '#16A35A' },
  { href: '/tasks', icon: CheckSquare, label: 'My Tasks', sub: 'Assigned to you', tint: '#FFF3DC', ink: '#B06800' },
  { href: '/inventory', icon: Package, label: 'Inventory', sub: 'Stock & withdrawals', tint: '#E9F5EC', ink: '#204A2E' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[#0f3d28] mb-1.5 tracking-tight">
        Welcome, {profile?.full_name || user.email}
      </h1>
      <p className="text-[#6E9A7C] text-sm mb-8">Here&apos;s what&apos;s happening today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(function (card) {
          const Icon = card.icon
          return (
            <a key={card.href} href={card.href} className="group">
              <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#d5ddd8] transition-all duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: card.tint }}>
                    <Icon size={20} strokeWidth={2} color={card.ink} />
                  </div>
                  <ArrowRight size={16} className="text-[#c5cec8] mt-2.5 group-hover:text-[#16A35A] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="font-bold text-[#0A1F12] text-[15px]">{card.label}</div>
                <div className="text-xs text-[#6E9A7C] mt-0.5">{card.sub}</div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}