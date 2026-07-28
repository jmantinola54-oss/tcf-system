import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import ChecklistView from './ChecklistView'

export const dynamic = 'force-dynamic'

export default async function PillPage({ params }) {
  const { pillId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: pill } = await supabase.from('pills').select('id, name, branch_id, branches(name)').eq('id', pillId).single()
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      id, label, sort_order,
      checklist_items(
        id, label, checked, item_status, priority, due_date, category, doc_links, remarks, parent_id, section_id,
        task_assignments(profiles!task_assignments_user_id_fkey(full_name, email))
      )
    `)
    .eq('pill_id', pillId)
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">{pill?.name}</h1>
      <p className="mb-4"><a href={`/checklist/${pill?.branch_id}`} className="text-sm text-[#0f3d28] font-semibold hover:underline">← {pill?.branches?.name}</a></p>
      <ChecklistView pillId={pillId} initialSections={sections || []} isAdmin={isAdmin} />
    </div>
  )
}