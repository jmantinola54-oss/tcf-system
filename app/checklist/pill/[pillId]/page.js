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
    .select('id, label, sort_order, checklist_items(id, label, checked, item_status, priority, due_date)')
    .eq('pill_id', pillId)
    .order('sort_order')

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f3d28' }}>{pill?.name}</h1>
      <p><a href={`/checklist/${pill?.branch_id}`}>← {pill?.branches?.name}</a></p>
      <ChecklistView pillId={pillId} initialSections={sections || []} isAdmin={isAdmin} />
    </div>
  )
}