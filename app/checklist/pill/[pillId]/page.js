import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
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
        id, label, checked, item_status, priority, due_date, category, doc_links, remarks, parent_id, section_id, sort_order,
        task_assignments(id, user_id, profiles!task_assignments_user_id_fkey(full_name, email))
      )
    `)
    .eq('pill_id', pillId)
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  return (
    <div>
      
        <a href={pill ? '/checklist/' + pill.branch_id : '/checklist'}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E9A7C] hover:text-[#0f3d28] transition-colors mb-3"
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
        {pill && pill.branches ? pill.branches.name : 'Branch'}
      </a>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-6 tracking-tight">{pill ? pill.name : ''}</h1>
      <ChecklistView pillId={pillId} initialSections={sections || []} isAdmin={isAdmin} />
    </div>
  )
}