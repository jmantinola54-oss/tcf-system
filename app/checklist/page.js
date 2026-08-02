import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import BranchesOverview from '../components/BranchesOverview'

export const dynamic = 'force-dynamic'

export default async function ChecklistOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, sort_order, pills(id, sections(id, checklist_items(id, checked, parent_id)))')
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  // If this person has explicit pill-access restrictions set by an admin,
  // only show branches/pills they're allowed to see. Admins always see
  // everything, and anyone with zero restriction rows sees everything too
  // (restrictions are opt-in per user, not a default-locked-down model).
  const { data: accessRows } = await supabase.from('user_pill_access').select('pill_id').eq('user_id', user.id)
  const allowedPillIds = new Set((accessRows || []).map(function (r) { return r.pill_id }))
  const restricted = !isAdmin && allowedPillIds.size > 0

  let visibleBranches = branches || []
  if (restricted) {
    visibleBranches = visibleBranches
      .map(function (b) { return Object.assign({}, b, { pills: (b.pills || []).filter(function (p) { return allowedPillIds.has(p.id) }) }) })
      .filter(function (b) { return b.pills.length > 0 })
  }

  return <BranchesOverview initialBranches={visibleBranches} isAdmin={isAdmin} />
}