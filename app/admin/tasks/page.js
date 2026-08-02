import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskManager from './TaskManager'

export const dynamic = 'force-dynamic'

export default async function TasksAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!myProfile || !['admin', 'super_admin'].includes(myProfile.role) || myProfile.status !== 'active') redirect('/')

  const { data: items } = await supabase
    .from('checklist_items')
    .select('*, sections(label, pills(name, branches(name))), task_assignments(id, user_id, profiles!task_assignments_user_id_fkey(id, full_name, email))')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1 tracking-tight">Task Assignment</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">See who's assigned to what, across every checklist</p>
      <TaskManager items={items || []} />
    </div>
  )
}