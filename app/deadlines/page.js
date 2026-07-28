import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import DeadlineCenterView from './DeadlineCenterView'

export const dynamic = 'force-dynamic'

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, label, due_date, category, item_status, checked, doc_links, remarks, sections(label, pill_id, pills(name, branches(name)))')
    .not('due_date', 'is', null)
    .order('due_date')

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">Deadline Center</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Every tracked deadline, with status, person in charge and documents.</p>
      <DeadlineCenterView items={items || []} />
    </div>
  )
}