import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksView from './TasksView'

export const dynamic = 'force-dynamic'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') redirect('/')

  const { data: assignments } = await supabase
    .from('task_assignments')
    .select('checklist_items(id, label, priority, due_date, item_status, checked, category, doc_links, remarks, sections(pill_id, label, pills(name, branches(name))))')
    .eq('user_id', user.id)

  const tasks = (assignments || []).map(function (a) { return a.checklist_items }).filter(Boolean)
  const isAdmin = ['admin', 'super_admin'].includes(profile.role)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0f3d28] mb-1">My Tasks</h1>
      <p className="text-[#6E9A7C] text-sm mb-6">Everything currently assigned to you</p>
      <TasksView tasks={tasks} isAdmin={isAdmin} />
    </div>
  )
}