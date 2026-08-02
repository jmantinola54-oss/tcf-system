import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PillsView from './PillsView'

export const dynamic = 'force-dynamic'

export default async function BranchPage({ params }) {
  const { branchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: branch } = await supabase.from('branches').select('id, name').eq('id', branchId).single()
  const { data: pills } = await supabase
    .from('pills')
    .select('id, name, sort_order, sections(id, checklist_items(id, checked, parent_id))')
    .eq('branch_id', branchId)
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/checklist" className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E9A7C] hover:text-[#0f3d28] transition-colors mb-3">
        <ChevronLeft size={14} strokeWidth={2.5} />
        All Branches
      </Link>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-6 tracking-tight">{branch ? branch.name : ''}</h1>
      <PillsView branchId={branchId} initialPills={pills || []} isAdmin={isAdmin} />
    </div>
  )
}