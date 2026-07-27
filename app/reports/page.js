import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsView from './ReportsView'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role) || profile.status !== 'active') redirect('/')

  const { data: branches } = await supabase
    .from('branches')
    .select('name, pills(name, sections(label, checklist_items(label, checked, category, priority, item_status, due_date))))')
    .order('sort_order')

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">Reports</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Export checklist data as CSV or PDF</p>
      <ReportsView branches={branches || []} />
    </div>
  )
}