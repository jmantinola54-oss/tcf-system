import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import BranchesOverview from './components/BranchesOverview'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.status === 'pending') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-2">Welcome, {profile.full_name}</h1>
        <p className="text-[#B06800] font-semibold text-sm mb-1">Your account is waiting for administrator approval.</p>
        <p className="text-[#6E9A7C] text-xs">You'll get access once an admin approves your account.</p>
      </div>
    )
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, sort_order, pills(id, sections(id, checklist_items(id, checked)))')
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile?.role)

  return <BranchesOverview initialBranches={branches || []} isAdmin={isAdmin} />
}