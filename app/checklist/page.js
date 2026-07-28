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

  return <BranchesOverview initialBranches={branches || []} isAdmin={isAdmin} />
}