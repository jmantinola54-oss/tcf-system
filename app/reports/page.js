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
    .select('id, name, pills(id, name, sections(id, label, checklist_items(id, label, checked, category, priority, item_status, due_date)))')
    .order('sort_order')

  return <ReportsView branches={branches || []} />
}